import { envSchema } from './env.config';

const base = {
  DATABASE_URL: 'postgresql://localhost:5432/fettl',
  JWT_ACCESS_SECRET: 'local-secret',
  JWT_REFRESH_SECRET: 'local-secret',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  FRONTEND_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:3000',
};

describe('Google callback configuration', () => {
  it('accepts the callback on the same public API origin', () => {
    expect(
      envSchema.safeParse({
        ...base,
        GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
      }).success,
    ).toBe(true);
  });

  it('rejects a callback on a different host that would lose the state cookie', () => {
    expect(
      envSchema.safeParse({
        ...base,
        GOOGLE_CALLBACK_URL: 'https://api-tunnel.example/auth/google/callback',
      }).success,
    ).toBe(false);
  });
});
