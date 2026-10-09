import { ulid } from 'ulid';

// Je génère mes identifiants au format ULID : 26 caractères, qui se trient dans l'ordre du temps.
export const ULID_LENGTH = 26;

// Je n'accepte que les ULID valides. Tout autre texte reçu d'un client sera refusé.
export const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export const createUlid = (): string => ulid();

// Je vérifie qu'une valeur est bien un ULID avant de la faire confiance.
export const isUlid = (value: unknown): value is string =>
  typeof value === 'string' && ULID_REGEX.test(value);
