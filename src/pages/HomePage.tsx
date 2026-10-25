import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Dumbbell,
  Play,
  Share2,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
   DAYS_OF_WEEK,
  DayOfWeek,
  TrainingPlan,
  UserSettings,
  WorkoutDayPlan,
} from '../types';
import { NavTab } from '../components/BottomNavigation';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface HomePageProps {
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
  activeSession: ActiveWorkoutSession | null;
  onStartWorkout: (plan: TrainingPlan, day: WorkoutDayPlan) => void;
  onResumeWorkout: () => void;
  onNavigate: (tab: NavTab) => void;
  onShareActivePlan: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  plans,
  history,
  activeSession,
  onStartWorkout,
  onResumeWorkout,
  onNavigate,
  onShareActivePlan,
}) => {
  const activePlan = plans.find((p) => p.isActive) ?? plans[0] ?? null;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    return activePlan?.days[0]?.dayOfWeek ?? 'Пн';
  });

  const currentWorkoutDay =
    activePlan?.days.find((d) => d.dayOfWeek === selectedDay) ??
    activePlan?.days[0] ??
    null;

  const myHistory = history.filter((h) => h.participant === 'me');
  const friendHistory = history.filter((h) => h.participant === 'friend');

  const myTotalVolume = myHistory.reduce((acc, r) => acc + r.totalVolumeKg, 0);
  const friendTotalVolume = friendHistory.reduce((acc, r) => acc + r.totalVolumeKg, 0);

  const myTotalSets = myHistory.reduce((acc, r) => acc + r.totalCompletedSets, 0);
  const friendTotalSets = friendHistory.reduce((acc, r) => acc + r.totalCompletedSets, 0);

  const completedDaysSet = new Set(myHistory.slice(0, 7).map((h) => h.dayOfWeek));

  return (
    <div className="space-y-8">
      {/* Unfinished workout banner if exists */}
      {activeSession && (
        <section
          aria-label="Незавершённая тренировка"
          className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Сессия сохранена на устройстве · {activeSession.dayOfWeek} · {activeSession.planName}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Незавершённая тренировка: {activeSession.workoutTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onResumeWorkout}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors shrink-0 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Продолжить с того же места</span>
          </button>
        </section>
      )}

      {/* Main 2-column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Greeting, Day Selector & Today's Workout Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Совместный режим · {settings.userName} и {settings.friendName}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                Привет, {settings.userName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <PWAInstallButton variant="compact" />
              <button
                type="button"
                onClick={onShareActivePlan}
                className="inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 transition-colors whitespace-nowrap shrink-0"
              >
                <Share2 className="w-4 h-4 text-emerald-500" />
                <span>Поделиться планом</span>
              </button>
            </div>
          </div>

          {/* Horizontal Day Scroller */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Расписание недели
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                Цель: {myHistory.length} / {settings.weeklyGoalWorkouts} трен.
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const hasPlanDay = activePlan?.days.some((d) => d.dayOfWeek === day);
                const isDone = completedDaysSet.has(day);
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    aria-label={`День недели ${day}`}
                    className={`min-h-[52px] rounded-xl flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : hasPlanDay
                        ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-medium hover:bg-slate-200 dark:hover:bg-slate-800'
                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-xs">{day}</span>
                    <span className="text-[10px] mt-1 font-mono-tabular">
                      {isDone ? 'Вып.' : hasPlanDay ? 'План' : 'Отдых'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Workout Card */}
          {activePlan && currentWorkoutDay ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activePlan.name} · {currentWorkoutDay.dayOfWeek} · ~{currentWorkoutDay.estimatedMinutes} мин
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {currentWorkoutDay.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Фокус: {currentWorkoutDay.focus} · {currentWorkoutDay.exercises.length} упражнений
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800">
                {currentWorkoutDay.exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="py-3 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {idx + 1}. {ex.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ex.muscleGroup} · Отдых {ex.restSeconds} сек
                      </div>
                    </div>
                    <div className="text-right font-mono-tabular shrink-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {ex.sets} × {ex.reps}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ex.isBodyweight
                          ? ex.targetWeightKg
                            ? `+${ex.targetWeightKg} ${settings.unit}`
                            : 'Свой вес'
                          : `${ex.targetWeightKg ?? 0} ${settings.unit}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onStartWorkout(activePlan, currentWorkoutDay)}
                  className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Начать тренировку ({currentWorkoutDay.dayOfWeek})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('plans')}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Изменить план</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                Нет активного плана тренировок
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Создайте свой первый недельный сплит или импортируйте JSON-план от друга.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('plans')}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm"
              >
                <span>Перейти к планам</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Duo Comparison & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Duo Comparison Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Совместная мотивация · Неделя
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {settings.userName} vs {settings.friendName}
                </h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 space-y-1">
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {settings.userName} (Вы)
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular">
                  {myTotalVolume.toLocaleString('ru-RU')} {settings.unit}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                  {myHistory.length} трен. · {myTotalSets} подходов
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 space-y-1">
                <div className="text-xs font-medium text-sky-600 dark:text-sky-400">
                  {settings.friendName} (Друг)
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono-tabular">
                  {friendTotalVolume.toLocaleString('ru-RU')} {settings.unit}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                  {friendHistory.length} трен. · {friendTotalSets} подходов
                </div>
              </div>
            </div>

            {/* Volume comparison progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                <span>Доля тоннажа: {settings.userName}</span>
                <span>{settings.friendName}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${
                      myTotalVolume + friendTotalVolume > 0
                        ? Math.round((myTotalVolume / (myTotalVolume + friendTotalVolume)) * 100)
                        : 50
                    }%`,
                  }}
                />
                <div className="bg-sky-500 h-full flex-1" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Подробная статистика и сравнение</span>
            </button>
          </div>

          {/* Recent Workouts Feed */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Последние тренировки
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('progress')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Все записи
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.slice(0, 4).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.participant === 'me'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-sky-500/10 text-sky-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.workoutTitle}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.participantName} · {item.dayOfWeek} · {item.durationMinutes} мин
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular shrink-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.totalVolumeKg.toLocaleString('ru-RU')} {settings.unit}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.totalCompletedSets} подх.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
