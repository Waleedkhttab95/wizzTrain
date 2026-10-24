import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@wizzapp/shared';
import type { Request, Response } from 'express';
import { mapPrismaError } from './prisma-error.mapper';

/**
 * The single global filter. Produces the unified error body required by
 * spec §10: `{ statusCode, error, message }` plus request context for debugging.
 *
 * Handling Prisma errors here (rather than in a second @Catch filter) keeps the
 * response shape identical regardless of which error surfaced first.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.resolve(exception);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${statusCode}: ${String(message)}`);
    }

    const body: ApiErrorResponse = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): Pick<ApiErrorResponse, 'statusCode' | 'error' | 'message'> {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { statusCode, error: exception.name, message: payload };
      }

      const record = payload as Record<string, unknown>;
      return {
        statusCode,
        error: (record.error as string) ?? exception.name,
        // ValidationPipe puts an array of messages here; pass it through as-is.
        message: (record.message as string | string[]) ?? exception.message,
      };
    }

    const prisma = mapPrismaError(exception);
    if (prisma) {
      return {
        statusCode: prisma.status,
        error: HttpStatus[prisma.status] ?? 'Error',
        message: prisma.message,
      };
    }

    // Unknown failure: log the detail (above), return nothing internal.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'حدث خطأ غير متوقع في الخادم',
    };
  }
}
