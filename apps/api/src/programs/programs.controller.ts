import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VIDEO_UPLOAD } from '@wizzapp/shared';
import { Role } from '@wizzapp/shared';
import type {
  AuthenticatedUser,
  ExerciseItemView,
  ExerciseLogView,
  WorkoutDayView,
  WorkoutProgramView,
} from '@wizzapp/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateExerciseItemDto } from './dto/create-exercise-item.dto';
import { CreateExerciseLogDto } from './dto/create-exercise-log.dto';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateWorkoutDayDto } from './dto/create-workout-day.dto';
import { UpdateExerciseItemDto } from './dto/update-exercise-item.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { UpdateWorkoutDayDto } from './dto/update-workout-day.dto';
import { ProgramsService } from './programs.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardErrors } from '../common/decorators/api-errors.decorator';

type DayView = Omit<WorkoutDayView, 'exercises'>;
type ExerciseView = Omit<ExerciseItemView, 'logs'>;

/** Program authoring for one client. Trainer only (spec §F3). */
@Roles(Role.Trainer)
@ApiTags('programs')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('clients/:clientId/programs')
export class ClientProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<WorkoutProgramView[]> {
    return this.programs.listForClient(user, clientId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateProgramDto,
  ): Promise<WorkoutProgramView> {
    return this.programs.createForClient(user, clientId, dto);
  }
}

@ApiTags('programs')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programs: ProgramsService) {}

  /** The caller's own current workout program, with every day and exercise. */
  // Declared before the `:id` route so "active" is never parsed as a UUID.

  @Roles(Role.Client)
  @Get('active')
  active(@CurrentUser() user: AuthenticatedUser): Promise<WorkoutProgramView> {
    return this.programs.getActiveForClient(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorkoutProgramView> {
    return this.programs.getById(user, id);
  }

  @Roles(Role.Trainer)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ): Promise<WorkoutProgramView> {
    return this.programs.updateProgram(user, id, dto);
  }

  @Roles(Role.Trainer)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.programs.deleteProgram(user, id);
  }

  @Roles(Role.Trainer)
  @Post(':id/days')
  addDay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWorkoutDayDto,
  ): Promise<DayView> {
    return this.programs.addDay(user, id, dto);
  }
}

@Roles(Role.Trainer)
@ApiTags('programs')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('days')
export class WorkoutDaysController {
  constructor(private readonly programs: ProgramsService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkoutDayDto,
  ): Promise<DayView> {
    return this.programs.updateDay(user, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.programs.deleteDay(user, id);
  }

  @Post(':id/exercises')
  addExercise(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExerciseItemDto,
  ): Promise<ExerciseView> {
    return this.programs.addExercise(user, id, dto);
  }
}

@ApiTags('programs')
@ApiBearerAuth('bearer')
@ApiStandardErrors()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly programs: ProgramsService) {}

  @Roles(Role.Trainer)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseItemDto,
  ): Promise<ExerciseView> {
    return this.programs.updateExercise(user, id, dto);
  }

  @Roles(Role.Trainer)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.programs.deleteExercise(user, id);
  }

  /**
   * Upload a demonstration clip for an exercise.
   *
   * Buffered in memory rather than streamed to a temp file: the cap is small,
   * and nothing reaches the disk until the type and size have been checked.
   * Uploading clears any link that was set, so an exercise never carries two
   * competing videos.
   */
  @ApiOperation({
    summary: 'Upload a demonstration video for one exercise',
    description:
      'Multipart field name is "video". Accepts MP4, MOV or WebM up to 50 MB. Replaces whatever video was attached before, link or file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['video'],
      properties: { video: { type: 'string', format: 'binary' } },
    },
  })
  @Roles(Role.Trainer)
  @Post(':id/video')
  @UseInterceptors(
    FileInterceptor('video', { limits: { fileSize: VIDEO_UPLOAD.maxBytes, files: 1 } }),
  )
  uploadVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ExerciseView> {
    return this.programs.attachVideo(user, id, file);
  }

  /** Detaches whichever video is attached, link or upload, and deletes the file. */
  @ApiOperation({ summary: 'Remove the video attached to one exercise' })
  @Roles(Role.Trainer)
  @Delete(':id/video')
  removeVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExerciseView> {
    return this.programs.removeVideo(user, id);
  }

  /** Record what was actually performed for one exercise (spec §F5). */
  @ApiOperation({
    summary: 'Record what was actually performed for one exercise',
    description:
      'actualReps is free-form, one entry per set — e.g. "10/9/9" for three sets of 10, 9 and 9. Both fields are optional, so a client can log a bodyweight set with reps only.',
  })
  @Roles(Role.Client)
  @Post(':id/logs')
  log(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateExerciseLogDto,
  ): Promise<ExerciseLogView> {
    return this.programs.logExercise(user, id, dto);
  }

  /** Remove a logged set — a client undoing a mistake, or a trainer tidying up. */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('logs/:logId')
  removeLog(
    @CurrentUser() user: AuthenticatedUser,
    @Param('logId', ParseUUIDPipe) logId: string,
  ): Promise<void> {
    return this.programs.deleteLog(user, logId);
  }
}
