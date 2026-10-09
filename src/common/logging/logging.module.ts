import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { EnvService } from '@common/config/env.service';
import { AppLogger } from './app-logger';
import { buildPinoHttpOptions } from './pino-http.options';

// Je rends le logging disponible partout dans l'application, sans avoir à réimporter ce module.
@Global()
@Module({
  imports: [
    // Je configure pino à partir de EnvService, donc à partir de la configuration déjà validée.
    LoggerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        pinoHttp: buildPinoHttpOptions(env),
      }),
    }),
  ],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggingModule {}
