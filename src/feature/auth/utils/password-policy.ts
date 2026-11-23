// Je fixe les bornes de longueur : 15 caractères minimum pour la sécurité, 128 maximum pour éviter un calcul Argon2 inutilement lourd.
export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

// Je renvoie la liste des règles non respectées. Une liste vide signifie que le mot de passe est acceptable.
export function validatePassword(password: string): string[] {
  const violations: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    violations.push('api.auth.password.too-short');
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    violations.push('api.auth.password.too-long');
  }

  return violations;
}
