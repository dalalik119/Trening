import React, { useEffect, useState } from 'react';
import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
  FullBackupPayload,
  TrainingPlan,
  UserSettings,
  WorkoutDayPlan,
} from './types';
import {
  createActiveSessionFromDay,
  createInitialSeedData,
  finalizeSessionToRecord,
  formatPlanAsShareText,
} from './utils/workoutLogic';
import {
  loadAppData,
  overwriteAllDataFromBackup,
  saveActiveSessionToDb,
  saveHistoryToDb,
  savePlansToDb,
  saveSettingsToDb,
} from './db/database';
import {
  BottomNavigation,
  NavTab,
  TopNavigation,
} from './components/BottomNavigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HomePage } from './pages/HomePage';
import { PlansPage } from './pages/PlansPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const seed = createInitialSeedData();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [settings, setSettings] = useState<UserSettings>(seed.settings);
  const [plans, setPlans] = useState<TrainingPlan[]>(seed.plans);
  const [history, setHistory] = useState<CompletedWorkoutRecord[]>(seed.history);
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadAppData().then((data) => {
      if (!mounted) return;
      setSettings(data.settings);
      setPlans(data.plans);
      setHistory(data.history);
      setActiveSession(data.activeSession);
      if (data.activeSession) {
        setActiveTab('workout');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleStartWorkout = (plan: TrainingPlan, day: WorkoutDayPlan) => {
    const newSession = createActiveSessionFromDay(plan, day);
    setActiveSession(newSession);
    saveActiveSessionToDb(newSession);
    setActiveTab('workout');
  };

  const handleQuickStartFromHeader = () => {
    if (activeSession) {
      setActiveTab('workout');
      return;
    }
    const activePlan = plans.find((p) => p.isActive) ?? plans[0];
    if (activePlan && activePlan.days[0]) {
      handleStartWorkout(activePlan, activePlan.days[0]);
    } else {
      setActiveTab('plans');
    }
  };

  const handleUpdateSession = (next: ActiveWorkoutSession) => {
    setActiveSession(next);
    saveActiveSessionToDb(next);
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    const record = finalizeSessionToRecord(activeSession, settings.userName);
    const nextHistory = [record, ...history];
    setHistory(nextHistory);
    setActiveSession(null);
    saveHistoryToDb(nextHistory);
    saveActiveSessionToDb(null);
    setActiveTab('progress');
  };

  const handleDiscardSession = () => {
    setActiveSession(null);
    saveActiveSessionToDb(null);
    setActiveTab('home');
  };

  const handleUpdatePlans = (nextPlans: TrainingPlan[]) => {
    setPlans(nextPlans);
    savePlansToDb(nextPlans);
  };

  const handleAddFriendWorkoutRecord = (record: CompletedWorkoutRecord) => {
    const nextHistory = [record, ...history];
    setHistory(nextHistory);
    saveHistoryToDb(nextHistory);
  };

  const handleUpdateSettings = (nextSettings: UserSettings) => {
    setSettings(nextSettings);
    saveSettingsToDb(nextSettings);
  };

  const handleRestoreFullBackup = (backup: FullBackupPayload) => {
    setSettings(backup.settings);
    setPlans(backup.plans);
    setHistory(backup.history);
    setActiveSession(backup.activeSession);
    overwriteAllDataFromBackup(backup);
  };

  const handleShareActivePlan = async () => {
    const activePlan = plans.find((p) => p.isActive) ?? plans[0];
    if (!activePlan) return;
    const text = formatPlanAsShareText(activePlan);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DuoFit: ${activePlan.name}`,
          text,
        });
        return;
      } catch {
        // fallback below
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareToast('План тренировок скопирован в буфер обмена для отправки другу');
      setTimeout(() => setShareToast(null), 3500);
    } catch {
      setActiveTab('plans');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasActiveSession={Boolean(activeSession)}
        onQuickStartWorkout={handleQuickStartFromHeader}
      />

      {shareToast && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div
            role="status"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
          >
            {shareToast}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'home' && (
          <HomePage
            settings={settings}
            plans={plans}
            history={history}
            activeSession={activeSession}
            onStartWorkout={handleStartWorkout}
            onResumeWorkout={() => setActiveTab('workout')}
            onNavigate={setActiveTab}
            onShareActivePlan={handleShareActivePlan}
          />
        )}

        {activeTab === 'plans' && (
          <PlansPage
            plans={plans}
            settings={settings}
            onUpdatePlans={handleUpdatePlans}
            onStartWorkout={handleStartWorkout}
          />
        )}

        {activeTab === 'workout' && (
          <WorkoutPage
            session={activeSession}
            plans={plans}
            settings={settings}
            onUpdateSession={handleUpdateSession}
            onFinishSession={handleFinishSession}
            onDiscardSession={handleDiscardSession}
            onStartWorkout={handleStartWorkout}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressPage
            history={history}
            settings={settings}
            onAddFriendWorkoutRecord={handleAddFriendWorkoutRecord}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            plans={plans}
            history={history}
            activeSession={activeSession}
            onUpdateSettings={handleUpdateSettings}
            onRestoreFullBackup={handleRestoreFullBackup}
          />
        )}
      </main>

      <OfflineIndicator />

      <BottomNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasActiveSession={Boolean(activeSession)}
      />
    </div>
  );
}
