
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { AccountEntity } from './account.entity';
import { AccountResponseDto } from './account-response.dto';
import { AccountStatus } from './account-status.enum';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  // Je crée un compte et je l'enregistre en base de données.
  async createAccount(): Promise<AccountResponseDto> {
    const account = this.accountRepository.create();
    const saved = await this.accountRepository.save(account);

    return this.toResponse(saved);
  }

  // Je recherche un compte avec son identifiant.
  async findById(id: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findOneBy({ id });

    return account ? this.toResponse(account) : null;
  }

  // Je recherche un compte dans une transaction.
  async findByIdInTransaction(
    manager: EntityManager,
    id: string,
  ): Promise<AccountResponseDto | null> {
    const account = await manager
      .getRepository(AccountEntity)
      .findOneBy({ id });

    return account ? this.toResponse(account) : null;
  }

  // Je vérifie si le compte est autorisé à se connecter.
  canAuthenticate(account: AccountResponseDto): boolean {
    return account.status === AccountStatus.Active;
  }

  // Je prépare les informations du compte pour la réponse API.
  private toResponse(account: AccountEntity): AccountResponseDto {
    return {
      id: account.id,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}
