import React, { useState } from 'react';
import { Award, Calendar, CheckCircle2, Plus, TrendingUp, Users } from 'lucide-react';
import { CompletedWorkoutRecord, DAYS_OF_WEEK, DayOfWeek, UserSettings } from '../types';

interface ProgressPageProps {
  history: CompletedWorkoutRecord[];
  settings: UserSettings;
  onAddFriendWorkoutRecord: (record: CompletedWorkoutRecord) => void;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  history,
  settings,
  onAddFriendWorkoutRecord,
}) => {
  const [filterParticipant, setFilterParticipant] = useState<'all' | 'me' | 'friend'>('all');
  const [showLogFriendModal, setShowLogFriendModal] = useState(false);
  const [friendTitle, setFriendTitle] = useState('Верх тела: Грудь и Плечи');
  const [friendDay, setFriendDay] = useState<DayOfWeek>('Пн');
  const [friendSets, setFriendSets] = useState('12');
  const [friendVolume, setFriendVolume] = useState('4650');
  const [friendDuration, setFriendDuration] = useState('50');

  const myRecords = history.filter((h) => h.participant === 'me');
  const friendRecords = history.filter((h) => h.participant === 'friend');

  const myVolume = myRecords.reduce((s, r) => s + r.totalVolumeKg, 0);
  const friendVolumeTotal = friendRecords.reduce((s, r) => s + r.totalVolumeKg, 0);

  const mySets = myRecords.reduce((s, r) => s + r.totalCompletedSets, 0);
  const friendSetsTotal = friendRecords.reduce((s, r) => s + r.totalCompletedSets, 0);

  const filteredHistory = history.filter((item) =>
    filterParticipant === 'all' ? true : item.participant === filterParticipant
  );

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: CompletedWorkoutRecord = {
      id: `hist-friend-${Date.now()}`,
      planId: 'friend-log',
      planName: 'Совместный сплит',
      dayOfWeek: friendDay,
      workoutTitle: friendTitle.trim() || 'Тренировка друга',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMinutes: Math.max(5, Number(friendDuration) || 45),
      participant: 'friend',
      participantName: settings.friendName,
      totalCompletedSets: Math.max(1, Number(friendSets) || 10),
      totalCompletedReps: (Number(friendSets) || 10) * 10,
      totalVolumeKg: Math.max(0, Number(friendVolume) || 3500),
      exercises: [],
    };
    onAddFriendWorkoutRecord(record);
    setShowLogFriendModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            История занятий и сравнение двух участников
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
            Прогресс и результаты
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowLogFriendModal(true)}
          className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-sky-500/50 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-sky-500" />
          <span>Внести результат друга ({settings.friendName})</span>
        </button>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Ваши тренировки ({settings.userName})
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white">
            {myRecords.length}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono-tabular">
            {mySets} выполненных подходов
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Ваш общий тоннаж
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-emerald-500">
            {myVolume.toLocaleString('ru-RU')} {settings.unit}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Фактический поднятый вес
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Тренировки друга ({settings.friendName})
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white">
            {friendRecords.length}
          </div>
          <div className="text-xs text-sky-600 dark:text-sky-400 font-mono-tabular">
            {friendSetsTotal} выполненных подходов
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Тоннаж друга ({settings.friendName})
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-sky-500">
            {friendVolumeTotal.toLocaleString('ru-RU')} {settings.unit}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Сравнение по обмену результатами
          </div>
        </div>
      </div>

      {/* Head-to-head comparison bar chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Сравнение показателей: {settings.userName} и {settings.friendName}
            </h2>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">
                {settings.userName}: {myVolume.toLocaleString('ru-RU')} {settings.unit}
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                {settings.friendName}: {friendVolumeTotal.toLocaleString('ru-RU')} {settings.unit}
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${
                    myVolume + friendVolumeTotal > 0
                      ? Math.round((myVolume / (myVolume + friendVolumeTotal)) * 100)
                      : 50
                  }%`,
                }}
              />
              <div className="bg-sky-500 h-full flex-1" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Соотношение суммарного рабочего тоннажа за всё время
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">
                {settings.userName}: {mySets} подходов
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                {settings.friendName}: {friendSetsTotal} подходов
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${
                    mySets + friendSetsTotal > 0
                      ? Math.round((mySets / (mySets + friendSetsTotal)) * 100)
                      : 50
                  }%`,
                }}
              />
              <div className="bg-sky-500 h-full flex-1" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Соотношение выполненных рабочих подходов
            </p>
          </div>
        </div>
      </div>

      {/* History List with Interactive Segmented Filter */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Журнал завершённых тренировок
            </h2>
          </div>

          {/* Interactive filter controls */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setFilterParticipant('all')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterParticipant === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Все ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterParticipant('me')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterParticipant === 'me'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {settings.userName} ({myRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterParticipant('friend')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                filterParticipant === 'friend'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {settings.friendName} ({friendRecords.length})
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredHistory.map((rec) => {
            const formattedDate = new Date(rec.finishedAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
            });
            return (
              <div key={rec.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        rec.participant === 'me'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-sky-500/10 text-sky-500'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {rec.workoutTitle}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {rec.participantName} · {rec.dayOfWeek} · {formattedDate} ·{' '}
                        {rec.durationMinutes} мин
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono-tabular shrink-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {rec.totalVolumeKg.toLocaleString('ru-RU')} {settings.unit}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {rec.totalCompletedSets} подх. · {rec.totalCompletedReps} повт.
                    </div>
                  </div>
                </div>

                {rec.exercises.length > 0 && (
                  <div className="pl-13 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    {rec.exercises
                      .filter((ex) => !ex.skipped)
                      .map((ex) => {
                        const completedSets = ex.sets.filter((s) => s.completed);
                        if (completedSets.length === 0) return null;
                        return (
                          <div key={ex.id} className="font-mono-tabular">
                            {ex.name}:{' '}
                            {completedSets
                              .map((s) =>
                                ex.isBodyweight
                                  ? `${s.actualReps}`
                                  : `${s.actualWeightKg ?? 0}${settings.unit}×${s.actualReps}`
                              )
                              .join(', ')}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Log Friend's Result */}
      {showLogFriendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="friend-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-sky-500" />
              <h3 id="friend-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Добавить тренировку друга ({settings.friendName})
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              В первой версии (без облачного сервера) вы можете внести результат, которым поделился друг, чтобы поддерживать актуальное сравнение.
            </p>
            <form onSubmit={handleAddFriendSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="friend-workout-title"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Название тренировки
                </label>
                <input
                  id="friend-workout-title"
                  type="text"
                  value={friendTitle}
                  onChange={(e) => setFriendTitle(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="friend-day-select"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    День недели
                  </label>
                  <select
                    id="friend-day-select"
                    value={friendDay}
                    onChange={(e) => setFriendDay(e.target.value as DayOfWeek)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="friend-duration-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Длительность (мин)
                  </label>
                  <input
                    id="friend-duration-input"
                    type="number"
                    value={friendDuration}
                    onChange={(e) => setFriendDuration(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="friend-sets-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Выполнено подходов
                  </label>
                  <input
                    id="friend-sets-input"
                    type="number"
                    value={friendSets}
                    onChange={(e) => setFriendSets(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-mono-tabular"
                  />
                </div>
                <div>
                  <label
                    htmlFor="friend-vol-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Тоннаж ({settings.unit})
                  </label>
                  <input
                    id="friend-vol-input"
                    type="number"
                    value={friendVolume}
                    onChange={(e) => setFriendVolume(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-mono-tabular"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogFriendModal(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400"
                >
                  Добавить запись
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
