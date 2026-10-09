import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppMode, LogLevel } from './data/enum';
import { ValidatedEnvironment } from './environment/environment.validation';

// Je suis le seul point d'entrée vers la configuration : les autres classes ne lisent jamais process.env.
@Injectable()
export class EnvService {
  constructor(
    private readonly configService: ConfigService<ValidatedEnvironment, true>,
  ) {}

  get appMode(): AppMode {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get appPort(): number {
    return this.configService.get('APP_PORT', { infer: true });
  }

  get logLevel(): LogLevel {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  // Je regroupe ici les paramètres de connexion PostgreSQL.
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

  // Je permets de lire n'importe quelle variable validée, avec son type exact.
  get<T extends keyof ValidatedEnvironment>(key: T): ValidatedEnvironment[T] {
    return this.configService.get(key, { infer: true });
  }
}
