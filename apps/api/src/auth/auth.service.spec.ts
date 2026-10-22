import { ServiceUnavailableException } from '@nestjs/common';
import { passwordlessStartSchema, verifyOtpSchema } from '@fettl/shared';
import { AuthService } from './auth.service';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import type { JwtService } from '@nestjs/jwt';

describe('Email sign-in', () => {
  it('uses the same normalized email for sending and verifying a code', () => {
    expect(
      passwordlessStartSchema.parse({ email: ' Person@Example.com ' }).email,
    ).toBe('person@example.com');
    expect(
      verifyOtpSchema.parse({ email: 'PERSON@example.com', otp: '123456' })
        .email,
    ).toBe('person@example.com');
  });

  it('does not reserve a code when email delivery is unconfigured', async () => {
    const prisma = {
      passwordlessRequest: { findFirst: jest.fn() },
    };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new AuthService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
      {} as JwtService,
    );

    await expect(
      service.passwordlessStart({ email: 'person@example.com' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.passwordlessRequest.findFirst).not.toHaveBeenCalled();
  });
});
