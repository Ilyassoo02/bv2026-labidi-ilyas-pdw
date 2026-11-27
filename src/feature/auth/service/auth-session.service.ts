
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  IsNull,
  Repository,
} from 'typeorm';

import { EnvService } from '../../../common/config/env.service';
import { AccountService } from '../../account/account.service';

import { AuthRefreshTokenEntity } from '../entities/auth-refresh-token.entity';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthSecurityException } from '../data/exception/auth-security.exception';
import type { AuthContext } from '../data/model/auth-context';

import { TokenCryptoService } from './token-crypto.service';

// Je définis les informations retournées après la création d'une session.
export type CreatedSession = {
  session: AuthSessionEntity;
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
};

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectRepository(AuthSessionEntity)
    private readonly sessionRepository: Repository<AuthSessionEntity>,

    private readonly tokenCrypto: TokenCryptoService,
    private readonly accountService: AccountService,
    private readonly envService: EnvService,
    private readonly dataSource: DataSource,
  ) {}

  // Je crée une session et son premier refresh token.
  async createSession(
    manager: EntityManager,
    accountId: string,
  ): Promise<CreatedSession> {
    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + this.accountSessionTtlMilliseconds(),
    );

    const csrfToken = this.tokenCrypto.createOpaqueToken();
    const refreshToken = this.tokenCrypto.createOpaqueToken();

    const sessionRepository = manager.getRepository(AuthSessionEntity);
    const refreshRepository = manager.getRepository(AuthRefreshTokenEntity);

    // J'enregistre la session.
    const session = await sessionRepository.save(
      sessionRepository.create({
        accountId,
        accessVersion: 1,
        csrfTokenHash: this.tokenCrypto.fingerprint(csrfToken),
        lastUsedAt: now,
        expiresAt,
        revokedAt: null,
        revocationReason: null,
      }),
    );

    // Je calcule la date d'expiration du refresh token.
    const refreshExpiresAt = new Date(
      Math.min(
        expiresAt.getTime(),
        now.getTime() + this.refreshTtlMilliseconds(),
      ),
    );

    // J'enregistre le refresh token sous forme d'empreinte.
    await refreshRepository.save(
      refreshRepository.create({
        sessionId: session.id,

        // Je donne un identifiant de famille au refresh token.
        familyId: session.id,

        tokenHash: this.tokenCrypto.fingerprint(refreshToken),
        expiresAt: refreshExpiresAt,
        consumedAt: null,
        revokedAt: null,
        replacedById: null,
        parentId: null,
      }),
    );

    return {
      session,
      refreshToken,
      csrfToken,
      refreshExpiresAt,
    };
  }

  // Je vérifie qu'une session est toujours autorisée.
  async verifyContext(
    context: AuthContext,
  ): Promise<AuthSessionEntity> {
    const session = await this.sessionRepository.findOneBy({
      id: context.sessionId,
    });

    if (
      !session ||
      session.accountId !== context.accountId ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date()
    ) {
      throw new AuthSecurityException();
    }

    // Je vérifie également que le compte peut se connecter.
    const account = await this.accountService.findById(
      context.accountId,
    );

    if (
      !account ||
      !this.accountService.canAuthenticate(account)
    ) {
      throw new AuthSecurityException();
    }

    return session;
  }

  // Je révoque une session et tous ses refresh tokens actifs.
  async revoke(
    manager: EntityManager,
    sessionId: string,
    reason: string,
  ): Promise<void> {
    const sessionRepository = manager.getRepository(AuthSessionEntity);
    const refreshRepository = manager.getRepository(AuthRefreshTokenEntity);

    await sessionRepository.update(sessionId, {
      revokedAt: new Date(),
      revocationReason: reason,
      accessVersion: () => 'access_version + 1',
    });

    this.throwIfInjected('during-session-revocation');

    await refreshRepository
      .createQueryBuilder()
      .update(AuthRefreshTokenEntity)
      .set({
        revokedAt: new Date(),
      })
      .where('session_id = :sessionId', { sessionId })
      .andWhere('revoked_at IS NULL')
      .execute();

    this.throwIfInjected('during-family-revocation');
  }

  // Je révoque toutes les sessions actives d'un compte.
  async revokeAll(
    manager: EntityManager,
    accountId: string,
  ): Promise<void> {
    const sessions = await manager
      .getRepository(AuthSessionEntity)
      .findBy({
        accountId,
        revokedAt: IsNull(),
      });

    for (const session of sessions) {
      await this.revoke(manager, session.id, 'logout-all');
    }
  }

  // Je révoque une session dans une transaction.
  async revokeCurrent(
    sessionId: string,
    reason: string,
  ): Promise<void> {
    await this.dataSource.transaction((manager) =>
      this.revoke(manager, sessionId, reason),
    );
  }

  // Je récupère la durée maximale d'une session.
  private accountSessionTtlMilliseconds(): number {
    return (
      this.envService.get('AUTH_SESSION_ABSOLUTE_TTL_SECONDS') * 1000
    );
  }

  // Je récupère la durée de vie des refresh tokens.
  private refreshTtlMilliseconds(): number {
    return (
      this.envService.get('AUTH_REFRESH_TOKEN_TTL_SECONDS') * 1000
    );
  }

  // Je gère les simulations de panne utilisées pendant les tests.
  private throwIfInjected(point: string): void {
    if (
      this.envService.get('AUTH_TEST_REFRESH_FAILURE_POINT') === point
    ) {
      throw new Error(`Injected auth-session failure: ${point}`);
    }
  }
}
