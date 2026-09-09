import { Injectable } from '@nestjs/common';
import { ok } from 'assert';

@Injectable()
export class HealthService {
  getHello(): any {
    return {statut:'ok'};
  }
}
