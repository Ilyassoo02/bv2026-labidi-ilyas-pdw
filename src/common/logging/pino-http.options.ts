import type { IncomingMessage, ServerResponse } from 'http';
import { EnvService } from '@common/config/env.service';
import { createUlid, isUlid } from './ulid';
import { REDACTED_PATHS, REDACTION_CENSOR } from './redaction';

// Je construis ici la configuration des logs HTTP à partir de la configuration validée.
export const buildPinoHttpOptions = (env: EnvService) => ({
  level: env.logLevel,

  // Je reprends le x-request-id envoyé par le client seulement s'il est un ULID valide, sinon j'en crée un.
  // Je le renvoie aussi au client dans l'en-tête X-Request-Id, pour qu'il puisse me le communiquer en cas de problème.
  genReqId: (req: IncomingMessage, res: ServerResponse): string => {
    const incoming = req.headers['x-request-id'];
    const requestId = isUlid(incoming) ? incoming : createUlid();
    res.setHeader('X-Request-Id', requestId);
    return requestId;
  },

  // Je masque les champs sensibles avant que la ligne de log ne soit écrite.
  redact: {
    paths: REDACTED_PATHS,
    censor: REDACTION_CENSOR,
  },

  // Je choisis le niveau de chaque ligne selon le résultat de la requête.
  customLogLevel: (
    req: IncomingMessage,
    res: ServerResponse,
    err?: Error,
  ): 'silent' | 'error' | 'warn' | 'info' => {
    // Je rends silencieuses les sondes de santé, pour ne pas polluer les logs.
    if (req.url?.startsWith('/health')) {
      return 'silent';
    }

    if (err || res.statusCode >= 500) {
      return 'error';
    }

    if (res.statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  },
});
