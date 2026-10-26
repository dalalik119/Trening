import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Timer,
  Trophy,
} from 'lucide-react';
import {
  ActiveWorkoutSession,
  SessionSetResult,
  TrainingPlan,
  UserSettings,
  WorkoutDayPlan,
} from '../types';
import { calculateSessionMetrics, validateSetInput } from '../utils/workoutLogic';

interface WorkoutPageProps {
  session: ActiveWorkoutSession | null;
  plans: TrainingPlan[];
  settings: UserSettings;
  onUpdateSession: (next: ActiveWorkoutSession) => void;
  onFinishSession: () => void;
  onDiscardSession: () => void;
  onStartWorkout: (plan: TrainingPlan, day: WorkoutDayPlan) => void;
  onNavigateToPlans: () => void;
}

export const WorkoutPage: React.FC<WorkoutPageProps> = ({
  session,
  plans,
  settings,
  onUpdateSession,
  onFinishSession,
  onDiscardSession,
  onStartWorkout,
  onNavigateToPlans,
}) => {
  const [remainingRestSec, setRemainingRestSec] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Sync rest countdown timer
  useEffect(() => {
    if (!session) return;

    if (session.restTimerPausedRemainingSec !== null) {
      setRemainingRestSec(session.restTimerPausedRemainingSec);
      return;
    }

    if (!session.restTimerEndAt) {
      setRemainingRestSec(0);
      return;
    }

    const updateRemaining = () => {
      const diff = Math.max(0, Math.ceil((session.restTimerEndAt! - Date.now()) / 1000));
      setRemainingRestSec(diff);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 300);
    return () => clearInterval(interval);
  }, [session?.restTimerEndAt, session?.restTimerPausedRemainingSec]);

  if (!session) {
    const activePlan = plans.find((p) => p.isActive) ?? plans[0] ?? null;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Режим активной тренировки
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Выберите тренировочный день из вашего плана ниже, чтобы запустить новую сессию с сохранением фактических весов, повторений и таймером отдыха.
          </p>
          {(!activePlan || activePlan.days.length === 0) && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToPlans}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Перейти к созданию плана тренировок</span>
              </button>
            </div>
          )}
        </div>

        {activePlan && activePlan.days.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activePlan.days.map((day) => (
              <div
                key={day.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {day.dayOfWeek} · ~{day.estimatedMinutes} мин
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {day.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {day.exercises.length} упражнений
                  </p>
                </div>
                <button
                  type="button"
                  disabled={day.exercises.length === 0}
                  onClick={() => onStartWorkout(activePlan, day)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {day.exercises.length > 0
                      ? `Начать (${day.dayOfWeek})`
                      : 'Добавьте упражнения'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const currentExIndex = Math.min(
    Math.max(0, session.currentExerciseIndex),
    session.exercises.length - 1
  );
  const currentExercise = session.exercises[currentExIndex];
  const metrics = calculateSessionMetrics(session.exercises);

  const handleSetFieldChange = (
    setIndex: number,
    field: 'actualReps' | 'actualWeightKg',
    rawValue: string
  ) => {
    setValidationError(null);
    const numValue = rawValue.trim() === '' ? 0 : Number(rawValue);

    const updatedExercises = session.exercises.map((ex, idx) => {
      if (idx !== currentExIndex) return ex;
      const updatedSets = ex.sets.map((s, sIdx) => {
        if (sIdx !== setIndex) return s;
        return {
          ...s,
          [field]:
            field === 'actualWeightKg' && rawValue.trim() === ''
              ? null
              : Math.max(0, numValue),
        };
      });
      return { ...ex, sets: updatedSets };
    });

    onUpdateSession({
      ...session,
      exercises: updatedExercises,
    });
  };

  const handleAdjustSetField = (
    setIndex: number,
    field: 'actualReps' | 'actualWeightKg',
    delta: number
  ) => {
    const targetSet = currentExercise.sets[setIndex];
    const currentVal =
      field === 'actualWeightKg'
        ? Number(targetSet.actualWeightKg ?? 0)
        : Number(targetSet.actualReps ?? 0);
    const nextVal = Math.max(0, Math.round((currentVal + delta) * 10) / 10);
    handleSetFieldChange(setIndex, field, String(nextVal));
  };

  const handleAddDynamicSet = () => {
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    const newSetNumber = currentExercise.sets.length + 1;
    const newSet: SessionSetResult = {
      id: `set-dyn-${Date.now()}`,
      setNumber: newSetNumber,
      plannedReps: lastSet?.plannedReps ?? 10,
      plannedWeightKg: lastSet?.plannedWeightKg ?? null,
      actualReps: lastSet?.actualReps ?? 10,
      actualWeightKg: lastSet?.actualWeightKg ?? null,
      completed: false,
    };

    const updatedExercises = session.exercises.map((ex, idx) =>
      idx === currentExIndex ? { ...ex, sets: [...ex.sets, newSet] } : ex
    );
    onUpdateSession({ ...session, exercises: updatedExercises });
  };

  const handleToggleSetCompleted = (setIndex: number) => {
    const targetSet = currentExercise.sets[setIndex];
    const check = validateSetInput(
      targetSet.actualReps,
      targetSet.actualWeightKg,
      currentExercise.isBodyweight
    );
    if (!check.valid) {
      setValidationError(check.error ?? 'Проверьте введённые значения');
      return;
    }

    setValidationError(null);
    const nextCompleted = !targetSet.completed;

    const updatedExercises = session.exercises.map((ex, idx) => {
      if (idx !== currentExIndex) return ex;
      return {
        ...ex,
        skipped: false,
        sets: ex.sets.map((s, sIdx) =>
          sIdx === setIndex
            ? {
                ...s,
                completed: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : undefined,
              }
            : s
        ),
      };
    });

    const restSec = currentExercise.restSeconds || 90;
    onUpdateSession({
      ...session,
      exercises: updatedExercises,
      restTimerDurationSec: restSec,
      restTimerEndAt: nextCompleted ? Date.now() + restSec * 1000 : session.restTimerEndAt,
      restTimerPausedRemainingSec: null,
    });
  };

  const handleStartRestTimer = (durationSec: number) => {
    onUpdateSession({
      ...session,
      restTimerDurationSec: durationSec,
      restTimerEndAt: Date.now() + durationSec * 1000,
      restTimerPausedRemainingSec: null,
    });
  };

  const handlePauseResumeTimer = () => {
    if (session.restTimerPausedRemainingSec !== null) {
      onUpdateSession({
        ...session,
        restTimerEndAt: Date.now() + session.restTimerPausedRemainingSec * 1000,
        restTimerPausedRemainingSec: null,
      });
    } else if (remainingRestSec > 0) {
      onUpdateSession({
        ...session,
        restTimerEndAt: null,
        restTimerPausedRemainingSec: remainingRestSec,
      });
    }
  };

  const handleResetTimer = () => {
    onUpdateSession({
      ...session,
      restTimerEndAt: null,
      restTimerPausedRemainingSec: null,
    });
    setRemainingRestSec(0);
  };

  const handleSkipExercise = () => {
    const updatedExercises = session.exercises.map((ex, idx) =>
      idx === currentExIndex ? { ...ex, skipped: !ex.skipped } : ex
    );
    const nextIndex =
      currentExIndex + 1 < session.exercises.length ? currentExIndex + 1 : currentExIndex;
    onUpdateSession({
      ...session,
      exercises: updatedExercises,
      currentExerciseIndex: nextIndex,
    });
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Session Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Активная сессия · {session.planName} · День {session.dayOfWeek}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {session.workoutTitle}
          </h1>
        </div>
        <div className="flex items-center gap-4 font-mono-tabular">
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Подходы</div>
            <div className="text-base font-bold text-emerald-500">
              {metrics.totalCompletedSets} / {metrics.totalPlannedSets}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Тоннаж</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {metrics.totalVolumeKg.toLocaleString('ru-RU')} {settings.unit}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFinishModal(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors whitespace-nowrap"
          >
            Завершить тренировку
          </button>
        </div>
      </div>

      {/* Exercise Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {session.exercises.map((ex, idx) => {
          const doneCount = ex.sets.filter((s) => s.completed).length;
          const isCurrent = idx === currentExIndex;
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() =>
                onUpdateSession({
                  ...session,
                  currentExerciseIndex: idx,
                })
              }
              className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                  : ex.skipped
                  ? 'border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                  : doneCount === ex.sets.length
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              {idx + 1}. {ex.name} ({doneCount}/{ex.sets.length})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Active Exercise Sets Table */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Упражнение {currentExIndex + 1} из {session.exercises.length} ·{' '}
                {currentExercise.muscleGroup} · Отдых по плану {currentExercise.restSeconds}с
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {currentExercise.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleSkipExercise}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-amber-500/50 whitespace-nowrap self-start sm:self-auto"
            >
              <SkipForward className="w-4 h-4" />
              <span>
                {currentExercise.skipped ? 'Вернуть упражнение' : 'Пропустить упражнение'}
              </span>
            </button>
          </div>

          {validationError && (
            <div
              role="alert"
              className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs font-semibold text-rose-500"
            >
              {validationError}
            </div>
          )}

          {/* Sets Header & Rows */}
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 px-3 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <div className="col-span-2">Подход</div>
              <div className="col-span-2">План</div>
              <div className="col-span-3">Вес ({settings.unit})</div>
              <div className="col-span-3">Повторы</div>
              <div className="col-span-2 text-right">Готово</div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentExercise.sets.map((setItem, sIdx) => (
                <div
                  key={setItem.id}
                  className={`grid grid-cols-12 gap-2 items-center py-3 px-2.5 rounded-xl transition-colors ${
                    setItem.completed
                      ? 'bg-emerald-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="col-span-2 font-mono-tabular font-bold text-sm text-slate-900 dark:text-white pl-1">
                    #{setItem.setNumber}
                  </div>

                  <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                    {setItem.plannedReps} ×{' '}
                    {currentExercise.isBodyweight
                      ? setItem.plannedWeightKg
                        ? `+${setItem.plannedWeightKg}`
                        : 'Свой'
                      : `${setItem.plannedWeightKg ?? 0}`}
                  </div>

                  <div className="col-span-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustSetField(sIdx, 'actualWeightKg', -2.5)}
                      aria-label={`Уменьшить вес подхода ${setItem.setNumber}`}
                      className="hidden sm:flex min-h-[40px] min-w-[32px] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      aria-label={`Фактический вес подхода ${setItem.setNumber}`}
                      value={setItem.actualWeightKg ?? ''}
                      placeholder={currentExercise.isBodyweight ? 'Свой' : '0'}
                      onChange={(e) =>
                        handleSetFieldChange(sIdx, 'actualWeightKg', e.target.value)
                      }
                      className="w-full min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-center text-sm font-mono-tabular font-semibold text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustSetField(sIdx, 'actualWeightKg', 2.5)}
                      aria-label={`Увеличить вес подхода ${setItem.setNumber}`}
                      className="hidden sm:flex min-h-[40px] min-w-[32px] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="col-span-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustSetField(sIdx, 'actualReps', -1)}
                      aria-label={`Уменьшить повторения подхода ${setItem.setNumber}`}
                      className="hidden sm:flex min-h-[40px] min-w-[32px] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      aria-label={`Фактические повторения подхода ${setItem.setNumber}`}
                      value={setItem.actualReps}
                      onChange={(e) => handleSetFieldChange(sIdx, 'actualReps', e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-center text-sm font-mono-tabular font-semibold text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustSetField(sIdx, 'actualReps', 1)}
                      aria-label={`Увеличить повторения подхода ${setItem.setNumber}`}
                      className="hidden sm:flex min-h-[40px] min-w-[32px] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleSetCompleted(sIdx)}
                      aria-label={
                        setItem.completed
                          ? `Снять отметку подхода ${setItem.setNumber}`
                          : `Отметить подход ${setItem.setNumber} выполненным`
                      }
                      className={`min-h-[44px] min-w-[44px] px-3 rounded-xl font-semibold text-xs inline-flex items-center justify-center gap-1 transition-colors ${
                        setItem.completed
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-emerald-500 hover:text-slate-950'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddDynamicSet}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Добавить ещё подход</span>
              </button>
            </div>
          </div>

          {/* Prev / Next Exercise Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={currentExIndex === 0}
              onClick={() =>
                onUpdateSession({
                  ...session,
                  currentExerciseIndex: Math.max(0, currentExIndex - 1),
                })
              }
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Предыдущее</span>
            </button>

            <button
              type="button"
              disabled={currentExIndex >= session.exercises.length - 1}
              onClick={() =>
                onUpdateSession({
                  ...session,
                  currentExerciseIndex: Math.min(
                    session.exercises.length - 1,
                    currentExIndex + 1
                  ),
                })
              }
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold disabled:opacity-40"
            >
              <span>Следующее упражнение</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Rest Timer Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Восстановление между подходами
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Таймер отдыха
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
          </div>

          <div className="py-6 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 text-center space-y-2">
            <div className="text-4xl font-bold font-mono-tabular text-slate-900 dark:text-white">
              {formatSeconds(remainingRestSec)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {session.restTimerPausedRemainingSec !== null
                ? 'На паузе'
                : remainingRestSec > 0
                ? 'Идёт отдых'
                : 'Таймер готов к запуску'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[60, 90, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleStartRestTimer(sec)}
                className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold font-mono-tabular hover:border-emerald-500 transition-colors"
              >
                {sec} сек
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePauseResumeTimer}
              disabled={remainingRestSec === 0 && session.restTimerPausedRemainingSec === null}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40"
            >
              {session.restTimerPausedRemainingSec !== null ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Продолжить</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Пауза</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleResetTimer}
              aria-label="Сбросить таймер отдыха"
              className="min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Сброс</span>
            </button>
          </div>
        </div>
      </div>

      {/* Finish Workout Confirmation Modal */}
      {showFinishModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="finish-workout-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3
                  id="finish-workout-title"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  Завершить тренировку?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Фактические результаты будут сохранены в вашем профиле и видны напарнику
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 font-mono-tabular text-center">
              <div>
                <div className="text-xs text-slate-500">Подходы</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {metrics.totalCompletedSets}/{metrics.totalPlannedSets}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Повторы</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {metrics.totalCompletedReps}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Тоннаж</div>
                <div className="text-base font-bold text-emerald-500">
                  {metrics.totalVolumeKg} {settings.unit}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowFinishModal(false);
                  onDiscardSession();
                }}
                className="min-h-[44px] px-4 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
              >
                Отменить без сохранения
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 sm:flex-initial min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  Вернуться
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFinishModal(false);
                    onFinishSession();
                  }}
                  className="flex-1 sm:flex-initial min-h-[44px] px-5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400"
                >
                  Сохранить в историю
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
