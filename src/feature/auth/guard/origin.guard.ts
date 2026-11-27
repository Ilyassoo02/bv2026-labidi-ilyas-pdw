
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import type { Request } from 'express';

import { ApiCode } from '../../../common/api/api-codes';
import { EnvService } from '../../../common/config/env.service';

import { AuthSecurityException } from '../data/exception/auth-security.exception';

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(
    private readonly envService: EnvService,
  ) {}

  // Je vérifie l'origine des requêtes.
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request>();

    // Je laisse passer les requêtes de lecture.
    if (
      !['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        request.method,
      )
    ) {
      return true;
    }

    // Je récupère l'origine de la requête.
    const origin = request.header('Origin');
    const referer = request.header('Referer');

    const candidate =
      origin ?? this.originFromReferer(referer);

    // Je vérifie si cette origine est autorisée.
    if (
      candidate &&
      this.envService.corsOrigins.includes(candidate)
    ) {
      return true;
    }

    // Je tolère l'absence d'origine hors production.
    if (
      !candidate &&
      !this.envService.isProduction
    ) {
      return true;
    }

    // Je refuse une origine non autorisée.
    throw new AuthSecurityException(
      ApiCode.AuthOriginInvalid,
      HttpStatus.FORBIDDEN,
    );
  }

  // Je récupère l'origine depuis le Referer.
  private originFromReferer(
    referer: string | undefined,
  ): string | undefined {
    if (!referer) {
      return undefined;
    }

    try {
      return new URL(referer).origin;
    } catch {
      return undefined;
    }
  }
}
