import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global by design: the database connection is a cross-cutting concern and a
 * single pooled client must be shared by every feature module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
