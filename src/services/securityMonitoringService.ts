/**
 * PRODUCT STUDIO by My BIMI
 * Security, Access Control & Diagnostics Monitoring Service
 * 
 * Provides:
 * 1. User Credential Authentication & Role Control (tohriyo / sachou + custom users)
 * 2. User Uses & Session Monitoring
 * 3. Data Edit History with before/after diffs
 * 4. Runtime Crash & Error Log tracking with global exception hooks
 */

import { AppRole, UserProfile, StoreId } from '../types/database';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/hashed comparison for application RBAC
  role: AppRole;
  is_super_admin?: boolean;
  assigned_store_id?: StoreId;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface UserSessionRecord {
  id: string;
  user_id: string;
  username: string;
  name: string;
  role: AppRole;
  ip_client: string;
  user_agent: string;
  login_time: string;
  last_active_time: string;
  status: 'ONLINE' | 'IDLE' | 'EXPIRED';
}

export interface UserActivityRecord {
  id: string;
  user_id: string;
  username: string;
  role: AppRole;
  action: string;
  details?: string;
  path?: string;
  timestamp: string;
}

export interface DataEditRecord {
  id: string;
  entity_type: 'product' | 'price' | 'inventory' | 'category' | 'store' | 'user' | 'supplier' | 'settings';
  entity_id: string;
  entity_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_ADJUST' | 'PRICE_OVERRIDE' | 'ROLE_CHANGE';
  description: string;
  user_id: string;
  user_name: string;
  user_role: string;
  diff?: {
    field: string;
    before: string | number | boolean;
    after: string | number | boolean;
  }[];
  timestamp: string;
}

export interface CrashLogRecord {
  id: string;
  error_name: string;
  message: string;
  stack?: string;
  component_stack?: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
  user_id?: string;
  username?: string;
  url: string;
  timestamp: string;
}

const STORAGE_USERS_KEY = 'bimi_security_users_v2';
const STORAGE_SESSIONS_KEY = 'bimi_security_sessions_v2';
const STORAGE_ACTIVITIES_KEY = 'bimi_security_activities_v2';
const STORAGE_EDITS_KEY = 'bimi_security_data_edits_v2';
const STORAGE_CRASHES_KEY = 'bimi_security_crashes_v2';

// Core pre-configured credentials
const CORE_INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-tohriyo-01',
    username: 'tohriyo',
    name: 'Tohriyo',
    email: 'tohriyo@mybimi.jp',
    passwordHash: 'Kurosaki',
    role: 'ADMIN',
    is_super_admin: true,
    is_active: true,
    created_at: '2026-10-01T00:00:00Z',
    last_login_at: '2026-10-08T00:00:00Z',
  },
  {
    id: 'usr-sachou-02',
    username: 'sachou',
    name: 'Sachou',
    email: 'sachou@mybimi.jp',
    passwordHash: 'nahian1111',
    role: 'MANAGER',
    is_super_admin: false,
    is_active: true,
    created_at: '2026-10-01T00:00:00Z',
    last_login_at: '2026-10-07T12:00:00Z',
  },
];

class SecurityMonitoringService {
  private users: UserAccount[] = [];
  private sessions: UserSessionRecord[] = [];
  private activities: UserActivityRecord[] = [];
  private dataEdits: DataEditRecord[] = [];
  private crashLogs: CrashLogRecord[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      this.attachGlobalErrorHandlers();
    }
  }

  private init() {
    if (this.isInitialized) return;
    try {
      const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers) as UserAccount[];
        // Ensure core accounts are always present and updated
        CORE_INITIAL_ACCOUNTS.forEach((core) => {
          const idx = parsed.findIndex((u) => u.username.toLowerCase() === core.username.toLowerCase());
          if (idx === -1) {
            parsed.unshift(core);
          } else {
            // Keep credentials intact
            parsed[idx].passwordHash = core.passwordHash;
            parsed[idx].is_super_admin = core.is_super_admin;
          }
        });
        this.users = parsed;
      } else {
        this.users = [...CORE_INITIAL_ACCOUNTS];
        this.saveUsers();
      }

      this.sessions = this.loadStorage<UserSessionRecord[]>(STORAGE_SESSIONS_KEY, []);
      this.activities = this.loadStorage<UserActivityRecord[]>(STORAGE_ACTIVITIES_KEY, []);
      this.dataEdits = this.loadStorage<DataEditRecord[]>(STORAGE_EDITS_KEY, []);
      this.crashLogs = this.loadStorage<CrashLogRecord[]>(STORAGE_CRASHES_KEY, []);
      this.isInitialized = true;
    } catch {
      this.users = [...CORE_INITIAL_ACCOUNTS];
      this.isInitialized = true;
    }
  }

  private loadStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveStorage<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  private saveUsers() {
    this.saveStorage(STORAGE_USERS_KEY, this.users);
  }

  // --- 1. AUTHENTICATION & USER MANAGEMENT ---
  public verifyCredentials(
    usernameOrEmail: string,
    passwordAttempt: string
  ): { success: boolean; user?: UserProfile; error?: string } {
    this.init();
    const query = usernameOrEmail.trim().toLowerCase();
    const user = this.users.find(
      (u) => u.username.toLowerCase() === query || u.email.toLowerCase() === query
    );

    if (!user) {
      this.recordActivity({
        user_id: 'guest',
        username: query || 'unknown',
        role: 'VIEWER',
        action: 'FAILED_LOGIN_UNKNOWN_USER',
        details: `Login rejected for unregistered user ID "${query}".`,
      });
      return { success: false, error: 'User ID not found. Access denied.' };
    }

    if (!user.is_active) {
      return { success: false, error: 'User account has been deactivated. Contact Administrator.' };
    }

    if (user.passwordHash !== passwordAttempt) {
      this.recordActivity({
        user_id: user.id,
        username: user.username,
        role: user.role,
        action: 'FAILED_LOGIN_PASSWORD_MISMATCH',
        details: `Incorrect password attempt for user "${user.username}".`,
      });
      return { success: false, error: 'Incorrect password. Please verify your credentials.' };
    }

    // Success: Update last login
    user.last_login_at = new Date().toISOString();
    this.saveUsers();

    // Map to UserProfile
    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assigned_store_id: user.assigned_store_id,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      username: user.username,
      is_super_admin: user.is_super_admin,
    };

    // Record session & activity
    this.recordSession(user);
    this.recordActivity({
      user_id: user.id,
      username: user.username,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      details: `Successful authenticated login session opened for ${user.name} (${user.role}).`,
    });

    return { success: true, user: profile };
  }

  public getAllUsers(): UserAccount[] {
    this.init();
    return [...this.users];
  }

  public createUser(input: {
    username: string;
    name: string;
    email: string;
    password: string;
    role: AppRole;
    assigned_store_id?: StoreId;
  }): { success: boolean; error?: string; user?: UserAccount } {
    this.init();
    const cleanUsername = input.username.trim().toLowerCase();
    if (!cleanUsername) return { success: false, error: 'User ID (Username) is required.' };
    if (!input.password || input.password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    const exists = this.users.some(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === input.email.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, error: `User ID "${cleanUsername}" or email is already registered.` };
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now().toString(36)}`,
      username: cleanUsername,
      name: input.name.trim() || cleanUsername,
      email: input.email.trim() || `${cleanUsername}@mybimi.jp`,
      passwordHash: input.password,
      role: input.role,
      assigned_store_id: input.assigned_store_id,
      is_active: true,
      created_at: new Date().toISOString(),
      last_login_at: undefined,
    };

    this.users.push(newUser);
    this.saveUsers();

    this.recordDataEdit({
      entity_type: 'user',
      entity_id: newUser.id,
      entity_name: newUser.username,
      action: 'CREATE',
      description: `Created new user account "${newUser.username}" with role [${newUser.role}].`,
      user_id: 'admin',
      user_name: 'Super Admin',
      user_role: 'ADMIN',
    });

    return { success: true, user: newUser };
  }

  public updateUserRole(userId: string, newRole: AppRole, editorName = 'tohriyo'): { success: boolean; error?: string } {
    this.init();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    const oldRole = user.role;
    user.role = newRole;
    this.saveUsers();

    this.recordDataEdit({
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.username,
      action: 'ROLE_CHANGE',
      description: `Updated role for user "${user.username}" from [${oldRole}] to [${newRole}].`,
      user_id: 'admin',
      user_name: editorName,
      user_role: 'ADMIN',
      diff: [{ field: 'role', before: oldRole, after: newRole }],
    });

    return { success: true };
  }

  public updateUserPassword(userId: string, newPassword: string): { success: boolean; error?: string } {
    this.init();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    user.passwordHash = newPassword;
    this.saveUsers();
    return { success: true };
  }

  public toggleUserActive(userId: string, editorName = 'tohriyo'): { success: boolean; error?: string; is_active?: boolean } {
    this.init();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.username === 'tohriyo') {
      return { success: false, error: 'The primary super admin account cannot be deactivated.' };
    }

    user.is_active = !user.is_active;
    this.saveUsers();

    this.recordDataEdit({
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.username,
      action: 'UPDATE',
      description: `User "${user.username}" was ${user.is_active ? 'activated' : 'deactivated'}.`,
      user_id: 'admin',
      user_name: editorName,
      user_role: 'ADMIN',
      diff: [{ field: 'is_active', before: !user.is_active, after: user.is_active }],
    });

    return { success: true, is_active: user.is_active };
  }

  public toggleUserStatus(userId: string, editorName = 'tohriyo'): { success: boolean; error?: string; is_active?: boolean } {
    return this.toggleUserActive(userId, editorName);
  }

  public deleteUser(userId: string): { success: boolean; error?: string } {
    this.init();
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };
    if (user.username === 'tohriyo' || user.username === 'sachou') {
      return { success: false, error: 'Core system accounts (tohriyo, sachou) cannot be deleted.' };
    }

    this.users = this.users.filter((u) => u.id !== userId);
    this.saveUsers();
    return { success: true };
  }

  // --- 2. USER USES & SESSION MONITORING ---
  private recordSession(user: UserAccount) {
    const session: UserSessionRecord = {
      id: `sess-${Date.now().toString(36)}`,
      user_id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      ip_client: '127.0.0.1 / Vercel HTTPS Edge',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Client',
      login_time: new Date().toISOString(),
      last_active_time: new Date().toISOString(),
      status: 'ONLINE',
    };

    // Mark previous sessions for this user as expired
    this.sessions = this.sessions.map((s) =>
      s.user_id === user.id && s.status === 'ONLINE' ? { ...s, status: 'IDLE' } : s
    );

    this.sessions.unshift(session);
    if (this.sessions.length > 50) this.sessions.pop();
    this.saveStorage(STORAGE_SESSIONS_KEY, this.sessions);
  }

  public recordActivity(activity: Omit<UserActivityRecord, 'id' | 'timestamp'>) {
    const record: UserActivityRecord = {
      ...activity,
      id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.activities.unshift(record);
    if (this.activities.length > 200) this.activities.pop();
    this.saveStorage(STORAGE_ACTIVITIES_KEY, this.activities);
  }

  public getSessions(): UserSessionRecord[] {
    return [...this.sessions];
  }

  public getActivities(): UserActivityRecord[] {
    return [...this.activities];
  }

  // --- 3. DATA EDIT HISTORY ---
  public recordDataEdit(entry: Omit<DataEditRecord, 'id' | 'timestamp'>) {
    const record: DataEditRecord = {
      ...entry,
      id: `edit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.dataEdits.unshift(record);
    if (this.dataEdits.length > 300) this.dataEdits.pop();
    this.saveStorage(STORAGE_EDITS_KEY, this.dataEdits);

    // Also record user activity
    this.recordActivity({
      user_id: entry.user_id,
      username: entry.user_name,
      role: (entry.user_role as AppRole) || 'ADMIN',
      action: `DATA_${entry.action}_${entry.entity_type.toUpperCase()}`,
      details: entry.description,
    });
  }

  public getDataEdits(): DataEditRecord[] {
    return [...this.dataEdits];
  }

  public clearDataEdits() {
    this.dataEdits = [];
    this.saveStorage(STORAGE_EDITS_KEY, this.dataEdits);
  }

  // --- 4. CRASH & ERROR LOG TRACKING ---
  public recordCrash(
    error: Error | string,
    componentStack?: string,
    severity: 'CRITICAL' | 'ERROR' | 'WARNING' = 'ERROR',
    userContext?: { id?: string; username?: string }
  ) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const record: CrashLogRecord = {
      id: `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      error_name: errorObj.name || 'ApplicationException',
      message: errorObj.message || String(error),
      stack: errorObj.stack,
      component_stack: componentStack,
      severity,
      user_id: userContext?.id,
      username: userContext?.username,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
    };

    this.crashLogs.unshift(record);
    if (this.crashLogs.length > 100) this.crashLogs.pop();
    this.saveStorage(STORAGE_CRASHES_KEY, this.crashLogs);
  }

  public getCrashLogs(): CrashLogRecord[] {
    return [...this.crashLogs];
  }

  public clearCrashLogs() {
    this.crashLogs = [];
    this.saveStorage(STORAGE_CRASHES_KEY, this.crashLogs);
  }

  private attachGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.recordCrash(
        event.error || event.message,
        undefined,
        'ERROR',
        { username: 'client-runtime' }
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordCrash(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        undefined,
        'CRITICAL',
        { username: 'unhandled-promise' }
      );
    });
  }
}

export const securityMonitoringService = new SecurityMonitoringService();
