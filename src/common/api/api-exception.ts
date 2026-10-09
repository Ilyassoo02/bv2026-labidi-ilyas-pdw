import { ApiCode, ApiCodeValue } from './api-codes';
import { ApiValidationError } from './api-response';

// Je définis les informations optionnelles que mon exception peut transporter.
interface ApiExceptionOptions {
  data?: unknown;
  validationErrors?: ApiValidationError[];
  logMessage?: string;
}

// Je crée une erreur connue : elle porte son statut HTTP et son code stable pour le client.
export class ApiException extends Error {
  readonly data: unknown;
  readonly validationErrors: ApiValidationError[];

  constructor(
    readonly statusCode: number,
    readonly apiCode: ApiCodeValue,
    options: ApiExceptionOptions = {},
  ) {
    // Je garde un message technique pour les logs, sans jamais l'envoyer au client.
    super(options.logMessage ?? apiCode);
    this.data = options.data ?? null;
    this.validationErrors = options.validationErrors ?? [];
  }
}

// Je spécialise l'exception pour une entrée invalide : HTTP 422, la requête est comprise mais son contenu est faux.
export class ValidationException extends ApiException {
  constructor(validationErrors: ApiValidationError[]) {
    super(422, ApiCode.CommonValidationError, { validationErrors });
  }
}
