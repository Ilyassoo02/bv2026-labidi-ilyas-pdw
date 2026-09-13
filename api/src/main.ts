import { NestFactory } from '@nestjs/core';
import { AppModule } from './root/app.module.js';
import { EnvService } from './core/config/env.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const envService = app.get(EnvService);

  await app.listen(envService.appPort);
  console.log(` API lancée sur le port ${envService.appPort} en mode ${envService.nodeEnv}`);
}

void bootstrap();