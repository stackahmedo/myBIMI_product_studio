import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { securityMonitoringService } from '../../services/securityMonitoringService';
import { AppRole } from '../../types/database';

export const LoginView: React.FC = () => {
  const { signIn, isLoading, authError, clearAuthError } = useAuth();

  // Mode: 'login' | 'register' | 'register-success' | 'forgot-password'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'register-success' | 'forgot-password'>('login');

  // Login form state
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Registration form state
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<AppRole>('STORE_STAFF');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [registeredUsername, setRegisteredUsername] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    const cleanUsername = usernameOrEmail.trim();
    if (!cleanUsername) {
      setLocalError('Please enter your User ID or Username.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn(cleanUsername, password);
      if (!res.success) {
        setLocalError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setLocalError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cleanUser = regUsername.trim().toLowerCase();
    if (!cleanUser) {
      setRegError('Please choose a User ID / Username.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setRegError('Password must be at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegSubmitting(true);
    try {
      const result = securityMonitoringService.requestAccountRegistration({
        username: cleanUser,
        name: regName.trim() || cleanUser,
        email: regEmail.trim() || `${cleanUser}@mybimi.jp`,
        password: regPassword,
        requestedRole: regRole,
      });

      if (result.success) {
        setRegisteredUsername(cleanUser);
        setViewMode('register-success');
        setRegUsername('');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setRegError(result.error || 'Failed to submit registration request.');
      }
    } catch (err: any) {
      setRegError(err.message || 'Error submitting registration.');
    } finally {
      setRegSubmitting(false);
    }
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-[#F7F8F9] text-slate-800 flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Organic Mint Pastel Curve (Top Right) */}
      <div
        className="absolute -top-32 -right-32 w-[34rem] h-[34rem] rounded-full pointer-events-none opacity-80"
        style={{
          background: 'radial-gradient(circle at 60% 40%, #D4EADB 0%, #C7E2D0 50%, transparent 75%)',
          filter: 'blur(30px)',
        }}
      />
      {/* Second soft mint accent blob */}
      <svg
        className="absolute top-0 right-0 w-[28rem] h-[28rem] pointer-events-none opacity-90 text-[#D2E8DB]"
        viewBox="0 0 400 400"
        fill="currentColor"
      >
        <path d="M150,0 C240,40 360,60 400,160 L400,0 Z" />
      </svg>

      {/* Organic Warm Blush Peach Curve (Bottom Left) */}
      <div
        className="absolute -bottom-36 -left-36 w-[36rem] h-[36rem] rounded-full pointer-events-none opacity-80"
        style={{
          background: 'radial-gradient(circle at 40% 60%, #FDE7E3 0%, #FCDAD4 50%, transparent 75%)',
          filter: 'blur(30px)',
        }}
      />
      {/* Second soft peach accent blob */}
      <svg
        className="absolute bottom-0 left-0 w-[28rem] h-[28rem] pointer-events-none opacity-90 text-[#FDE8E4]"
        viewBox="0 0 400 400"
        fill="currentColor"
      >
        <path d="M0,250 C80,280 180,350 220,400 L0,400 Z" />
      </svg>

      {/* Center White Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[2.25rem] p-7 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 transition-all">
        {/* VIEW 1: Standard Login Screen matching Mockup */}
        {viewMode === 'login' && (
          <div>
            {/* Logo */}
            <div className="flex justify-center mb-3">
              <img
                src="/product-studio-logo.png"
                alt="Product STUDIO"
                className="h-16 w-auto object-contain"
              />
            </div>

            {/* Subtitle with orange bullet points */}
            <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-slate-500 mb-6 flex-wrap">
              <span>Product Information</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F58220] inline-block shrink-0" />
              <span>Price Tags</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F58220] inline-block shrink-0" />
              <span>Marketing Studio</span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* User ID Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5 stroke-[1.75]" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="User ID / Username"
                  disabled={submitting || isLoading}
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:ring-1 focus:ring-[#005A43] focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 stroke-[1.75]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={submitting || isLoading}
                  className="w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-slate-200/90 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:ring-1 focus:ring-[#005A43] focus:bg-white transition-all font-medium font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 stroke-[1.75]" />
                  ) : (
                    <Eye className="w-5 h-5 stroke-[1.75]" />
                  )}
                </button>
              </div>

              {/* Remember me & Forgot password? */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      rememberMe
                        ? 'bg-[#005A43] text-white'
                        : 'border border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span
                    onClick={() => setRememberMe(!rememberMe)}
                    className="text-xs text-slate-700 font-medium"
                  >
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setViewMode('forgot-password')}
                  className="text-xs font-medium text-[#005A43] hover:text-[#004735] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full mt-2 py-3.5 bg-[#005A43] hover:bg-[#004735] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{submitting ? 'Authenticating...' : 'Login to Product Studio'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider: Don't have an account? */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Create Account Outline Pill Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  setRegError(null);
                  setViewMode('register');
                }}
                className="w-full sm:w-auto px-7 py-2.5 bg-white border border-[#005A43] hover:bg-[#005A43]/5 active:scale-[0.99] text-[#005A43] font-semibold text-xs rounded-xl sm:rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Create account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Footer with Secure Access Divider */}
            <div className="relative mt-7 mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-white px-3 text-slate-400 font-medium tracking-wider uppercase">
                  Secure Access
                </span>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 leading-relaxed">
              <p>© 2026 Product Studio. All Rights Reserved.</p>
              <p>by My BIMI - Central Operations</p>
            </div>
          </div>
        )}

        {/* VIEW 2: Create Account / Registration (Approval by Sachou or Admin) */}
        {viewMode === 'register' && (
          <div>
            <div className="flex justify-center mb-2">
              <img
                src="/product-studio-logo.png"
                alt="Product STUDIO"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Create Account</h2>
              <p className="text-xs text-slate-500">Request operator access to Product Studio</p>
            </div>

            {/* Mandatory Approval Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 mb-4 leading-relaxed">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
                  Approval Required
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  New accounts require authorization by <strong>Sachou (Manager)</strong> or{' '}
                  <strong>Admin</strong> before login access is activated.
                </p>
              </div>
            </div>

            {/* Register Error */}
            {regError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium">{regError}</div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Requested Username */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Desired User ID / Username"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:bg-white"
                />
              </div>

              {/* Full Name */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Full Name (e.g. Tanaka Taro)"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:bg-white"
                />
              </div>

              {/* Email Address */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Email Address (optional)"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:bg-white"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Password (min 4 characters)"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:bg-white font-sans"
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:bg-white font-sans"
                />
              </div>

              {/* Requested Role */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Requested Role / Department
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as AppRole)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#005A43]"
                >
                  <option value="STORE_STAFF">Store Staff (Price Tags & Shelf Operations)</option>
                  <option value="MANAGER">Store Manager / Operations</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={regSubmitting}
                className="w-full mt-3 py-3 bg-[#005A43] hover:bg-[#004735] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{regSubmitting ? 'Submitting Request...' : 'Submit Account for Approval'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Back to Login */}
              <button
                type="button"
                onClick={() => {
                  setRegError(null);
                  setViewMode('login');
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: Registration Success / Pending Confirmation */}
        {viewMode === 'register-success' && (
          <div className="text-center py-2 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-[#005A43] rounded-full mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Registration Submitted!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your account application for <strong className="text-slate-800">@{registeredUsername}</strong> is now pending authorization.
              </p>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Next Step: Sachou or Admin Approval</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                As per company security policy, new Product Studio accounts cannot log in until approved by <strong>Sachou (Manager)</strong> or <strong>Admin (Tohriyo)</strong>.
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Please inform Sachou or Admin to approve your User ID in their <strong>Users & Access Control</strong> panel.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail(registeredUsername);
                setViewMode('login');
              }}
              className="w-full py-3 bg-[#005A43] hover:bg-[#004735] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIEW 4: Forgot Password / Credentials Support */}
        {viewMode === 'forgot-password' && (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Password Assistance</h3>
              <p className="text-xs text-slate-500 mt-1">
                Centralized password recovery and account resets
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Contact Authorized Supervisors:</p>
              <ul className="space-y-1.5 text-[11px] list-disc pl-4 text-slate-600">
                <li>
                  <strong>Tohriyo (Super Admin)</strong> - Can reset any account credential.
                </li>
                <li>
                  <strong>Sachou (Manager)</strong> - Can verify operational access and approve updates.
                </li>
              </ul>
              <p className="text-[11px] text-slate-500 pt-1">
                For security reasons, password resets are processed through internal supervisor verification.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('login')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
