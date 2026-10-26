import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Lock,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  loginAccount,
  registerAccount,
  ServerUserPayload,
} from '../services/apiClient';

interface AuthPageProps {
  onAuthenticated: (payload: ServerUserPayload) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [weeklyGoalWorkouts, setWeeklyGoalWorkouts] = useState(3);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await registerAccount({
          username,
          displayName,
          password,
          weeklyGoalWorkouts,
          unit,
        });
        onAuthenticated(res);
      } else {
        const res = await loginAccount({
          username,
          password,
        });
        onAuthenticated(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 max-w-6xl w-full mx-auto">
        <span className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0">
          DuoFit
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register');
              setError(null);
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 transition-colors whitespace-nowrap"
          >
            {mode === 'register' ? 'Уже есть профиль? Войти' : 'Создать новый профиль'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch w-full">
          {/* Left 7 columns: Value Proposition & Clean Slate Architecture */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8 py-2">
            <div className="space-y-4">
              <div className="text-xs font-medium text-emerald-400">
                Совместный фитнес-трекер · Личный профиль и синхронизация с другом
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight font-display">
                Тренируйтесь с другом, ведите свой план с чистого листа
              </h1>
              <p className="text-base text-slate-400 max-w-xl leading-relaxed">
                Создайте личный профиль за 10 секунд. Внутри вас ждёт чистый аккаунт без лишних предзаполненных данных — настройте свою программу с нуля или выберите шаблон, подключите друга по коду и сравнивайте реальный прогресс.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white">С чистого листа</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Никаких чужих тренировок в истории. Вы сами создаёте свой сплит и заполняете рабочие веса.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white">Код друга DUO-XXXX</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Каждый профиль получает уникальный код. Введите код друга, чтобы видеть его результаты и делиться планами.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white">Сохранение на сервере</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Все ваши планы, подходы и история надёжно привязаны к вашему логину и доступны при следующем входе.
                </p>
              </div>
            </div>
          </div>

          {/* Right 5 columns: Login / Registration Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 h-full flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className={`flex-1 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      mode === 'register'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Новый профиль
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className={`flex-1 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      mode === 'login'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Вход в аккаунт
                  </button>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white font-display">
                    {mode === 'register'
                      ? 'Создание личного профиля'
                      : 'Вход в ваш профиль DuoFit'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {mode === 'register'
                      ? 'Заполните начальные параметры — профиль откроется полностью чистым и готовым к настройке.'
                      : 'Введите ваш логин и пароль, чтобы загрузить сохранённые планы и историю.'}
                  </p>
                </div>

                <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="auth-username"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Логин (латиницей, например alex_fit)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-username"
                        type="text"
                        required
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="alex_fit"
                        className="w-full min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label
                        htmlFor="auth-displayname"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Ваше имя (будет видно другу)
                      </label>
                      <div className="relative">
                        <UserPlus className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="auth-displayname"
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Например: Дмитрий"
                          className="w-full min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-medium text-slate-300 mb-1.5"
                    >
                      Пароль (минимум 4 символа)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="auth-password"
                        type="password"
                        required
                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label
                          htmlFor="auth-goal"
                          className="block text-xs font-medium text-slate-300 mb-1.5"
                        >
                          Цель тренировок в неделю
                        </label>
                        <select
                          id="auth-goal"
                          value={weeklyGoalWorkouts}
                          onChange={(e) => setWeeklyGoalWorkouts(Number(e.target.value))}
                          className="w-full min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white font-mono-tabular"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                            <option key={n} value={n}>
                              {n} трен. / нед.
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="auth-unit"
                          className="block text-xs font-medium text-slate-300 mb-1.5"
                        >
                          Единицы веса
                        </label>
                        <select
                          id="auth-unit"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value as 'kg' | 'lb')}
                          className="w-full min-h-[44px] rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white"
                        >
                          <option value="kg">Килограммы (кг)</option>
                          <option value="lb">Фунты (lb)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-400"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 mt-2"
                  >
                    <span>
                      {loading
                        ? 'Подождите...'
                        : mode === 'register'
                        ? 'Создать чистый профиль и войти'
                        : 'Войти в профиль'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-500">
                Совет: чтобы протестировать совместный режим с другом, вы можете зарегистрировать два профиля и связать их по коду <span className="font-mono-tabular text-slate-300">DUO-XXXX</span>.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
