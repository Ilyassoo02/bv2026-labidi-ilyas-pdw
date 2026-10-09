import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppLogger } from '@common/logging';
import { ValidationException } from './api-exception';
import { ApiExceptionFilter } from './api-exception.filter';
import { ApiResponseInterceptor } from './api-response.interceptor';
import { mapValidationErrors } from './api-validation';

// Je branche une seule fois les composants transversaux, pour que toute l'application les utilise.
export const configureApplication = async (
  app: INestApplication,
): Promise<void> => {
  // Je valide chaque entrée : les champs inconnus sont refusés et les erreurs passent par mon format.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new ValidationException(mapValidationErrors(errors)),
    }),
  );

  // J'enveloppe chaque succès dans mon format de réponse.
  app.useGlobalInterceptors(new ApiResponseInterceptor(app.get(Reflector)));

  // Je récupère le logger de façon asynchrone, car il est transitoire, puis je transforme chaque erreur en réponse maîtrisée.
  const logger = await app.resolve(AppLogger);
  app.useGlobalFilters(new ApiExceptionFilter(logger));

  // Je génère la documentation Swagger à partir des routes, disponible sur /docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HOOS API')
    .setDescription("Documentation de l'API du backend PWD")
    .setVersion('0.0.1')
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
};
