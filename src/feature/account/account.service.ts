import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from './account.entity';
import { AccountResponseDto } from './account-response.dto';

// Je suis le point où la persistance devient une réponse adaptée au contrat HTTP.
@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  // Je crée un compte : create() prépare l'objet en mémoire, save() écrit réellement en base.
  async createAccount(): Promise<AccountResponseDto> {
    const account = this.accountRepository.create();
    const saved = await this.accountRepository.save(account);
    return this.toResponse(saved);
  }

  // Je cherche un compte par son identifiant ; s'il n'existe pas, je renvoie null.
  async findById(id: string): Promise<AccountResponseDto | null> {
    const account = await this.accountRepository.findOneBy({ id });
    return account ? this.toResponse(account) : null;
  }

  // Je choisis explicitement les champs exposés : une colonne ajoutée en base ne sort jamais toute seule.
  private toResponse(account: AccountEntity): AccountResponseDto {
    return {
      id: account.id,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}
