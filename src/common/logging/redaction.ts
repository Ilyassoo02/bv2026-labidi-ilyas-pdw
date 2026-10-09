// Je liste les champs que je ne veux jamais voir apparaître dans les logs : mots de passe, cookies et tokens.
export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.accessToken',
  'req.body.refreshToken',
  '*.password',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
  '*.apiKey',
];

// Je remplace la valeur sensible par ce texte, pour que la ligne de log reste lisible.
export const REDACTION_CENSOR = '[REDACTED]';
