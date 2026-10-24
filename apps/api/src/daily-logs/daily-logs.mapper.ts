import type { DailyLogView } from '@wizzapp/shared';
import { toIsoDate } from '../common/utils/date.util';
import type { DailyLogRow } from './daily-logs.select';

export function toDailyLogView(row: DailyLogRow): DailyLogView {
  return {
    id: row.id,
    logDate: toIsoDate(row.logDate),
    weightKg: row.weightKg,
    caloriesActual: row.caloriesActual,
    carbsGActual: row.carbsGActual,
    proteinGActual: row.proteinGActual,
    fatGActual: row.fatGActual,
    fiberGActual: row.fiberGActual,
    waterLActual: row.waterLActual,
    sleepHours: row.sleepHours,
    stepsActual: row.stepsActual,
    notes: row.notes,
  };
}
