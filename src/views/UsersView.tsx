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
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Copy,
  Terminal,
  Sparkles,
  Trash2,
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
  const { profile, role, isDeveloper: authIsDeveloper } = useAuth();

  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Password visibility state (Developer inspection)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [revealAllPasswords, setRevealAllPasswords] = useState(false);

  // Edit User Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editRole, setEditRole] = useState<AppRole>('STORE_STAFF');
  const [editStoreId, setEditStoreId] = useState<StoreId | ''>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editApprovalStatus, setEditApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('APPROVED');
  const [editIsDeveloper, setEditIsDeveloper] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create Form state
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<AppRole>('MANAGER');
  const [formStoreId, setFormStoreId] = useState<StoreId | ''>('');
  const [formIsDeveloper, setFormIsDeveloper] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isTohriyo =
    authIsDeveloper ||
    profile?.username?.toLowerCase() === 'tohriyo' ||
    profile?.is_developer === true ||
    profile?.is_super_admin === true ||
    (role === 'ADMIN' && profile?.name?.toLowerCase().includes('tohriyo'));

  const isDeveloper = isTohriyo;

  const canApprove =
    role === 'ADMIN' ||
    profile?.username?.toLowerCase() === 'sachou' ||
    profile?.username?.toLowerCase() === 'tohriyo' ||
    role === 'MANAGER' ||
    profile?.is_super_admin ||
    isDeveloper;

  const [assignedRolePending, setAssignedRolePending] = useState<Record<string, AppRole>>({});

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleToggleAllPasswords = () => {
    const next = !revealAllPasswords;
    setRevealAllPasswords(next);
    if (next) {
      const map: Record<string, boolean> = {};
      userList.forEach((u) => {
        map[u.id] = true;
      });
      setVisiblePasswords(map);
    } else {
      setVisiblePasswords({});
    }
  };

  const handleCopyPassword = (pwd: string, username: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pwd);
      addToast({
        type: 'success',
        title: 'Password Copied',
        message: `Password for @${username} copied to clipboard.`,
      });
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const loadUsers = () => {
    securityMonitoringService.reconcilePendingFromEdits();
    const list = securityMonitoringService.getAllUsers();
    setUserList(list);
  };

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 2500);
    const handleUpdate = () => loadUsers();
    window.addEventListener('bimi_security_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('bimi_security_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleApproveUser = (userIdOrUsername: string, targetUser: UserAccount, roleToGrant?: AppRole) => {
    const finalRole = roleToGrant || assignedRolePending[userIdOrUsername] || assignedRolePending[targetUser.id] || targetUser.role || 'STORE_STAFF';
    const approverName = profile?.name || profile?.username || 'sachou';

    const res = securityMonitoringService.approveAccount(userIdOrUsername, approverName, finalRole);
    if (res.success) {
      loadUsers();
      addToast({
        type: 'success',
        title: 'Account Approved',
        message: `Account @${targetUser.username} has been approved by ${approverName} with role [${finalRole}]. User can now log in.`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Approval Failed',
        message: res.error || 'Failed to approve account.',
      });
    }
  };

  const handleRejectUser = (userIdOrUsername: string, targetUser: UserAccount) => {
    const approverName = profile?.name || profile?.username || 'sachou';
    const res = securityMonitoringService.rejectAccount(userIdOrUsername, approverName);
    if (res.success) {
      loadUsers();
      addToast({
        type: 'info',
        title: 'Account Rejected',
        message: `Account registration request for @${targetUser.username} has been rejected.`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: res.error || 'Failed to reject account.',
      });
    }
  };

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

  const handleDeleteUser = (targetUser: UserAccount) => {
    if (targetUser.username.toLowerCase() === 'tohriyo' || targetUser.username.toLowerCase() === 'sachou') {
      addToast({
        type: 'error',
        title: 'Action Prohibited',
        message: 'Core system accounts (tohriyo, sachou) cannot be deleted.',
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete user @${targetUser.username} (${targetUser.name})? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    const res = securityMonitoringService.deleteUser(
      targetUser.id,
      profile?.name || profile?.username || 'tohriyo'
    );

    if (res.success) {
      loadUsers();
      addToast({
        type: 'info',
        title: 'User Deleted',
        message: `Account @${targetUser.username} was permanently removed.`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: res.error || 'Failed to delete user account.',
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setFormError('User ID (Username) is required.');
      return;
    }
    if (cleanUsername.length < 3) {
      setFormError('User ID must be at least 3 characters.');
      return;
    }
    if (/\s/.test(cleanUsername)) {
      setFormError('User ID cannot contain spaces.');
      return;
    }
    const exists = userList.some(
      (u) => u.username.toLowerCase().trim() === cleanUsername
    );
    if (exists) {
      setFormError(`User ID "@${cleanUsername}" is already taken. Every user must have a unique User ID.`);
      return;
    }
    if (!formPassword || formPassword.trim().length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }

    const res = securityMonitoringService.createUser({
      username: cleanUsername,
      name: formName.trim() || cleanUsername,
      email: formEmail.trim() || `${cleanUsername}@mybimi.jp`,
      password: formPassword.trim(),
      role: formRole,
      assigned_store_id: formStoreId || undefined,
      is_developer: formIsDeveloper,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create user account.');
      return;
    }

    addToast({
      type: 'success',
      title: 'User Profile Created',
      message: `User ID @${res.user?.username} created and ready to log in.`,
    });

    // Reset & close
    setFormUsername('');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setShowPassword(false);
    setFormRole('MANAGER');
    setFormStoreId('');
    setFormIsDeveloper(false);
    setIsCreateModalOpen(false);
    loadUsers();
  };

  const handleOpenEditModal = (targetUser: UserAccount) => {
    setEditingUserId(targetUser.id);
    setEditUsername(targetUser.username);
    setEditName(targetUser.name);
    setEditEmail(targetUser.email);
    setEditPassword(targetUser.passwordHash || '');
    setShowEditPassword(false);
    setEditRole(targetUser.role);
    setEditStoreId(targetUser.assigned_store_id || '');
    setEditIsActive(targetUser.is_active);
    setEditApprovalStatus(targetUser.approval_status || 'APPROVED');
    setEditIsDeveloper(Boolean(targetUser.is_developer || targetUser.username.toLowerCase() === 'tohriyo'));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setEditError(null);

    const cleanUsername = editUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setEditError('User ID is required.');
      return;
    }
    if (cleanUsername.length < 3) {
      setEditError('User ID must be at least 3 characters.');
      return;
    }
    if (/\s/.test(cleanUsername)) {
      setEditError('User ID cannot contain spaces.');
      return;
    }
    const duplicate = userList.some(
      (u) => u.id !== editingUserId && u.username.toLowerCase().trim() === cleanUsername
    );
    if (duplicate) {
      setEditError(`User ID "@${cleanUsername}" is already used by another user. Usernames must be unique.`);
      return;
    }
    if (!editName.trim()) {
      setEditError('Display Name is required.');
      return;
    }
    if (editPassword && editPassword.trim().length < 4) {
      setEditError('Password must be at least 4 characters.');
      return;
    }

    const res = securityMonitoringService.updateUserProfile(
      editingUserId,
      {
        username: cleanUsername,
        name: editName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim(),
        role: editRole,
        assigned_store_id: editStoreId || null,
        is_active: editIsActive,
        approval_status: editApprovalStatus,
        is_developer: editIsDeveloper,
      },
      profile?.name || profile?.username || 'tohriyo'
    );

    if (!res.success) {
      setEditError(res.error || 'Failed to update user profile.');
      return;
    }

    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: `User profile for @${res.user?.username} was successfully saved.`,
    });

    setIsEditModalOpen(false);
    setEditingUserId(null);
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
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Users & Access Role Control
            </h1>
            {isDeveloper && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1 shadow-2xs">
                <Terminal className="w-3 h-3 text-indigo-600" />
                Developer Privilege Active (@tohriyo)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage authenticated User IDs, inspect user passwords, edit user profiles, and assign store locations.
          </p>
        </div>

        {(role === 'ADMIN' || isDeveloper) && (
          <button
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Create User Profile & Password</span>
          </button>
        )}
      </div>

      {/* Developer Password Inspector Banner */}
      {isDeveloper && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-amber-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-indigo-950 flex items-center gap-1.5 flex-wrap">
                <span>Developer Mode: Password Visibility & Profile Control Enabled</span>
                <span className="text-[9px] font-mono font-bold bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded">
                  @tohriyo
                </span>
              </p>
              <p className="text-[11px] text-indigo-900/80 mt-0.5">
                As system developer (@tohriyo), you can inspect other users' passwords in cleartext, edit profiles, and create instant credentials.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleToggleAllPasswords}
              className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-900 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              {revealAllPasswords ? <EyeOff className="w-3.5 h-3.5 text-indigo-700" /> : <Eye className="w-3.5 h-3.5 text-indigo-700" />}
              <span>{revealAllPasswords ? 'Mask Passwords' : 'Show All Passwords'}</span>
            </button>
          </div>
        </div>
      )}

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

      {/* Pending Account Approvals Section (Sachou or Admin) */}
      {canApprove && (
        <div className="bg-white border border-amber-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Pending Account Registrations</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      userList.filter((u) => u.approval_status === 'PENDING').length > 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {userList.filter((u) => u.approval_status === 'PENDING').length}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Accounts requesting operator access. Only <strong>Sachou (Manager)</strong> or{' '}
                  <strong>Admin</strong> can approve them.
                </p>
              </div>
            </div>
          </div>

          {userList.filter((u) => u.approval_status === 'PENDING').length === 0 ? (
            <div className="p-4 text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>No pending account registrations. All requested accounts are reviewed.</span>
            </div>
          ) : (
            <div className="divide-y divide-amber-100/60 p-3 sm:p-4 space-y-3">
              {userList
                .filter((u) => u.approval_status === 'PENDING')
                .map((pending) => (
                  <div
                    key={pending.id}
                    className="p-3.5 bg-amber-50/40 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{pending.name}</span>
                        <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          @{pending.username}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100/90 text-amber-800 border border-amber-300">
                          REQUESTED: {pending.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>{pending.email}</span>
                        <span>•</span>
                        <span>
                          Applied:{' '}
                          {pending.requested_at
                            ? new Date(pending.requested_at).toLocaleString()
                            : 'Recently'}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        value={assignedRolePending[pending.id] || pending.role || 'STORE_STAFF'}
                        onChange={(e) =>
                          setAssignedRolePending((prev) => ({
                            ...prev,
                            [pending.id]: e.target.value as AppRole,
                          }))
                        }
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
                      >
                        <option value="STORE_STAFF">STORE_STAFF (Tags/Shelf)</option>
                        <option value="MANAGER">MANAGER (Operations)</option>
                        <option value="ADMIN">ADMIN (System Admin)</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleApproveUser(pending.id, pending)}
                        className="px-3 py-1.5 bg-[#005A43] hover:bg-[#004735] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectUser(pending.id, pending)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

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
                      {(isCoreTohriyo || u.is_developer) && (
                        <span className="font-mono text-[9px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-300">
                          DEVELOPER
                        </span>
                      )}
                      {isCoreSachou && (
                        <span className="font-mono text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                          CORE MANAGER
                        </span>
                      )}
                      {u.approval_status === 'PENDING' && (
                        <span className="font-mono text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                          PENDING APPROVAL
                        </span>
                      )}
                      {u.approval_status === 'REJECTED' && (
                        <span className="font-mono text-[9px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                          REJECTED
                        </span>
                      )}
                      {u.approval_status === 'APPROVED' && !isCoreTohriyo && !isCoreSachou && (
                        <span className="font-mono text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                          APPROVED
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
                          <span>
                            Last login:{' '}
                            {new Date(u.last_login_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Developer Password Inspector (ONLY visible to tohriyo / developer) */}
                {isDeveloper && (
                  <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs self-start sm:self-center transition-colors">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[10px] text-slate-400 font-mono font-semibold">PWD:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-900 select-all min-w-[70px]">
                      {visiblePasswords[u.id] || revealAllPasswords ? u.passwordHash : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(u.id)}
                      title={visiblePasswords[u.id] || revealAllPasswords ? 'Mask password' : 'Show password'}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors cursor-pointer"
                    >
                      {visiblePasswords[u.id] || revealAllPasswords ? (
                        <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(u.passwordHash, u.username)}
                      title="Copy password to clipboard"
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Role setup control, Edit Profile & Status */}
                <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
                  {/* Quick Approve / Reject for Pending Accounts */}
                  {u.approval_status === 'PENDING' && canApprove && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveUser(u.id, u)}
                        className="px-2.5 py-1 bg-[#005A43] hover:bg-[#004735] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectUser(u.id, u)}
                        className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Edit Profile Action Button (Developer / Admin) */}
                  {(isDeveloper || role === 'ADMIN') && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(u)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      title={`Edit profile for @${u.username}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden md:inline">Edit Profile</span>
                    </button>
                  )}

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
                  {!isCoreTohriyo && (isDeveloper || role === 'ADMIN') && (
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

                  {/* Delete user account */}
                  {!isCoreTohriyo && !isCoreSachou && !isSelf && (isDeveloper || role === 'ADMIN') && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      title={`Permanently delete user @${u.username}`}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 text-xs cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  Create User Profile & Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPassword(generateRandomPassword())}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate</span>
                  </button>
                </div>
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
                    <option value="STORE_STAFF">STORE_STAFF</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="VIEWER">VIEWER</option>
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

              {/* Developer Privilege Option */}
              {isDeveloper && (
                <label className="flex items-center gap-2 p-2 bg-indigo-50/70 border border-indigo-200/80 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDeveloper}
                    onChange={(e) => setFormIsDeveloper(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-indigo-950">Grant Developer Status</span>
                    <p className="text-[10px] text-indigo-800/80">Can inspect passwords and edit user profiles</p>
                  </div>
                </label>
              )}

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

      {/* EDIT USER PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Edit User Profile: @{editUsername}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Modify profile information, credentials, and access role.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-3.5 text-xs">
              {editError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    User ID (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    disabled={editUsername.toLowerCase() === 'tohriyo'}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="name@mybimi.jp"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Password / Reset Credentials
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateRandomPassword())}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    minLength={4}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={editRole}
                    disabled={editUsername.toLowerCase() === 'tohriyo'}
                    onChange={(e) => setEditRole(e.target.value as AppRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer disabled:opacity-60"
                  >
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="MANAGER">MANAGER (Operations)</option>
                    <option value="STORE_STAFF">STORE_STAFF (Tags/Shelf)</option>
                    <option value="VIEWER">VIEWER (Read Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Store Branch
                  </label>
                  <select
                    value={editStoreId}
                    onChange={(e) => setEditStoreId(e.target.value as StoreId)}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editIsActive ? 'ACTIVE' : 'INACTIVE'}
                    disabled={editUsername.toLowerCase() === 'tohriyo'}
                    onChange={(e) => setEditIsActive(e.target.value === 'ACTIVE')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer disabled:opacity-60"
                  >
                    <option value="ACTIVE">Active (Allowed Login)</option>
                    <option value="INACTIVE">Deactivated</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approval State
                  </label>
                  <select
                    value={editApprovalStatus}
                    onChange={(e) => setEditApprovalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              {/* Developer status checkbox */}
              {isDeveloper && (
                <label className="flex items-center gap-2.5 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsDeveloper}
                    disabled={editUsername.toLowerCase() === 'tohriyo'}
                    onChange={(e) => setEditIsDeveloper(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-indigo-950 text-xs">Developer Privileges</span>
                    <p className="text-[10px] text-indigo-800/80">Can inspect cleartext passwords & manage user profiles</p>
                  </div>
                </label>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
