
import { Injectable } from '@nestjs/common';
import { EnvService } from '../../../common/config/env.service';
import { ApiValidationError } from '../../../common/api/api-response';
import { ValidationException } from '../../../common/api/api-exception';

@Injectable()
export class PasswordPolicyService {
  constructor(private readonly envService: EnvService) {}

  // Je vérifie si le mot de passe respecte les règles.
  validate(password: string): ApiValidationError[] {
    const validationErrors: ApiValidationError[] = [];

    if (password.length < this.envService.passwordMinLength) {
      validationErrors.push({
        property: 'password',
        messages: ['api.auth.register.error.password.too-short'],
        children: [],
      });
    }

    if (password.length > this.envService.passwordMaxLength) {
      validationErrors.push({
        property: 'password',
        messages: ['api.auth.register.error.password.too-long'],
        children: [],
      });
    }

    return validationErrors;
  }

  // Je déclenche une exception si le mot de passe est invalide.
  assertValid(password: string): void {
    const validationErrors = this.validate(password);

    if (validationErrors.length > 0) {
      throw new ValidationException(validationErrors);
    }
  }
}