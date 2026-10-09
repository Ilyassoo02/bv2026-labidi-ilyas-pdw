// Je définis l'erreur de validation telle que le client la recevra.
export interface ApiValidationError {
  property: string;
  messages: string[];
  children: ApiValidationError[];
}

// Je définis la forme unique de toutes mes réponses, succès comme erreur.
export interface ApiResponse<T> {
  code: string;
  result: boolean;
  data: T | null;
  validationErrors: ApiValidationError[];
}

// Je fabrique une réponse de succès, toujours avec le même format.
export const success = <T>(code: string, data: T): ApiResponse<T> => ({
  code,
  result: true,
  data,
  validationErrors: [],
});

// Je fabrique une réponse d'erreur, avec les erreurs de validation éventuelles.
export const error = (
  code: string,
  validationErrors: ApiValidationError[] = [],
): ApiResponse<null> => ({
  code,
  result: false,
  data: null,
  validationErrors,
});
