import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppRole, UserProfile, StoreId } from '../types/database';

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
    email: 'admin@mybimi.jp',
    role: 'ADMIN',
    name: 'Kenji Tanaka (Administrator)',
    description: 'Full unrestricted system access, user administration & settings',
  },
  {
    email: 'manager@mybimi.jp',
    role: 'MANAGER',
    name: 'Sayaka Sato (Store Manager)',
    description: 'Products, branch pricing, inventory & supplier management',
    assignedStoreId: 'store-shin-koiwa',
  },
  {
    email: 'staff@mybimi.jp',
    role: 'STORE_STAFF',
    name: 'Haruto Takahashi (Retail Staff)',
    description: 'View products, stock adjustment & shelf price tag generation',
    assignedStoreId: 'store-shin-koiwa',
  },
  {
    email: 'viewer@mybimi.jp',
    role: 'VIEWER',
    name: 'Auditor Guest (Viewer)',
    description: 'Read-only catalog & stock observation (no write access)',
  },
];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole;
  permissions: AuthPermissions;
  isLoading: boolean;
  isConfigured: boolean;
  authError: string | null;
  session: Session | null;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role?: AppRole, storeId?: StoreId) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  // Role switcher / Demo login
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
    canGeneratePriceTags: true, // All roles can print or generate price cards
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>({
    id: 'user-admin-01',
    name: 'Kenji Tanaka',
    email: 'admin@mybimi.jp',
    role: 'ADMIN',
    is_active: true,
    last_login_at: new Date().toISOString(),
  });
  const [role, setRole] = useState<AppRole>('ADMIN');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const permissions = computePermissions(role);

  // Load user profile from Supabase profiles table
  const fetchUserProfile = async (userId: string, userEmail: string): Promise<UserProfile> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Fallback default profile - always default to safe least-privilege VIEWER
        return {
          id: userId,
          email: userEmail,
          name: userEmail.split('@')[0],
          role: 'VIEWER',
          is_active: true,
          last_login_at: new Date().toISOString(),
        };
      }

      return {
        id: data.id,
        email: data.email,
        name: data.full_name || data.email.split('@')[0],
        role: (data.role?.toUpperCase() as AppRole) || 'VIEWER',
        assigned_store_id: data.assigned_store_id,
        is_active: data.is_active ?? true,
        last_login_at: data.last_login_at || new Date().toISOString(),
      };
    } catch {
      return {
        id: userId,
        email: userEmail,
        name: userEmail.split('@')[0],
        role: 'VIEWER',
        is_active: true,
        last_login_at: new Date().toISOString(),
      };
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      // In demo/fallback mode: preserve persistent role stored in localStorage
      try {
        const savedDemoRole = localStorage.getItem('product_studio_active_role') as AppRole;
        if (savedDemoRole && ['ADMIN', 'MANAGER', 'STORE_STAFF', 'VIEWER'].includes(savedDemoRole)) {
          const match = DEMO_ACCOUNTS.find((a) => a.role === savedDemoRole) || DEMO_ACCOUNTS[0];
          setRole(match.role);
          setProfile({
            id: `demo-${match.role.toLowerCase()}`,
            name: match.name,
            email: match.email,
            role: match.role,
            assigned_store_id: match.assignedStoreId,
            is_active: true,
            last_login_at: new Date().toISOString(),
          });
        }
      } catch {
        // ignore storage errors
      }
      setIsLoading(false);
      return;
    }

    // Live Supabase Authentication
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          setSession(session);
          setUser(session.user);
          const p = await fetchUserProfile(session.user.id, session.user.email || '');
          if (mounted) {
            setProfile(p);
            setRole(toAppRole(p.role));
          }
        }
      } catch (err: any) {
        console.error('Supabase session load error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Auth State Changes (Login, Logout, Token Refresh, Password Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        const p = await fetchUserProfile(newSession.user.id, newSession.user.email || '');
        if (mounted) {
          setProfile(p);
          setRole(toAppRole(p.role));
        }
      } else {
        // Logged out
        setProfile(null);
        setRole('VIEWER');
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    setIsLoading(true);

    if (!isConfigured) {
      // Offline / Demo authentication
      const match = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (match) {
        setRole(match.role);
        setProfile({
          id: `demo-${match.role.toLowerCase()}`,
          name: match.name,
          email: match.email,
          role: match.role,
          assigned_store_id: match.assignedStoreId,
          is_active: true,
          last_login_at: new Date().toISOString(),
        });
        localStorage.setItem('product_studio_active_role', match.role);
        setIsLoading(false);
        return { success: true };
      }
      // If any other credentials entered, allow demo login with MANAGER
      setRole('MANAGER');
      setProfile({
        id: `demo-user-${Date.now().toString(36)}`,
        name: email.split('@')[0],
        email,
        role: 'MANAGER',
        is_active: true,
        last_login_at: new Date().toISOString(),
      });
      localStorage.setItem('product_studio_active_role', 'MANAGER');
      setIsLoading(false);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        const p = await fetchUserProfile(data.user.id, data.user.email || email);
        setProfile(p);
        setRole(toAppRole(p.role));
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Authentication failed';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
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

    if (!isConfigured) {
      setRole(requestedRole);
      setProfile({
        id: `demo-reg-${Date.now().toString(36)}`,
        name: fullName,
        email,
        role: requestedRole,
        assigned_store_id: storeId,
        is_active: true,
        last_login_at: new Date().toISOString(),
      });
      localStorage.setItem('product_studio_active_role', requestedRole);
      setIsLoading(false);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: requestedRole,
            assigned_store_id: storeId,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const p = await fetchUserProfile(data.user.id, data.user.email || email);
        setProfile(p);
        setRole(toAppRole(p.role));
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const signOut = async (): Promise<void> => {
    if (isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('VIEWER');
    localStorage.removeItem('product_studio_active_role');
  };

  const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed' };
    }
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password update failed' };
    }
  };

  const switchDemoRole = (newRole: AppRole) => {
    const match = DEMO_ACCOUNTS.find((a) => a.role === newRole) || DEMO_ACCOUNTS[0];
    setRole(newRole);
    setProfile({
      id: `demo-${newRole.toLowerCase()}`,
      name: match.name,
      email: match.email,
      role: newRole,
      assigned_store_id: match.assignedStoreId,
      is_active: true,
      last_login_at: new Date().toISOString(),
    });
    localStorage.setItem('product_studio_active_role', newRole);
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
