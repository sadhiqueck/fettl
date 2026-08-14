import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
      throw new ServiceUnavailableException('Google sign-in is unavailable.');
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const options = {
      path: '/auth/google',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure:
        process.env.NODE_ENV === 'production' ||
        process.env.API_URL?.startsWith('https://') === true,
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
      return {};
    }
    const state = randomBytes(32).toString('hex');
    res.cookie('oauth_state', state, { ...options, maxAge: 600_000 });
    return { state };
  }
}
