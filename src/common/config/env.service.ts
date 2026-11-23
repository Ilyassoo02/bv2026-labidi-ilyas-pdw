
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppMode, LogLevel } from './data/enum';
import { ValidatedEnvironment } from './environment/environment.validation';

// Je centralise l'accès aux variables d'environnement de mon application.
@Injectable()
export class EnvService {
  constructor(
    private readonly configService: ConfigService<ValidatedEnvironment, true>,
  ) {}

  // Configuration générale de l'application.
  get appMode(): AppMode {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.appMode === AppMode.Prod;
  }

  get appPort(): number {
    return this.configService.get('APP_PORT', { infer: true });
  }

  get logLevel(): LogLevel {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  // Configuration de la base de données PostgreSQL.
  get dbHost(): string {
    return this.configService.get('DB_HOST', { infer: true });
  }

  get dbPort(): number {
    return this.configService.get('DB_PORT', { infer: true });
  }

  get dbUser(): string {
    return this.configService.get('DB_USER', { infer: true });
  }

  get dbPassword(): string {
    return this.configService.get('DB_PASSWORD', { infer: true });
  }

  get dbName(): string {
    return this.configService.get('DB_NAME', { infer: true });
  }

  get dbSync(): boolean {
    return this.configService.get('DB_SYNC', { infer: true });
  }

  // Configuration de la politique des mots de passe.
  get passwordMinLength(): number {
    return this.configService.get('AUTH_PASSWORD_MIN_LENGTH', {
      infer: true,
    });
  }

  get passwordMaxLength(): number {
    return this.configService.get('AUTH_PASSWORD_MAX_LENGTH', {
      infer: true,
    });
  }

  // Configuration du hachage Argon2id.
  get passwordArgon2MemoryCost(): number {
    return this.configService.get('AUTH_PASSWORD_ARGON2_MEMORY_COST', {
      infer: true,
    });
  }

  get passwordArgon2TimeCost(): number {
    return this.configService.get('AUTH_PASSWORD_ARGON2_TIME_COST', {
      infer: true,
    });
  }

  get passwordArgon2Parallelism(): number {
    return this.configService.get('AUTH_PASSWORD_ARGON2_PARALLELISM', {
      infer: true,
    });
  }

  // Durée de vie des jetons et des sessions.
  get accessTokenTtlSeconds(): number {
    return this.get('AUTH_ACCESS_TOKEN_TTL_SECONDS');
  }

  get refreshTokenTtlSeconds(): number {
    return this.get('AUTH_REFRESH_TOKEN_TTL_SECONDS');
  }

  get sessionAbsoluteTtlSeconds(): number {
    return this.get('AUTH_SESSION_ABSOLUTE_TTL_SECONDS');
  }

  // Configuration de sécurité des jetons JWT.
  get refreshTokenPepper(): string {
    return this.get('AUTH_REFRESH_TOKEN_PEPPER');
  }

  get jwtActiveKid(): string {
    return this.get('AUTH_JWT_ACTIVE_KID');
  }

  get jwtPrivateKeyBase64(): string {
    return this.get('AUTH_JWT_PRIVATE_KEY_BASE64');
  }

  get jwtPublicKeysJson(): string {
    return this.get('AUTH_JWT_PUBLIC_KEYS_JSON');
  }

  // Je récupère une variable validée avec son type exact.
  get<T extends keyof ValidatedEnvironment>(
    key: T,
  ): ValidatedEnvironment[T] {
    return this.configService.get(key, { infer: true });
  }
}
