import React, { useState } from 'react';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { signIn, isLoading, authError, clearAuthError } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!usernameOrEmail.trim()) {
      setLocalError('Please enter your User ID or Email.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn(usernameOrEmail.trim(), password);
      if (!res.success) {
        setLocalError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setLocalError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setSubmitting(false);
    }
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none font-sans">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-md border border-white/20 flex items-center">
            <img
              src="/product-studio-logo.png"
              alt="Product STUDIO by My BIMI"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                OFFICIAL STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">by My BIMI · Central Operations</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Gate · 256-bit AES Authenticated</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/60 relative">
          {/* Card Header */}
          <div className="text-center space-y-3 mb-7">
            <div className="flex justify-center">
              <div className="bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 inline-flex items-center justify-center">
                <img
                  src="/product-studio-logo.png"
                  alt="Product STUDIO"
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Restricted Login</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                Access is restricted to authorized operators only. Please authenticate with your User ID and password.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID Field */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-300 block">User ID / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. tohriyo or sachou"
                  disabled={submitting || isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  disabled={submitting || isLoading}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-800/80 border border-slate-700/80 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{submitting ? 'Verifying Credentials...' : 'Authenticate & Unlock Studio'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Pre-configured Authorized Accounts Notice */}
          <div className="mt-7 pt-5 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-semibold text-[10px] uppercase tracking-wider">
              <span>Security Policy</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" />
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 text-left leading-relaxed">
              Without an authorized User ID and password, access to product catalog, inventory matrices, store retail pricing, and database records is strictly prohibited.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} MyBIMI HALAL 360 STORE · Developed by AHMED FAIYAZ</p>
      </footer>
    </div>
  );
};
