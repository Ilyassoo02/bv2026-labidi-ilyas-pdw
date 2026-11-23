
import { Injectable } from '@nestjs/common';
import {
  createHmac,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { ulid } from 'ulid';

import { EnvService } from '../../../common/config/env.service';
import { AuthSecurityException } from '../data/exception/auth-security.exception';

// Je définis les informations contenues dans un access token.
export type AccessTokenClaims = jwt.JwtPayload & {
  sub: string;
  sid: string;
  jti: string;
  ver: number;
};

// Je définis les clés publiques autorisées.
type TrustedKeys = Record<string, string>;

// Je vérifie le format des identifiants ULID.
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

@Injectable()
export class TokenCryptoService {
  private readonly issuer = 'hoos-api';
  private readonly audience = 'hoos-web';

  private readonly refreshPepper: Buffer;
  private readonly privateKeyPem: string;
  private readonly publicKeys: Map<string, string>;

  constructor(private readonly envService: EnvService) {
    // Je prépare le secret utilisé pour les refresh tokens.
    this.refreshPepper = this.resolvePepper();

    // Je récupère les clés JWT.
    const material = this.resolveKeyMaterial();

    // Je vérifie les clés avant de les utiliser.
    this.validatePublicKeys(material.publicKeys);
    this.validateKeyMaterial(
      material.privateKeyPem,
      material.publicKeys,
    );

    this.privateKeyPem = material.privateKeyPem;

    this.publicKeys = new Map(
      Object.entries(material.publicKeys).map(
        ([kid, encodedKey]) => [
          kid,
          Buffer.from(encodedKey, 'base64').toString('utf8'),
        ],
      ),
    );
  }

  // Je signe un access token avec la clé privée ES256.
  signAccessToken(
    accountId: string,
    sessionId: string,
    accessVersion: number,
  ): string {
    return jwt.sign(
      {
        sub: accountId,
        sid: sessionId,
        ver: accessVersion,
      },
      this.privateKeyPem,
      {
        algorithm: 'ES256',
        issuer: this.issuer,
        audience: this.audience,
        expiresIn: this.envService.accessTokenTtlSeconds,
        jwtid: ulid(),
        header: {
          alg: 'ES256',
          typ: 'at+jwt',
          kid: this.envService.jwtActiveKid,
        },
      },
    );
  }

  // Je vérifie la signature et le contenu d'un access token.
  verifyAccessToken(token: string): AccessTokenClaims {
    // Je refuse les tokens trop longs ou mal formés.
    if (
      token.length > 4096 ||
      token.split('.').length !== 3
    ) {
      throw new AuthSecurityException();
    }

    let decoded: jwt.Jwt | null;

    try {
      decoded = jwt.decode(token, {
        complete: true,
      }) as jwt.Jwt | null;
    } catch {
      throw new AuthSecurityException();
    }

    const header = decoded?.header;

    // Je refuse les algorithmes et en-têtes non autorisés.
    if (
      !header ||
      header.alg !== 'ES256' ||
      header.typ !== 'at+jwt' ||
      typeof header.kid !== 'string' ||
      !/^[A-Za-z0-9._-]{1,100}$/.test(header.kid) ||
      'jku' in header ||
      'jwk' in header ||
      'x5u' in header ||
      'x5c' in header ||
      'crit' in header
    ) {
      throw new AuthSecurityException();
    }

    // Je recherche la clé publique correspondant au kid.
    const key = this.publicKeys.get(header.kid);

    if (!key) {
      throw new AuthSecurityException();
    }

    try {
      // Je vérifie la signature et les paramètres JWT.
      const payload = jwt.verify(token, key, {
        algorithms: ['ES256'],
        issuer: this.issuer,
        audience: this.audience,
        maxAge: `${this.envService.accessTokenTtlSeconds}s`,
        clockTolerance: 5,
      });

      if (typeof payload === 'string') {
        throw new AuthSecurityException();
      }

      // Je valide les informations contenues dans le token.
      if (
        typeof payload.sub !== 'string' ||
        !ULID_REGEX.test(payload.sub) ||
        typeof payload.sid !== 'string' ||
        !ULID_REGEX.test(payload.sid) ||
        typeof payload.jti !== 'string' ||
        !ULID_REGEX.test(payload.jti) ||
        typeof payload.ver !== 'number' ||
        !Number.isInteger(payload.ver) ||
        typeof payload.iat !== 'number' ||
        typeof payload.exp !== 'number' ||
        payload.exp - payload.iat >
          this.envService.accessTokenTtlSeconds
      ) {
        throw new AuthSecurityException();
      }

      return payload as AccessTokenClaims;
    } catch {
      throw new AuthSecurityException();
    }
  }

  // Je génère un refresh token aléatoire de 32 octets.
  createOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  // Je calcule une empreinte HMAC-SHA256 du jeton.
  fingerprint(value: string): string {
    return createHmac('sha256', this.refreshPepper)
      .update(value)
      .digest('hex');
  }

  // Je récupère et valide le pepper.
  private resolvePepper(): Buffer {
    if (this.envService.refreshTokenPepper) {
      const pepper = Buffer.from(
        this.envService.refreshTokenPepper,
        'base64',
      );

      if (pepper.length >= 32) {
        return pepper;
      }

      if (this.envService.isProduction) {
        throw new Error(
          'AUTH_REFRESH_TOKEN_PEPPER must contain at least 32 bytes',
        );
      }
    }

    // En production, le pepper est obligatoire.
    if (this.envService.isProduction) {
      throw new Error(
        'AUTH_REFRESH_TOKEN_PEPPER is required in production',
      );
    }

    // En développement, je crée un pepper temporaire.
    return randomBytes(32);
  }

  // Je charge les clés JWT depuis la configuration.
  private resolveKeyMaterial(): {
    privateKeyPem: string;
    publicKeys: TrustedKeys;
  } {
    if (
      this.envService.jwtPrivateKeyBase64 &&
      this.envService.jwtPublicKeysJson
    ) {
      let publicKeys: TrustedKeys;

      try {
        const parsed: unknown = JSON.parse(
          this.envService.jwtPublicKeysJson,
        );

        if (
          !parsed ||
          typeof parsed !== 'object' ||
          Array.isArray(parsed) ||
          Object.values(parsed).some(
            (value) => typeof value !== 'string',
          )
        ) {
          throw new Error('Invalid public keys');
        }

        publicKeys = parsed as TrustedKeys;
      } catch {
        throw new Error(
          'AUTH_JWT_PUBLIC_KEYS_JSON is invalid',
        );
      }

      return {
        privateKeyPem: Buffer.from(
          this.envService.jwtPrivateKeyBase64,
          'base64',
        ).toString('utf8'),
        publicKeys,
      };
    }

    // Je refuse de démarrer sans clés en production.
    if (this.envService.isProduction) {
      throw new Error(
        'Production JWT key material is required',
      );
    }

    // En développement, je peux générer des clés temporaires.
    const pair = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });

    const privateKeyPem = pair.privateKey
      .export({
        type: 'pkcs8',
        format: 'pem',
      })
      .toString();

    const publicKeyPem = pair.publicKey
      .export({
        type: 'spki',
        format: 'pem',
      })
      .toString();

    return {
      privateKeyPem,
      publicKeys: {
        [this.envService.jwtActiveKid]:
          Buffer.from(publicKeyPem).toString('base64'),
      },
    };
  }

  // Je vérifie que les clés publiques sont correctement déclarées.
  private validatePublicKeys(keys: TrustedKeys): void {
    for (const [kid, encodedKey] of Object.entries(keys)) {
      if (
        !/^[A-Za-z0-9._-]{1,100}$/.test(kid) ||
        !encodedKey
      ) {
        throw new Error(
          'JWT public key configuration is invalid',
        );
      }
    }

    if (!keys[this.envService.jwtActiveKid]) {
      throw new Error(
        'Active JWT key identifier is not trusted',
      );
    }
  }

  // Je vérifie la validité et la compatibilité des clés ES256.
  private validateKeyMaterial(
    privateKeyPem: string,
    keys: TrustedKeys,
  ): void {
    try {
      const privateKey = createPrivateKey(privateKeyPem);

      if (
        privateKey.asymmetricKeyType !== 'ec' ||
        privateKey.asymmetricKeyDetails?.namedCurve !==
          'prime256v1'
      ) {
        throw new Error(
          'JWT private key must be an EC P-256 key',
        );
      }

      const publicKeyObjects = new Map<
        string,
        ReturnType<typeof createPublicKey>
      >();

      // Je contrôle chacune des clés publiques.
      for (const [kid, encodedKey] of Object.entries(keys)) {
        const publicKey = createPublicKey(
          Buffer.from(encodedKey, 'base64').toString('utf8'),
        );

        if (
          publicKey.asymmetricKeyType !== 'ec' ||
          publicKey.asymmetricKeyDetails?.namedCurve !==
            'prime256v1'
        ) {
          throw new Error(
            `JWT public key ${kid} must be an EC P-256 key`,
          );
        }

        publicKeyObjects.set(kid, publicKey);
      }

      const activePublicKey = publicKeyObjects.get(
        this.envService.jwtActiveKid,
      );

      if (!activePublicKey) {
        throw new Error(
          'Active JWT key identifier is not trusted',
        );
      }

      // Je compare la clé publique calculée avec celle configurée.
      const derived = createPublicKey(privateKey).export({
        type: 'spki',
        format: 'der',
      });

      const configured = activePublicKey.export({
        type: 'spki',
        format: 'der',
      });

      if (
        derived.length !== configured.length ||
        !timingSafeEqual(derived, configured)
      ) {
        throw new Error(
          'JWT private and public keys are incompatible',
        );
      }
    } catch (error) {
      throw new Error(
        `Invalid JWT key material: ${
          error instanceof Error
            ? error.message
            : 'unknown error'
        }`,
      );
    }
  }
}
