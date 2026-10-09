import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { ApiCode } from './api-codes';
import {
  API_SKIP_TRANSFORM_KEY,
  API_SUCCESS_CODE_KEY,
} from './api-metadata.decorator';
import { success } from './api-response';

// J'enveloppe automatiquement chaque réponse de succès dans mon format ApiResponse.
@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Je regarde d'abord la méthode, puis la classe : la règle la plus précise gagne.
    const targets = [context.getHandler(), context.getClass()];

    // Si la route demande une réponse brute, je la laisse passer sans rien changer.
    const skip = this.reflector.getAllAndOverride<boolean>(
      API_SKIP_TRANSFORM_KEY,
      targets,
    );
    if (skip) {
      return next.handle();
    }

    // Je prends le code de succès de la route, ou le code par défaut s'il n'y en a pas.
    const code =
      this.reflector.getAllAndOverride<string>(API_SUCCESS_CODE_KEY, targets) ??
      ApiCode.CommonSuccess;

    // Je transforme la valeur retournée par le Controller en réponse enveloppée.
    return next.handle().pipe(map((data: unknown) => success(code, data)));
  }
}
