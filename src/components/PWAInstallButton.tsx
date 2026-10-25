import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleTrigger = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleTrigger}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Download className="w-4 h-4 text-emerald-500" />
          <span>{isIOS ? 'Установить на iPhone' : 'Установить PWA'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleTrigger}
          className="w-full flex items-center justify-between gap-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 px-4 py-3.5 text-left hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Установить DuoFit на главный экран
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Полноэкранный режим без панели браузера и работа без интернета
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
            Инструкция
          </span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3
                id="pwa-guide-title"
                className="text-lg font-bold text-slate-900 dark:text-white"
              >
                Установка DuoFit на iPhone или Android
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Закрыть инструкцию установки"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                Для iPhone (Safari):
              </p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Нажмите кнопку «Поделиться» в нижней панели Safari.</li>
                <li>Прокрутите меню вниз и выберите «На экран Домой».</li>
                <li>Нажмите «Добавить» — иконка DuoFit появится на главном экране.</li>
              </ol>
              <p className="font-medium text-slate-900 dark:text-slate-100 pt-2">
                Для Android / Desktop (Chrome, Edge):
              </p>
              <p>
                Нажмите на значок установки в адресной строке браузера или выберите «Установить приложение» в меню браузера.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full min-h-[44px] rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};
