import { SetMetadata } from '@nestjs/common';

// Je définis la clé sous laquelle je range le code de succès d'une route.
export const API_SUCCESS_CODE_KEY = 'api:success-code';

// Je pose sur une route le code applicatif qui décrira sa réponse de succès.
export const ApiSuccessCode = (code: string) =>
  SetMetadata(API_SUCCESS_CODE_KEY, code);

// Je définis la clé qui indique à l'Interceptor de ne pas envelopper la réponse.
export const API_SKIP_TRANSFORM_KEY = 'api:skip-transform';

// Je marque une route dont la réponse doit rester brute, comme une sonde de santé.
export const SkipApiTransform = () => SetMetadata(API_SKIP_TRANSFORM_KEY, true);
