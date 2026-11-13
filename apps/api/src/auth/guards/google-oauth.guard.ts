import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import {
  createGoogleState,
  originFromGoogleState,
  selectFrontendOrigin,
} from '../google-return-origin';
import { secureAuthCookies } from '../auth-cookie-policy';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
      throw new ServiceUnavailableException('Google sign-in is unavailable.');
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const frontends = process.env.FRONTEND_URL || 'http://localhost:5173';
    const options = {
      path: '/auth/google',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: secureAuthCookies(process.env.NODE_ENV, process.env.API_URL),
    };
    if (req.path.endsWith('/callback')) {
      res.clearCookie('oauth_state', options);
      if (
        typeof req.query.state !== 'string' ||
        !req.query.state ||
        req.query.state !== req.cookies?.oauth_state
      ) {
        throw new UnauthorizedException('Google sign-in expired. Start again.');
      }
      try {
        originFromGoogleState(frontends, req.query.state);
      } catch {
        throw new UnauthorizedException('Google sign-in expired. Start again.');
      }
      return {};
    }
    let origin: string;
    try {
      origin = selectFrontendOrigin(frontends, req.query.returnTo);
    } catch {
      throw new BadRequestException('Invalid sign-in destination');
    }
    const state = createGoogleState(origin);
    res.cookie('oauth_state', state, { ...options, maxAge: 600_000 });
    return { state };
  }
}
