
import { z } from 'zod';
import { AppMode, LogLevel } from '../data/enum';

// Je valide les différents modes de fonctionnement de l'application.
const appModeSchema = z
  .enum(['DEV', 'TEST', 'PROD', 'development', 'test', 'production'])
  .transform((value) => {
    if (value === 'development') {
      return AppMode.Dev;
    }

    if (value === 'test') {
      return AppMode.Test;
    }

    if (value === 'production') {
      return AppMode.Prod;
    }

    return value as AppMode;
  });

// Je définis toutes les variables d'environnement de mon application.
const environmentSchema = z
  .object({
    // Configuration générale.
    APP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    NODE_ENV: appModeSchema,

    LOG_LEVEL: z.enum(LogLevel).default(LogLevel.Info),

    // Configuration PostgreSQL.
    DB_HOST: z.string().min(1).default('localhost'),

    DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),

    DB_USER: z.string().min(1),

    DB_PASSWORD: z.string().min(1),

    DB_NAME: z.string().min(1),

    DB_SYNC: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),

    // Politique de sécurité des mots de passe.
    AUTH_PASSWORD_MIN_LENGTH: z.coerce
      .number()
      .int()
      .min(1)
      .default(15),

    AUTH_PASSWORD_MAX_LENGTH: z.coerce
      .number()
      .int()
      .min(64)
      .max(1024)
      .default(128),

    // Paramètres du hachage Argon2id.
    AUTH_PASSWORD_ARGON2_MEMORY_COST: z.coerce
      .number()
      .int()
      .min(19456)
      .default(19456),

    AUTH_PASSWORD_ARGON2_TIME_COST: z.coerce
      .number()
      .int()
      .min(2)
      .default(2),

    AUTH_PASSWORD_ARGON2_PARALLELISM: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    // Protection contre les tentatives de connexion répétées.
    AUTH_PASSWORD_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(5),

    AUTH_PASSWORD_LOCKOUT_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .default(900),

    // Durée de vie des jetons JWT.
    AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .max(600)
      .default(600),

    // Durée de vie des refresh tokens.
    AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .default(604800),

    // Durée maximale d'une session.
    AUTH_SESSION_ABSOLUTE_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(1)
      .default(2592000),

    // Secret utilisé pour les empreintes des refresh tokens.
    AUTH_REFRESH_TOKEN_PEPPER: z.string().default(''),

    // Configuration des clés JWT ES256.
    AUTH_JWT_ACTIVE_KID: z.string().default('dev-active'),

    AUTH_JWT_PRIVATE_KEY_BASE64: z.string().default(''),

    AUTH_JWT_PUBLIC_KEYS_JSON: z.string().default('{}'),

    // Injection de pannes réservée aux tests.
    AUTH_TEST_REFRESH_FAILURE_POINT: z
      .enum([
        '',
        'after-successor-persistence',
        'after-consumed',
        'during-session-revocation',
        'during-family-revocation',
      ])
      .default(''),
  })

  // Je vérifie la cohérence des paramètres de sécurité.
  .superRefine((env, ctx) => {
    // Je refuse la synchronisation automatique en production.
    if (env.NODE_ENV === AppMode.Prod && env.DB_SYNC) {
      ctx.addIssue({
        code: 'custom',
        path: ['DB_SYNC'],
        message: 'DB_SYNC doit rester à false en production',
      });
    }

    // Je vérifie les limites des mots de passe.
    if (
      env.AUTH_PASSWORD_MIN_LENGTH >
      env.AUTH_PASSWORD_MAX_LENGTH
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_PASSWORD_MIN_LENGTH'],
        message:
          'La longueur minimale dépasse la longueur maximale',
      });
    }

    // Je vérifie la cohérence des durées de session.
    if (
      env.AUTH_REFRESH_TOKEN_TTL_SECONDS >
      env.AUTH_SESSION_ABSOLUTE_TTL_SECONDS
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_REFRESH_TOKEN_TTL_SECONDS'],
        message:
          'Le refresh token dépasse la durée maximale de la session',
      });
    }

    // En production, les secrets de sécurité sont obligatoires.
    if (env.NODE_ENV === AppMode.Prod) {
      // Je vérifie que le pepper contient au moins 32 octets.
      const pepper = Buffer.from(
        env.AUTH_REFRESH_TOKEN_PEPPER,
        'base64',
      );

      if (pepper.length < 32) {
        ctx.addIssue({
          code: 'custom',
          path: ['AUTH_REFRESH_TOKEN_PEPPER'],
          message:
            'Le pepper doit contenir au moins 32 octets',
        });
      }

      // Je refuse l'injection de pannes en production.
      if (env.AUTH_TEST_REFRESH_FAILURE_POINT) {
        ctx.addIssue({
          code: 'custom',
          path: ['AUTH_TEST_REFRESH_FAILURE_POINT'],
          message:
            'L injection de pannes est interdite en production',
        });
      }

      // Je vérifie la présence des clés JWT.
      if (
        !env.AUTH_JWT_PRIVATE_KEY_BASE64 ||
        !env.AUTH_JWT_PUBLIC_KEYS_JSON ||
        env.AUTH_JWT_PUBLIC_KEYS_JSON === '{}'
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['AUTH_JWT_PRIVATE_KEY_BASE64'],
          message:
            'Les clés JWT sont obligatoires en production',
        });
      }
    }
  });

// Je récupère automatiquement les types validés par Zod.
export type ValidatedEnvironment = z.infer<typeof environmentSchema>;

// Je valide toutes les variables au démarrage.
export const validateEnvironment = (
  config: Record<string, unknown>,
): ValidatedEnvironment => {
  const result = environmentSchema.safeParse(config);

  // Si une variable est incorrecte, je refuse le démarrage.
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(
      `Invalid environment configuration: ${message}`,
    );
  }

  // Je retourne la configuration validée.
  return result.data;
};
