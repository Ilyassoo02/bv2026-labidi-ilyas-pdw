
import { ExecutionContext } from '@nestjs/common';

import { OriginGuard } from './origin.guard';

describe('OriginGuard', () => {
  let guard: OriginGuard;

  // Je prépare une configuration fictive.
  const envService = {
    corsOrigins: ['http://localhost:5173'],
    isProduction: false,
  };

  // Je simule une requête HTTP.
  const createContext = (
    method: string,
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const request = {
      method,
      header: (name: string) =>
        headers[name.toLowerCase()],
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    envService.corsOrigins = ['http://localhost:5173'];
    envService.isProduction = false;

    guard = new OriginGuard(envService as never);
  });

  // Test 1 : je laisse passer les requêtes GET.
  it('autorise une requête GET', () => {
    const context = createContext('GET');

    expect(guard.canActivate(context)).toBe(true);
  });

  // Test 2 : je reconnais une origine autorisée.
  it('autorise une origine connue', () => {
    const context = createContext('POST', {
      origin: 'http://localhost:5173',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  // Test 3 : je bloque une origine inconnue.
  it('refuse une origine non autorisée', () => {
    const context = createContext('POST', {
      origin: 'https://site-inconnu.example',
    });

    expect(() => guard.canActivate(context)).toThrow();
  });

  // Test 4 : je tolère l'absence d'origine en développement.
  it('autorise une requête sans origine en développement', () => {
    envService.isProduction = false;

    const context = createContext('POST');

    expect(guard.canActivate(context)).toBe(true);
  });

  // Test 5 : je bloque l'absence d'origine en production.
  it('refuse une requête sans origine en production', () => {
    envService.isProduction = true;

    const context = createContext('POST');

    expect(() => guard.canActivate(context)).toThrow();
  });

  // Test 6 : je peux récupérer l'origine depuis Referer.
  it('autorise un Referer provenant d un site connu', () => {
    const context = createContext('POST', {
      referer: 'http://localhost:5173/connexion',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  // Test 7 : je refuse un Referer non autorisé.
  it('refuse un Referer provenant d un autre site', () => {
    const context = createContext('POST', {
      referer: 'https://site-inconnu.example/page',
    });

    expect(() => guard.canActivate(context)).toThrow();
  });
});
