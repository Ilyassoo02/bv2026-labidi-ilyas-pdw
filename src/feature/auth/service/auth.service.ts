
import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApiCode } from '../../../common/api/api-codes';
import { ApiException } from '../../../common/api/api-exception';
import { AppLogger } from '../../../common/logging/app-logger';

import { AccountService } from '../../account/account.service';

import { LoginRequestDto } from '../data/dto/request/login-request.dto';
import { RegisterRequestDto } from '../data/dto/request/register-request.dto';
import { RegistrationResponseDto } from '../data/dto/response/registration-response.dto';

import type {
  AuthContext,
  AuthenticatedSession,
} from '../data/model/auth-context';

import { normalizeEmail } from '../utils/normalize-email';

import { PasswordHasherService } from './password-hasher.service';
import { AuthIdentifierService } from './auth-identifier.service';
import { PasswordCredentialService } from './password-credential.service';
import { PasswordPolicyService } from './password-policy.service';
import { AuthSessionService } from './auth-session.service';
import { TokenCryptoService } from './token-crypto.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly accountService: AccountService,
    private readonly authIdentifierService: AuthIdentifierService,
    private readonly passwordCredentialService: PasswordCredentialService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly passwordPolicyService: PasswordPolicyService,
    private readonly authSessionService: AuthSessionService,
    private readonly tokenCryptoService: TokenCryptoService,
    private readonly appLogger: AppLogger,
  ) {
    this.appLogger.setContext(AuthService.name);
  }

  // Je crée un nouveau compte utilisateur.
  async register(
    dto: RegisterRequestDto,
  ): Promise<RegistrationResponseDto> {
    // Je vérifie que le mot de passe respecte les règles.
    this.passwordPolicyService.assertValid(dto.password);

    // Je normalise l'adresse e-mail.
    const email = normalizeEmail(dto.email);

    try {
      // Je crée le compte, l'e-mail et le mot de passe
      // dans une seule transaction.
      const account = await this.dataSource.transaction(
        async (manager) => {
          // Je vérifie si l'adresse e-mail existe déjà.
          const existingIdentifier =
            await this.authIdentifierService.findEmailInTransaction(
              manager,
              email,
            );

          if (existingIdentifier) {
            throw this.emailAlreadyUsed();
          }

          // Je crée le compte.
          const createdAccount =
            await this.accountService.createInTransaction(
              manager,
            );

          // J'enregistre l'adresse e-mail.
          await this.authIdentifierService.create(
            manager,
            createdAccount.id,
            email,
          );

          // J'enregistre le mot de passe haché.
          await this.passwordCredentialService.create(
            manager,
            createdAccount.id,
            dto.password,
          );

          return createdAccount;
        },
      );

      // Je conserve une trace de l'inscription.
      this.appLogger.audit({
        event: 'auth.registration.success',
        accountId: account.id,
      });

      // Je retourne uniquement les informations autorisées.
      return {
        accountId: account.id,
        email,
        status: account.status,
        emailVerified: false,
        createdAt: account.createdAt.toISOString(),
      };
    } catch (error) {
      // Je gère les doublons détectés par PostgreSQL.
      if (this.isUniqueViolation(error)) {
        throw this.emailAlreadyUsed();
      }

      throw error;
    }
  }

  // Je connecte un utilisateur avec son e-mail et son mot de passe.
  async login(
    dto: LoginRequestDto,
  ): Promise<AuthenticatedSession> {
    const email = normalizeEmail(dto.email);

    const result = await this.dataSource.transaction(
      async (manager) => {
        // Je recherche l'adresse e-mail.
        const identifier =
          await this.authIdentifierService.findEmailInTransaction(
            manager,
            email,
          );

        // Si l'e-mail est inconnu, je fais une vérification factice.
        if (!identifier) {
          await this.passwordHasher.verifyAgainstDummy(
            dto.password,
          );

          return null;
        }

        // Je recherche le compte.
        const account =
          await this.accountService.findByIdInTransaction(
            manager,
            identifier.accountId,
          );

        // Je recherche le mot de passe enregistré.
        const credential =
          await this.passwordCredentialService.findByAccountIdInTransaction(
            manager,
            identifier.accountId,
          );

        // Je vérifie le mot de passe.
        const passwordMatches = credential
          ? await this.passwordHasher.verify(
              credential.passwordHash,
              dto.password,
            )
          : await this.passwordHasher.verifyAgainstDummy(
              dto.password,
            );

        // Je vérifie si la connexion est autorisée.
        if (
          !account ||
          !credential ||
          !passwordMatches ||
          !this.accountService.canAuthenticate(account) ||
          credential.disabledAt !== null ||
          (credential.lockedUntil !== null &&
            credential.lockedUntil > new Date())
        ) {
          // Je compte les tentatives avec un mauvais mot de passe.
          if (credential && !passwordMatches) {
            await this.passwordCredentialService.recordFailedAttempt(
              manager,
              credential.id,
            );
          }

          return null;
        }

        // Je remets le compteur d'échecs à zéro.
        await this.passwordCredentialService.recordSuccessfulUse(
          manager,
          credential.id,
        );

        // Je crée une nouvelle session.
        const createdSession =
          await this.authSessionService.createSession(
            manager,
            account.id,
          );

        return {
          accountId: account.id,
          sessionId: createdSession.session.id,
          accessVersion: createdSession.session.accessVersion,
          refreshToken: createdSession.refreshToken,
          csrfToken: createdSession.csrfToken,
          refreshExpiresAt: createdSession.refreshExpiresAt,
        };
      },
    );

    // Si la connexion échoue, je retourne toujours la même erreur.
    if (!result) {
      this.appLogger.security({
        event: 'auth.password.login.failed',
        reason: 'invalid-credentials',
      });

      throw this.invalidCredentials();
    }

    // Je conserve une trace de la connexion réussie.
    this.appLogger.security({
      event: 'auth.password.login.success',
      accountId: result.accountId,
    });

    // Je génère le jeton d'accès JWT.
    const accessToken = this.tokenCryptoService.signAccessToken(
      result.accountId,
      result.sessionId,
      result.accessVersion,
    );

    return {
      accountId: result.accountId,
      sessionId: result.sessionId,
      accessToken,
      refreshToken: result.refreshToken,
      csrfToken: result.csrfToken,
      refreshExpiresAt: result.refreshExpiresAt,
    };
  }

  // Je déconnecte l'utilisateur de sa session actuelle.
  async logout(context: AuthContext): Promise<void> {
    await this.authSessionService.revokeCurrent(
      context.sessionId,
      'logout',
    );
  }

  // Je déconnecte l'utilisateur de toutes ses sessions.
  async logoutAll(context: AuthContext): Promise<void> {
    await this.dataSource.transaction((manager) =>
      this.authSessionService.revokeAll(
        manager,
        context.accountId,
      ),
    );
  }

  // Je prépare l'erreur pour des identifiants incorrects.
  private invalidCredentials(): ApiException {
    return new ApiException(
      HttpStatus.UNAUTHORIZED,
      ApiCode.AuthInvalidCredentials,
      {
        logMessage: 'Password authentication failed',
      },
    );
  }

  // Je prépare l'erreur si l'adresse e-mail existe déjà.
  private emailAlreadyUsed(): ApiException {
    return new ApiException(
      HttpStatus.CONFLICT,
      ApiCode.AuthEmailAlreadyUsed,
      {
        logMessage: 'Registration rejected because email is already used',
      },
    );
  }

  // Je vérifie si PostgreSQL a détecté un doublon.
  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'driverError' in error &&
      typeof error.driverError === 'object' &&
      error.driverError !== null &&
      'code' in error.driverError &&
      error.driverError.code === '23505'
    );
  }
}
