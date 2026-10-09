import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppLogger } from '@common/logging';
import { ApiException } from './api-exception';
import { ApiCode, ApiCodeValue } from './api-codes';
import { ApiValidationError, error } from './api-response';

// Je capte toutes les erreurs pour renvoyer une réponse dans mon format, sans fuite technique.
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(ApiExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, apiCode, validationErrors } = this.describe(exception);

    // Je journalise la cause technique, avec un niveau adapté au statut.
    const fields = {
      event: 'api.request.failed',
      statusCode,
      apiCode,
      cause: exception instanceof Error ? exception.message : String(exception),
    };

    if (statusCode >= 500) {
      this.logger.error({
        ...fields,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else {
      this.logger.warn(fields);
    }

    // Je renvoie au client uniquement le code stable et les erreurs de validation.
    response.status(statusCode).json(error(apiCode, validationErrors));
  }

  // Je traduis chaque type d'exception en statut HTTP et code applicatif.
  private describe(exception: unknown): {
    statusCode: number;
    apiCode: ApiCodeValue;
    validationErrors: ApiValidationError[];
  } {
    if (exception instanceof ApiException) {
      return {
        statusCode: exception.statusCode,
        apiCode: exception.apiCode,
        validationErrors: exception.validationErrors,
      };
    }

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        apiCode: ApiCode.CommonError,
        validationErrors: [],
      };
    }

    // Une erreur inconnue devient un 500 générique : rien d'interne n'est exposé.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      apiCode: ApiCode.CommonError,
      validationErrors: [],
    };
  }
}
