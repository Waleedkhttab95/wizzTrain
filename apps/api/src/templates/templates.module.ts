import { Module } from '@nestjs/common';
import { VideoStorageService } from '../programs/video-storage.service';
import { TemplatesController } from './templates.controller';
import { TemplatesRepository } from './templates.repository';
import { TemplatesService } from './templates.service';

@Module({
  controllers: [TemplatesController],
  // VideoStorageService is stateless; providing it directly avoids importing
  // ProgramsModule, which would pull the whole programme surface in for a
  // single URL helper.
  providers: [TemplatesService, TemplatesRepository, VideoStorageService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
