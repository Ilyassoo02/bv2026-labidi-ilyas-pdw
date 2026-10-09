import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { configureApplication } from '@common/api/configure-application';
import { AppModule } from '@root/app.module';

// Je teste la route temporaire de validation avec une vraie application Nest.
describe('TestValidation (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Je crée le module de test avec toute l'application, comme dans les autres tests e2e.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = moduleFixture.createNestApplication();
    // J'applique la même configuration globale que dans main.ts (préfixe, pipes, filtres, intercepteurs).
    await configureApplication(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/test-validation avec un corps valide renvoie 201 et enveloppe les données', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/test-validation')
      .send({ name: 'Ilyas', age: 25, role: 'USER' })
      .expect(201);

    // Je vérifie que la réponse suit le format commun { code, result, data, validationErrors }.
    expect(response.body.result).toBe(true);
    expect(response.body.data).toEqual({ name: 'Ilyas', age: 25, role: 'USER' });
  });

  it('POST /api/test-validation avec un corps invalide renvoie 422 et les erreurs de validation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/test-validation')
      .send({ name: '', age: 200, role: 'INCONNU', champInconnu: 'x' })
      .expect(422);

    // Je vérifie que l'erreur suit le format commun et contient des erreurs de validation.
    expect(response.body.result).toBe(false);
    expect(response.body.code).toBe('api.common.validation-error');
    expect(response.body.validationErrors.length).toBeGreaterThan(0);
  });
});
