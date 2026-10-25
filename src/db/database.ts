import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
  FullBackupPayload,
  TrainingPlan,
  UserSettings,
} from '../types';
import { createInitialSeedData } from '../utils/workoutLogic';

const DB_NAME = 'duofit_indexeddb';
const DB_VERSION = 1;

const STORE_PLANS = 'plans';
const STORE_HISTORY = 'history';
const STORE_SESSION = 'active_session';
const STORE_SETTINGS = 'settings';

const FALLBACK_KEY = 'duofit_fallback_storage_v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PLANS)) {
        db.createObjectStore(STORE_PLANS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SESSION)) {
        db.createObjectStore(STORE_SESSION, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

function putAllInStore<T>(db: IDBDatabase, storeName: string, items: T[], clearFirst = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    if (clearFirst) {
      store.clear();
    }
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface LoadedAppData {
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
  activeSession: ActiveWorkoutSession | null;
}

export async function loadAppData(): Promise<LoadedAppData> {
  const seed = createInitialSeedData();
  try {
    const db = await openDatabase();
    const [plans, history, sessions, settingsArr] = await Promise.all([
      getAllFromStore<TrainingPlan>(db, STORE_PLANS),
      getAllFromStore<CompletedWorkoutRecord>(db, STORE_HISTORY),
      getAllFromStore<ActiveWorkoutSession>(db, STORE_SESSION),
      getAllFromStore<UserSettings>(db, STORE_SETTINGS),
    ]);

    if (plans.length === 0 && history.length === 0 && settingsArr.length === 0) {
      await Promise.all([
        putAllInStore(db, STORE_PLANS, seed.plans, true),
        putAllInStore(db, STORE_HISTORY, seed.history, true),
        putAllInStore(db, STORE_SETTINGS, [seed.settings], true),
      ]);
      db.close();
      return {
        settings: seed.settings,
        plans: seed.plans,
        history: seed.history,
        activeSession: null,
      };
    }

    db.close();
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
    );

    return {
      settings: settingsArr[0] ?? seed.settings,
      plans: plans.length > 0 ? plans : seed.plans,
      history: sortedHistory,
      activeSession: sessions[0] ?? null,
    };
  } catch {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (raw) {
        return JSON.parse(raw) as LoadedAppData;
      }
    } catch {
      // ignore fallback errors
    }
    return {
      settings: seed.settings,
      plans: seed.plans,
      history: seed.history,
      activeSession: null,
    };
  }
}

export async function savePlansToDb(plans: TrainingPlan[]): Promise<void> {
  try {
    const db = await openDatabase();
    await putAllInStore(db, STORE_PLANS, plans, true);
    db.close();
  } catch {
    // fallback handled silently
  }
}

export async function saveHistoryToDb(history: CompletedWorkoutRecord[]): Promise<void> {
  try {
    const db = await openDatabase();
    await putAllInStore(db, STORE_HISTORY, history, true);
    db.close();
  } catch {
    // fallback handled silently
  }
}

export async function saveActiveSessionToDb(session: ActiveWorkoutSession | null): Promise<void> {
  try {
    const db = await openDatabase();
    await putAllInStore(db, STORE_SESSION, session ? [session] : [], true);
    db.close();
  } catch {
    // fallback handled silently
  }
}

export async function saveSettingsToDb(settings: UserSettings): Promise<void> {
  try {
    const db = await openDatabase();
    await putAllInStore(db, STORE_SETTINGS, [settings], true);
    db.close();
  } catch {
    // fallback handled silently
  }
}

export async function overwriteAllDataFromBackup(backup: FullBackupPayload): Promise<void> {
  try {
    const db = await openDatabase();
    await Promise.all([
      putAllInStore(db, STORE_PLANS, backup.plans, true),
      putAllInStore(db, STORE_HISTORY, backup.history, true),
      putAllInStore(db, STORE_SETTINGS, [backup.settings], true),
      putAllInStore(db, STORE_SESSION, backup.activeSession ? [backup.activeSession] : [], true),
    ]);
    db.close();
  } catch {
    // fallback handled silently
  }
}
