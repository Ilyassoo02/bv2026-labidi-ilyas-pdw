
/**
 * Je regroupe ici tous les codes applicatifs de mon API.
 * Un code publié devient un contrat :
 * j'en ajoute si besoin, mais je ne renomme jamais un code existant.
 */

export const ApiCode = {
  // Codes généraux de l'application.
  CommonError: 'api.common.error',
  CommonSuccess: 'api.common.success',
  CommonValidationError: 'api.common.validation-error',

  // Codes liés à l'authentification.
  AuthUnauthorized: 'api.auth.unauthorized',
  AuthInvalidCredentials: 'api.auth.invalid-credentials',
  AuthRefreshInvalid: 'api.auth.refresh-invalid',
  AuthEmailAlreadyUsed: 'api.auth.email-already-used',

  // Codes liés à la sécurité.
  AuthCsrfInvalid: 'api.security.csrf-invalid',
  AuthOriginInvalid: 'api.security.origin-invalid',

  // Codes liés aux comptes utilisateurs.
  AccountFound: 'api.account.found',
  AccountNotFound: 'api.account.not-found',
  AccountCreated: 'api.account.created',
} as const;

// Je déduis automatiquement le type des codes autorisés.
export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode];
