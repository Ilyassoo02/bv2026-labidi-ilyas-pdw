
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountModule } from '../account/account.module';

import { AuthIdentifierEntity } from './entities/auth-identifier.entity';
import { PasswordCredentialEntity } from './entities/password-credential.entity';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { AuthRefreshTokenEntity } from './entities/auth-refresh-token.entity';

import { AuthIdentifierService } from './service/auth-identifier.service';
import { PasswordCredentialService } from './service/password-credential.service';
import { PasswordHasherService } from './service/password-hasher.service';
import { PasswordPolicyService } from './service/password-policy.service';
import { AuthCookieService } from './service/auth-cookie.service';
import { CsrfService } from './service/csrf.service';
import { TokenCryptoService } from './service/token-crypto.service';
import { AuthSessionService } from './service/auth-session.service';
import { RefreshTokenService } from './service/refresh-token.service';
import { AuthService } from './service/auth.service';

import { AuthController } from './controller/auth.controller';

import { OriginGuard } from './guard/origin.guard';
import { AccessAuthGuard } from './guard/access-auth.guard';

@Module({
  imports: [
    // Je récupère les fonctionnalités liées aux comptes.
    AccountModule,

    // Je déclare les entités utilisées pour l'authentification.
    TypeOrmModule.forFeature([
      AuthIdentifierEntity,
      PasswordCredentialEntity,
      AuthSessionEntity,
      AuthRefreshTokenEntity,
    ]),
  ],

  // Je déclare le contrôleur qui contient les routes d'authentification.
  controllers: [
    AuthController,
  ],

  // Je déclare les services et les protections de mon application.
  providers: [
    AuthIdentifierService,
    PasswordCredentialService,
    PasswordHasherService,
    PasswordPolicyService,
    AuthCookieService,
    CsrfService,
    TokenCryptoService,
    AuthSessionService,
    RefreshTokenService,
    AuthService,

    // Je vérifie d'abord la provenance des requêtes.
    {
      provide: APP_GUARD,
      useClass: OriginGuard,
    },

    // Je vérifie ensuite l'authentification et la session.
    {
      provide: APP_GUARD,
      useClass: AccessAuthGuard,
    },
  ],
})
export class AuthModule {}
