import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { configureApplication } from '@common/api/configure-application';
import { AppModule } from '@root/app.module';

// Je teste l'application complète, comme le ferait un client HTTP réel.
describe('Health (e2e)', () => {
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

  it('GET /api/health/live renvoie 200 et { status: ok }', () => {
    return request(app.getHttpServer())
      .get('/api/health/live')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
