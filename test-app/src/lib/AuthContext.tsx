import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createId, hashPassword } from './crypto';
import {
  getSession,
  getSettings,
  getUsers,
  saveSession,
  saveSettings,
  saveUsers,
} from './storage';
import type { AppSettings, User, UserRole } from './types';

type CreateAccountInput = {
  name: string;
  employeeId: string;
  password: string;
  asAdministrator?: boolean;
  email?: string;
  /** First employer bootstrap */
  asEmployer?: boolean;
};

type AuthContextValue = {
  ready: boolean;
  user: User | null;
  settings: AppSettings;
  users: User[];
  pendingApprovals: User[];
  login: (employeeId: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  createAccount: (
    input: CreateAccountInput,
  ) => Promise<{ ok: boolean; error?: string; pending?: boolean }>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    employerEmail: null,
    employerUserId: null,
    initialized: false,
  });

  const refresh = useCallback(async () => {
    const [allUsers, appSettings, session] = await Promise.all([
      getUsers(),
      getSettings(),
      getSession(),
    ]);
    setUsers(allUsers);
    setSettings(appSettings);
    if (session) {
      const current = allUsers.find((u) => u.id === session.userId) ?? null;
      setUser(current);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const login = useCallback(
    async (employeeId: string, password: string) => {
      const allUsers = await getUsers();
      const passwordHash = await hashPassword(password);
      const found = allUsers.find(
        (u) =>
          u.employeeId.trim().toLowerCase() === employeeId.trim().toLowerCase() ||
          (u.email && u.email.trim().toLowerCase() === employeeId.trim().toLowerCase()),
      );

      if (!found || found.passwordHash !== passwordHash) {
        return { ok: false, error: 'Invalid employee ID or password.' };
      }

      if (found.status === 'rejected') {
        return { ok: false, error: 'This account was rejected by the employer.' };
      }

      // Administrator signing in with email triggers confirmation to employer
      if (
        found.role === 'administrator' &&
        found.status === 'pending' &&
        found.email
      ) {
        found.pendingEmployerApproval = true;
        await saveUsers(allUsers);
      }

      await saveSession({ userId: found.id });
      setUsers([...allUsers]);
      setUser({ ...found });
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(async () => {
    await saveSession(null);
    setUser(null);
  }, []);

  const createAccount = useCallback(async (input: CreateAccountInput) => {
    const allUsers = await getUsers();
    const appSettings = await getSettings();
    const employeeId = input.employeeId.trim();
    const email = input.email?.trim().toLowerCase();

    if (!input.name.trim() || !employeeId || !input.password) {
      return { ok: false, error: 'Name, employee ID, and password are required.' };
    }

    if (input.password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const duplicate = allUsers.find(
      (u) => u.employeeId.trim().toLowerCase() === employeeId.toLowerCase(),
    );
    if (duplicate) {
      return { ok: false, error: 'That employee ID is already registered.' };
    }

    if (email) {
      const emailTaken = allUsers.find(
        (u) => u.email && u.email.toLowerCase() === email,
      );
      if (emailTaken) {
        return { ok: false, error: 'That email is already in use.' };
      }
    }

    const passwordHash = await hashPassword(input.password);
    let role: UserRole = 'employee';
    let status: User['status'] = 'pending';
    let pendingEmployerApproval = true;

    // Bootstrap first employer (creator of the org)
    if (input.asEmployer || (!appSettings.initialized && input.asAdministrator)) {
      if (!email) {
        return { ok: false, error: 'Employer / administrator setup requires an email.' };
      }
      role = 'employer';
      status = 'approved';
      pendingEmployerApproval = false;

      const employer: User = {
        id: createId('user'),
        name: input.name.trim(),
        employeeId,
        email,
        passwordHash,
        role,
        status,
        createdAt: new Date().toISOString(),
        pendingEmployerApproval: false,
      };

      const nextUsers = [...allUsers, employer];
      const nextSettings: AppSettings = {
        employerEmail: email,
        employerUserId: employer.id,
        initialized: true,
      };

      await saveUsers(nextUsers);
      await saveSettings(nextSettings);
      await saveSession({ userId: employer.id });
      setUsers(nextUsers);
      setSettings(nextSettings);
      setUser(employer);
      return { ok: true, pending: false };
    }

    if (input.asAdministrator) {
      if (!email) {
        return { ok: false, error: 'Administrator accounts require a specific email.' };
      }
      if (!appSettings.initialized || !appSettings.employerUserId) {
        return {
          ok: false,
          error: 'No employer is set up yet. Create the employer account first.',
        };
      }
      role = 'administrator';
      status = 'pending';
      pendingEmployerApproval = true;
    } else {
      role = 'employee';
      status = appSettings.initialized ? 'pending' : 'approved';
      pendingEmployerApproval = appSettings.initialized;
      if (!appSettings.initialized) {
        // No employer yet — allow first employee-like user but prefer employer setup
        status = 'approved';
        pendingEmployerApproval = false;
      }
    }

    const newUser: User = {
      id: createId('user'),
      name: input.name.trim(),
      employeeId,
      email: email || undefined,
      passwordHash,
      role,
      status,
      createdAt: new Date().toISOString(),
      pendingEmployerApproval,
    };

    const nextUsers = [...allUsers, newUser];
    await saveUsers(nextUsers);
    await saveSession({ userId: newUser.id });
    setUsers(nextUsers);
    setUser(newUser);

    return {
      ok: true,
      pending: newUser.status === 'pending',
    };
  }, []);

  const approveUser = useCallback(
    async (userId: string) => {
      const allUsers = await getUsers();
      const next = allUsers.map((u) =>
        u.id === userId
          ? { ...u, status: 'approved' as const, pendingEmployerApproval: false }
          : u,
      );
      await saveUsers(next);
      setUsers(next);
      if (user?.id === userId) {
        setUser(next.find((u) => u.id === userId) ?? null);
      }
    },
    [user?.id],
  );

  const rejectUser = useCallback(
    async (userId: string) => {
      const allUsers = await getUsers();
      const next = allUsers.map((u) =>
        u.id === userId
          ? { ...u, status: 'rejected' as const, pendingEmployerApproval: false }
          : u,
      );
      await saveUsers(next);
      setUsers(next);
    },
    [],
  );

  const pendingApprovals = useMemo(
    () =>
      users.filter(
        (u) =>
          u.status === 'pending' ||
          (u.role === 'administrator' && u.pendingEmployerApproval),
      ),
    [users],
  );

  const value = useMemo(
    () => ({
      ready,
      user,
      settings,
      users,
      pendingApprovals,
      login,
      logout,
      createAccount,
      approveUser,
      rejectUser,
      refresh,
    }),
    [
      ready,
      user,
      settings,
      users,
      pendingApprovals,
      login,
      logout,
      createAccount,
      approveUser,
      rejectUser,
      refresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
