import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestValidationDto } from './test-validation.dto';

// Je crée une route temporaire pour vérifier que la validation globale fonctionne.
@ApiTags('Test')
@Controller('test-validation')
export class TestValidationController {
  // Je renvoie le corps reçu : si la requête arrive ici, elle est valide et sera enveloppée dans { code, result, data }.
  @Post()
  validate(@Body() body: TestValidationDto): TestValidationDto {
    return body;
  }
}
