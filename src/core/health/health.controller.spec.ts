import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

// Je teste le contrôleur seul, sans démarrer le serveur HTTP.
describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = moduleRef.get<HealthController>(HealthController);
  });

  it('renvoie le statut ok', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
  });
});
