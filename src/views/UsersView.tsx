import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Check,
  X,
  Plus,
  UserPlus,
  KeyRound,
  Store as StoreIcon,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Power,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  securityMonitoringService,
  UserAccount,
} from '../services/securityMonitoringService';
import { AppRole, StoreId } from '../types/database';

export const UsersView: React.FC = () => {
  const { stores, addToast } = useApp();
  const { profile, role } = useAuth();

  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<AppRole>('MANAGER');
  const [formStoreId, setFormStoreId] = useState<StoreId | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  const isTohriyo =
    profile?.username?.toLowerCase() === 'tohriyo' ||
    profile?.is_super_admin === true ||
    (role === 'ADMIN' && profile?.name?.toLowerCase().includes('tohriyo'));

  const loadUsers = () => {
    const list = securityMonitoringService.getAllUsers();
    setUserList(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = (userId: string, newRole: AppRole, targetUser: UserAccount) => {
    if (targetUser.username.toLowerCase() === 'tohriyo' && newRole !== 'ADMIN') {
      addToast({
        type: 'error',
        title: 'Action Prohibited',
        message: 'The core Super Admin account "tohriyo" cannot be demoted.',
      });
      return;
    }

    const res = securityMonitoringService.updateUserRole(
      userId,
      newRole,
      profile?.name || profile?.username || 'tohriyo'
    );

    if (res.success) {
      loadUsers();
      addToast({
        type: 'success',
        title: 'User Role Updated',
        message: `Role for @${targetUser.username} updated to ${newRole}.`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: res.error || 'Failed to update user role.',
      });
    }
  };

  const handleToggleStatus = (targetUser: UserAccount) => {
    if (targetUser.username.toLowerCase() === 'tohriyo') {
      addToast({
        type: 'error',
        title: 'Action Prohibited',
        message: 'The core Super Admin account cannot be deactivated.',
      });
      return;
    }

    const res = securityMonitoringService.toggleUserStatus(
      targetUser.id,
      profile?.name || profile?.username || 'tohriyo'
    );

    if (res.success) {
      loadUsers();
      addToast({
        type: 'info',
        title: 'User Status Updated',
        message: `Account @${targetUser.username} is now ${res.is_active ? 'ACTIVE' : 'DEACTIVATED'}.`,
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formUsername.trim()) {
      setFormError('User ID (Username) is required.');
      return;
    }
    if (!formPassword || formPassword.length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }

    const res = securityMonitoringService.createUser({
      username: formUsername,
      name: formName || formUsername,
      email: formEmail || `${formUsername.toLowerCase().trim()}@mybimi.jp`,
      password: formPassword,
      role: formRole,
      assigned_store_id: formStoreId || undefined,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create user account.');
      return;
    }

    addToast({
      type: 'success',
      title: 'User Created Successfully',
      message: `User ID @${res.user?.username} can now log into Product Studio.`,
    });

    // Reset & close
    setFormUsername('');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('MANAGER');
    setFormStoreId('');
    setIsCreateModalOpen(false);
    loadUsers();
  };

  const permissionsMatrix = [
    { permission: 'Super Admin Security & Monitor Panel', superAdmin: true, storeManager: false, inventoryLead: false, staff: false },
    { permission: 'Manage Master Catalog & SKUs', superAdmin: true, storeManager: true, inventoryLead: true, staff: false },
    { permission: 'Override Store Retail Prices', superAdmin: true, storeManager: true, inventoryLead: false, staff: false },
    { permission: 'Execute Physical Stock Adjustments', superAdmin: true, storeManager: true, inventoryLead: true, staff: false },
    { permission: 'Inter-Branch Stock Transfers', superAdmin: true, storeManager: true, inventoryLead: true, staff: false },
    { permission: 'Print Shelf Price Tags & POP', superAdmin: true, storeManager: true, inventoryLead: true, staff: true },
    { permission: 'Trigger Website / POS Sync', superAdmin: true, storeManager: true, inventoryLead: false, staff: false },
    { permission: 'Create & Edit Store Branches', superAdmin: true, storeManager: false, inventoryLead: false, staff: false },
    { permission: 'Control User Roles & Access Credentials', superAdmin: true, storeManager: false, inventoryLead: false, staff: false },
    { permission: 'Inspect Audit Logs & Error Diagnostics', superAdmin: true, storeManager: true, inventoryLead: false, staff: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Users & Access Role Control
            </h1>
            {isTohriyo && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                tohriyo Control Enabled
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage authenticated User IDs, set access roles, and assign store locations.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Create User ID & Password</span>
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-800">
            Mandatory Authentication Gate Active
          </p>
          <p className="text-[11px] text-slate-500">
            Only users registered with a valid User ID and password can log in. User roles directly govern operational permissions across all branches.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <span>Registered Accounts</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {userList.length}
            </span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {isTohriyo ? 'Role setup & editing enabled' : 'Authorized user roster'}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {userList.map((u) => {
            const isSelf = profile?.username?.toLowerCase() === u.username.toLowerCase();
            const isCoreTohriyo = u.username.toLowerCase() === 'tohriyo';
            const isCoreSachou = u.username.toLowerCase() === 'sachou';
            const assignedStore = stores.find((s) => s.id === u.assigned_store_id);

            return (
              <div
                key={u.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  !u.is_active ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/40'
                }`}
              >
                {/* User info */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      isCoreTohriyo
                        ? 'bg-amber-500 text-white shadow-xs'
                        : isCoreSachou
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-xs text-slate-900">{u.name}</p>
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        @{u.username}
                      </span>
                      {isCoreTohriyo && (
                        <span className="font-mono text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                          CORE SUPER ADMIN
                        </span>
                      )}
                      {isCoreSachou && (
                        <span className="font-mono text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                          CORE MANAGER
                        </span>
                      )}
                      {isSelf && (
                        <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                          YOU (ACTIVE)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>{u.email}</span>
                      <span>•</span>
                      <span>
                        Branch: <strong>{assignedStore ? assignedStore.name : 'Central Master HQ'}</strong>
                      </span>
                      {u.last_login_at && (
                        <>
                          <span>•</span>
                          <span>Last login: {new Date(u.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role setup control & Status */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Role setup dropdown */}
                  <div className="flex flex-col items-end">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
                      Assigned Role
                    </label>
                    {isTohriyo && !isCoreTohriyo ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as AppRole, u)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                      >
                        <option value="ADMIN">ADMIN (Full Access)</option>
                        <option value="MANAGER">MANAGER (Ops & Pricing)</option>
                        <option value="STORE_STAFF">STORE_STAFF (Catalog/Stock)</option>
                        <option value="VIEWER">VIEWER (Read Only)</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'MANAGER'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : u.role === 'STORE_STAFF'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    )}
                  </div>

                  {/* Account status toggle */}
                  {!isCoreTohriyo && role === 'ADMIN' && (
                    <button
                      onClick={() => handleToggleStatus(u)}
                      title={u.is_active ? 'Deactivate user' : 'Activate user'}
                      className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        u.is_active
                          ? 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-900">
            Role Permissions Policy Matrix
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Defines granular operational actions across retail branches
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 font-medium">
                <th className="py-3 px-4 font-medium">SYSTEM PERMISSION</th>
                <th className="py-3 px-4 font-medium text-center">ADMIN (tohriyo)</th>
                <th className="py-3 px-4 font-medium text-center">MANAGER (sachou)</th>
                <th className="py-3 px-4 font-medium text-center">STORE STAFF</th>
                <th className="py-3 px-4 font-medium text-center">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissionsMatrix.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-900">{p.permission}</td>
                  <td className="py-3 px-4 text-center">
                    {p.superAdmin ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.storeManager ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.inventoryLead ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.staff ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  Create User ID & Credentials
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  User ID (Login Identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. kenji, staff1, akiko"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Kenji Tanaka"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@mybimi.jp"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role Setup *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AppRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="MANAGER">MANAGER</option>
                    <option value="STORE_STAFF">STORE_STAFF</option>
                    <option value="VIEWER">VIEWER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Branch
                  </label>
                  <select
                    value={formStoreId}
                    onChange={(e) => setFormStoreId(e.target.value as StoreId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="">Central Master HQ</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
