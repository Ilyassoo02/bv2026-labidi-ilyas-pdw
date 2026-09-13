import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './env.schema.js';
import { EnvService } from './env.service.js';

@Global()
@Module({})
export class AppConfigModule {
  static register(): DynamicModule {
    return {
      module: AppConfigModule,
      imports: [
        ConfigModule.forRoot({
          validate: validateEnvironment,
          isGlobal: true,
        }),
      ],
      providers: [EnvService],
      exports: [EnvService],
    };
  }
}