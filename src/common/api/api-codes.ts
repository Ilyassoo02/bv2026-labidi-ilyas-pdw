
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

  // Code lié à la protection CSRF.
  AuthCsrfInvalid: 'api.security.csrf-invalid',

  // Codes liés aux comptes utilisateurs.
  AccountFound: 'api.account.found',
  AccountNotFound: 'api.account.not-found',
  AccountCreated: 'api.account.created',
} as const;

// Je déduis automatiquement le type des codes autorisés.
// Cela permet d'éviter les fautes de frappe dans les autres fichiers.
export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode];
