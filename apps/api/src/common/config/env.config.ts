import { parseFrontendOrigins } from './browser-origin';
import { z } from 'zod';

export const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1),
    API_URL: z.string().url().optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_BUCKET_NAME: z.string().min(1).optional(),
    S3_PUBLIC_URL: z.string().url().optional(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    FRONTEND_URL: z.string().refine((value) => {
      try {
        parseFrontendOrigins(value);
        return true;
      } catch {
        return false;
      }
    }, 'Expected a comma-separated list of HTTP(S) origins, with the sign-in destination first'),
    MAX_GROUP_MEMBERS: z.coerce.number().default(50),
    VPA_ENCRYPTION_KEY: z.string().min(1).optional(),
    VAPID_PUBLIC_KEY: z.string().min(1).optional(),
    VAPID_PRIVATE_KEY: z.string().min(1).optional(),
    VAPID_SUBJECT: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
  })
  .superRefine((config, context) => {
    if (config.NODE_ENV === 'production') {
      if (config.API_URL && !config.API_URL.startsWith('https://')) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['API_URL'],
          message: 'Production public API URL must use HTTPS',
        });
      }
      if (
        config.JWT_ACCESS_SECRET.length < 32 ||
        config.JWT_ACCESS_SECRET.includes('change-in-production')
      )
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'Use a unique secret of at least 32 characters',
        });
      for (const key of [
        'API_URL',
        'EMAIL_FROM',
        'RESEND_API_KEY',
        'VPA_ENCRYPTION_KEY',
        'S3_ENDPOINT',
        'S3_REGION',
        'S3_ACCESS_KEY_ID',
        'S3_SECRET_ACCESS_KEY',
        'S3_BUCKET_NAME',
      ] as const) {
        if (!config[key]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: 'Required in production',
          });
        }
      }
    }

    if (
      config.VPA_ENCRYPTION_KEY &&
      !/^[a-fA-F0-9]{64}$/.test(config.VPA_ENCRYPTION_KEY)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['VPA_ENCRYPTION_KEY'],
        message: 'Must be a 64-character hexadecimal AES-256 key',
      });
    }

    if (
      Boolean(config.GOOGLE_CLIENT_ID) !== Boolean(config.GOOGLE_CLIENT_SECRET)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CLIENT_SECRET'],
        message: 'Google client ID and secret must be configured together',
      });
    }

    if (config.GOOGLE_CALLBACK_URL) {
      const apiUrl = (
        config.API_URL || `http://localhost:${config.PORT}`
      ).replace(/\/$/, '');
      const expected = `${apiUrl}/auth/google/callback`;
      if (config.GOOGLE_CALLBACK_URL !== expected) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['GOOGLE_CALLBACK_URL'],
          message: `Must match the public API callback URL: ${expected}`,
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(
    Object.fromEntries(
      Object.entries(config).filter(([, value]) => value !== ''),
    ),
  );

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
