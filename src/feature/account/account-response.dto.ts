import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from './account-status.enum';

// Je décris ce que le client peut voir : jamais la structure interne de la table.
export class AccountResponseDto {
  @ApiProperty({
    example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    description: 'Identifiant ULID du compte',
  })
  id!: string;

  @ApiProperty({ enum: AccountStatus, example: AccountStatus.Active })
  status!: AccountStatus;

  @ApiProperty({ example: '2026-10-09T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-09T10:00:00.000Z' })
  updatedAt!: string;
}
