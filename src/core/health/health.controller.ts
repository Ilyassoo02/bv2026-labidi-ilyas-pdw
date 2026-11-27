
import { Controller, Get } from '@nestjs/common';
import { SkipApiTransform } from '@common/api/api-metadata.decorator';
import { Public } from '@feature/auth/decorator/public.decorator';

// Je regroupe ici les routes de santé : elles disent seulement si l'API répond, sans toucher au métier.
@Public()
@Controller('health')
export class HealthController {
  // Je marque cette route comme brute, pour que la sonde reçoive exactement { status: 'ok' }.
  @SkipApiTransform()
  @Get('live')
  live(): { status: string } {
    return { status: 'ok' };
  }
}
