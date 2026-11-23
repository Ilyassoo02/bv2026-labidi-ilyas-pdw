
import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  // Je prépare une configuration valide pour les tests.
  const validConfig = {
    NODE_ENV: 'DEV',
    DB_USER: 'test-user',
    DB_PASSWORD: 'test-password',
    DB_NAME: 'test-database',
    DB_SYNC: 'false',
  };

  // Test 1 : configuration valide.
  it('accepte une configuration valide', () => {
    const result = validateEnvironment(validConfig);

    expect(result.AUTH_PASSWORD_MIN_LENGTH).toBe(15);
    expect(result.AUTH_PASSWORD_MAX_LENGTH).toBe(128);
    expect(result.AUTH_ACCESS_TOKEN_TTL_SECONDS).toBe(600);
  });

  // Test 2 : mot de passe impossible à valider.
  it('refuse une longueur minimale supérieure au maximum', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        AUTH_PASSWORD_MIN_LENGTH: 200,
        AUTH_PASSWORD_MAX_LENGTH: 128,
      }),
    ).toThrow(/AUTH_PASSWORD_MIN_LENGTH/);
  });

  // Test 3 : refresh token trop long.
  it('refuse un refresh token plus long que la session', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        AUTH_REFRESH_TOKEN_TTL_SECONDS: 5000,
        AUTH_SESSION_ABSOLUTE_TTL_SECONDS: 4000,
      }),
    ).toThrow(/AUTH_REFRESH_TOKEN_TTL_SECONDS/);
  });

  // Test 4 : synchronisation interdite en production.
  it('refuse DB_SYNC en production', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'PROD',
        DB_SYNC: 'true',
      }),
    ).toThrow(/DB_SYNC/);
  });

  // Test 5 : pepper obligatoire en production.
  it('refuse un pepper absent en production', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'PROD',
      }),
    ).toThrow(/AUTH_REFRESH_TOKEN_PEPPER/);
  });

  // Test 6 : clés JWT obligatoires en production.
  it('refuse des clés JWT absentes en production', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'PROD',
      }),
    ).toThrow(/AUTH_JWT_PRIVATE_KEY_BASE64/);
  });

  // Test 7 : injection de panne interdite en production.
  it('refuse une injection de panne en production', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'PROD',
        AUTH_TEST_REFRESH_FAILURE_POINT: 'after-consumed',
      }),
    ).toThrow(/AUTH_TEST_REFRESH_FAILURE_POINT/);
  });
});
