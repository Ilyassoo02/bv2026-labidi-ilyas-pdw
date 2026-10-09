import { Controller, Get } from '@nestjs/common';

// Je regroupe ici les routes de santé : elles disent seulement si l'API répond, sans toucher au métier.
@Controller('health')
export class HealthController {
  // Je réponds à GET /health/live. Je renvoie simplement un objet : NestJS le transforme en JSON.
  @Get('live')
  live(): { status: string } {
    return { status: 'ok' };
  }
}
