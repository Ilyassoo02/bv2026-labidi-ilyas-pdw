import { DynamicModule, Module } from '@nestjs/common';
import { AppConfigModule } from '@common/config/app-config.module';
import { DatabaseModule } from '@common/database/database.module';
import { LoggingModule } from '@common/logging';
import { HealthModule } from '@core/health';
import { AccountModule } from '@feature/account/account.module';

@Module({})
export class AppModule {
  // J'assemble ici tous les modules de l'application, dans l'ordre où ils doivent démarrer.
  static register(): DynamicModule {
    return {
      module: AppModule,
      imports: [
        AppConfigModule.register(),
        LoggingModule,
        DatabaseModule,
        HealthModule,
        AccountModule,
      ],
    };
  }
}
