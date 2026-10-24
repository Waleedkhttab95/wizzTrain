import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface MappedError {
  status: number;
  message: string;
}

/**
 * Translates the Prisma error codes this app can actually produce into HTTP
 * semantics. Anything else falls through to a 500 so we never leak driver
 * internals to the client.
 *
 * @see https://www.prisma.io/docs/orm/reference/error-reference
 */
export function mapPrismaError(exception: unknown): MappedError | null {
  if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (exception.code) {
    case 'P2002': {
      const target = exception.meta?.target;
      const fields = Array.isArray(target) ? target.join('، ') : String(target ?? '');
      return {
        status: HttpStatus.CONFLICT,
        message: fields ? `القيمة مستخدمة بالفعل: ${fields}` : 'القيمة مستخدمة بالفعل',
      };
    }
    case 'P2003':
      return { status: HttpStatus.BAD_REQUEST, message: 'مرجع غير صالح لسجل مرتبط' };
    case 'P2025':
      return { status: HttpStatus.NOT_FOUND, message: 'السجل المطلوب غير موجود' };
    default:
      return null;
  }
}
