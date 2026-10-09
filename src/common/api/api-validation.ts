import { ValidationError } from 'class-validator';
import { ApiValidationError } from './api-response';

// Je transforme un nom de contrainte en code stable : isNotEmpty devient is-not-empty.
const toKebabCase = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

// Je convertis une erreur de class-validator dans mon contrat, en gardant les erreurs imbriquées.
export const mapValidationError = (
  error: ValidationError,
): ApiValidationError => {
  const messages = Object.entries(error.constraints ?? {}).map(
    ([constraint, message]) =>
      message.startsWith('api.')
        ? message
        : `api.common.validation.error.${toKebabCase(constraint)}`,
  );

  return {
    property: error.property,
    messages,
    children: (error.children ?? []).map(mapValidationError),
  };
};

// Je convertis toute la liste d'erreurs renvoyée par le ValidationPipe.
export const mapValidationErrors = (
  errors: ValidationError[],
): ApiValidationError[] => errors.map(mapValidationError);
