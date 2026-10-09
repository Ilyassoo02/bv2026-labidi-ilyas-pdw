import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// Je déclare le module de santé : il n'a besoin d'aucun autre module pour l'instant.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
