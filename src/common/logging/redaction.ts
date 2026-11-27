/**
 * Je liste les champs sensibles que je ne veux jamais
 * voir apparaître dans les journaux de mon API.
 */
export const REDACTED_PATHS = [
  // Je protège les informations d'authentification.
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',

  // Je protège le jeton CSRF envoyé dans les en-têtes.
  'req.headers["x-csrf-token"]',

  // Je protège les informations sensibles du corps des requêtes.
  'req.body.password',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.csrfToken',

  // Je protège également les champs sensibles imbriqués.
  '*.password',
  '*.accessToken',
  '*.refreshToken',
  '*.csrfToken',
  '*.secret',
  '*.apiKey',
];

// Je remplace les valeurs sensibles par ce texte
// pour que les journaux restent lisibles.
export const REDACTION_CENSOR = '[REDACTED]';
