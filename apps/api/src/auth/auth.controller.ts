import { parseFrontendOrigins } from '../common/config/browser-origin';
import {
  Controller,
  BadRequestException,
  Post,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  passwordlessStartSchema,
  verifyMagicLinkSchema,
  verifyOtpSchema,
} from '@fettl/shared';
import type {
  PasswordlessStartInput,
  VerifyMagicLinkInput,
  VerifyOtpInput,
} from '@fettl/shared';
import type { Response, Request } from 'express';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  originFromGoogleState,
  selectFrontendOrigin,
} from './google-return-origin';
import { secureAuthCookies } from './auth-cookie-policy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get secureCookies() {
    return secureAuthCookies(
      process.env.NODE_ENV,
      this.configService.get<string>('API_URL'),
    );
  }

  private getFrontendUrl() {
    const [primary] = parseFrontendOrigins(
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173',
    );
    return primary;
  }

  private setCookies(
    res: Response,
    access_token: string,
    refresh_token: string,
  ) {
    // 15 minutes
    res.cookie('auth_token', access_token, {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: this.secureCookies ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    // 7 days
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: this.secureCookies ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  // ─── Passwordless Auth ─────────────────────────────────

  @Post('passwordless/start')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(passwordlessStartSchema))
  passwordlessStart(@Body() dto: PasswordlessStartInput, @Req() req: Request) {
    const frontend = req.headers.origin
      ? selectFrontendOrigin(
          this.configService.get<string>('FRONTEND_URL') ??
            'http://localhost:5173',
          req.headers.origin,
        )
      : this.getFrontendUrl();
    return this.authService.passwordlessStart(dto, frontend);
  }

  @Post('passwordless/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(verifyOtpSchema))
  async passwordlessVerify(
    @Body() dto: VerifyOtpInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, user } =
      await this.authService.verifyOtp(dto);
    this.setCookies(res, access_token, refresh_token);
    return { user };
  }

  @Get('magic-link/verify')
  legacyMagicLink(
    @Query('token') token: string,
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response,
  ) {
    let frontend: string;
    try {
      frontend = selectFrontendOrigin(
        this.configService.get<string>('FRONTEND_URL') ??
          'http://localhost:5173',
        returnTo,
      );
    } catch {
      throw new BadRequestException('Invalid sign-in destination');
    }
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      throw new BadRequestException('Invalid login link');
    }
    return res.redirect(
      302,
      `${frontend}/auth/confirm#${new URLSearchParams({ token }).toString()}`,
    );
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UsePipes(new ZodValidationPipe(verifyMagicLinkSchema))
  async magicLinkVerify(
    @Body() dto: VerifyMagicLinkInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token, user } =
      await this.authService.verifyMagicLink(dto.token);
    this.setCookies(res, access_token, refresh_token);
    return { user };
  }

  // ─── Google OAuth ──────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  googleAuth() {
    // Intercepted by GoogleOauthGuard
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontend = originFromGoogleState(
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173',
      req.query.state,
    );
    const { access_token, refresh_token } = await this.authService.googleLogin(
      req.user as import('./auth.service').GoogleProfile,
    );
    this.setCookies(res, access_token, refresh_token);

    return res.redirect(`${frontend}/dashboard`);
  }

  // ─── Session Management ────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies as Record<string, string>)?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { access_token, refresh_token, user } =
      await this.authService.refresh(refreshToken);
    this.setCookies(res, access_token, refresh_token);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req.cookies as Record<string, string>)?.refresh_token;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    const cookieOptions = {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: this.secureCookies ? ('none' as const) : ('lax' as const),
      path: '/',
    };

    res.clearCookie('auth_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    return { message: 'Logged out successfully' };
  }
}
