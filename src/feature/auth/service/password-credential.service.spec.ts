
import { EntityManager } from 'typeorm';

import { PasswordCredentialService } from './password-credential.service';
import { PasswordCredentialEntity } from '../entities/password-credential.entity';

describe('PasswordCredentialService', () => {
  let service: PasswordCredentialService;

  // Je prépare une fausse requête SQL.
  let queryBuilder: {
    update: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    execute: jest.Mock;
  };

  // Je prépare une fausse base de données.
  let repository: {
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  let manager: {
    getRepository: jest.Mock;
  };

  let passwordHasher: {
    hash: jest.Mock;
  };

  let envService: {
    get: jest.Mock;
  };

  beforeEach(() => {
    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    repository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    manager = {
      getRepository: jest.fn().mockReturnValue(repository),
    };

    passwordHasher = {
      hash: jest.fn().mockResolvedValue('$argon2id$hash-test'),
    };

    envService = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_PASSWORD_MAX_ATTEMPTS') {
          return 5;
        }

        if (key === 'AUTH_PASSWORD_LOCKOUT_SECONDS') {
          return 900;
        }

        return undefined;
      }),
    };

    service = new PasswordCredentialService(
      repository as never,
      passwordHasher as never,
      envService as never,
    );
  });

  // Test 1 : je recherche le mot de passe d'un compte.
  it('recherche les identifiants de connexion', async () => {
    const credential = {
      accountId: 'compte-1',
      passwordHash: 'hash-test',
    };

    repository.findOneBy.mockResolvedValue(credential);

    const result = await service.findByAccountId('compte-1');

    expect(result).toEqual(credential);
    expect(repository.findOneBy).toHaveBeenCalledWith({
      accountId: 'compte-1',
    });
  });

  // Test 2 : je vérifie le cas où le compte n'existe pas.
  it('retourne null si aucun mot de passe existe', async () => {
    repository.findOneBy.mockResolvedValue(null);

    const result = await service.findByAccountId('inconnu');

    expect(result).toBeNull();
  });

  // Test 3 : je recherche dans une transaction.
  it('recherche les identifiants dans une transaction', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await service.findByAccountIdInTransaction(
      manager as unknown as EntityManager,
      'compte-1',
    );

    expect(manager.getRepository).toHaveBeenCalledWith(
      PasswordCredentialEntity,
    );

    expect(repository.findOneBy).toHaveBeenCalledWith({
      accountId: 'compte-1',
    });
  });

  // Test 4 : je vérifie que le mot de passe est haché.
  it('crée un mot de passe haché', async () => {
    repository.create.mockImplementation((data) => data);
    repository.save.mockImplementation(async (data) => data);

    const result = await service.create(
      manager as unknown as EntityManager,
      'compte-1',
      'MonMotDePasseDeTest123!',
    );

    expect(passwordHasher.hash).toHaveBeenCalledWith(
      'MonMotDePasseDeTest123!',
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'compte-1',
        passwordHash: '$argon2id$hash-test',
        hashVersion: 'argon2id-v1',
        failedAttempts: 0,
        lockedUntil: null,
      }),
    );

    expect(repository.save).toHaveBeenCalled();
    expect(result.passwordHash).toBe('$argon2id$hash-test');
  });

  // Test 5 : je vérifie le comptage des erreurs.
  it('enregistre une tentative échouée', async () => {
    await service.recordFailedAttempt(
      manager as unknown as EntityManager,
      'credential-1',
    );

    expect(queryBuilder.update).toHaveBeenCalledWith(
      PasswordCredentialEntity,
    );

    expect(queryBuilder.set).toHaveBeenCalledWith(
      expect.objectContaining({
        failedAttempts: expect.any(Function),
        lastFailedAt: expect.any(Function),
        lockedUntil: expect.any(Function),
      }),
    );

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'id = :credentialId',
      { credentialId: 'credential-1' },
    );

    expect(queryBuilder.execute).toHaveBeenCalled();
  });

  // Test 6 : je vérifie les paramètres de verrouillage.
  it('utilise les limites de sécurité configurées', async () => {
    await service.recordFailedAttempt(
      manager as unknown as EntityManager,
      'credential-1',
    );

    expect(envService.get).toHaveBeenCalledWith(
      'AUTH_PASSWORD_MAX_ATTEMPTS',
    );

    expect(envService.get).toHaveBeenCalledWith(
      'AUTH_PASSWORD_LOCKOUT_SECONDS',
    );
  });

  // Test 7 : je remets le compteur à zéro après un succès.
  it('réinitialise les erreurs après une connexion réussie', async () => {
    await service.recordSuccessfulUse(
      manager as unknown as EntityManager,
      'credential-1',
    );

    expect(repository.update).toHaveBeenCalledWith(
      'credential-1',
      expect.objectContaining({
        failedAttempts: 0,
        lockedUntil: null,
        lastUsedAt: expect.any(Date),
      }),
    );
  });
});
