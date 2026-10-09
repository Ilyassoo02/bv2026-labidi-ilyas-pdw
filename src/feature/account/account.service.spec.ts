import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountEntity } from './account.entity';
import { AccountService } from './account.service';
import { AccountStatus } from './account-status.enum';

// Je teste le service avec un faux Repository : aucune base PostgreSQL n'est nécessaire.
describe('AccountService', () => {
  let service: AccountService;
  const repository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: getRepositoryToken(AccountEntity), useValue: repository },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  it('renvoie null si le compte est absent', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findById('01ARZ3NDEKTSV4RRFFQ69G5FAV')).resolves.toBeNull();
  });

  it('transforme une entité en réponse sans les colonnes internes', async () => {
    const entity = Object.assign(new AccountEntity(), {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      status: AccountStatus.Active,
      anonymizedAt: null,
      version: 1,
      createdAt: new Date('2026-10-09T10:00:00.000Z'),
      updatedAt: new Date('2026-10-09T10:00:00.000Z'),
    });
    repository.findOneBy.mockResolvedValue(entity);

    const result = await service.findById(entity.id);

    expect(result).toEqual({
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      status: AccountStatus.Active,
      createdAt: '2026-10-09T10:00:00.000Z',
      updatedAt: '2026-10-09T10:00:00.000Z',
    });
    expect(result).not.toHaveProperty('version');
    expect(result).not.toHaveProperty('anonymizedAt');
  });

  it('crée un compte actif et le renvoie en réponse', async () => {
    const entity = new AccountEntity();
    repository.create.mockReturnValue(entity);
    repository.save.mockImplementation(async (account: AccountEntity) =>
      Object.assign(account, {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        status: AccountStatus.Active,
        createdAt: new Date('2026-10-09T10:00:00.000Z'),
        updatedAt: new Date('2026-10-09T10:00:00.000Z'),
      }),
    );

    const result = await service.createAccount();

    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result.status).toBe(AccountStatus.Active);
  });
});
