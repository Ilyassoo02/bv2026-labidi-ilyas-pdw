
import { HttpStatus, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

import { ApiCode } from '../../../common/api/api-codes';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthSecurityException } from '../data/exception/auth-security.exception';
import { TokenCryptoService } from './token-crypto.service';

@Injectable()
export class CsrfService {
  constructor(
    private readonly tokenCrypto: TokenCryptoService,
  ) {}

  // Je vérifie le jeton CSRF envoyé par le navigateur.
  assertValid(
    request: Request,
    session: AuthSessionEntity,
  ): void {
    // Je récupère le jeton depuis l'en-tête HTTP.
    const token = request.header('X-CSRF-Token');

    // Je refuse un jeton absent ou trop long.
    if (!token || token.length > 512) {
      throw new AuthSecurityException(
        ApiCode.AuthCsrfInvalid,
        HttpStatus.FORBIDDEN,
      );
    }

    // Je calcule l'empreinte du jeton reçu.
    const actual = Buffer.from(
      this.tokenCrypto.fingerprint(token),
      'hex',
    );

    // Je récupère l'empreinte stockée dans la session.
    const expectedHash = session.csrfTokenHash;

    // Je vérifie le format de l'empreinte enregistrée.
    if (!/^[a-fA-F0-9]{64}$/.test(expectedHash)) {
      throw new AuthSecurityException(
        ApiCode.AuthCsrfInvalid,
        HttpStatus.FORBIDDEN,
      );
    }

    const expected = Buffer.from(expectedHash, 'hex');

    // Je compare les empreintes en temps constant.
    if (
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    ) {
      throw new AuthSecurityException(
        ApiCode.AuthCsrfInvalid,
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
