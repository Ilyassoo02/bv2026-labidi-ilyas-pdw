
import { EnvService } from '../../../common/config/env.service';
import { ValidationException } from '../../../common/api/api-exception';
import { PasswordPolicyService } from './password-policy.service';

describe('PasswordPolicyService', () => {
  const envService = {
    passwordMinLength: 15,
    passwordMaxLength: 128,
  } as EnvService;

  const service = new PasswordPolicyService(envService);

  it('refuse un mot de passe de 14 caractères', () => {
    const errors = service.validate('a'.repeat(14));
    expect(errors).toHaveLength(1);
    expect(errors[0].messages).toContain(
      'api.auth.register.error.password.too-short',
    );
  });

  it('accepte un mot de passe de 15 caractères', () => {
    expect(service.validate('a'.repeat(15))).toEqual([]);
  });

  it('accepte un mot de passe de 128 caractères', () => {
    expect(service.validate('a'.repeat(128))).toEqual([]);
  });

  it('refuse un mot de passe de 129 caractères', () => {
    const errors = service.validate('a'.repeat(129));
    expect(errors).toHaveLength(1);
  });

  it('déclenche une exception si le mot de passe est invalide', () => {
    expect(() => service.assertValid('a'.repeat(14))).toThrow(
      ValidationException,
    );
  });
});
