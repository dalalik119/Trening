import React, { useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  LogOut,
  Moon,
  RotateCcw,
  Sun,
  Upload,
  User,
} from 'lucide-react';
import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
  FullBackupPayload,
  LinkedFriendSummary,
  TrainingPlan,
  UserAccountSummary,
  UserSettings,
} from '../types';
import { validateFullBackup } from '../utils/workoutLogic';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface SettingsPageProps {
  account: UserAccountSummary;
  linkedFriend: LinkedFriendSummary | null;
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
  activeSession: ActiveWorkoutSession | null;
  onUpdateSettings: (next: UserSettings) => void;
  onRestoreFullBackup: (backup: FullBackupPayload) => void;
  onResetCleanSlate: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  account,
  linkedFriend,
  settings,
  plans,
  history,
  activeSession,
  onUpdateSettings,
  onRestoreFullBackup,
  onResetCleanSlate,
  onLogout,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [weeklyGoal, setWeeklyGoal] = useState(String(settings.weeklyGoalWorkouts));
  const [notice, setNotice] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<FullBackupPayload | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const showSavedMessage = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      userName: userName.trim() || account.displayName,
      weeklyGoalWorkouts: Math.min(7, Math.max(1, Number(weeklyGoal) || 3)),
    };
    onUpdateSettings(updated);
    showSavedMessage('Профиль и цели сохранены в вашем аккаунте');
  };

  const handleCopyFriendCode = async () => {
    try {
      await navigator.clipboard.writeText(account.friendCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    } catch {
      // ignore
    }
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
    a.download = `duofit-backup-${account.username}-${new Date().toISOString().slice(0, 10)}.json`;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Управление аккаунтом @{account.username}, тема, единицы измерения и данные
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
            Настройки профиля
          </h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-rose-500 hover:border-rose-500/40 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Выйти из профиля (@{account.username})</span>
        </button>
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
        {/* Profile & Account Details */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Личный профиль
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Логин аккаунта:</span>
              <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                @{account.username}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Код для подключения друга:</span>
              <button
                type="button"
                onClick={handleCopyFriendCode}
                className="inline-flex items-center gap-1.5 font-mono-tabular font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span>{account.friendCode}</span>
                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Подключённый напарник:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {linkedFriend
                  ? `${linkedFriend.displayName} (@${linkedFriend.username})`
                  : 'Не подключён'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="settings-username"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Отображаемое имя
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
              <span>Сохранить изменения</span>
            </button>
          </form>
        </div>

        {/* Theme, Units & Clean Slate Reset */}
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

          {/* Data Management & Clean Slate Reset */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Управление данными профиля
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              В вашем профиле сохранено планов: {plans.length}, тренировок в истории: {history.length}. Вы можете скачать резервную копию или полностью очистить профиль до чистого листа.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportFullBackup}
                className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:border-emerald-500/50 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Скачать копию JSON</span>
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

              <button
                type="button"
                onClick={() => setShowConfirmReset(true)}
                className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-rose-500/30 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Очистить профиль с чистого листа</span>
              </button>
            </div>

            {backupError && (
              <p role="alert" className="text-xs font-semibold text-rose-500">
                {backupError}
              </p>
            )}

            {pendingBackup && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Подтвердите перезапись: в файле найдено планов ({pendingBackup.plans.length}) и тренировок ({pendingBackup.history.length}).
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreFullBackup(pendingBackup);
                      setPendingBackup(null);
                      showSavedMessage('Данные успешно восстановлены из резервной копии');
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

            {showConfirmReset && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">
                  Вы уверены? Все ваши текущие планы ({plans.length}) и история тренировок ({history.length}) будут удалены, чтобы вы могли настроить профиль заново с чистого листа.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetCleanSlate();
                      setShowConfirmReset(false);
                      showSavedMessage('Профиль очищен до чистого листа');
                    }}
                    className="min-h-[38px] px-4 rounded-lg bg-rose-500 text-white text-xs font-bold"
                  >
                    Да, очистить всё
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
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
