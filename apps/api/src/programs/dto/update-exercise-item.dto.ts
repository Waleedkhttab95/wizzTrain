import { PartialType } from '@nestjs/mapped-types';
import { CreateExerciseItemDto } from './create-exercise-item.dto';

export class UpdateExerciseItemDto extends PartialType(CreateExerciseItemDto) {}
