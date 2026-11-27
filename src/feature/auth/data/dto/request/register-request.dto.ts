
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterRequestDto {
  // Je vérifie que l'adresse e-mail est valide.
  @ApiProperty({
    example: 'test@example.com',
    maxLength: 320,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail(
    {},
    { message: 'api.auth.register.error.email.invalid' },
  )
  @MaxLength(320, {
    message: 'api.auth.register.error.email.too-long',
  })
  email!: string;

  // Je vérifie que le mot de passe est bien renseigné.
  @ApiProperty({
    example: 'MonMotDePasseSecurise123!',
  })
  @IsString({
    message: 'api.auth.register.error.password.invalid',
  })
  @MinLength(1, {
    message: 'api.auth.register.error.password.required',
  })
  @MaxLength(1024, {
    message: 'api.auth.register.error.password.too-long',
  })
  password!: string;
}
