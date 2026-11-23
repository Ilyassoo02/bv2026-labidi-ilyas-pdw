
import { EntityManager } from 'typeorm';

import { AuthIdentifierService } from './auth-identifier.service';
import { AuthIdentifierType } from '../auth-identifier-type.enum';
import { AuthIdentifierEntity } from '../entities/auth-identifier.entity';

describe('AuthIdentifierService', () => {
  // Je prépare un repository fictif pour mes tests.
  let service: AuthIdentifierService;

  const repository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const manager = {
    getRepository: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthIdentifierService(repository as never);

    manager.getRepository.mockReturnValue(repository);
  });

  // Je vérifie qu'une adresse e-mail peut être retrouvée.
  it('recherche un identifiant avec son e-mail', async () => {
    const identifier = {
      accountId: 'compte-1',
      type: AuthIdentifierType.Email,
      value: 'test@example.com',
    };

    repository.findOneBy.mockResolvedValue(identifier);

    const result = await service.findEmail('test@example.com');

    expect(result).toEqual(identifier);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      type: AuthIdentifierType.Email,
      value: 'test@example.com',
    });
  });

  // Je vérifie le résultat si l'adresse n'existe pas.
  it('retourne null si l e-mail est inconnu', async () => {
    repository.findOneBy.mockResolvedValue(null);

    const result = await service.findEmail('inconnu@example.com');

    expect(result).toBeNull();
  });

  // Je vérifie la recherche dans une transaction.
  it('recherche un identifiant dans une transaction', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await service.findEmailInTransaction(
      manager as unknown as EntityManager,
      'test@example.com',
    );

    expect(manager.getRepository).toHaveBeenCalledWith(
      AuthIdentifierEntity,
    );

    expect(repository.findOneBy).toHaveBeenCalledWith({
      type: AuthIdentifierType.Email,
      value: 'test@example.com',
    });
  });

  // Je vérifie la création d'un nouvel identifiant.
  it('crée un identifiant principal non vérifié', async () => {
    const identifier = {
      accountId: 'compte-1',
      type: AuthIdentifierType.Email,
      value: 'test@example.com',
      verifiedAt: null,
      isPrimary: true,
    };

    repository.create.mockReturnValue(identifier);
    repository.save.mockResolvedValue(identifier);

    const result = await service.create(
      manager as unknown as EntityManager,
      'compte-1',
      'test@example.com',
    );

    expect(repository.create).toHaveBeenCalledWith(identifier);
    expect(repository.save).toHaveBeenCalledWith(identifier);
    expect(result).toEqual(identifier);
  });
});
