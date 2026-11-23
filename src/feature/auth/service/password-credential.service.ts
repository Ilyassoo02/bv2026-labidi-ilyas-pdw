
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { EnvService } from '../../../common/config/env.service';

import { PasswordCredentialEntity } from '../entities/password-credential.entity';
import { PasswordHasherService } from './password-hasher.service';

@Injectable()
export class PasswordCredentialService {
  constructor(
    @InjectRepository(PasswordCredentialEntity)
    private readonly credentialRepository: Repository<PasswordCredentialEntity>,
    private readonly passwordHasher: PasswordHasherService,
    private readonly envService: EnvService,
  ) {}

  // Je recherche le mot de passe associé à un compte.
  async findByAccountId(
    accountId: string,
  ): Promise<PasswordCredentialEntity | null> {
    return this.credentialRepository.findOneBy({
      accountId,
    });
  }

  // Je recherche le mot de passe dans une transaction.
  async findByAccountIdInTransaction(
    manager: EntityManager,
    accountId: string,
  ): Promise<PasswordCredentialEntity | null> {
    return manager
      .getRepository(PasswordCredentialEntity)
      .findOneBy({
        accountId,
      });
  }

  // Je crée un mot de passe sécurisé pour un compte.
  async create(
    manager: EntityManager,
    accountId: string,
    password: string,
  ): Promise<PasswordCredentialEntity> {
    const repository = manager.getRepository(PasswordCredentialEntity);

    const credential = repository.create({
      accountId,
      passwordHash: await this.passwordHasher.hash(password),
      hashVersion: 'argon2id-v1',
      failedAttempts: 0,
      lockedUntil: null,
      lastFailedAt: null,
      lastUsedAt: null,
      changedAt: new Date(),
      disabledAt: null,
    });

    return repository.save(credential);
  }

  // J'enregistre une tentative de connexion échouée.
  async recordFailedAttempt(
    manager: EntityManager,
    credentialId: string,
  ): Promise<void> {
    const repository = manager.getRepository(PasswordCredentialEntity);

    const max = this.envService.get('AUTH_PASSWORD_MAX_ATTEMPTS');
    const seconds = this.envService.get('AUTH_PASSWORD_LOCKOUT_SECONDS');

    await repository
      .createQueryBuilder()
      .update(PasswordCredentialEntity)
      .set({
        failedAttempts: () => 'failed_attempts + 1',
        lastFailedAt: () => 'CURRENT_TIMESTAMP',
        lockedUntil: () =>
          `CASE WHEN failed_attempts + 1 >= ${max} ` +
          `THEN CURRENT_TIMESTAMP + (${seconds} * INTERVAL '1 second') ` +
          `ELSE locked_until END`,
      })
      .where('id = :credentialId', { credentialId })
      .andWhere(
        '(locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)',
      )
      .execute();
  }

  // Je remets le compteur à zéro après une connexion réussie.
  async recordSuccessfulUse(
    manager: EntityManager,
    credentialId: string,
  ): Promise<void> {
    await manager
      .getRepository(PasswordCredentialEntity)
      .update(credentialId, {
        failedAttempts: 0,
        lockedUntil: null,
        lastUsedAt: new Date(),
      });
  }
}
