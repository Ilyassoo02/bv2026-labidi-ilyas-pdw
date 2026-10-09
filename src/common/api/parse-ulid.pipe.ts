import { Injectable, PipeTransform } from '@nestjs/common';
import { isUlid } from '@common/logging';
import { ApiCode } from './api-codes';
import { ApiException } from './api-exception';

// Je vérifie qu'un identifiant d'URL est un ULID valide, avant toute requête vers la base.
@Injectable()
export class ParseUlidPipe implements PipeTransform<unknown, string> {
  transform(value: unknown): string {
    if (!isUlid(value)) {
      throw new ApiException(400, ApiCode.CommonError, {
        logMessage: 'Invalid ULID route parameter',
      });
    }

    return value;
  }
}
