
import type { Request } from 'express';

import { RefreshTokenService } from './refresh-token.service';
import { AuthRefreshTokenEntity } from '../entities/auth-refresh-token.entity';
import { AuthSessionEntity } from '../entities/auth-session.entity';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  const oldRefreshToken = 'r'.repeat(48);

  const tokenRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const sessionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const manager = {
    getRepository: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  const tokenCrypto = {
    fingerprint: jest.fn(),
    createOpaqueToken: jest.fn(),
  };

  const csrfService = {
    assertValid: jest.fn(),
  };

  const sessions = {
    revoke: jest.fn(),
  };

  const envService = {
    get: jest.fn(),
  };

  const cookies = {
    names: {
      refresh: 'hoos-refresh',
    },
  };

  const accountService = {
    findByIdInTransaction: jest.fn(),
    canAuthenticate: jest.fn(),
  };

  let request: Request;

  beforeEach(() => {
    jest.resetAllMocks();

    // Je prépare une requête avec un refresh token.
    request = {
      cookies: {
        'hoos-refresh': oldRefreshToken,
      },
      header: jest.fn().mockReturnValue('csrf-test'),
    } as unknown as Request;

    // Je prépare une transaction fictive.
    manager.getRepository.mockImplementation((entity) => {
      if (entity === AuthRefreshTokenEntity) {
        return tokenRepository;
      }

      if (entity === AuthSessionEntity) {
        return sessionRepository;
      }

      return undefined;
    });

    dataSource.transaction.mockImplementation(
      async (callback) => callback(manager),
    );

    tokenCrypto.fingerprint.mockImplementation(
      (value: string) => `hash-${value}`,
    );

    tokenCrypto.createOpaqueToken.mockReturnValue(
      'nouveau-refresh-token-test',
    );

    // Je prépare un ancien jeton encore valide.
    tokenRepository.findOneBy.mockResolvedValue({
      id: 'token-1',
      sessionId: 'session-1',
    });

    tokenRepository.findOne.mockResolvedValue({
      id: 'token-1',
      sessionId: 'session-1',
      tokenHash: `hash-${oldRefreshToken}`,
      consumedAt: null,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 600000),
    });

    // Je prépare une session active.
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      accountId: 'compte-1',
      accessVersion: 1,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 3600000),
    });

    tokenRepository.create.mockImplementation(
      (data) => data,
    );

    tokenRepository.save.mockImplementation(
      async (data) => ({
        id: data.id ?? 'token-2',
        ...data,
      }),
    );

    sessionRepository.save.mockImplementation(
      async (data) => data,
    );

    accountService.findByIdInTransaction.mockResolvedValue({
      id: 'compte-1',
      status: 'ACTIVE',
    });

    accountService.canAuthenticate.mockReturnValue(true);

    envService.get.mockImplementation((key: string) => {
      if (key === 'AUTH_REFRESH_TOKEN_TTL_SECONDS') {
        return 604800;
      }

      return '';
    });

    sessions.revoke.mockResolvedValue(undefined);

    // Je crée le service avec des dépendances fictives.
    service = new RefreshTokenService(
      dataSource as never,
      tokenCrypto as never,
      csrfService as never,
      sessions as never,
      envService as never,
      cookies as never,
      accountService as never,
    );
  });

  // Test 1 : je refuse un refresh token absent.
  it('refuse un refresh token absent', async () => {
    request.cookies = {};

    await expect(
      service.rotate(request),
    ).rejects.toThrow();

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  // Test 2 : je refuse une requête sans protection CSRF.
  it('refuse une requête sans CSRF', async () => {
    (request.header as jest.Mock).mockReturnValue(undefined);

    await expect(
      service.rotate(request),
    ).rejects.toThrow();

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  // Test 3 : je refuse un jeton qui n'existe pas en base.
  it('refuse un refresh token inconnu', async () => {
    tokenRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.rotate(request),
    ).rejects.toThrow();

    expect(tokenRepository.save).not.toHaveBeenCalled();
  });

  // Test 4 : je renouvelle correctement le jeton.
  it('renouvelle un refresh token valide', async () => {
    const result = await service.rotate(request);

    expect(result.accountId).toBe('compte-1');
    expect(result.sessionId).toBe('session-1');
    expect(result.accessVersion).toBe(2);

    expect(result.refreshToken).toBe(
      'nouveau-refresh-token-test',
    );

    expect(csrfService.assertValid).toHaveBeenCalled();

    expect(tokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        parentId: 'token-1',
        consumedAt: null,
      }),
    );

    expect(tokenRepository.save).toHaveBeenCalledTimes(2);
    expect(sessionRepository.save).toHaveBeenCalled();
  });

  // Test 5 : je refuse une session expirée.
  it('refuse une session expirée', async () => {
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      accountId: 'compte-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60000),
    });

    await expect(
      service.rotate(request),
    ).rejects.toThrow();

    expect(tokenRepository.save).not.toHaveBeenCalled();
  });

  // Test 6 : je détecte la réutilisation d'un ancien jeton.
  it('révoque la session si un jeton est réutilisé', async () => {
    tokenRepository.findOne.mockResolvedValue({
      id: 'token-1',
      sessionId: 'session-1',
      tokenHash: `hash-${oldRefreshToken}`,
      consumedAt: new Date(),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 600000),
    });

    await expect(
      service.rotate(request),
    ).rejects.toThrow();

    expect(sessions.revoke).toHaveBeenCalledWith(
      manager,
      'session-1',
      'refresh-reuse',
    );

    expect(tokenRepository.create).not.toHaveBeenCalled();
  });
});
