// Je mets l'e-mail sous sa forme canonique : sans espaces autour et en minuscules.
// Je l'applique à l'inscription comme à la connexion, sinon « Nicolas@Example.com » et « nicolas@example.com » seraient deux comptes différents.
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
