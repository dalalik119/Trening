import {
  ActiveWorkoutSession,
  CatalogExercise,
  CompletedWorkoutRecord,
  DayOfWeek,
  FullBackupPayload,
  MuscleGroup,
  PlanExportPayload,
  PlannedExercise,
  SessionExerciseRecord,
  TrainingPlan,
  UserSettings,
  WorkoutDayPlan,
} from '../types';

export const EXERCISE_CATALOG: CatalogExercise[] = [
  {
    id: 'cat-bench-press',
    name: 'Жим штанги лёжа',
    muscleGroup: 'Грудь',
    isBodyweight: false,
    defaultSets: 4,
    defaultReps: 8,
    defaultWeightKg: 70,
    defaultRestSec: 120,
  },
  {
    id: 'cat-incline-db',
    name: 'Жим гантелей на наклонной',
    muscleGroup: 'Грудь',
    isBodyweight: false,
    defaultSets: 3,
    defaultReps: 10,
    defaultWeightKg: 24,
    defaultRestSec: 90,
  },
  {
    id: 'cat-pushups',
    name: 'Отжимания на брусьях',
    muscleGroup: 'Грудь',
    isBodyweight: true,
    defaultSets: 3,
    defaultReps: 12,
    defaultWeightKg: null,
    defaultRestSec: 90,
  },
  {
    id: 'cat-pullups',
    name: 'Подтягивания широким хватом',
    muscleGroup: 'Спина',
    isBodyweight: true,
    defaultSets: 4,
    defaultReps: 10,
    defaultWeightKg: null,
    defaultRestSec: 120,
  },
  {
    id: 'cat-barbell-row',
    name: 'Тяга штанги в наклоне',
    muscleGroup: 'Спина',
    isBodyweight: false,
    defaultSets: 4,
    defaultReps: 10,
    defaultWeightKg: 65,
    defaultRestSec: 90,
  },
  {
    id: 'cat-squat',
    name: 'Приседания со штангой',
    muscleGroup: 'Ноги',
    isBodyweight: false,
    defaultSets: 4,
    defaultReps: 8,
    defaultWeightKg: 90,
    defaultRestSec: 150,
  },
  {
    id: 'cat-rdl',
    name: 'Румынская тяга',
    muscleGroup: 'Ноги',
    isBodyweight: false,
    defaultSets: 3,
    defaultReps: 10,
    defaultWeightKg: 80,
    defaultRestSec: 120,
  },
  {
    id: 'cat-lunges',
    name: 'Болгарские выпады с гантелями',
    muscleGroup: 'Ноги',
    isBodyweight: false,
    defaultSets: 3,
    defaultReps: 12,
    defaultWeightKg: 18,
    defaultRestSec: 90,
  },
  {
    id: 'cat-ohp',
    name: 'Армейский жим стоя',
    muscleGroup: 'Плечи',
    isBodyweight: false,
    defaultSets: 4,
    defaultReps: 8,
    defaultWeightKg: 45,
    defaultRestSec: 120,
  },
  {
    id: 'cat-lat-raise',
    name: 'Махи гантелями в стороны',
    muscleGroup: 'Плечи',
    isBodyweight: false,
    defaultSets: 3,
    defaultReps: 15,
    defaultWeightKg: 10,
    defaultRestSec: 60,
  },
  {
    id: 'cat-bicep-curl',
    name: 'Подъём штанги на бицепс',
    muscleGroup: 'Руки',
    isBodyweight: false,
    defaultSets: 3,
    defaultReps: 12,
    defaultWeightKg: 32.5,
    defaultRestSec: 75,
  },
  {
    id: 'cat-plank',
    name: 'Планка с контролем кора',
    muscleGroup: 'Пресс',
    isBodyweight: true,
    defaultSets: 3,
    defaultReps: 60,
    defaultWeightKg: null,
    defaultRestSec: 60,
  },
];

export interface ExerciseValidationResult {
  valid: boolean;
  error?: string;
}

export function validateExerciseInput(input: {
  name: string;
  sets: number;
  reps: number;
  targetWeightKg: number | null;
  restSeconds: number;
  isBodyweight: boolean;
}): ExerciseValidationResult {
  const trimmed = input.name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Введите название упражнения' };
  }
  if (!Number.isFinite(input.sets) || input.sets < 1 || input.sets > 20) {
    return { valid: false, error: 'Количество подходов должно быть от 1 до 20' };
  }
  if (!Number.isFinite(input.reps) || input.reps < 1 || input.reps > 500) {
    return { valid: false, error: 'Количество повторений должно быть от 1 до 500' };
  }
  if (!input.isBodyweight && input.targetWeightKg !== null) {
    if (!Number.isFinite(input.targetWeightKg) || input.targetWeightKg < 0 || input.targetWeightKg > 1000) {
      return { valid: false, error: 'Рабочий вес должен быть от 0 до 1000 кг' };
    }
  }
  if (input.isBodyweight && input.targetWeightKg !== null && input.targetWeightKg < 0) {
    return { valid: false, error: 'Дополнительный вес не может быть отрицательным' };
  }
  if (!Number.isFinite(input.restSeconds) || input.restSeconds < 10 || input.restSeconds > 600) {
    return { valid: false, error: 'Время отдыха должно быть от 10 до 600 секунд' };
  }
  return { valid: true };
}

export function validateSetInput(
  actualReps: number,
  actualWeightKg: number | null,
  isBodyweight: boolean
): ExerciseValidationResult {
  if (!Number.isFinite(actualReps) || actualReps < 0 || actualReps > 500) {
    return { valid: false, error: 'Повторения должны быть числом от 0 до 500' };
  }
  if (!isBodyweight && actualWeightKg !== null) {
    if (!Number.isFinite(actualWeightKg) || actualWeightKg < 0 || actualWeightKg > 1000) {
      return { valid: false, error: 'Вес должен быть от 0 до 1000 кг' };
    }
  }
  if (isBodyweight && actualWeightKg !== null && actualWeightKg < 0) {
    return { valid: false, error: 'Вес не может быть отрицательным' };
  }
  return { valid: true };
}

export function createActiveSessionFromDay(
  plan: TrainingPlan,
  day: WorkoutDayPlan,
  nowIso: string = new Date().toISOString()
): ActiveWorkoutSession {
  const exercises: SessionExerciseRecord[] = day.exercises.map((ex, idx) => ({
    id: `sess-ex-${idx}-${ex.id}`,
    plannedExerciseId: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    isBodyweight: ex.isBodyweight,
    restSeconds: ex.restSeconds,
    skipped: false,
    sets: Array.from({ length: ex.sets }, (_, sIdx) => ({
      id: `set-${idx}-${sIdx + 1}`,
      setNumber: sIdx + 1,
      plannedReps: ex.reps,
      plannedWeightKg: ex.targetWeightKg,
      actualReps: ex.reps,
      actualWeightKg: ex.targetWeightKg,
      completed: false,
    })),
  }));

  return {
    id: `session-${Date.now()}`,
    planId: plan.id,
    planName: plan.name,
    dayId: day.id,
    dayOfWeek: day.dayOfWeek,
    workoutTitle: day.title,
    startedAt: nowIso,
    currentExerciseIndex: 0,
    exercises,
    restTimerEndAt: null,
    restTimerDurationSec: exercises[0]?.restSeconds ?? 90,
    restTimerPausedRemainingSec: null,
  };
}

export function calculateSessionMetrics(exercises: SessionExerciseRecord[]): {
  totalCompletedSets: number;
  totalPlannedSets: number;
  totalCompletedReps: number;
  totalVolumeKg: number;
} {
  let totalCompletedSets = 0;
  let totalPlannedSets = 0;
  let totalCompletedReps = 0;
  let totalVolumeKg = 0;

  for (const ex of exercises) {
    if (ex.skipped) continue;
    for (const s of ex.sets) {
      totalPlannedSets += 1;
      if (s.completed) {
        totalCompletedSets += 1;
        const reps = Math.max(0, Number(s.actualReps) || 0);
        totalCompletedReps += reps;
        const weight = s.actualWeightKg !== null && s.actualWeightKg > 0 ? Number(s.actualWeightKg) : 0;
        totalVolumeKg += reps * weight;
      }
    }
  }

  return {
    totalCompletedSets,
    totalPlannedSets,
    totalCompletedReps,
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
  };
}

export function finalizeSessionToRecord(
  session: ActiveWorkoutSession,
  participantName: string,
  finishedAtIso: string = new Date().toISOString()
): CompletedWorkoutRecord {
  const metrics = calculateSessionMetrics(session.exercises);
  const startMs = new Date(session.startedAt).getTime();
  const endMs = new Date(finishedAtIso).getTime();
  const rawMinutes = Math.round((endMs - startMs) / 60000);
  const durationMinutes = Number.isFinite(rawMinutes) && rawMinutes > 0 ? rawMinutes : 42;

  return {
    id: `hist-${Date.now()}`,
    planId: session.planId,
    planName: session.planName,
    dayOfWeek: session.dayOfWeek,
    workoutTitle: session.workoutTitle,
    startedAt: session.startedAt,
    finishedAt: finishedAtIso,
    durationMinutes,
    participant: 'me',
    participantName,
    totalCompletedSets: metrics.totalCompletedSets,
    totalCompletedReps: metrics.totalCompletedReps,
    totalVolumeKg: metrics.totalVolumeKg,
    exercises: session.exercises,
  };
}

export function cloneDayToAnotherDay(
  plan: TrainingPlan,
  sourceDayId: string,
  targetDayOfWeek: DayOfWeek
): TrainingPlan {
  const sourceDay = plan.days.find((d) => d.id === sourceDayId);
  if (!sourceDay) return plan;

  const copiedExercises: PlannedExercise[] = sourceDay.exercises.map((ex, idx) => ({
    ...ex,
    id: `ex-${Date.now()}-${idx}`,
  }));

  const existingIndex = plan.days.findIndex((d) => d.dayOfWeek === targetDayOfWeek);
  const newDay: WorkoutDayPlan = {
    id: existingIndex >= 0 ? plan.days[existingIndex].id : `day-${Date.now()}`,
    dayOfWeek: targetDayOfWeek,
    title: `${sourceDay.title} (копия)`,
    focus: sourceDay.focus,
    estimatedMinutes: sourceDay.estimatedMinutes,
    exercises: copiedExercises,
  };

  const nextDays = [...plan.days];
  if (existingIndex >= 0) {
    nextDays[existingIndex] = newDay;
  } else {
    nextDays.push(newDay);
  }

  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    days: nextDays,
  };
}

export function serializePlanToExport(plan: TrainingPlan, exportedBy: string): string {
  const payload: PlanExportPayload = {
    format: 'duofit-plan',
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: exportedBy.trim() || 'Участник DuoFit',
    plan,
  };
  return JSON.stringify(payload, null, 2);
}

export function formatPlanAsShareText(plan: TrainingPlan): string {
  const lines: string[] = [
    `План тренировок DuoFit: ${plan.name}`,
    `Автор: ${plan.authorName}`,
    plan.description,
    '',
  ];
  for (const day of plan.days) {
    lines.push(`${day.dayOfWeek} — ${day.title} (${day.focus}, ~${day.estimatedMinutes} мин):`);
    for (const ex of day.exercises) {
      const weightText = ex.isBodyweight
        ? ex.targetWeightKg
          ? `свой вес + ${ex.targetWeightKg} кг`
          : 'свой вес'
        : `${ex.targetWeightKg ?? 0} кг`;
      lines.push(`  • ${ex.name}: ${ex.sets}×${ex.reps} (${weightText}, отдых ${ex.restSeconds}с)`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export interface ParsedPlanImportResult {
  valid: boolean;
  error?: string;
  plan?: TrainingPlan;
  isDuplicateId?: boolean;
  isDuplicateName?: boolean;
}

const VALID_DAYS: Set<string> = new Set(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);
const VALID_MUSCLES: Set<string> = new Set([
  'Грудь',
  'Спина',
  'Ноги',
  'Плечи',
  'Руки',
  'Пресс',
  'Всё тело',
]);

function sanitizeText(val: unknown, fallback: string, maxLen = 120): string {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.replace(/[<>]/g, '').trim();
  return cleaned ? cleaned.slice(0, maxLen) : fallback;
}

export function validateAndParsePlanImport(
  rawJson: string,
  existingPlans: TrainingPlan[]
): ParsedPlanImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { valid: false, error: 'Некорректный JSON-файл. Проверьте формат данных.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Файл пуст или не содержит объект плана.' };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.format !== 'duofit-plan' || obj.version !== 1) {
    return {
      valid: false,
      error: 'Неподдерживаемый формат или версия файла (ожидается duofit-plan v1).',
    };
  }

  const rawPlan = obj.plan as Record<string, unknown> | undefined;
  if (!rawPlan || typeof rawPlan !== 'object') {
    return { valid: false, error: 'В файле отсутствует структура тренировочного плана.' };
  }

  if (typeof rawPlan.name !== 'string' || !rawPlan.name.trim()) {
    return { valid: false, error: 'У импортируемого плана отсутствует название.' };
  }

  if (!Array.isArray(rawPlan.days) || rawPlan.days.length === 0) {
    return { valid: false, error: 'План должен содержать хотя бы один тренировочный день.' };
  }

  const sanitizedDays: WorkoutDayPlan[] = [];
  for (let i = 0; i < rawPlan.days.length; i++) {
    const d = rawPlan.days[i] as Record<string, unknown>;
    if (!d || typeof d !== 'object') {
      return { valid: false, error: `День #${i + 1} повреждён.` };
    }
    const dayOfWeek = typeof d.dayOfWeek === 'string' && VALID_DAYS.has(d.dayOfWeek)
      ? (d.dayOfWeek as DayOfWeek)
      : 'Пн';

    if (!Array.isArray(d.exercises)) {
      return { valid: false, error: `В дне "${dayOfWeek}" отсутствует список упражнений.` };
    }

    const sanitizedExercises: PlannedExercise[] = [];
    for (let j = 0; j < d.exercises.length; j++) {
      const ex = d.exercises[j] as Record<string, unknown>;
      if (!ex || typeof ex !== 'object' || typeof ex.name !== 'string' || !ex.name.trim()) {
        return { valid: false, error: `Упражнение #${j + 1} в дне "${dayOfWeek}" некорректно.` };
      }
      const sets = Number(ex.sets);
      const reps = Number(ex.reps);
      const restSeconds = Number(ex.restSeconds ?? 90);
      const isBodyweight = Boolean(ex.isBodyweight);
      const targetWeightKg =
        ex.targetWeightKg === null || ex.targetWeightKg === undefined
          ? null
          : Number(ex.targetWeightKg);

      const check = validateExerciseInput({
        name: ex.name,
        sets,
        reps,
        targetWeightKg,
        restSeconds,
        isBodyweight,
      });
      if (!check.valid) {
        return { valid: false, error: `Ошибка в упражнении "${ex.name}": ${check.error}` };
      }

      const muscleGroup: MuscleGroup =
        typeof ex.muscleGroup === 'string' && VALID_MUSCLES.has(ex.muscleGroup)
          ? (ex.muscleGroup as MuscleGroup)
          : 'Всё тело';

      sanitizedExercises.push({
        id: sanitizeText(ex.id, `ex-imp-${i}-${j}`, 64),
        name: sanitizeText(ex.name, 'Упражнение', 80),
        muscleGroup,
        isBodyweight,
        sets,
        reps,
        targetWeightKg,
        restSeconds,
      });
    }

    sanitizedDays.push({
      id: sanitizeText(d.id, `day-imp-${i}`, 64),
      dayOfWeek,
      title: sanitizeText(d.title, `Тренировка ${dayOfWeek}`, 80),
      focus: sanitizeText(d.focus, 'Силовая', 60),
      estimatedMinutes: Math.min(240, Math.max(10, Number(d.estimatedMinutes) || 45)),
      exercises: sanitizedExercises,
    });
  }

  const planId = sanitizeText(rawPlan.id, `plan-${Date.now()}`, 64);
  const planName = sanitizeText(rawPlan.name, 'Импортированный план', 80);

  const isDuplicateId = existingPlans.some((p) => p.id === planId);
  const isDuplicateName = existingPlans.some(
    (p) => p.name.toLowerCase() === planName.toLowerCase()
  );

  const cleanPlan: TrainingPlan = {
    id: planId,
    name: planName,
    description: sanitizeText(rawPlan.description, 'План получен от друга через DuoFit', 200),
    authorName: sanitizeText(rawPlan.authorName ?? obj.exportedBy, 'Друг', 60),
    createdAt: typeof rawPlan.createdAt === 'string' ? rawPlan.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: false,
    days: sanitizedDays,
  };

  return {
    valid: true,
    plan: cleanPlan,
    isDuplicateId,
    isDuplicateName,
  };
}

export function validateFullBackup(rawJson: string): {
  valid: boolean;
  error?: string;
  payload?: FullBackupPayload;
} {
  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    if (!parsed || parsed.format !== 'duofit-backup' || parsed.version !== 1) {
      return { valid: false, error: 'Неверный формат резервной копии (ожидается duofit-backup v1).' };
    }
    if (!Array.isArray(parsed.plans) || !Array.isArray(parsed.history) || !parsed.settings) {
      return { valid: false, error: 'Резервная копия повреждена: отсутствуют разделы планов или истории.' };
    }
    return { valid: true, payload: parsed as unknown as FullBackupPayload };
  } catch {
    return { valid: false, error: 'Файл резервной копии не является валидным JSON.' };
  }
}

export function createInitialSeedData(): {
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
} {
  const settings: UserSettings = {
    id: 'default',
    userName: 'Алексей',
    friendName: 'Максим',
    unit: 'kg',
    theme: 'dark',
    restSoundEnabled: true,
    weeklyGoalWorkouts: 3,
  };

  const mainPlan: TrainingPlan = {
    id: 'plan-duofit-split-1',
    name: 'Сплит: Сила и База 3× в неделю',
    description: 'Совместная программа для двух друзей: упор на базовые многосуставные движения и прогрессию рабочих весов.',
    authorName: 'Алексей и Максим',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-24T18:00:00.000Z',
    isActive: true,
    days: [
      {
        id: 'day-mon-push',
        dayOfWeek: 'Пн',
        title: 'Верх тела: Грудь и Плечи',
        focus: 'Жимовая база и дельты',
        estimatedMinutes: 50,
        exercises: [
          {
            id: 'ex-mon-1',
            catalogId: 'cat-bench-press',
            name: 'Жим штанги лёжа',
            muscleGroup: 'Грудь',
            isBodyweight: false,
            sets: 4,
            reps: 8,
            targetWeightKg: 75,
            restSeconds: 120,
          },
          {
            id: 'ex-mon-2',
            catalogId: 'cat-incline-db',
            name: 'Жим гантелей на наклонной',
            muscleGroup: 'Грудь',
            isBodyweight: false,
            sets: 3,
            reps: 10,
            targetWeightKg: 26,
            restSeconds: 90,
          },
          {
            id: 'ex-mon-3',
            catalogId: 'cat-ohp',
            name: 'Армейский жим стоя',
            muscleGroup: 'Плечи',
            isBodyweight: false,
            sets: 3,
            reps: 8,
            targetWeightKg: 45,
            restSeconds: 120,
          },
          {
            id: 'ex-mon-4',
            catalogId: 'cat-pushups',
            name: 'Отжимания на брусьях',
            muscleGroup: 'Грудь',
            isBodyweight: true,
            sets: 3,
            reps: 12,
            targetWeightKg: null,
            restSeconds: 90,
          },
        ],
      },
      {
        id: 'day-wed-pull',
        dayOfWeek: 'Ср',
        title: 'Тяга: Спина и Бицепс',
        focus: 'Ширина спины и хват',
        estimatedMinutes: 48,
        exercises: [
          {
            id: 'ex-wed-1',
            catalogId: 'cat-pullups',
            name: 'Подтягивания широким хватом',
            muscleGroup: 'Спина',
            isBodyweight: true,
            sets: 4,
            reps: 10,
            targetWeightKg: null,
            restSeconds: 120,
          },
          {
            id: 'ex-wed-2',
            catalogId: 'cat-barbell-row',
            name: 'Тяга штанги в наклоне',
            muscleGroup: 'Спина',
            isBodyweight: false,
            sets: 4,
            reps: 10,
            targetWeightKg: 67.5,
            restSeconds: 90,
          },
          {
            id: 'ex-wed-3',
            catalogId: 'cat-bicep-curl',
            name: 'Подъём штанги на бицепс',
            muscleGroup: 'Руки',
            isBodyweight: false,
            sets: 3,
            reps: 12,
            targetWeightKg: 35,
            restSeconds: 75,
          },
        ],
      },
      {
        id: 'day-fri-legs',
        dayOfWeek: 'Пт',
        title: 'Низ тела и Кор',
        focus: 'Присед, задняя поверхность и пресс',
        estimatedMinutes: 55,
        exercises: [
          {
            id: 'ex-fri-1',
            catalogId: 'cat-squat',
            name: 'Приседания со штангой',
            muscleGroup: 'Ноги',
            isBodyweight: false,
            sets: 4,
            reps: 8,
            targetWeightKg: 95,
            restSeconds: 150,
          },
          {
            id: 'ex-fri-2',
            catalogId: 'cat-rdl',
            name: 'Румынская тяга',
            muscleGroup: 'Ноги',
            isBodyweight: false,
            sets: 3,
            reps: 10,
            targetWeightKg: 82.5,
            restSeconds: 120,
          },
          {
            id: 'ex-fri-3',
            catalogId: 'cat-plank',
            name: 'Планка с контролем кора',
            muscleGroup: 'Пресс',
            isBodyweight: true,
            sets: 3,
            reps: 60,
            targetWeightKg: null,
            restSeconds: 60,
          },
        ],
      },
    ],
  };

  const secondaryPlan: TrainingPlan = {
    id: 'plan-duofit-home-2',
    name: 'Атлетика: Гантели и Турник',
    description: 'Компактный сплит на 2 дня без штанги — удобно выполнять дома или на уличной площадке.',
    authorName: 'Максим',
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-20T12:00:00.000Z',
    isActive: false,
    days: [
      {
        id: 'day-tue-full',
        dayOfWeek: 'Вт',
        title: 'Фулбоди А: Верх и Выпады',
        focus: 'Выносливость и рельеф',
        estimatedMinutes: 40,
        exercises: [
          {
            id: 'ex-tue-1',
            catalogId: 'cat-pullups',
            name: 'Подтягивания широким хватом',
            muscleGroup: 'Спина',
            isBodyweight: true,
            sets: 4,
            reps: 12,
            targetWeightKg: null,
            restSeconds: 90,
          },
          {
            id: 'ex-tue-2',
            catalogId: 'cat-lunges',
            name: 'Болгарские выпады с гантелями',
            muscleGroup: 'Ноги',
            isBodyweight: false,
            sets: 3,
            reps: 12,
            targetWeightKg: 20,
            restSeconds: 90,
          },
        ],
      },
    ],
  };

  const history: CompletedWorkoutRecord[] = [
    {
      id: 'hist-seed-1',
      planId: 'plan-duofit-split-1',
      planName: 'Сплит: Сила и База 3× в неделю',
      dayOfWeek: 'Пт',
      workoutTitle: 'Низ тела и Кор',
      startedAt: '2026-10-23T17:10:00.000Z',
      finishedAt: '2026-10-23T18:02:00.000Z',
      durationMinutes: 52,
      participant: 'me',
      participantName: 'Алексей',
      totalCompletedSets: 10,
      totalCompletedReps: 240,
      totalVolumeKg: 5435,
      exercises: [
        {
          id: 's-ex-1',
          plannedExerciseId: 'ex-fri-1',
          name: 'Приседания со штангой',
          muscleGroup: 'Ноги',
          isBodyweight: false,
          restSeconds: 150,
          skipped: false,
          sets: [
            { id: 's1', setNumber: 1, plannedReps: 8, plannedWeightKg: 95, actualReps: 8, actualWeightKg: 95, completed: true },
            { id: 's2', setNumber: 2, plannedReps: 8, plannedWeightKg: 95, actualReps: 8, actualWeightKg: 95, completed: true },
            { id: 's3', setNumber: 3, plannedReps: 8, plannedWeightKg: 95, actualReps: 8, actualWeightKg: 95, completed: true },
            { id: 's4', setNumber: 4, plannedReps: 8, plannedWeightKg: 95, actualReps: 7, actualWeightKg: 95, completed: true },
          ],
        },
        {
          id: 's-ex-2',
          plannedExerciseId: 'ex-fri-2',
          name: 'Румынская тяга',
          muscleGroup: 'Ноги',
          isBodyweight: false,
          restSeconds: 120,
          skipped: false,
          sets: [
            { id: 's5', setNumber: 1, plannedReps: 10, plannedWeightKg: 82.5, actualReps: 10, actualWeightKg: 82.5, completed: true },
            { id: 's6', setNumber: 2, plannedReps: 10, plannedWeightKg: 82.5, actualReps: 10, actualWeightKg: 82.5, completed: true },
            { id: 's7', setNumber: 3, plannedReps: 10, plannedWeightKg: 82.5, actualReps: 10, actualWeightKg: 82.5, completed: true },
          ],
        },
      ],
    },
    {
      id: 'hist-seed-2',
      planId: 'plan-duofit-split-1',
      planName: 'Сплит: Сила и База 3× в неделю',
      dayOfWeek: 'Ср',
      workoutTitle: 'Тяга: Спина и Бицепс',
      startedAt: '2026-10-21T18:00:00.000Z',
      finishedAt: '2026-10-21T18:47:00.000Z',
      durationMinutes: 47,
      participant: 'me',
      participantName: 'Алексей',
      totalCompletedSets: 11,
      totalCompletedReps: 114,
      totalVolumeKg: 3890,
      exercises: [],
    },
    {
      id: 'hist-seed-3',
      planId: 'plan-duofit-split-1',
      planName: 'Сплит: Сила и База 3× в неделю',
      dayOfWeek: 'Пн',
      workoutTitle: 'Верх тела: Грудь и Плечи',
      startedAt: '2026-10-19T17:30:00.000Z',
      finishedAt: '2026-10-19T18:20:00.000Z',
      durationMinutes: 50,
      participant: 'me',
      participantName: 'Алексей',
      totalCompletedSets: 13,
      totalCompletedReps: 120,
      totalVolumeKg: 4920,
      exercises: [],
    },
    {
      id: 'hist-friend-1',
      planId: 'plan-duofit-split-1',
      planName: 'Сплит: Сила и База 3× в неделю',
      dayOfWeek: 'Пт',
      workoutTitle: 'Низ тела и Кор',
      startedAt: '2026-10-24T11:00:00.000Z',
      finishedAt: '2026-10-24T11:54:00.000Z',
      durationMinutes: 54,
      participant: 'friend',
      participantName: 'Максим',
      totalCompletedSets: 10,
      totalCompletedReps: 232,
      totalVolumeKg: 5180,
      exercises: [],
    },
    {
      id: 'hist-friend-2',
      planId: 'plan-duofit-split-1',
      planName: 'Сплит: Сила и База 3× в неделю',
      dayOfWeek: 'Ср',
      workoutTitle: 'Тяга: Спина и Бицепс',
      startedAt: '2026-10-22T19:00:00.000Z',
      finishedAt: '2026-10-22T19:49:00.000Z',
      durationMinutes: 49,
      participant: 'friend',
      participantName: 'Максим',
      totalCompletedSets: 11,
      totalCompletedReps: 118,
      totalVolumeKg: 4120,
      exercises: [],
    },
  ];

  return {
    settings,
    plans: [mainPlan, secondaryPlan],
    history,
  };
}
