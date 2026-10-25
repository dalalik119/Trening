import React, { useState } from 'react';
import {
  Check,
  Database,
  Download,
  Moon,
  Sun,
  Upload,
  User,
} from 'lucide-react';
import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
  FullBackupPayload,
  TrainingPlan,
  UserSettings,
} from '../types';
import { validateFullBackup } from '../utils/workoutLogic';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface SettingsPageProps {
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
  activeSession: ActiveWorkoutSession | null;
  onUpdateSettings: (next: UserSettings) => void;
  onRestoreFullBackup: (backup: FullBackupPayload) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  plans,
  history,
  activeSession,
  onUpdateSettings,
  onRestoreFullBackup,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [friendName, setFriendName] = useState(settings.friendName);
  const [weeklyGoal, setWeeklyGoal] = useState(String(settings.weeklyGoalWorkouts));
  const [notice, setNotice] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<FullBackupPayload | null>(null);

  const showSavedMessage = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      userName: userName.trim() || 'Алексей',
      friendName: friendName.trim() || 'Максим',
      weeklyGoalWorkouts: Math.min(7, Math.max(1, Number(weeklyGoal) || 3)),
    };
    onUpdateSettings(updated);
    showSavedMessage('Профиль и цели сохранены в IndexedDB');
  };

  const handleExportFullBackup = () => {
    const payload: FullBackupPayload = {
      format: 'duofit-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      plans,
      history,
      activeSession,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duofit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSavedMessage('Резервная копия всех данных скачана');
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = validateFullBackup(reader.result);
        if (!res.valid || !res.payload) {
          setBackupError(res.error ?? 'Ошибка чтения резервной копии');
          setPendingBackup(null);
        } else {
          setBackupError(null);
          setPendingBackup(res.payload);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Персонализация, единицы измерения, PWA и резервное копирование IndexedDB
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
          Настройки DuoFit
        </h1>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Profile & Participants */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Участники и цели
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="settings-username"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Ваше имя
              </label>
              <input
                id="settings-username"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="settings-friendname"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Имя напарника (друга)
              </label>
              <input
                id="settings-friendname"
                type="text"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="settings-weekly-goal"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Цель тренировок в неделю (1–7)
              </label>
              <input
                id="settings-weekly-goal"
                type="number"
                min={1}
                max={7}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm font-mono-tabular"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить профиль</span>
            </button>
          </form>
        </div>

        {/* Theme, Units & PWA */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Тема и единицы измерения
            </h2>

            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Оформление интерфейса
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                  className={`min-h-[44px] rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Тёмная тема</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                  className={`min-h-[44px] rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
                    settings.theme === 'light'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Светлая тема</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Единицы рабочего веса
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, unit: 'kg' })}
                  className={`min-h-[44px] rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
                    settings.unit === 'kg'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Килограммы (кг)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, unit: 'lb' })}
                  className={`min-h-[44px] rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
                    settings.unit === 'lb'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Фунты (lb)
                </button>
              </div>
            </div>

            <div className="pt-2">
              <PWAInstallButton variant="full" />
            </div>
          </div>

          {/* IndexedDB Backup & Restore */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Резервная копия данных (IndexedDB)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Все ваши планы ({plans.length}) и записи тренировок ({history.length}) хранятся локально на устройстве без платного сервера. Создайте резервный JSON-файл перед переносом на новый телефон.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportFullBackup}
                className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:border-emerald-500/50 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Скачать резервную копию</span>
              </button>

              <label className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer text-xs font-semibold hover:border-emerald-500/50 transition-colors">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>Восстановить из файла</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleBackupFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {backupError && (
              <p role="alert" className="text-xs font-semibold text-rose-500">
                {backupError}
              </p>
            )}

            {pendingBackup && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Подтвердите перезапись: в файле найдено планов ({pendingBackup.plans.length}) и тренировок ({pendingBackup.history.length}). Текущие данные будут заменены.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreFullBackup(pendingBackup);
                      setPendingBackup(null);
                      showSavedMessage('Все данные успешно восстановлены из резервной копии');
                    }}
                    className="min-h-[38px] px-4 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold"
                  >
                    Подтвердить восстановление
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingBackup(null)}
                    className="min-h-[38px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
