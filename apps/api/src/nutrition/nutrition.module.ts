import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { ClientNutritionController, NutritionController } from './nutrition.controller';
import { NutritionRepository } from './nutrition.repository';
import { NutritionService } from './nutrition.service';

@Module({
  imports: [ClientsModule],
  controllers: [ClientNutritionController, NutritionController],
  providers: [NutritionService, NutritionRepository],
  // SummaryModule needs the active targets to compute "target vs. remaining".
  exports: [NutritionRepository],
})
export class NutritionModule {}
