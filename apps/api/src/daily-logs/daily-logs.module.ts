import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { ClientDailyLogsController, DailyLogsController } from './daily-logs.controller';
import { DailyLogsRepository } from './daily-logs.repository';
import { DailyLogsService } from './daily-logs.service';

@Module({
  imports: [ClientsModule],
  controllers: [DailyLogsController, ClientDailyLogsController],
  providers: [DailyLogsService, DailyLogsRepository],
  // SummaryModule aggregates these rows; it needs the repository, not the service.
  exports: [DailyLogsRepository],
})
export class DailyLogsModule {}
