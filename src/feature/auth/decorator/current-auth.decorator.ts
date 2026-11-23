
import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

import type { Request } from 'express';
import type { AuthContext } from '../data/model/auth-context';

// Je récupère les informations de l'utilisateur authentifié.
export const CurrentAuth = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthContext => {
    // Je récupère la requête HTTP.
    const request = context
      .switchToHttp()
      .getRequest<Request & { auth?: AuthContext }>();

    // Je vérifie que l'utilisateur est authentifié.
    if (!request.auth) {
      throw new Error(
        'Authenticated context is unavailable',
      );
    }

    // Je retourne les informations de connexion.
    return request.auth;
  },
);
