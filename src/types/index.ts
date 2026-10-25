export type DayOfWeek = 'Пн' | 'Вт' | 'Ср' | 'Чт' | 'Пт' | 'Сб' | 'Вс';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export type MuscleGroup =
  | 'Грудь'
  | 'Спина'
  | 'Ноги'
  | 'Плечи'
  | 'Руки'
  | 'Пресс'
  | 'Всё тело';

export interface CatalogExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isBodyweight: boolean;
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg: number | null;
  defaultRestSec: number;
}

export interface PlannedExercise {
  id: string;
  catalogId?: string;
  name: string;
  muscleGroup: MuscleGroup;
  isBodyweight: boolean;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDayPlan {
  id: string;
  dayOfWeek: DayOfWeek;
  title: string;
  focus: string;
  estimatedMinutes: number;
  exercises: PlannedExercise[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  days: WorkoutDayPlan[];
}

export interface SessionSetResult {
  id: string;
  setNumber: number;
  plannedReps: number;
  plannedWeightKg: number | null;
  actualReps: number;
  actualWeightKg: number | null;
  completed: boolean;
  completedAt?: string;
}

export interface SessionExerciseRecord {
  id: string;
  plannedExerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  isBodyweight: boolean;
  restSeconds: number;
  skipped: boolean;
  sets: SessionSetResult[];
}

export interface ActiveWorkoutSession {
  id: string;
  planId: string;
  planName: string;
  dayId: string;
  dayOfWeek: DayOfWeek;
  workoutTitle: string;
  startedAt: string;
  currentExerciseIndex: number;
  exercises: SessionExerciseRecord[];
  restTimerEndAt: number | null;
  restTimerDurationSec: number;
  restTimerPausedRemainingSec: number | null;
}

export interface CompletedWorkoutRecord {
  id: string;
  planId: string;
  planName: string;
  dayOfWeek: DayOfWeek;
  workoutTitle: string;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
  participant: 'me' | 'friend';
  participantName: string;
  totalCompletedSets: number;
  totalCompletedReps: number;
  totalVolumeKg: number;
  exercises: SessionExerciseRecord[];
}

export interface UserSettings {
  id: 'default';
  userName: string;
  friendName: string;
  unit: 'kg' | 'lb';
  theme: 'dark' | 'light';
  restSoundEnabled: boolean;
  weeklyGoalWorkouts: number;
}

export interface PlanExportPayload {
  format: 'duofit-plan';
  version: 1;
  exportedAt: string;
  exportedBy: string;
  plan: TrainingPlan;
}

export interface FullBackupPayload {
  format: 'duofit-backup';
  version: 1;
  exportedAt: string;
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
  activeSession: ActiveWorkoutSession | null;
}
