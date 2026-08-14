import {
  Injectable,
  UnauthorizedException,
  Logger,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import type { PasswordlessStartInput, VerifyOtpInput } from '@fettl/shared';
import { decryptVpaSafe } from '../common/utils/encryption';
import { getMagicLinkEmailTemplate } from './templates/magic-link.template';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: { value: string; verified?: boolean }[];
  photos?: { value: string }[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─── Passwordless Auth ─────────────────────────────────

  async passwordlessStart(dto: PasswordlessStartInput) {
    const recentRequest = await this.prisma.passwordlessRequest.findFirst({
      where: {
        email: dto.email,
        createdAt: { gt: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    });
    if (recentRequest) {
      throw new HttpException(
        'Please wait before requesting another code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(dto.email, otp);

    const magicToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(magicToken)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const apiUrl = (
      this.configService.get<string>('API_URL') ||
      `http://localhost:${this.configService.get<number>('PORT') || 3000}`
    ).replace(/\/$/, '');
    const magicLink = `${apiUrl}/auth/magic-link/verify?token=${magicToken}`;

    await this.prisma.$transaction([
      this.prisma.passwordlessRequest.deleteMany({
        where: { email: dto.email },
      }),
      this.prisma.passwordlessRequest.create({
        data: { email: dto.email, otpHash, tokenHash, expiresAt },
      }),
    ]);

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey)
      throw new ServiceUnavailableException('Email sign-in is unavailable.');
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from:
        this.configService.get<string>('EMAIL_FROM') ||
        'Fettl <noreply@sqck.online>',
      to: dto.email,
      subject: 'Your Fettl login code',
      html: getMagicLinkEmailTemplate(otp, magicLink),
    });
    if (error) {
      await this.prisma.passwordlessRequest.deleteMany({
        where: { email: dto.email, tokenHash },
      });
      throw new ServiceUnavailableException(
        'Email delivery failed. Please try again.',
      );
    }
    return { message: 'Verification sent' };
  }

  async verifyOtp(dto: VerifyOtpInput) {
    const otpHash = this.hashOtp(dto.email, dto.otp);

    const request = await this.prisma.passwordlessRequest.findFirst({
      where: {
        email: dto.email,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!request || request.attempts >= 5) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (request.otpHash !== otpHash) {
      const attempt = await this.prisma.passwordlessRequest.updateMany({
        where: { id: request.id, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
      });
      if (attempt.count && request.attempts >= 4) {
        await this.prisma.passwordlessRequest.deleteMany({
          where: { id: request.id },
        });
      }
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Consume exactly once, including when two verification requests race.
    const consumed = await this.prisma.passwordlessRequest.deleteMany({
      where: { id: request.id, attempts: { lt: 5 } },
    });
    if (!consumed.count)
      throw new UnauthorizedException('Invalid or expired OTP');

    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      create: {
        email: dto.email,
        name: dto.email.split('@')[0],
        isEmailVerified: true,
      },
      update: { isEmailVerified: true },
    });

    return this.generateTokens(user);
  }

  async verifyMagicLink(token: string) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
      throw new UnauthorizedException('Invalid login link');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const request = await this.prisma.passwordlessRequest.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!request) {
      throw new UnauthorizedException('Invalid or expired login link');
    }

    // Consume exactly once, including when two verification requests race.
    const consumed = await this.prisma.passwordlessRequest.deleteMany({
      where: { id: request.id },
    });
    if (!consumed.count)
      throw new UnauthorizedException('Invalid or expired login link');

    const user = await this.prisma.user.upsert({
      where: { email: request.email },
      create: {
        email: request.email,
        name: request.email.split('@')[0],
        isEmailVerified: true,
      },
      update: { isEmailVerified: true },
    });

    return this.generateTokens(user);
  }

  // ─── Google OAuth ──────────────────────────────────────

  async googleLogin(profile: GoogleProfile) {
    if (!profile) {
      throw new UnauthorizedException('No user from google');
    }

    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    const googleId = profile.id;
    const avatarUrl = profile.photos?.[0]?.value;

    if (!email || profile.emails?.[0]?.verified !== true) {
      throw new UnauthorizedException('Google profile missing email');
    }

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email, name, googleId, avatarUrl, isEmailVerified: true },
      });
    } else if (user.googleId && user.googleId !== googleId) {
      throw new UnauthorizedException('Google account does not match.');
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: user.avatarUrl ?? avatarUrl,
          isEmailVerified: true,
        },
      });
    }

    return this.generateTokens(user);
  }

  // ─── Session Management ────────────────────────────────

  async refresh(refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('No refresh token provided');

    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    return this.prisma.$transaction(async (tx) => {
      const saved = await tx.refreshToken.findUnique({
        where: { token: hashedToken },
        include: { user: true },
      });
      if (!saved) throw new UnauthorizedException('Invalid refresh token');
      const consumed = await tx.refreshToken.deleteMany({
        where: {
          id: saved.id,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (!consumed.count)
        throw new UnauthorizedException('Invalid refresh token');
      return this.generateTokens(saved.user, tx);
    });
  }

  async logout(refreshToken: string) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prisma.refreshToken.deleteMany({
      where: { token: hashedToken },
    });
  }

  // ─── Helpers ───────────────────────────────────────────

  private hashOtp(email: string, otp: string) {
    return crypto
      .createHmac(
        'sha256',
        this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      )
      .update(email)
      .update(':')
      .update(otp)
      .digest('hex');
  }

  private async generateTokens(
    user: {
      id: string;
      email: string;
      name: string;
      vpa?: string | null;
    },
    tx: Pick<PrismaService, 'refreshToken'> = this.prisma,
  ) {
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    const refresh_token = crypto.randomBytes(64).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(refresh_token)
      .digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await tx.refreshToken.create({
      data: { token: hashedToken, userId: user.id, expiresAt },
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        vpa: decryptVpaSafe(user.vpa),
      },
    };
  }
}
