
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { configureApplication } from '@common/api/configure-application';
import { AppModule } from '@root/app.module';

// Je teste que les routes Account sont protégées.
describe('Account (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule.register()],
      }).compile();

    app = moduleFixture.createNestApplication();

    await configureApplication(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // Je vérifie qu'on ne peut pas créer de compte sans connexion.
  it('refuse POST /api/account sans authentification', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/account')
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'api.auth.unauthorized',
      result: false,
    });
  });

  // Je vérifie qu'on ne peut pas consulter un compte sans connexion.
  it('refuse GET /api/account/:id sans authentification', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/account/01ARZ3NDEKTSV4RRFFQ69G5FAV')
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'api.auth.unauthorized',
      result: false,
    });
  });

  // Je vérifie que la sécurité passe avant la validation de l'ULID.
  it('refuse un identifiant incorrect sans authentification', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/account/pas-un-ulid')
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'api.auth.unauthorized',
      result: false,
    });
  });

  // Je vérifie que les informations personnelles sont protégées.
  it('refuse GET /api/account/me sans authentification', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/account/me')
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'api.auth.unauthorized',
      result: false,
    });
  });
});
