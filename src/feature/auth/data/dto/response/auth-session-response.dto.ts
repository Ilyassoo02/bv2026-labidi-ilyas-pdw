
import { ApiProperty } from '@nestjs/swagger';

export class AuthSessionResponseDto {
  // Je retourne l'identifiant du compte.
  @ApiProperty({
    example: '01K2Z3Z4Z5Z6Z7Z8Z9ZAABBCCD',
  })
  accountId!: string;

  // Je précise si la session est authentifiée.
  @ApiProperty({
    example: true,
  })
  authenticated!: boolean;
}
