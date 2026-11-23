
import { SetMetadata } from '@nestjs/common';

// Je définis la clé utilisée pour identifier les routes publiques.
export const PUBLIC_ROUTE = 'auth:public';

// Je crée un décorateur pour rendre une route accessible sans connexion.
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PUBLIC_ROUTE, true);
