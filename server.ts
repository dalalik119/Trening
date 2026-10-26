import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  ActiveWorkoutSession,
  CompletedWorkoutRecord,
  LinkedFriendSummary,
  TrainingPlan,
  UserAccountSummary,
  UserSettings,
} from './src/types';
import { createCleanUserData } from './src/utils/workoutLogic';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'duofit_users.json');

interface StoredUserRecord {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  avatarColor: string;
  friendCode: string;
  linkedFriendId: string | null;
  createdAt: string;
  settings: UserSettings;
  plans: TrainingPlan[];
  history: CompletedWorkoutRecord[];
  activeSession: ActiveWorkoutSession | null;
}

interface ServerStore {
  users: StoredUserRecord[];
  sessions: Record<string, string>; // token -> userId
}

const AVATAR_COLORS = [
  '#10B981',
  '#0EA5E9',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
  '#14B8A6',
];

function loadStore(): ServerStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as ServerStore;
      if (parsed && Array.isArray(parsed.users) && parsed.sessions) {
        return parsed;
      }
    }
  } catch {
    // ignore and create fresh store
  }
  return { users: [], sessions: {} };
}

function saveStore(store: ServerStore): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`duofit_salt_${password}`).digest('hex');
}

function generateFriendCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = 'DUO-';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!existingCodes.has(code)) return code;
  }
  return `DUO-${Date.now().toString().slice(-4)}`;
}

function toAccountSummary(u: StoredUserRecord): UserAccountSummary {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarColor: u.avatarColor,
    friendCode: u.friendCode,
    linkedFriendId: u.linkedFriendId,
    createdAt: u.createdAt,
  };
}

function buildLinkedFriendSummary(store: ServerStore, user: StoredUserRecord): LinkedFriendSummary | null {
  if (!user.linkedFriendId) return null;
  const friend = store.users.find((u) => u.id === user.linkedFriendId);
  if (!friend) return null;

  const friendHistory: CompletedWorkoutRecord[] = (friend.history || [])
    .filter((h) => h.participant === 'me')
    .map((h) => ({
      ...h,
      participant: 'friend',
      participantName: friend.displayName,
    }));

  return {
    id: friend.id,
    username: friend.username,
    displayName: friend.displayName,
    avatarColor: friend.avatarColor,
    friendCode: friend.friendCode,
    weeklyGoalWorkouts: friend.settings?.weeklyGoalWorkouts ?? 3,
    history: friendHistory,
    plans: friend.plans || [],
  };
}

function buildUserResponse(store: ServerStore, user: StoredUserRecord, token?: string) {
  const linkedFriend = buildLinkedFriendSummary(store, user);
  const effectiveSettings: UserSettings = {
    ...user.settings,
    userName: user.displayName,
    friendName: linkedFriend ? linkedFriend.displayName : user.settings.friendName || '',
  };

  return {
    token,
    account: toAccountSummary(user),
    settings: effectiveSettings,
    plans: user.plans || [],
    history: (user.history || []).filter((h) => h.participant === 'me'),
    activeSession: user.activeSession || null,
    linkedFriend,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const getAuthenticatedUser = (
    req: express.Request,
    store: ServerStore
  ): StoredUserRecord | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length).trim();
    const userId = store.sessions[token];
    if (!userId) return null;
    return store.users.find((u) => u.id === userId) ?? null;
  };

  // Register new account (starts from a 100% clean slate!)
  app.post('/api/auth/register', (req, res) => {
    const store = loadStore();
    const rawUsername = String(req.body?.username ?? '').trim().toLowerCase();
    const rawDisplayName = String(req.body?.displayName ?? '').trim();
    const rawPassword = String(req.body?.password ?? '');
    const weeklyGoal = Math.min(7, Math.max(1, Number(req.body?.weeklyGoalWorkouts) || 3));
    const unit = req.body?.unit === 'lb' ? 'lb' : 'kg';

    if (!rawUsername || rawUsername.length < 3 || !/^[a-z0-9_.-]+$/.test(rawUsername)) {
      res.status(400).json({
        error: 'Логин должен содержать минимум 3 символа (латинские буквы, цифры, _ или .)',
      });
      return;
    }

    if (!rawDisplayName || rawDisplayName.length < 2) {
      res.status(400).json({ error: 'Введите ваше имя (минимум 2 символа)' });
      return;
    }

    if (!rawPassword || rawPassword.length < 4) {
      res.status(400).json({ error: 'Пароль должен содержать минимум 4 символа' });
      return;
    }

    if (store.users.some((u) => u.username === rawUsername)) {
      res.status(409).json({ error: 'Пользователь с таким логином уже зарегистрирован' });
      return;
    }

    const existingCodes = new Set(store.users.map((u) => u.friendCode));
    const friendCode = generateFriendCode(existingCodes);
    const cleanData = createCleanUserData(rawDisplayName, weeklyGoal);
    cleanData.settings.unit = unit;

    const newUser: StoredUserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: rawUsername,
      displayName: rawDisplayName,
      passwordHash: hashPassword(rawPassword),
      avatarColor: AVATAR_COLORS[store.users.length % AVATAR_COLORS.length],
      friendCode,
      linkedFriendId: null,
      createdAt: new Date().toISOString(),
      settings: cleanData.settings,
      plans: [], // Strictly clean slate: 0 plans, 0 workouts!
      history: [],
      activeSession: null,
    };

    const token = crypto.randomBytes(24).toString('hex');
    store.users.push(newUser);
    store.sessions[token] = newUser.id;
    saveStore(store);

    res.json(buildUserResponse(store, newUser, token));
  });

  // Login to existing account
  app.post('/api/auth/login', (req, res) => {
    const store = loadStore();
    const rawUsername = String(req.body?.username ?? '').trim().toLowerCase();
    const rawPassword = String(req.body?.password ?? '');

    const user = store.users.find((u) => u.username === rawUsername);
    if (!user || user.passwordHash !== hashPassword(rawPassword)) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    store.sessions[token] = user.id;
    saveStore(store);

    res.json(buildUserResponse(store, user, token));
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const store = loadStore();
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      delete store.sessions[token];
      saveStore(store);
    }
    res.json({ ok: true });
  });

  // Get current user state + live friend progress
  app.get('/api/me', (req, res) => {
    const store = loadStore();
    const user = getAuthenticatedUser(req, store);
    if (!user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }
    res.json(buildUserResponse(store, user));
  });

  // Sync user's plans, history, settings, or activeSession
  app.put('/api/me/state', (req, res) => {
    const store = loadStore();
    const user = getAuthenticatedUser(req, store);
    if (!user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    if (req.body.settings && typeof req.body.settings === 'object') {
      user.settings = {
        ...user.settings,
        ...req.body.settings,
      };
      if (typeof req.body.settings.userName === 'string' && req.body.settings.userName.trim()) {
        user.displayName = req.body.settings.userName.trim();
      }
    }

    if (Array.isArray(req.body.plans)) {
      user.plans = req.body.plans;
    }

    if (Array.isArray(req.body.history)) {
      user.history = req.body.history.filter(
        (h: CompletedWorkoutRecord) => h.participant === 'me'
      );
    }

    if ('activeSession' in req.body) {
      user.activeSession = req.body.activeSession ?? null;
    }

    saveStore(store);
    res.json(buildUserResponse(store, user));
  });

  // Reset account to clean slate
  app.post('/api/me/reset', (req, res) => {
    const store = loadStore();
    const user = getAuthenticatedUser(req, store);
    if (!user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    user.plans = [];
    user.history = [];
    user.activeSession = null;
    saveStore(store);

    res.json(buildUserResponse(store, user));
  });

  // Link friend by Friend Code (e.g. DUO-XXXX) or username
  app.post('/api/friends/link', (req, res) => {
    const store = loadStore();
    const user = getAuthenticatedUser(req, store);
    if (!user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    const query = String(req.body?.codeOrUsername ?? '').trim();
    if (!query) {
      res.status(400).json({ error: 'Введите код друга (например DUO-XXXX) или его логин' });
      return;
    }

    const upperQuery = query.toUpperCase();
    const lowerQuery = query.toLowerCase();

    const targetFriend = store.users.find(
      (u) => u.friendCode.toUpperCase() === upperQuery || u.username === lowerQuery
    );

    if (!targetFriend) {
      res.status(404).json({
        error: 'Пользователь с таким кодом или логином не найден. Проверьте код у друга.',
      });
      return;
    }

    if (targetFriend.id === user.id) {
      res.status(400).json({ error: 'Нельзя добавить самого себя в качестве напарника.' });
      return;
    }

    // Mutually link the two friends
    user.linkedFriendId = targetFriend.id;
    user.settings.friendName = targetFriend.displayName;
    targetFriend.linkedFriendId = user.id;
    targetFriend.settings.friendName = user.displayName;

    saveStore(store);
    res.json(buildUserResponse(store, user));
  });

  // Unlink friend
  app.post('/api/friends/unlink', (req, res) => {
    const store = loadStore();
    const user = getAuthenticatedUser(req, store);
    if (!user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    if (user.linkedFriendId) {
      const friend = store.users.find((u) => u.id === user.linkedFriendId);
      if (friend && friend.linkedFriendId === user.id) {
        friend.linkedFriendId = null;
        friend.settings.friendName = '';
      }
    }

    user.linkedFriendId = null;
    user.settings.friendName = '';
    saveStore(store);

    res.json(buildUserResponse(store, user));
  });

  // Copy a plan from linked friend into my plans
  app.post('/api/friends/copy-plan', (req, res) => {
    const store = loadStore();
    const user = getAuthenticatedUser(req, store);
    if (!user || !user.linkedFriendId) {
      res.status(400).json({ error: 'Сначала подключите напарника' });
      return;
    }

    const friend = store.users.find((u) => u.id === user.linkedFriendId);
    if (!friend) {
      res.status(404).json({ error: 'Напарник не найден' });
      return;
    }

    const planId = String(req.body?.planId ?? '');
    const sourcePlan = friend.plans.find((p) => p.id === planId) ?? friend.plans[0];
    if (!sourcePlan) {
      res.status(404).json({ error: 'У напарника пока нет созданных планов' });
      return;
    }

    const clonedPlan: TrainingPlan = {
      ...sourcePlan,
      id: `plan-friend-${Date.now()}`,
      name: `${sourcePlan.name} (от ${friend.displayName})`,
      isActive: user.plans.length === 0,
      updatedAt: new Date().toISOString(),
    };

    user.plans.push(clonedPlan);
    saveStore(store);
    res.json(buildUserResponse(store, user));
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DuoFit server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
