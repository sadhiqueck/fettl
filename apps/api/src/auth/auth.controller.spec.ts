import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

const token = 'a'.repeat(64);

function setup(apiUrl: string) {
  const service = {
    verifyMagicLink: jest.fn().mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      user: { id: 'person' },
    }),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'API_URL') return apiUrl;
      if (key === 'FRONTEND_URL')
        return 'https://app.sqck.online,http://localhost:5173';
      return undefined;
    }),
  };
  const redirect = jest.fn();
  const cookie = jest.fn();
  const res = { redirect, cookie };
  const controller = new AuthController(
    service as unknown as AuthService,
    config as unknown as ConfigService,
  );
  return {
    controller,
    service,
    redirect,
    cookie,
    res: res as unknown as Response,
  };
}

describe('Magic link confirmation', () => {
  it('redirects an old GET link to confirmation without consuming it', () => {
    const { controller, service, redirect, cookie, res } = setup(
      'http://localhost:3000',
    );
    controller.legacyMagicLink(token, 'http://localhost:5173', res);
    expect(redirect).toHaveBeenCalledWith(
      302,
      `http://localhost:5173/auth/confirm#token=${token}`,
    );
    expect(service.verifyMagicLink).not.toHaveBeenCalled();
    expect(cookie).not.toHaveBeenCalled();
  });

  it.each([
    ['http://localhost:3000', false, 'lax'],
    ['https://api.sqck.online', true, 'none'],
  ])(
    'confirms by POST and sets expected cookies for %s',
    async (apiUrl, secure, sameSite) => {
      const { controller, service, cookie, res } = setup(apiUrl);
      await expect(controller.magicLinkVerify({ token }, res)).resolves.toEqual(
        {
          user: { id: 'person' },
        },
      );
      expect(service.verifyMagicLink).toHaveBeenCalledWith(token);
      expect(cookie).toHaveBeenCalledWith(
        'auth_token',
        'access',
        expect.objectContaining({
          httpOnly: true,
          secure,
          sameSite,
          path: '/',
          maxAge: 15 * 60 * 1000,
        }),
      );
      expect(cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh',
        expect.objectContaining({
          httpOnly: true,
          secure,
          sameSite,
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
    },
  );
});
