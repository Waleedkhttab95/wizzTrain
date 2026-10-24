import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

/**
 * One structured line per request. Deliberately logs only method, path, status
 * and duration — never bodies or query values, which carry the health data this
 * platform exists to protect.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const status = http.getResponse<{ statusCode: number }>().statusCode;
        this.logger.log(
          `${request.method} ${request.route?.path ?? request.url} ${status} ${Date.now() - startedAt}ms`,
        );
      }),
    );
  }
}
