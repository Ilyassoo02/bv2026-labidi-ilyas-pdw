
import { ExecutionContext } from '@nestjs/common';

import { AccessAuthGuard } from './access-auth.guard';

describe('AccessAuthGuard', () => {
  let guard: AccessAuthGuard;

  // Je simule les dépendances du Guard.
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const cookies = {
    names: {
      access: 'hoos-access',
    },
  };

  const tokenCrypto = {
    verifyAccessToken: jest.fn(),
  };

  const sessions = {
    verifyContext: jest.fn(),
  };

  const csrf = {
    assertValid: jest.fn(),
  };

  // Je prépare une fausse requête HTTP.
  const createContext = (
    request: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.resetAllMocks();

    reflector.getAllAndOverride.mockReturnValue(false);

    tokenCrypto.verifyAccessToken.mockReturnValue({
      sub: 'compte-1',
      sid: 'session-1',
      jti: 'token-1',
      ver: 1,
    });

    sessions.verifyContext.mockResolvedValue({
      id: 'session-1',
      accountId: 'compte-1',
      accessVersion: 1,
    });

    guard = new AccessAuthGuard(
      reflector as never,
      cookies as never,
      tokenCrypto as never,
      sessions as never,
      csrf as never,
    );
  });

  // Test 1 : je laisse passer une route publique.
  it('autorise une route publique', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const request = {
      method: 'GET',
      cookies: {},
    };

    const result = await guard.canActivate(
      createContext(request),
    );

    expect(result).toBe(true);
    expect(tokenCrypto.verifyAccessToken).not.toHaveBeenCalled();
  });

  // Test 2 : je refuse une route privée sans JWT.
  it('refuse une route privée sans jeton', async () => {
    const request = {
      method: 'GET',
      cookies: {},
    };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toThrow();
  });

  // Test 3 : j'autorise une requête GET avec un JWT valide.
  it('autorise une session valide', async () => {
    const request = {
      method: 'GET',
      cookies: {
        'hoos-access': 'jeton-valide',
      },
    };

    const result = await guard.canActivate(
      createContext(request),
    );

    expect(result).toBe(true);

    expect(sessions.verifyContext).toHaveBeenCalledWith({
      accountId: 'compte-1',
      sessionId: 'session-1',
      tokenId: 'token-1',
    });

    expect(request).toHaveProperty('auth');
    expect(csrf.assertValid).not.toHaveBeenCalled();
  });

  // Test 4 : je vérifie le CSRF pour une requête POST.
  it('vérifie le CSRF pour une modification', async () => {
    const request = {
      method: 'POST',
      cookies: {
        'hoos-access': 'jeton-valide',
      },
    };

    await guard.canActivate(
      createContext(request),
    );

    expect(csrf.assertValid).toHaveBeenCalledTimes(1);
  });

  // Test 5 : je refuse un ancien jeton d'accès.
  it('refuse un jeton avec une ancienne version', async () => {
    const request = {
      method: 'GET',
      cookies: {
        'hoos-access': 'ancien-jeton',
      },
    };

    sessions.verifyContext.mockResolvedValue({
      id: 'session-1',
      accountId: 'compte-1',
      accessVersion: 2,
    });

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toThrow();
  });

  // Test 6 : je refuse une requête si le contrôle CSRF échoue.
  it('refuse une modification avec un CSRF invalide', async () => {
    const request = {
      method: 'POST',
      cookies: {
        'hoos-access': 'jeton-valide',
      },
    };

    csrf.assertValid.mockImplementation(() => {
      throw new Error('CSRF invalide');
    });

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toThrow('CSRF invalide');
  });
});
