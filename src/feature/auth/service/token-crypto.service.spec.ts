
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { ulid } from 'ulid';

import { EnvService } from '../../../common/config/env.service';
import { AuthSecurityException } from '../data/exception/auth-security.exception';
import { TokenCryptoService } from './token-crypto.service';

describe('TokenCryptoService', () => {
  // Je génère des clés ES256 uniquement pour les tests.
  const keys = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
  });

  // Je prépare la configuration de test.
  const envService = {
    isProduction: false,
    jwtActiveKid: 'test-key',
    jwtPrivateKeyBase64: Buffer.from(
      keys.privateKey,
    ).toString('base64'),
    jwtPublicKeysJson: JSON.stringify({
      'test-key': Buffer.from(
        keys.publicKey,
      ).toString('base64'),
    }),
    refreshTokenPepper: randomBytes(32).toString('base64'),
    accessTokenTtlSeconds: 600,
  } as EnvService;

  const service = new TokenCryptoService(envService);

  // Test 1 : je signe et vérifie un JWT valide.
  it('signe et vérifie un JWT valide', () => {
    const accountId = ulid();
    const sessionId = ulid();

    const token = service.signAccessToken(
      accountId,
      sessionId,
      1,
    );

    const claims = service.verifyAccessToken(token);

    expect(claims.sub).toBe(accountId);
    expect(claims.sid).toBe(sessionId);
    expect(claims.ver).toBe(1);
  });

  // Test 2 : je refuse un JWT mal formé.
  it('refuse un JWT mal formé', () => {
    expect(() =>
      service.verifyAccessToken('token-invalide'),
    ).toThrow(AuthSecurityException);
  });

  // Test 3 : je refuse un JWT dont le contenu a été modifié.
  it('refuse un JWT dont le contenu a été modifié', () => {
    const token = service.signAccessToken(
      ulid(),
      ulid(),
      1,
    );

    const [header, payload, signature] = token.split('.');

    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;

    data.sub = ulid();

    const modifiedPayload = Buffer.from(
      JSON.stringify(data),
    ).toString('base64url');

    expect(() =>
      service.verifyAccessToken(
        `${header}.${modifiedPayload}.${signature}`,
      ),
    ).toThrow(AuthSecurityException);
  });

  // Test 4 : je génère des refresh tokens différents.
  it('génère des refresh tokens différents', () => {
    const token1 = service.createOpaqueToken();
    const token2 = service.createOpaqueToken();

    expect(token1).not.toBe(token2);
    expect(token1).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  // Test 5 : je calcule une empreinte HMAC stable.
  it('calcule une empreinte HMAC stable', () => {
    const token = 'mon-refresh-token';

    const hash1 = service.fingerprint(token);
    const hash2 = service.fingerprint(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);

    expect(
      service.fingerprint('autre-token'),
    ).not.toBe(hash1);
  });

  // Test 6 : je refuse un JWT expiré.
  it('refuse un JWT expiré', () => {
    const token = jwt.sign(
      {
        sub: ulid(),
        sid: ulid(),
        ver: 1,
      },
      keys.privateKey,
      {
        algorithm: 'ES256',
        issuer: 'hoos-api',
        audience: 'hoos-web',
        expiresIn: -30,
        jwtid: ulid(),
        header: {
          alg: 'ES256',
          typ: 'at+jwt',
          kid: 'test-key',
        },
      },
    );

    expect(() =>
      service.verifyAccessToken(token),
    ).toThrow(AuthSecurityException);
  });

  // Test 7 : je refuse un JWT avec une clé inconnue.
  it('refuse un JWT avec une clé inconnue', () => {
    const token = jwt.sign(
      {
        sub: ulid(),
        sid: ulid(),
        ver: 1,
      },
      keys.privateKey,
      {
        algorithm: 'ES256',
        issuer: 'hoos-api',
        audience: 'hoos-web',
        expiresIn: 600,
        jwtid: ulid(),
        header: {
          alg: 'ES256',
          typ: 'at+jwt',
          kid: 'cle-inconnue',
        },
      },
    );

    expect(() =>
      service.verifyAccessToken(token),
    ).toThrow(AuthSecurityException);
  });
});
