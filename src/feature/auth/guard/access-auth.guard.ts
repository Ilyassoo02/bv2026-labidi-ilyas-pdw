
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AuthCookieService } from '../service/auth-cookie.service';
import { AuthSessionService } from '../service/auth-session.service';
import { CsrfService } from '../service/csrf.service';
import { TokenCryptoService } from '../service/token-crypto.service';

import type { AuthContext } from '../data/model/auth-context';

import { PUBLIC_ROUTE } from '../decorator/public.decorator';
import { AuthSecurityException } from '../data/exception/auth-security.exception';

// Je définis une requête qui peut contenir les informations de connexion.
type AuthRequest = Request & {
  auth?: AuthContext;
};

@Injectable()
export class AccessAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cookies: AuthCookieService,
    private readonly tokenCrypto: TokenCryptoService,
    private readonly sessions: AuthSessionService,
    private readonly csrf: CsrfService,
  ) {}

  // Je vérifie si l'utilisateur peut accéder à la route.
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    // Je vérifie si la route est publique.
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    // Je laisse passer les routes publiques.
    if (isPublic) {
      return true;
    }

    // Je récupère la requête HTTP.
    const request = context
      .switchToHttp()
      .getRequest<AuthRequest>();

    // Je récupère les cookies de connexion.
    const cookies = request.cookies as
      | Record<string, unknown>
      | undefined;

    // Je récupère le jeton d'accès.
    const token = cookies?.[this.cookies.names.access];

    // Je refuse une requête sans jeton.
    if (typeof token !== 'string') {
      throw new AuthSecurityException();
    }

    // Je vérifie la signature et la validité du JWT.
    const claims = this.tokenCrypto.verifyAccessToken(token);

    // Je prépare les informations de l'utilisateur connecté.
    const auth: AuthContext = {
      accountId: claims.sub,
      sessionId: claims.sid,
      tokenId: claims.jti,
    };

    // Je vérifie que la session existe et qu'elle est active.
    const session = await this.sessions.verifyContext(auth);

    // Je refuse un ancien jeton d'accès.
    if (session.accessVersion !== claims.ver) {
      throw new AuthSecurityException();
    }

    // Je vérifie le CSRF pour les requêtes qui modifient des données.
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        request.method,
      )
    ) {
      this.csrf.assertValid(request, session);
    }

    // Je conserve les informations de l'utilisateur dans la requête.
    request.auth = auth;

    // J'autorise l'accès à la route.
    return true;
  }
}
