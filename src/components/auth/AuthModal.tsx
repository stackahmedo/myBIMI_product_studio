import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Database,
  ArrowRight,
  Sparkles,
  RefreshCw,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppRole, StoreId } from '../../types/database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const {
    user,
    profile,
    role,
    isConfigured,
    authError,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    switchDemoRole,
    clearAuthError,
  } = useAuth();

  const { stores, addToast } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('MANAGER');
  const [assignedStoreId, setAssignedStoreId] = useState<StoreId | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearAuthError();

    const res = await signIn(email, password);
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Signed in as ${email}.`,
      });
      onClose();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearAuthError();

    const res = await signUp(email, password, fullName, selectedRole, assignedStoreId || undefined);
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Account Created',
        message: isConfigured
          ? 'Confirmation email sent (or session active). Welcome to Product Studio!'
          : 'Demo account registered and activated.',
      });
      onClose();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearAuthError();

    const res = await resetPasswordForEmail(email);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(
        isConfigured
          ? `Password reset instructions sent to ${email}. Check your inbox.`
          : `Demo mode: Password reset simulated for ${email}.`
      );
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearAuthError();

    const res = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your account password has been updated.',
      });
      setMode('login');
      setPassword(newPassword);
    }
  };

  const handleQuickDemoSelect = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword('demo-password-123');
    switchDemoRole(acc.role);
    addToast({
      type: 'info',
      title: `Switched to ${acc.role}`,
      message: `Operating as ${acc.name}.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs overflow-y-auto animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg text-emerald-400">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Product Studio Auth</h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isConfigured ? 'Supabase Live' : 'Demo Local Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Role-Based Access Control (RBAC) & Supabase Auth
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-600">
          <button
            onClick={() => {
              setMode('login');
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-slate-900 text-slate-900 bg-white font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-slate-900 text-slate-900 bg-white font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => {
              setMode('forgot');
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'forgot'
                ? 'border-slate-900 text-slate-900 bg-white font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          {/* Messages */}
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Error</p>
                <p className="mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Success</p>
                <p className="mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. k.tanaka@mybimi.jp"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Supabase Auth'}</span>
              </button>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kenji Tanaka"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@mybimi.jp"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Assignment</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none font-medium"
                  >
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="MANAGER">MANAGER (Products, Inventory, Sourcing)</option>
                    <option value="STORE_STAFF">STORE_STAFF (Stock & Price Tags)</option>
                    <option value="VIEWER">VIEWER (Read Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Branch</label>
                  <select
                    value={assignedStoreId}
                    onChange={(e) => setAssignedStoreId(e.target.value as StoreId)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  >
                    <option value="">All / Headquarters</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                <span>Register User Profile</span>
              </button>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-500">
                Enter your account email to receive a secure password recovery link via Supabase Auth.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@mybimi.jp"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          {/* MODE: RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <p className="text-xs text-slate-500">
                Enter your new password to complete the credentials update.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* Quick Demo Switcher Strip (Allows immediate testing of all 4 roles) */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1-Click Role Switcher (Test RBAC)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Current Role: <strong className="text-slate-900">{role}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemoSelect(acc)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    role === acc.role
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{acc.role}</span>
                    {role === acc.role && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className={`text-[10px] truncate mt-0.5 ${role === acc.role ? 'text-slate-300' : 'text-slate-500'}`}>
                    {acc.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
