import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse as SwaggerApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiCodeValue } from './api-codes';

// Je documente dans Swagger la vraie enveloppe : code, result, data et validationErrors.
export const ApiEnvelopeResponse = <T extends Type<unknown>>(
  model: T,
  options: { status: HttpStatus; code: ApiCodeValue; description: string },
) =>
  applyDecorators(
    ApiExtraModels(model),
    SwaggerApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        properties: {
          code: { type: 'string', example: options.code },
          result: { type: 'boolean', example: true },
          data: { $ref: getSchemaPath(model) },
          validationErrors: { type: 'array', items: { type: 'object' } },
        },
      },
    }),
  );
