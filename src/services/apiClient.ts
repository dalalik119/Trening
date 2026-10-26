import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
  LinkedFriendSummary,
  TrainingPlan,
  UserAccountSummary,
  UserSettings,
} from '../types';

const TOKEN_STORAGE_KEY = 'duofit_auth_token_v2';

export interface ServerUserPayload {
  token?: string;
  account: UserAccountSummary;
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
  activeSession: ActiveWorkoutSession | null;
  linkedFriend: LinkedFriendSummary | null;
}

export function getSavedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSavedToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSavedToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Ошибка запроса к серверу');
  }
  return data as T;
}

export async function registerAccount(params: {
  username: string;
  displayName: string;
  password: string;
  weeklyGoalWorkouts: number;
  unit: 'kg' | 'lb';
}): Promise<ServerUserPayload> {
  const res = await apiRequest<ServerUserPayload>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (res.token) {
    setSavedToken(res.token);
  }
  return res;
}

export async function loginAccount(params: {
  username: string;
  password: string;
}): Promise<ServerUserPayload> {
  const res = await apiRequest<ServerUserPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (res.token) {
    setSavedToken(res.token);
  }
  return res;
}

export async function logoutAccount(): Promise<void> {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  setSavedToken(null);
}

export async function fetchCurrentUser(): Promise<ServerUserPayload> {
  return apiRequest<ServerUserPayload>('/api/me', { method: 'GET' });
}

export async function syncUserState(partial: {
  settings?: UserSettings;
  plans?: TrainingPlan[];
  history?: CompletedWorkoutRecord[];
  activeSession?: ActiveWorkoutSession | null;
}): Promise<ServerUserPayload> {
  return apiRequest<ServerUserPayload>('/api/me/state', {
    method: 'PUT',
    body: JSON.stringify(partial),
  });
}

export async function resetUserAccountData(): Promise<ServerUserPayload> {
  return apiRequest<ServerUserPayload>('/api/me/reset', {
    method: 'POST',
  });
}

export async function linkFriendByCodeOrUsername(
  codeOrUsername: string
): Promise<ServerUserPayload> {
  return apiRequest<ServerUserPayload>('/api/friends/link', {
    method: 'POST',
    body: JSON.stringify({ codeOrUsername }),
  });
}

export async function unlinkCurrentFriend(): Promise<ServerUserPayload> {
  return apiRequest<ServerUserPayload>('/api/friends/unlink', {
    method: 'POST',
  });
}

export async function copyFriendPlanToMe(planId?: string): Promise<ServerUserPayload> {
  return apiRequest<ServerUserPayload>('/api/friends/copy-plan', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
}
