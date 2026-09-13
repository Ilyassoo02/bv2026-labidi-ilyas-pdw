import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidatedEnvironment } from './env.schema.js';

@Injectable()
export class EnvService {
  constructor(private readonly config: ConfigService<ValidatedEnvironment, true>) {}

  get appPort(): number {
    return this.config.get('APP_PORT', { infer: true });
  }

  get nodeEnv(): string {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get isProd(): boolean {
    return this.nodeEnv === 'PROD';
  }
}