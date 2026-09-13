import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from '../core/health/health.module.js';
import { AppConfigModule } from '../core/config/app-config.module.js';

@Module({
  imports: [AppConfigModule.register(), HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}