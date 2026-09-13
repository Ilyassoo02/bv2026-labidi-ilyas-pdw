import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger {
  private context = 'Application';

  setContext(context: string) {
    this.context = context;
  }

  application(event: string, payload?: Record<string, unknown>) {
    console.log(`[APP] [${this.context}] ${event}`, payload ?? '');
  }

  security(event: string, payload?: Record<string, unknown>) {
    console.warn(`[SECURITY] [${this.context}] ${event}`, payload ?? '');
  }

  audit(event: string, payload?: Record<string, unknown>) {
    console.log(`[AUDIT] [${this.context}] ${event}`, payload ?? '');
  }
}