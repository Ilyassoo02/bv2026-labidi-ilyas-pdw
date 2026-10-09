import { Module } from '@nestjs/common';
import { TestValidationController } from './test-validation.controller';

// Je déclare le module de test pour l'exposer dans l'application.
@Module({
  controllers: [TestValidationController],
})
export class TestValidationModule {}
