import { validatePassword } from './password-policy';

// Je teste les bornes de longueur, sans module Nest ni base de données.
describe('validatePassword', () => {
  it('refuse un mot de passe de 14 caractères', () => {
    expect(validatePassword('a'.repeat(14))).toEqual([
      'api.auth.password.too-short',
    ]);
  });

  it('accepte un mot de passe de 15 caractères', () => {
    expect(validatePassword('a'.repeat(15))).toEqual([]);
  });

  it('accepte un mot de passe de 128 caractères', () => {
    expect(validatePassword('a'.repeat(128))).toEqual([]);
  });

  it('refuse un mot de passe de 129 caractères', () => {
    expect(validatePassword('a'.repeat(129))).toEqual([
      'api.auth.password.too-long',
    ]);
  });
});
