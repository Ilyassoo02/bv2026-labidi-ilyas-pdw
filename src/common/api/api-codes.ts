// Je regroupe ici tous les codes applicatifs de mon API.
// Un code publié devient un contrat : j'en ajoute si besoin, mais je ne renomme jamais un code existant.
export const ApiCode = {
  CommonError: 'api.common.error',
  CommonSuccess: 'api.common.success',
  CommonValidationError: 'api.common.validation-error',
  AuthUnauthorized: 'api.auth.unauthorized',
  AuthInvalidCredentials: 'api.auth.invalid-credentials',
  AccountFound: 'api.account.found',
  AccountNotFound: 'api.account.not-found',
  AccountCreated: 'api.account.created',
} as const;

// Je déduis le type de l'un de ces codes, pour éviter les fautes de frappe.
export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode];
