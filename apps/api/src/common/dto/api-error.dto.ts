import { ApiProperty } from '@nestjs/swagger';
import type { ApiErrorResponse } from '@wizzapp/shared';

/**
 * The unified error body every failure returns (spec §10). Declared as a class
 * so Swagger can render its schema; the API itself builds these objects in
 * AllExceptionsFilter, not here.
 */
export class ApiErrorDto implements ApiErrorResponse {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({
    description:
      'A single message, or an array of them when request validation fails. Messages are in Arabic.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'المتدرب غير موجود',
  })
  message!: string | string[];

  @ApiProperty({ example: '2026-08-29T16:47:29.967Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/clients/4f2c…' })
  path!: string;
}
