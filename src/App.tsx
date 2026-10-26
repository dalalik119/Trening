import React, { useEffect, useState } from 'react';
import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
  FullBackupPayload,
  LinkedFriendSummary,
  TrainingPlan,
  UserAccountSummary,
  UserSettings,
  WorkoutDayPlan,
} from './types';
import {
  STARTER_PLAN_TEMPLATES,
  createActiveSessionFromDay,
  createCleanUserData,
  finalizeSessionToRecord,
} from './utils/workoutLogic';
import {
  ServerUserPayload,
  copyFriendPlanToMe,
  fetchCurrentUser,
  getSavedToken,
  linkFriendByCodeOrUsername,
  logoutAccount,
  resetUserAccountData,
  setSavedToken,
  syncUserState,
  unlinkCurrentFriend,
} from './services/apiClient';
import {
  BottomNavigation,
  NavTab,
  TopNavigation,
} from './components/BottomNavigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { PlansPage } from './pages/PlansPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const cleanDefaults = createCleanUserData();
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<UserAccountSummary | null>(null);
  const [linkedFriend, setLinkedFriend] = useState<LinkedFriendSummary | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [settings, setSettings] = useState<UserSettings>(cleanDefaults.settings);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [history, setHistory] = useState<CompletedWorkoutRecord[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveWorkoutSession | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const applyServerPayload = (payload: ServerUserPayload, autoSwitchWorkout = false) => {
    setAccount(payload.account);
    setLinkedFriend(payload.linkedFriend);
    setSettings(payload.settings);
    setPlans(payload.plans);
    setHistory(payload.history);
    setActiveSession(payload.activeSession);
    if (autoSwitchWorkout && payload.activeSession) {
      setActiveTab('workout');
    }
  };

  useEffect(() => {
    const token = getSavedToken();
    if (!token) {
      setAuthReady(true);
      return;
    }
    fetchCurrentUser()
      .then((payload) => {
        applyServerPayload(payload, true);
      })
      .catch(() => {
        setSavedToken(null);
      })
      .finally(() => {
        setAuthReady(true);
      });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 text-sm">
        Загрузка профиля DuoFit...
      </div>
    );
  }

  if (!account) {
    return (
      <AuthPage
        onAuthenticated={(payload) => {
          applyServerPayload(payload, true);
          setActiveTab('home');
        }}
      />
    );
  }

  const handleStartWorkout = (plan: TrainingPlan, day: WorkoutDayPlan) => {
    const newSession = createActiveSessionFromDay(plan, day);
    setActiveSession(newSession);
    setActiveTab('workout');
    syncUserState({ activeSession: newSession }).then(applyServerPayload).catch(() => {});
  };

  const handleQuickStartFromHeader = () => {
    if (activeSession) {
      setActiveTab('workout');
      return;
    }
    const activePlan = plans.find((p) => p.isActive) ?? plans[0];
    const firstDayWithExercises = activePlan?.days.find((d) => d.exercises.length > 0);
    if (activePlan && firstDayWithExercises) {
      handleStartWorkout(activePlan, firstDayWithExercises);
    } else {
      setActiveTab('plans');
    }
  };

  const handleUpdateSession = (next: ActiveWorkoutSession) => {
    setActiveSession(next);
    syncUserState({ activeSession: next }).catch(() => {});
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    const record = finalizeSessionToRecord(activeSession, account.displayName);
    const nextHistory = [record, ...history];
    setHistory(nextHistory);
    setActiveSession(null);
    setActiveTab('progress');
    syncUserState({ history: nextHistory, activeSession: null })
      .then(applyServerPayload)
      .catch(() => {});
  };

  const handleDiscardSession = () => {
    setActiveSession(null);
    setActiveTab('home');
    syncUserState({ activeSession: null }).then(applyServerPayload).catch(() => {});
  };

  const handleUpdatePlans = (nextPlans: TrainingPlan[]) => {
    setPlans(nextPlans);
    syncUserState({ plans: nextPlans }).then(applyServerPayload).catch(() => {});
  };

  const handleCreatePlanFromTemplate = (templateId: string) => {
    const tpl = STARTER_PLAN_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const built = tpl.buildPlan(account.displayName);
    const nextPlans = plans.map((p) => ({ ...p, isActive: false })).concat(built);
    setPlans(nextPlans);
    syncUserState({ plans: nextPlans }).then(applyServerPayload).catch(() => {});
    showToast(`Шаблон «${built.name}» добавлен в ваш профиль`);
  };

  const handleUpdateSettings = (nextSettings: UserSettings) => {
    setSettings(nextSettings);
    syncUserState({ settings: nextSettings }).then(applyServerPayload).catch(() => {});
  };

  const handleRestoreFullBackup = (backup: FullBackupPayload) => {
    setSettings(backup.settings);
    setPlans(backup.plans);
    setHistory(backup.history);
    setActiveSession(backup.activeSession);
    syncUserState({
      settings: backup.settings,
      plans: backup.plans,
      history: backup.history,
      activeSession: backup.activeSession,
    })
      .then(applyServerPayload)
      .catch(() => {});
  };

  const handleResetCleanSlate = async () => {
    const res = await resetUserAccountData();
    applyServerPayload(res);
  };

  const handleLinkFriend = async (codeOrUsername: string) => {
    const res = await linkFriendByCodeOrUsername(codeOrUsername);
    applyServerPayload(res);
    showToast(
      `Напарник ${res.linkedFriend?.displayName ?? ''} успешно подключён к вашему профилю!`
    );
  };

  const handleUnlinkFriend = async () => {
    const res = await unlinkCurrentFriend();
    applyServerPayload(res);
    showToast('Напарник отключён');
  };

  const handleCopyFriendPlan = async (planId?: string) => {
    const res = await copyFriendPlanToMe(planId);
    applyServerPayload(res);
    showToast('План напарника скопирован в ваши планы');
  };

  const handleRefreshProgress = async () => {
    const res = await fetchCurrentUser();
    applyServerPayload(res);
  };

  const handleLogout = async () => {
    await logoutAccount();
    setAccount(null);
    setLinkedFriend(null);
    setPlans([]);
    setHistory([]);
    setActiveSession(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasActiveSession={Boolean(activeSession)}
        onQuickStartWorkout={handleQuickStartFromHeader}
      />

      {statusToast && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div
            role="status"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
          >
            {statusToast}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'home' && (
          <HomePage
            account={account}
            linkedFriend={linkedFriend}
            settings={settings}
            plans={plans}
            history={history}
            activeSession={activeSession}
            onStartWorkout={handleStartWorkout}
            onResumeWorkout={() => setActiveTab('workout')}
            onNavigate={setActiveTab}
            onCreatePlanFromTemplate={handleCreatePlanFromTemplate}
            onLinkFriend={handleLinkFriend}
            onCopyFriendPlan={handleCopyFriendPlan}
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
            onNavigateToPlans={() => setActiveTab('plans')}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressPage
            account={account}
            linkedFriend={linkedFriend}
            history={history}
            settings={settings}
            onLinkFriend={handleLinkFriend}
            onUnlinkFriend={handleUnlinkFriend}
            onRefreshProgress={handleRefreshProgress}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            account={account}
            linkedFriend={linkedFriend}
            settings={settings}
            plans={plans}
            history={history}
            activeSession={activeSession}
            onUpdateSettings={handleUpdateSettings}
            onRestoreFullBackup={handleRestoreFullBackup}
            onResetCleanSlate={handleResetCleanSlate}
            onLogout={handleLogout}
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
