
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { DataSource } from 'typeorm';

import { ApiCode } from '../../../common/api/api-codes';
import { EnvService } from '../../../common/config/env.service';
import { AccountService } from '../../account/account.service';

import { AuthRefreshTokenEntity } from '../entities/auth-refresh-token.entity';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthSecurityException } from '../data/exception/auth-security.exception';

import { CsrfService } from './csrf.service';
import { AuthSessionService } from './auth-session.service';
import { TokenCryptoService } from './token-crypto.service';
import { AuthCookieService } from './auth-cookie.service';

// Je définis les informations renvoyées après le renouvellement.
export type RotatedRefresh = {
  accountId: string;
  sessionId: string;
  accessVersion: number;
  refreshToken: string;
  refreshExpiresAt: Date;
};

// Je définis le résultat si un ancien jeton est réutilisé.
type ReplayDetected = {
  replayDetected: true;
};

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tokenCrypto: TokenCryptoService,
    private readonly csrfService: CsrfService,
    private readonly sessions: AuthSessionService,
    private readonly envService: EnvService,
    private readonly cookies: AuthCookieService,
    private readonly accountService: AccountService,
  ) {}

  // Je renouvelle un refresh token.
  async rotate(request: Request): Promise<RotatedRefresh> {
    // Je récupère le refresh token dans les cookies.
    const cookies = request.cookies as
      | Record<string, unknown>
      | undefined;

    const refreshToken = cookies?.[this.cookies.names.refresh];

    // Je refuse un jeton absent ou incorrect.
    if (
      typeof refreshToken !== 'string' ||
      refreshToken.length < 40 ||
      refreshToken.length > 512
    ) {
      throw new AuthSecurityException(ApiCode.AuthRefreshInvalid);
    }

    // Je vérifie la présence du jeton CSRF.
    const csrfToken = request.header('X-CSRF-Token');

    if (!csrfToken) {
      throw new AuthSecurityException(ApiCode.AuthCsrfInvalid, 403);
    }

    // Je réalise toutes les modifications dans une transaction.
    const result = await this.dataSource.transaction<
      RotatedRefresh | ReplayDetected
    >(async (manager) => {
      const tokenRepository = manager.getRepository(
        AuthRefreshTokenEntity,
      );

      const sessionRepository = manager.getRepository(
        AuthSessionEntity,
      );

      // Je recherche le jeton grâce à son empreinte.
      const tokenHash = this.tokenCrypto.fingerprint(refreshToken);

      const candidate = await tokenRepository.findOneBy({
        tokenHash,
      });

      if (!candidate) {
        throw new AuthSecurityException(ApiCode.AuthRefreshInvalid);
      }

      // Je verrouille la session pendant le renouvellement.
      const session = await sessionRepository.findOne({
        where: {
          id: candidate.sessionId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!session) {
        throw new AuthSecurityException(ApiCode.AuthRefreshInvalid);
      }

      // Je verrouille également le refresh token.
      const token = await tokenRepository.findOne({
        where: {
          id: candidate.id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (
        !token ||
        token.tokenHash !== tokenHash ||
        token.sessionId !== session.id
      ) {
        throw new AuthSecurityException(ApiCode.AuthRefreshInvalid);
      }

      // Je détecte la réutilisation d'un ancien jeton.
      if (
        token.consumedAt !== null ||
        token.revokedAt !== null
      ) {
        await this.sessions.revoke(
          manager,
          session.id,
          'refresh-reuse',
        );

        return { replayDetected: true };
      }

      // Je refuse les sessions ou jetons expirés.
      if (
        token.expiresAt <= new Date() ||
        session.expiresAt <= new Date() ||
        session.revokedAt !== null
      ) {
        throw new AuthSecurityException(ApiCode.AuthRefreshInvalid);
      }

      // Je vérifie que le compte peut toujours se connecter.
      const account =
        await this.accountService.findByIdInTransaction(
          manager,
          session.accountId,
        );

      if (
        !account ||
        !this.accountService.canAuthenticate(account)
      ) {
        throw new AuthSecurityException(ApiCode.AuthRefreshInvalid);
      }

      // Je valide la protection CSRF.
      this.csrfService.assertValid(request, session);

      // Je crée un nouveau refresh token.
      const newRefreshToken = this.tokenCrypto.createOpaqueToken();

      const now = new Date();

      const refreshExpiresAt = new Date(
        Math.min(
          session.expiresAt.getTime(),
          now.getTime() *
            0 +
            now.getTime() +
            this.envService.get(
              'AUTH_REFRESH_TOKEN_TTL_SECONDS',
            ) *
              1000,
        ),
      );

      // J'enregistre le nouveau jeton dans la base de données.
      const replacement = await tokenRepository.save(
        tokenRepository.create({
          sessionId: session.id,
          tokenHash: this.tokenCrypto.fingerprint(newRefreshToken),
          expiresAt: refreshExpiresAt,
          consumedAt: null,
          revokedAt: null,
          replacedById: null,
          parentId: token.id,
        }),
      );

      this.throwIfInjected('after-successor-persistence');

      // Je marque l'ancien jeton comme consommé.
      token.consumedAt = now;
      token.replacedById = replacement.id;

      await tokenRepository.save(token);

      this.throwIfInjected('after-consumed');

      // Je mets à jour la version de la session.
      session.accessVersion += 1;
      session.lastUsedAt = now;

      await sessionRepository.save(session);

      return {
        accountId: session.accountId,
        sessionId: session.id,
        accessVersion: session.accessVersion,
        refreshToken: newRefreshToken,
        refreshExpiresAt,
      };
    });

    // Je refuse la connexion si un ancien jeton a été réutilisé.
    if ('replayDetected' in result) {
      throw new AuthSecurityException(ApiCode.AuthRefreshInvalid);
    }

    return result;
  }

  // Je simule certaines pannes pour les tests.
  private throwIfInjected(point: string): void {
    if (
      this.envService.get('AUTH_TEST_REFRESH_FAILURE_POINT') === point
    ) {
      throw new Error(`Injected refresh failure: ${point}`);
    }
  }
}
