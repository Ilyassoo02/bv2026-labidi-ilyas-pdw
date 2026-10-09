import { z } from 'zod';
import { AppMode, LogLevel } from '../data/enum';

// Je garde la même règle pour NODE_ENV : DEV, TEST ou PROD, ou leurs noms longs convertis ensuite.
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

// Je décris ici toutes les variables que mon application accepte.
const environmentSchema = z.object({
  APP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: appModeSchema,
  // Je valide le niveau de log : une faute comme "inof" doit empêcher le démarrage au lieu de passer silencieusement.
  LOG_LEVEL: z.enum(LogLevel).default(LogLevel.Info),

  // Je déclare la connexion PostgreSQL : ces valeurs viennent du fichier .env.
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  // Je lis DB_SYNC comme un texte 'true' ou 'false', puis je le convertis en booléen.
  DB_SYNC: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type ValidatedEnvironment = z.infer<typeof environmentSchema>;

// Je lance la validation au démarrage : si une variable est fausse, je refuse de lancer l'application.
export const validateEnvironment = (
  config: Record<string, unknown>,
): ValidatedEnvironment => {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return result.data;
};
