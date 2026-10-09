import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppMode, ConfigKey, LogLevel } from './data/enum';
import { ValidatedEnvironment } from './environment/environment.validation';

// Je suis la seule porte d'entrée vers la configuration : le reste du code injecte EnvService, jamais process.env.
@Injectable()
export class EnvService {
  constructor(
    private readonly configService: ConfigService<ValidatedEnvironment, true>,
  ) {}

  get appMode(): AppMode {
    return this.get(ConfigKey.NodeEnv);
  }

  get appPort(): number {
    return this.get(ConfigKey.Port);
  }

  // J'expose le niveau de log déjà validé, pour que le logger n'ait jamais à relire la configuration brute.
  get logLevel(): LogLevel {
    return this.get(ConfigKey.LogLevel);
  }

  get<T extends keyof ValidatedEnvironment>(key: T): ValidatedEnvironment[T] {
    return this.configService.get(key, { infer: true });
  }
}
