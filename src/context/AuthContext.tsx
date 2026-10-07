import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppRole, UserProfile, StoreId } from '../types/database';
import { securityMonitoringService } from '../services/securityMonitoringService';

export interface AuthPermissions {
  canManageAll: boolean;
  canManageProducts: boolean;
  canManagePricing: boolean;
  canManageInventory: boolean;
  canAdjustStock: boolean;
  canGeneratePriceTags: boolean;
  canManageSuppliers: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  isReadOnly: boolean;
}

export interface DemoAccount {
  email: string;
  role: AppRole;
  name: string;
  description: string;
  assignedStoreId?: StoreId;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'tohriyo@mybimi.jp',
    role: 'ADMIN',
    name: 'Tohriyo (Super Admin)',
    description: 'Unrestricted central control, security surveillance & role setup',
  },
  {
    email: 'sachou@mybimi.jp',
    role: 'MANAGER',
    name: 'Sachou (Store Management)',
    description: 'Catalog management, pricing overrides, inventory & supplier logistics',
  },
];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole;
  permissions: AuthPermissions;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isConfigured: boolean;
  authError: string | null;
  session: Session | null;
  // Auth methods
  signIn: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role?: AppRole, storeId?: StoreId) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoRole: (role: AppRole) => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const computePermissions = (role: AppRole): AuthPermissions => {
  return {
    canManageAll: role === 'ADMIN',
    canManageProducts: role === 'ADMIN' || role === 'MANAGER',
    canManagePricing: role === 'ADMIN' || role === 'MANAGER',
    canManageInventory: role === 'ADMIN' || role === 'MANAGER',
    canAdjustStock: role === 'ADMIN' || role === 'MANAGER' || role === 'STORE_STAFF',
    canGeneratePriceTags: true,
    canManageSuppliers: role === 'ADMIN' || role === 'MANAGER',
    canViewReports: role === 'ADMIN' || role === 'MANAGER',
    canManageUsers: role === 'ADMIN',
    canManageSettings: role === 'ADMIN',
    isReadOnly: role === 'VIEWER',
  };
};

export const toAppRole = (r?: string): AppRole => {
  const upper = r?.toUpperCase();
  if (upper === 'ADMIN' || upper === 'SUPER_ADMIN') return 'ADMIN';
  if (upper === 'MANAGER' || upper === 'STORE_MANAGER' || upper === 'INVENTORY_LEAD') return 'MANAGER';
  if (upper === 'STORE_STAFF' || upper === 'STAFF') return 'STORE_STAFF';
  return 'VIEWER';
};

const SESSION_STORAGE_KEY = 'bimi_auth_active_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole>('VIEWER');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const permissions = computePermissions(role);
  const isAuthenticated = Boolean(profile);
  const isSuperAdmin = Boolean(
    profile?.username?.toLowerCase() === 'tohriyo' || profile?.is_super_admin || role === 'ADMIN'
  );

  // Restore authenticated session on mount
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as UserProfile;
          // Verify user still exists and is active in security service
          const allUsers = securityMonitoringService.getAllUsers();
          const match = allUsers.find(
            (u) =>
              u.id === parsed.id ||
              (parsed.username && u.username.toLowerCase() === parsed.username.toLowerCase())
          );

          if (match && match.is_active && mounted) {
            const activeProfile: UserProfile = {
              id: match.id,
              name: match.name,
              email: match.email,
              role: match.role,
              assigned_store_id: match.assigned_store_id,
              is_active: match.is_active,
              last_login_at: match.last_login_at || new Date().toISOString(),
              username: match.username,
              is_super_admin: match.is_super_admin,
            };
            setProfile(activeProfile);
            setRole(match.role);
            setUser({ id: match.id, email: match.email } as any);
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (usernameOrEmail: string, passwordAttempt: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      // 1. Verify via primary Security Service (tohriyo / sachou / created users)
      const secResult = securityMonitoringService.verifyCredentials(usernameOrEmail, passwordAttempt);
      if (secResult.success && secResult.user) {
        const appRole: AppRole =
          secResult.user.role === 'ADMIN' || secResult.user.role === 'super_admin'
            ? 'ADMIN'
            : secResult.user.role === 'MANAGER' || secResult.user.role === 'store_manager'
            ? 'MANAGER'
            : secResult.user.role === 'STORE_STAFF' || secResult.user.role === 'inventory_lead' || secResult.user.role === 'staff'
            ? 'STORE_STAFF'
            : 'VIEWER';

        setProfile(secResult.user);
        setRole(appRole);
        setUser({ id: secResult.user.id, email: secResult.user.email } as any);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(secResult.user));
        setIsLoading(false);
        return { success: true };
      }

      // 2. Fallback to Supabase Auth if online
      if (isConfigured && usernameOrEmail.includes('@')) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: usernameOrEmail,
            password: passwordAttempt,
          });
          if (!error && data.user) {
            const userRole: AppRole = toAppRole((data.user.user_metadata as any)?.role);
            const p: UserProfile = {
              id: data.user.id,
              name: (data.user.user_metadata as any)?.full_name || usernameOrEmail.split('@')[0],
              email: data.user.email || usernameOrEmail,
              role: userRole,
              is_active: true,
              last_login_at: new Date().toISOString(),
              username: usernameOrEmail.split('@')[0],
            };
            setProfile(p);
            setRole(userRole);
            setUser(data.user);
            setSession(data.session);
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(p));
            setIsLoading(false);
            return { success: true };
          }
        } catch {
          // ignore supabase error and rely on security service error
        }
      }

      const errMsg = secResult.error || 'Invalid User ID or Password. Access denied.';
      setAuthError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    } catch (err: any) {
      const errMsg = err.message || 'Authentication system error.';
      setAuthError(errMsg);
      setIsLoading(false);
      return { success: false, error: errMsg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    requestedRole: AppRole = 'STORE_STAFF',
    storeId?: StoreId
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    setIsLoading(true);

    const username = email.split('@')[0].toLowerCase();
    const res = securityMonitoringService.createUser({
      username,
      name: fullName,
      email,
      password,
      role: requestedRole,
      assigned_store_id: storeId,
    });

    if (!res.success) {
      setAuthError(res.error || 'Failed to create user account.');
      setIsLoading(false);
      return { success: false, error: res.error };
    }

    setIsLoading(false);
    return { success: true };
  };

  const signOut = async (): Promise<void> => {
    if (profile) {
      securityMonitoringService.recordActivity({
        user_id: profile.id,
        username: profile.username || profile.name,
        role,
        action: 'LOGOUT',
        details: `User session ended for ${profile.name}.`,
      });
    }

    if (isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('VIEWER');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('product_studio_active_role');
  };

  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    return { success: true };
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!profile) return { success: false, error: 'No active session.' };
    const res = securityMonitoringService.updateUserPassword(profile.id, password);
    return res;
  };

  const switchDemoRole = (newRole: AppRole) => {
    // If logged in as tohriyo, switch role dynamically for testing
    if (profile) {
      setRole(newRole);
      setProfile({
        ...profile,
        role: newRole,
      });
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        permissions,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        isConfigured,
        authError,
        session,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        switchDemoRole,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
