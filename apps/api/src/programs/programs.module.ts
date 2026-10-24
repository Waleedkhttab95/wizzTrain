import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { TemplatesModule } from '../templates/templates.module';
import {
  ClientProgramsController,
  ExercisesController,
  ProgramsController,
  WorkoutDaysController,
} from './programs.controller';
import { ProgramsRepository } from './programs.repository';
import { ProgramsService } from './programs.service';
import { VideoStorageService } from './video-storage.service';

@Module({
  imports: [ClientsModule, TemplatesModule], // ClientAccessService + applying templates
  controllers: [
    ClientProgramsController,
    ProgramsController,
    WorkoutDaysController,
    ExercisesController,
  ],
  providers: [ProgramsService, ProgramsRepository, VideoStorageService],
  // ClientsModule renders the active program on a client's profile, so it
  // needs the same URL resolution for uploaded videos.
  exports: [ProgramsRepository, VideoStorageService],
})
export class ProgramsModule {}
