
import { EntityManager } from 'typeorm';

import { AuthSessionService } from './auth-session.service';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthRefreshTokenEntity } from '../entities/auth-refresh-token.entity';

describe('AuthSessionService', () => {
  let service: AuthSessionService;

  // Je prépare une fausse requête SQL.
  const queryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  // Je prépare le repository des sessions.
  const sessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    update: jest.fn(),
  };

  // Je prépare le repository des refresh tokens.
  const refreshRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const manager = {
    getRepository: jest.fn(),
  };

  const tokenCrypto = {
    createOpaqueToken: jest.fn(),
    fingerprint: jest.fn(),
  };

  const accountService = {
    findById: jest.fn(),
    canAuthenticate: jest.fn(),
  };

  const envService = {
    get: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Je configure les repositories fictifs.
    manager.getRepository.mockImplementation((entity) => {
      if (entity === AuthSessionEntity) {
        return sessionRepository;
      }

      if (entity === AuthRefreshTokenEntity) {
        return refreshRepository;
      }

      return undefined;
    });

    sessionRepository.create.mockImplementation((data) => ({
      id: 'session-1',
      ...data,
    }));

    sessionRepository.save.mockImplementation(async (data) => data);
    sessionRepository.update.mockResolvedValue({ affected: 1 });
    sessionRepository.findBy.mockResolvedValue([]);

    refreshRepository.create.mockImplementation((data) => data);
    refreshRepository.save.mockImplementation(async (data) => data);
    refreshRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    queryBuilder.update.mockReturnThis();
    queryBuilder.set.mockReturnThis();
    queryBuilder.where.mockReturnThis();
    queryBuilder.andWhere.mockReturnThis();
    queryBuilder.execute.mockResolvedValue({ affected: 1 });

    tokenCrypto.createOpaqueToken
      .mockReturnValueOnce('csrf-token-test')
      .mockReturnValueOnce('refresh-token-test');

    tokenCrypto.fingerprint.mockImplementation(
      (value: string) => `hash-${value}`,
    );

    accountService.findById.mockResolvedValue({
      id: 'compte-1',
      status: 'ACTIVE',
    });

    accountService.canAuthenticate.mockReturnValue(true);

    envService.get.mockImplementation((key: string) => {
      if (key === 'AUTH_SESSION_ABSOLUTE_TTL_SECONDS') {
        return 2592000;
      }

      if (key === 'AUTH_REFRESH_TOKEN_TTL_SECONDS') {
        return 604800;
      }

      return '';
    });

    dataSource.transaction.mockImplementation(
      async (callback) => callback(manager),
    );

    // Je crée mon service avec les dépendances fictives.
    service = new AuthSessionService(
      sessionRepository as never,
      tokenCrypto as never,
      accountService as never,
      envService as never,
      dataSource as never,
    );
  });

  // Test 1 : je vérifie la création d'une session.
  it('crée une session et un refresh token', async () => {
    const result = await service.createSession(
      manager as unknown as EntityManager,
      'compte-1',
    );

    expect(result.session.accountId).toBe('compte-1');
    expect(result.session.accessVersion).toBe(1);

    expect(result.csrfToken).toBe('csrf-token-test');
    expect(result.refreshToken).toBe('refresh-token-test');

    expect(sessionRepository.save).toHaveBeenCalled();
    expect(refreshRepository.save).toHaveBeenCalled();

    expect(refreshRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        tokenHash: 'hash-refresh-token-test',
      }),
    );
  });

  // Test 2 : je vérifie une session valide.
  it('accepte une session active', async () => {
    const session = {
      id: 'session-1',
      accountId: 'compte-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    };

    sessionRepository.findOneBy.mockResolvedValue(session);

    const result = await service.verifyContext({
      accountId: 'compte-1',
      sessionId: 'session-1',
      tokenId: 'token-1',
    });

    expect(result).toEqual(session);
    expect(accountService.canAuthenticate).toHaveBeenCalled();
  });

  // Test 3 : je refuse une session révoquée.
  it('refuse une session révoquée', async () => {
    sessionRepository.findOneBy.mockResolvedValue({
      id: 'session-1',
      accountId: 'compte-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000),
    });

    await expect(
      service.verifyContext({
        accountId: 'compte-1',
        sessionId: 'session-1',
        tokenId: 'token-1',
      }),
    ).rejects.toThrow();
  });

  // Test 4 : je refuse une session expirée.
  it('refuse une session expirée', async () => {
    sessionRepository.findOneBy.mockResolvedValue({
      id: 'session-1',
      accountId: 'compte-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60000),
    });

    await expect(
      service.verifyContext({
        accountId: 'compte-1',
        sessionId: 'session-1',
        tokenId: 'token-1',
      }),
    ).rejects.toThrow();
  });

  // Test 5 : je révoque une session.
  it('révoque une session et ses refresh tokens', async () => {
    await service.revoke(
      manager as unknown as EntityManager,
      'session-1',
      'logout',
    );

    expect(sessionRepository.update).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        revokedAt: expect.any(Date),
        revocationReason: 'logout',
      }),
    );

    expect(queryBuilder.execute).toHaveBeenCalled();
  });

  // Test 6 : je révoque toutes les sessions d'un compte.
  it('révoque toutes les sessions actives', async () => {
    sessionRepository.findBy.mockResolvedValue([
      { id: 'session-1' },
      { id: 'session-2' },
    ]);

    await service.revokeAll(
      manager as unknown as EntityManager,
      'compte-1',
    );

    expect(sessionRepository.update).toHaveBeenCalledTimes(2);
    expect(queryBuilder.execute).toHaveBeenCalledTimes(2);
  });

  // Test 7 : je vérifie que la déconnexion utilise une transaction.
  it('révoque la session courante dans une transaction', async () => {
    await service.revokeCurrent('session-1', 'logout');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);

    expect(sessionRepository.update).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        revocationReason: 'logout',
      }),
    );
  });
});
