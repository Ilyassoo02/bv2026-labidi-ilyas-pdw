import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Je définis les rôles acceptés pour tester la validation d'un enum.
export enum TestRole {
  Admin = 'ADMIN',
  User = 'USER',
}

// Je décris le corps de la requête de test. Chaque règle doit renvoyer une erreur 422 si elle n'est pas respectée.
export class TestValidationDto {
  // Je vérifie que le nom est une chaîne non vide de 20 caractères maximum.
  @ApiProperty({ example: 'Ilyas' })
  @IsString()
  @IsNotEmpty({ message: 'api.test.name.required' })
  @MaxLength(20)
  name!: string;

  // Je vérifie que l'âge est un entier entre 0 et 150.
  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(0)
  @Max(150)
  age!: number;

  // Je vérifie que le rôle fait partie de l'enum TestRole.
  @ApiProperty({ enum: TestRole, example: TestRole.User })
  @IsEnum(TestRole)
  role!: TestRole;
}
