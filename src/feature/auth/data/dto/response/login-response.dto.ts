
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  // Je retourne l'identifiant du compte connecté.
  @ApiProperty({
    example: '01K2Z3Z4Z5Z6Z7Z8Z9ZAABBCCD',
  })
  accountId!: string;

  // Je retourne l'adresse e-mail du compte.
  @ApiProperty({
    example: 'test@example.com',
  })
  email!: string;

  // Je confirme que la connexion est réussie.
  @ApiProperty({
    example: true,
  })
  authenticated!: boolean;
}
