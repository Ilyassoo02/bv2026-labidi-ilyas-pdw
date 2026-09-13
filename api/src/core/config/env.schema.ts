import { z } from 'zod';
import { AppMode } from './config.keys.js';

export const envSchema = z
  .object({
    NODE_ENV: z.nativeEnum(AppMode).default(AppMode.Dev),
    APP_PORT: z.coerce.number().default(3000),
    DB_SYNC: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .default(false),
  })
  .superRefine((data, ctx: z.RefinementCtx) => {
    if (data.NODE_ENV === AppMode.Prod && data.DB_SYNC) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DB_SYNC interdit en PROD',
        path: ['DB_SYNC'],
      });
    }
  });

export type ValidatedEnvironment = z.infer<typeof envSchema>;

export function validateEnvironment(config: Record<string, unknown>): ValidatedEnvironment {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Configuration invalide : ${issues}`);
  }
  return result.data;
}