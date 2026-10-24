import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { DailyLogsModule } from '../daily-logs/daily-logs.module';
import { NutritionModule } from '../nutrition/nutrition.module';
import { MySummaryController, SummaryController } from './summary.controller';
import { SummaryRepository } from './summary.repository';
import { SummaryService } from './summary.service';

@Module({
  // Imports the modules that own the data, rather than re-declaring their
  // repositories here — that would create a second Prisma-backed instance and
  // duplicate the query logic.
  imports: [ClientsModule, DailyLogsModule, NutritionModule],
  controllers: [SummaryController, MySummaryController],
  providers: [SummaryService, SummaryRepository],
})
export class SummaryModule {}
