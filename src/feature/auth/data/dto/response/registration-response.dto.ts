
import { ApiProperty } from '@nestjs/swagger';

import { AccountStatus } from '@feature/account/account-status.enum';

export class RegistrationResponseDto {
  // Je retourne l'identifiant du nouveau compte.
  @ApiProperty({
    example: '01K2Z3Z4Z5Z6Z7Z8Z9ZAABBCCD',
  })
  accountId!: string;

  // Je retourne l'adresse e-mail enregistrée.
  @ApiProperty({
    example: 'test@example.com',
  })
  email!: string;

  // Je retourne le statut du compte.
  @ApiProperty({
    enum: AccountStatus,
    example: AccountStatus.Active,
  })
  status!: AccountStatus;

  // Je précise si l'adresse e-mail est vérifiée.
  @ApiProperty({
    example: false,
  })
  emailVerified!: boolean;

  // Je retourne la date de création du compte.
  @ApiProperty({
    example: '2026-11-23T12:00:00.000Z',
  })
  createdAt!: string;
}
