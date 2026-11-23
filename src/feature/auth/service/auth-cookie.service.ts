
import { Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';

import { EnvService } from '../../../common/config/env.service';

// Je définis les trois cookies utilisés pour l'authentification.
export type AuthCookieNames = {
  access: string;
  refresh: string;
  csrf: string;
};

@Injectable()
export class AuthCookieService {
  readonly names: AuthCookieNames;

  constructor(private readonly envService: EnvService) {
    // En production, j'utilise le préfixe sécurisé __Host-.
    this.names = this.envService.isProduction
      ? {
          access: '__Host-hoos-access',
          refresh: '__Host-hoos-refresh',
          csrf: '__Host-hoos-csrf',
        }
      : {
          access: 'hoos-access',
          refresh: 'hoos-refresh',
          csrf: 'hoos-csrf',
        };
  }

  // Je crée le cookie contenant l'access token.
  setAccessCookie(response: Response, token: string): void {
    response.cookie(this.names.access, token, {
      ...this.baseOptions(true),
      maxAge: this.envService.accessTokenTtlSeconds * 1000,
    });
  }

  // Je crée le cookie contenant le refresh token.
  setRefreshCookie(
    response: Response,
    token: string,
    expiresAt: Date,
  ): void {
    response.cookie(this.names.refresh, token, {
      ...this.baseOptions(true),
      expires: expiresAt,
    });
  }

  // Je crée le cookie CSRF, accessible au JavaScript du client.
  setCsrfCookie(
    response: Response,
    token: string,
    expiresAt: Date,
  ): void {
    response.cookie(this.names.csrf, token, {
      ...this.baseOptions(false),
      expires: expiresAt,
    });
  }

  // Je supprime les cookies lors de la déconnexion.
  clearAuthCookies(response: Response): void {
    for (const name of Object.values(this.names)) {
      response.clearCookie(
        name,
        this.baseOptions(name !== this.names.csrf),
      );
    }
  }

  // Je centralise les options de sécurité des cookies.
  private baseOptions(httpOnly: boolean): CookieOptions {
    return {
      httpOnly,
      secure: this.envService.isProduction,
      sameSite: 'strict',
      path: '/',
    };
  }
}
