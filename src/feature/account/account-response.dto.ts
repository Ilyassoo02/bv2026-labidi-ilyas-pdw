import { AccountStatus } from './account-status.enum';

// Je décris ce que le client peut voir : jamais la structure interne de la table.
export class AccountResponseDto {
  id!: string;
  status!: AccountStatus;
  createdAt!: string;
  updatedAt!: string;
}
