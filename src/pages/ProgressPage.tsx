import React, { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  RefreshCw,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  CompletedWorkoutRecord,
  LinkedFriendSummary,
  UserAccountSummary,
  UserSettings,
} from '../types';

interface ProgressPageProps {
  account: UserAccountSummary;
  linkedFriend: LinkedFriendSummary | null;
  history: CompletedWorkoutRecord[];
  settings: UserSettings;
  onLinkFriend: (codeOrUsername: string) => Promise<void>;
  onUnlinkFriend: () => Promise<void>;
  onRefreshProgress: () => Promise<void>;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  account,
  linkedFriend,
  history,
  settings,
  onLinkFriend,
  onUnlinkFriend,
  onRefreshProgress,
}) => {
  const [filterParticipant, setFilterParticipant] = useState<'all' | 'me' | 'friend'>('all');
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const myRecords = history.filter((h) => h.participant === 'me');
  const friendRecords = linkedFriend ? linkedFriend.history : [];

  const allRecords = [...myRecords, ...friendRecords].sort(
    (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
  );

  const myVolume = myRecords.reduce((s, r) => s + r.totalVolumeKg, 0);
  const friendVolumeTotal = friendRecords.reduce((s, r) => s + r.totalVolumeKg, 0);

  const mySets = myRecords.reduce((s, r) => s + r.totalCompletedSets, 0);
  const friendSetsTotal = friendRecords.reduce((s, r) => s + r.totalCompletedSets, 0);

  const filteredHistory = allRecords.filter((item) =>
    filterParticipant === 'all' ? true : item.participant === filterParticipant
  );

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) {
      setLinkError('Введите код друга (DUO-XXXX) или логин');
      return;
    }
    setLinkError(null);
    setLinking(true);
    try {
      await onLinkFriend(friendCodeInput.trim());
      setFriendCodeInput('');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Ошибка подключения друга');
    } finally {
      setLinking(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(account.friendCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshProgress();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Личная статистика и синхронизация результатов с другом
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
            Прогресс и результаты
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 transition-colors whitespace-nowrap"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Скопировано: {account.friendCode}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-500" />
                <span>Мой код: {account.friendCode}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-sky-500/50 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 text-sky-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Обновить данные</span>
          </button>
        </div>
      </div>

      {/* Friend Connection Banner or Connected Status */}
      {!linkedFriend ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <UserPlus className="w-4 h-4" />
                <span>Совместный трекер прогресса</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Подключите профиль друга для сравнения результатов
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Когда ваш друг зарегистрируется в DuoFit, введите его код (например{' '}
                <span className="font-mono-tabular font-semibold">DUO-XXXX</span>) или логин. Все его завершённые тренировки будут автоматически отображаться здесь для сравнения.
              </p>
            </div>

            <form onSubmit={handleLinkSubmit} className="flex flex-col sm:flex-row gap-2 shrink-0">
              <input
                type="text"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value)}
                placeholder="Код DUO-XXXX или логин"
                aria-label="Код или логин друга"
                className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm font-mono-tabular"
              />
              <button
                type="submit"
                disabled={linking}
                className="min-h-[42px] px-5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition-colors whitespace-nowrap"
              >
                {linking ? 'Подключение...' : 'Добавить друга'}
              </button>
            </form>
          </div>
          {linkError && (
            <p role="alert" className="text-xs font-semibold text-rose-500">
              {linkError}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-base shrink-0">
              {linkedFriend.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                Напарник подключён · @{linkedFriend.username} · Код {linkedFriend.friendCode}
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {linkedFriend.displayName} (Цель: {linkedFriend.weeklyGoalWorkouts} трен./нед.)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onUnlinkFriend}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 hover:text-rose-500 hover:border-rose-500/40 transition-colors self-start sm:self-auto"
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span>Отключить напарника</span>
          </button>
        </div>
      )}

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Ваши тренировки ({account.displayName})
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
            Тренировки друга ({linkedFriend ? linkedFriend.displayName : 'Не подключён'})
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
            Тоннаж друга ({linkedFriend ? linkedFriend.displayName : '—'})
          </div>
          <div className="text-2xl font-bold font-mono-tabular text-sky-500">
            {friendVolumeTotal.toLocaleString('ru-RU')} {settings.unit}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Синхронизировано с профилем друга
          </div>
        </div>
      </div>

      {/* Head-to-head comparison bar chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Сравнение показателей: {account.displayName} и{' '}
              {linkedFriend ? linkedFriend.displayName : 'Напарник'}
            </h2>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold font-mono-tabular">
              <span className="text-emerald-600 dark:text-emerald-400">
                {account.displayName}: {myVolume.toLocaleString('ru-RU')} {settings.unit}
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                {linkedFriend ? linkedFriend.displayName : 'Друг'}:{' '}
                {friendVolumeTotal.toLocaleString('ru-RU')} {settings.unit}
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
            <div className="flex justify-between text-xs font-semibold font-mono-tabular">
              <span className="text-emerald-600 dark:text-emerald-400">
                {account.displayName}: {mySets} подходов
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                {linkedFriend ? linkedFriend.displayName : 'Друг'}: {friendSetsTotal} подходов
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
              Все ({allRecords.length})
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
              {account.displayName} ({myRecords.length})
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
              {linkedFriend ? linkedFriend.displayName : 'Друг'} ({friendRecords.length})
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Записей о тренировках пока нет
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Проведите свою первую тренировку во вкладке «Тренировка», и её детальные результаты сразу сохранятся в этом журнале.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
