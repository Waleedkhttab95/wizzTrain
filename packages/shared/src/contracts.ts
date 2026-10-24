import type { Role } from './roles';

/** `POST /auth/login` */
export interface LoginResponse {
  accessToken: string;
  role: Role;
  user: { id: string; name: string; email: string };
}

/** How consistently a client has been logging, derived from the last 7 days. */
export type AdherenceStatus = 'committed' | 'partial' | 'behind';

export interface ClientSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  goalWeightKg: number | null;
  /** Weight recorded when the trainer set them up, in kg. */
  startWeightKg: number | null;
  startDate: string | null;
  createdAt: string;

  /** ISO date of their most recent daily log, or null if they never logged. */
  lastLogDate: string | null;
  /** Weight from that most recent log — the figure the trainer scans for. */
  latestWeightKg: number | null;
  /**
   * Seven booleans, oldest first, ending today: did they log that day?
   * Drives the week strip on the client card.
   */
  weekStrip: boolean[];
  /** Count of `true` in `weekStrip`, 0-7. */
  daysLoggedThisWeek: number;
  status: AdherenceStatus;
  /**
   * When the trainer archived them, or null while they are active. Archived
   * clients keep their history but leave the roster, drop out of the
   * adherence average, and cannot sign in.
   */
  archivedAt: string | null;
}

export interface ClientProfile extends ClientSummary {
  heightCm: number | null;
  age: number | null;
  goalNote: string | null;
  activeProgram: WorkoutProgramView | null;
  activeNutritionPlan: NutritionPlanView | null;
  latestDailyLog: DailyLogView | null;
}

/**
 * What a client may see about themselves. Deliberately narrower than the
 * trainer's `ClientProfile`: their own goal and their coach's note, without the
 * roster metadata the trainer uses to triage.
 */
export interface ClientSelfView {
  id: string;
  name: string;
  email: string;
  heightCm: number | null;
  age: number | null;
  startDate: string | null;
  startWeightKg: number | null;
  goalWeightKg: number | null;
  /** The trainer's note about this client's goal — shown as the coach's note. */
  goalNote: string | null;
  trainerName: string;
}

export interface ExerciseLogView {
  id: string;
  completedAt: string;
  actualWeightKg: number | null;
  actualReps: string | null;
}

/**
 * A demonstration video attached to an exercise, already resolved to something
 * the client can open — the app does not need to know whether the trainer
 * pasted a link or uploaded a file.
 */
export interface ExerciseVideo {
  kind: 'link' | 'upload';
  url: string;
}

export interface ExerciseItemView {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restInterval: string | null;
  notes: string | null;
  orderIndex: number;
  /** Null when the trainer hasn't attached one — it is optional. */
  video: ExerciseVideo | null;
  logs: ExerciseLogView[];
}

/** Limits the API enforces on an uploaded exercise video. */
export const VIDEO_UPLOAD = {
  maxBytes: 50 * 1024 * 1024,
  mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'] as const,
  extensions: ['.mp4', '.mov', '.webm'] as const,
} as const;

export interface WorkoutDayView {
  id: string;
  dayLabel: string;
  orderIndex: number;
  exercises: ExerciseItemView[];
}

export interface WorkoutProgramView {
  id: string;
  title: string;
  startDate: string;
  isActive: boolean;
  createdAt: string;
  days: WorkoutDayView[];
}

// ── Program templates ───────────────────────────────────────────────────

export interface TemplateExerciseView {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restInterval: string | null;
  notes: string | null;
  orderIndex: number;
  video: ExerciseVideo | null;
}

export interface TemplateDayView {
  id: string;
  dayLabel: string;
  orderIndex: number;
  exercises: TemplateExerciseView[];
}

/** A reusable plan. Applying it copies into a WorkoutProgram — never links. */
export interface ProgramTemplateView {
  id: string;
  title: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  days: TemplateDayView[];
}

/** Row shape for the templates list, without loading every exercise. */
export interface ProgramTemplateSummary {
  id: string;
  title: string;
  notes: string | null;
  updatedAt: string;
  dayCount: number;
  exerciseCount: number;
}

export interface MealView {
  id: string;
  name: string;
  description: string;
}

export interface NutritionPlanView {
  id: string;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberMinG: number | null;
  waterMinL: number | null;
  stepsMin: number | null;
  isActive: boolean;
  createdAt: string;
  meals: MealView[];
}

export interface DailyLogView {
  id: string;
  /** ISO date, `YYYY-MM-DD`. One record per client per date. */
  logDate: string;
  weightKg: number | null;
  caloriesActual: number | null;
  carbsGActual: number | null;
  proteinGActual: number | null;
  fatGActual: number | null;
  fiberGActual: number | null;
  waterLActual: number | null;
  sleepHours: number | null;
  stepsActual: number | null;
  notes: string | null;
}

/**
 * A daily log as the trainer sees it: the client's own numbers plus whether
 * they trained that day, which lives in ExerciseLog rather than DailyLog.
 */
export interface ClientDailyLogView extends DailyLogView {
  /** True when at least one exercise was logged on this date. */
  workedOut: boolean;
}

/** One nutrient tracked in the weekly summary: what was eaten vs. what was targeted. */
export interface NutrientTotals {
  /** Sum of the client's logged values across the week. */
  actual: number;
  /** Plan target × 7 (null when no active nutrition plan sets this target). */
  target: number | null;
  /** `target - actual`, floored at 0. Null when there is no target. */
  remaining: number | null;
  /** Average per logged day (not per calendar day). Null when nothing was logged. */
  dailyAverage: number | null;
}

export interface WeightTrendPoint {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  weightKg: number;
}

/** One training day in the active program, and whether it happened this week. */
export interface AdherenceDay {
  id: string;
  label: string;
  /** True when at least one exercise from this day was logged during the week. */
  logged: boolean;
}

export interface WeeklyAdherence {
  /** ExerciseItems planned for the week (one pass through the active program). */
  planned: number;
  /** Distinct ExerciseItems the client logged during the week. */
  logged: number;
  /** `logged / planned`, 0–1. Null when nothing was planned. */
  rate: number | null;
  /**
   * Day-level view of the same week, in program order. A trainer thinks in
   * sessions ("3 of 4 days"), which the exercise counts above do not answer.
   */
  days: AdherenceDay[];
}

export interface WeekComparison {
  averageWeightKg: number | null;
  averageCaloriesPerLoggedDay: number | null;
  averageSleepHours: number | null;
  adherenceRate: number | null;
}

/** `GET /clients/:id/weekly-summary?week=YYYY-Www` */
export interface WeeklySummaryView {
  /** ISO week identifier, e.g. `2026-W35`. */
  week: string;
  /** Monday of the ISO week, `YYYY-MM-DD`. */
  weekStart: string;
  /** Sunday of the ISO week, `YYYY-MM-DD`. */
  weekEnd: string;
  daysLogged: number;
  averageWeightKg: number | null;
  weightChangeKg: number | null;
  weightTrend: WeightTrendPoint[];
  nutrition: {
    calories: NutrientTotals;
    protein: NutrientTotals;
    carbs: NutrientTotals;
    fat: NutrientTotals;
    fiber: NutrientTotals;
    waterL: NutrientTotals;
    steps: NutrientTotals;
  };
  averageSleepHours: number | null;
  adherence: WeeklyAdherence;
  previousWeek: WeekComparison;
}

/** Unified error body produced by the global exception filter. */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}
