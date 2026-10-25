import React from 'react';
import { Calendar, Dumbbell, Home, Play, Settings, TrendingUp } from 'lucide-react';

export type NavTab = 'home' | 'plans' | 'workout' | 'progress' | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasActiveSession: boolean;
  onQuickStartWorkout: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'plans', label: 'Планы', icon: Calendar },
  { id: 'workout', label: 'Тренировка', icon: Dumbbell },
  { id: 'progress', label: 'Прогресс', icon: TrendingUp },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export const TopNavigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  hasActiveSession,
  onQuickStartWorkout,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <a
        href="#home"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('home');
        }}
        className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 font-display"
      >
        DuoFit
      </a>

      <nav
        aria-label="Основная навигация"
        className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'border-emerald-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onQuickStartWorkout}
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-semibold text-slate-950 bg-emerald-500 rounded-lg hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{hasActiveSession ? 'Продолжить сессию' : 'Начать тренировку'}</span>
        </button>
      </div>
    </header>
  );
};

export const BottomNavigation: React.FC<{
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasActiveSession: boolean;
}> = ({ activeTab, onSelectTab, hasActiveSession }) => {
  return (
    <nav
      aria-label="Мобильная навигация"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
                {item.id === 'workout' && hasActiveSession ? 'Активна' : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
