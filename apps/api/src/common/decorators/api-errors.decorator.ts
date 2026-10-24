import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../dto/api-error.dto';

/**
 * The error responses every guarded route can return, documented once instead
 * of repeated on each handler.
 */
export function ApiStandardErrors() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorDto }),
    ApiUnauthorizedResponse({
      description: 'Missing, malformed or expired token',
      type: ApiErrorDto,
    }),
    ApiForbiddenResponse({
      description: 'Authenticated, but not for this role or resource',
      type: ApiErrorDto,
    }),
    ApiNotFoundResponse({
      description: 'Resource not found, or not owned by the caller',
      type: ApiErrorDto,
    }),
    ApiTooManyRequestsResponse({ description: 'Rate limit exceeded', type: ApiErrorDto }),
  );
}
