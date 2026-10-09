import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { configureApplication } from '@common/api/configure-application';
import { AppModule } from '@root/app.module';

// Je teste le domaine Account de bout en bout, avec la vraie base PostgreSQL.
describe('Account (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = moduleFixture.createNestApplication();
    await configureApplication(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/account crée un compte, puis GET /api/account/:id le retrouve', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/account')
      .expect(201);

    expect(created.body.result).toBe(true);
    expect(created.body.code).toBe('api.account.created');

    const id: string = created.body.data.id;

    const found = await request(app.getHttpServer())
      .get(`/api/account/${id}`)
      .expect(200);

    expect(found.body.data).toMatchObject({ id, status: 'ACTIVE' });
  });

  it('GET /api/account/:id renvoie 404 si le compte n’existe pas', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/account/01ARZ3NDEKTSV4RRFFQ69G5FAV')
      .expect(404);

    expect(response.body).toMatchObject({
      code: 'api.account.not-found',
      result: false,
    });
  });

  it('GET /api/account/:id renvoie 400 si l’identifiant n’est pas un ULID', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/account/pas-un-ulid')
      .expect(400);

    expect(response.body).toMatchObject({ result: false });
  });
});
