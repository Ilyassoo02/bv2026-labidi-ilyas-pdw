import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvService } from '@common/config/env.service';
import { AppMode } from '@common/config/data/enum';

// Je construis la configuration de la base à partir de EnvService : je ne lis jamais process.env ici.
export const createNestTypeOrmOptions = (
  env: EnvService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: env.dbHost,
  port: env.dbPort,
  username: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  // Je charge automatiquement les entités déclarées par les modules métier.
  autoLoadEntities: true,
  // Je laisse TypeORM modifier le schéma seulement si DB_SYNC=true, et jamais en production.
  synchronize: env.dbSync && env.appMode !== AppMode.Prod,
  // Je retente la connexion trois fois si PostgreSQL n'est pas encore prêt au démarrage.
  retryAttempts: 3,
  retryDelay: 1000,
});
