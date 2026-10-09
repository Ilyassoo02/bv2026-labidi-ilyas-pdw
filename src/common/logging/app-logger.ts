import { Injectable, Scope } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

// Je force chaque log à nommer son événement : c'est lui qui me permettra de retrouver ce qui s'est passé.
export interface LogFields {
  event: string;
  [key: string]: unknown;
}

// Je suis un logger à contrat fixe : j'impose la structure, et l'appelant choisit seulement l'événement.
// Scope TRANSIENT : chaque classe qui me demande reçoit sa propre instance, donc son propre contexte.
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  constructor(private readonly pino: PinoLogger) {}

  // Je pose le nom de la classe qui logue, pour le retrouver dans les lignes.
  setContext(context: string): void {
    this.pino.setContext(context);
  }

  // Je logue un événement applicatif normal.
  application(fields: LogFields): void {
    this.pino.info({ category: 'application', ...fields }, fields.event);
  }

  // Je logue un événement à surveiller, comme une erreur client 4xx.
  warn(fields: LogFields): void {
    this.pino.warn({ category: 'application', ...fields }, fields.event);
  }

  // Je logue une erreur serveur.
  error(fields: LogFields): void {
    this.pino.error({ category: 'application', ...fields }, fields.event);
  }

  // Je logue un événement de sécurité : tentative suspecte, échec d'authentification, etc.
  security(fields: LogFields): void {
    this.pino.warn({ category: 'security', ...fields }, fields.event);
  }

  // Je logue une trace métier, pour savoir qui a fait quoi.
  audit(fields: LogFields): void {
    this.pino.info({ category: 'audit', ...fields }, fields.event);
  }
}
