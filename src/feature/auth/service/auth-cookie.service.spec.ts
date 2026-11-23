
import type { Response } from 'express';

import { EnvService } from '../../../common/config/env.service';
import { AuthCookieService } from './auth-cookie.service';

describe('AuthCookieService', () => {
  // Je prépare une configuration de développement.
  const envService = {
    isProduction: false,
    accessTokenTtlSeconds: 600,
  } as EnvService;

  const service = new AuthCookieService(envService);

  // Je simule une réponse HTTP.
  let response: Response;

  beforeEach(() => {
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;
  });

  // Test 1 : création du cookie access.
  it('crée un cookie access sécurisé', () => {
    service.setAccessCookie(response, 'mon-access-token');

    expect(response.cookie).toHaveBeenCalledWith(
      'hoos-access',
      'mon-access-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
        maxAge: 600000,
      },
    );
  });

  // Test 2 : création du cookie refresh.
  it('crée un cookie refresh', () => {
    const expiresAt = new Date('2030-01-01T00:00:00Z');

    service.setRefreshCookie(
      response,
      'mon-refresh-token',
      expiresAt,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'hoos-refresh',
      'mon-refresh-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
        expires: expiresAt,
      },
    );
  });

  // Test 3 : le cookie CSRF doit être accessible au navigateur.
  it('crée un cookie CSRF non httpOnly', () => {
    const expiresAt = new Date('2030-01-01T00:00:00Z');

    service.setCsrfCookie(
      response,
      'mon-csrf-token',
      expiresAt,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'hoos-csrf',
      'mon-csrf-token',
      {
        httpOnly: false,
        secure: false,
        sameSite: 'strict',
        path: '/',
        expires: expiresAt,
      },
    );
  });

  // Test 4 : suppression des trois cookies.
  it('supprime les cookies lors de la déconnexion', () => {
    service.clearAuthCookies(response);

    expect(response.clearCookie).toHaveBeenCalledTimes(3);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'hoos-access',
      expect.objectContaining({ httpOnly: true }),
    );

    expect(response.clearCookie).toHaveBeenCalledWith(
      'hoos-refresh',
      expect.objectContaining({ httpOnly: true }),
    );

    expect(response.clearCookie).toHaveBeenCalledWith(
      'hoos-csrf',
      expect.objectContaining({ httpOnly: false }),
    );
  });

  // Test 5 : vérification des cookies en production.
  it('utilise des cookies sécurisés en production', () => {
    const productionEnv = {
      isProduction: true,
      accessTokenTtlSeconds: 600,
    } as EnvService;

    const productionService = new AuthCookieService(
      productionEnv,
    );

    productionService.setAccessCookie(
      response,
      'access-token',
    );

    expect(response.cookie).toHaveBeenCalledWith(
      '__Host-hoos-access',
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      }),
    );
  });
});
