import { HttpStatus } from '@nestjs/common';
import {
  ApiCode,
  type ApiCodeValue,
} from '../../../../common/api/api-codes';
import { ApiException } from '../../../../common/api/api-exception';

export class AuthSecurityException extends ApiException {
  constructor(
    code: ApiCodeValue = ApiCode.AuthUnauthorized,
    statusCode: number = HttpStatus.UNAUTHORIZED,
  ) {
    super(statusCode, code, {
      logMessage: 'Authentication security validation failed',
    });
  }
}

