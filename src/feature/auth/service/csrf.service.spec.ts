
import { HttpStatus } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import type { Request } from 'express';

import { ApiCode } from '../../../common/api/api-codes';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthSecurityException } from '../data/exception/auth-security.exception';
import { TokenCryptoService } from './token-crypto.service';
import { CsrfService } from './csrf.service';

describe('CsrfService', () => {
  // Je prépare un secret uniquement pour les tests.
  const pepper = randomBytes(32);

  const tokenCrypto = {
    fingerprint: (token: string): string =>
      createHmac('sha256', pepper)
        .update(token)
        .digest('hex'),
  } as TokenCryptoService;

  const service = new CsrfService(tokenCrypto);

  // Je simule une requête HTTP.
  const createRequest = (token?: string): Request =>
    ({
      header: (name: string) =>
        name.toLowerCase() === 'x-csrf-token'
          ? token
          : undefined,
    }) as unknown as Request;

  // Je simule une session avec son empreinte CSRF.
  const createSession = (
    token: string,
  ): AuthSessionEntity =>
    ({
      csrfTokenHash: tokenCrypto.fingerprint(token),
    }) as AuthSessionEntity;

  // Test 1 : un jeton correct est accepté.
  it('accepte un jeton CSRF valide', () => {
    const token = 'mon-jeton-csrf-valide';

    expect(() =>
      service.assertValid(
        createRequest(token),
        createSession(token),
      ),
    ).not.toThrow();
  });

  // Test 2 : un jeton absent est refusé.
  it('refuse un jeton CSRF absent', () => {
    expect(() =>
      service.assertValid(
        createRequest(),
        createSession('jeton-attendu'),
      ),
    ).toThrow(AuthSecurityException);
  });

  // Test 3 : un mauvais jeton est refusé.
  it('refuse un jeton CSRF incorrect', () => {
    expect(() =>
      service.assertValid(
        createRequest('mauvais-jeton'),
        createSession('bon-jeton'),
      ),
    ).toThrow(AuthSecurityException);
  });

  // Test 4 : un jeton trop long est refusé.
  it('refuse un jeton CSRF trop long', () => {
    expect(() =>
      service.assertValid(
        createRequest('a'.repeat(513)),
        createSession('jeton-attendu'),
      ),
    ).toThrow(AuthSecurityException);
  });

  // Test 5 : une empreinte mal formée est refusée.
  it('refuse une empreinte CSRF invalide', () => {
    const session = {
      csrfTokenHash: 'empreinte-invalide',
    } as AuthSessionEntity;

    expect(() =>
      service.assertValid(
        createRequest('mon-jeton'),
        session,
      ),
    ).toThrow(AuthSecurityException);
  });

  // Test 6 : une erreur CSRF renvoie bien HTTP 403.
  it('renvoie le code HTTP 403 pour un jeton invalide', () => {
    try {
      service.assertValid(
        createRequest('mauvais-jeton'),
        createSession('bon-jeton'),
      );

      throw new Error('Une exception était attendue');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthSecurityException);
      expect(error).toMatchObject({
        statusCode: HttpStatus.FORBIDDEN,
        apiCode: ApiCode.AuthCsrfInvalid,
      });
    }
  });
});
