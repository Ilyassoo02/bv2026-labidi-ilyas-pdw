import { DynamicModule, Module } from '@nestjs/common';
import { AppConfigModule } from '@common/config/app-config.module';
import { LoggingModule } from '@common/logging';
import { HealthModule } from '@core/health';

// Je suis le module racine : je n'ai aucune logique, j'assemble seulement les briques.
@Module({})
export class AppModule {
  // Je calcule la composition au démarrage, car la configuration doit être prête avant les autres modules.
  static register(): DynamicModule {
    return {
      module: AppModule,
      // J'ajoute le module de logs juste après la configuration, car les logs dépendent de la configuration.
      imports: [AppConfigModule.register(), LoggingModule, HealthModule],
    };
  }
}
