import { configureApplication } from '@common/api/configure-application';
import { EnvService } from '@common/config/env.service';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from '@root/app.module';

const bootstrap = async () => {
  // J'active le buffer de logs : les premiers messages attendent que pino soit prêt, pour ne rien perdre.
  const app = await NestFactory.create(AppModule.register(), {
    bufferLogs: true,
  });

  // Je remplace le logger par défaut de NestJS par pino, pour que tous les logs aient le même format.
  app.useLogger(app.get(Logger));

  // J'active ma configuration globale : validation, enveloppe de succès et gestion des erreurs.
  await configureApplication(app);

  const envService: EnvService = app.get(EnvService);
  await app.listen(envService.appPort);
};

bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
