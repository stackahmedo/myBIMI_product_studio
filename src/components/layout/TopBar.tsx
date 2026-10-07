import React, { useState } from 'react';
import {
  Search,
  Store as StoreIcon,
  Bell,
  ChevronDown,
  Plus,
  Check,
  Menu,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  LogOut,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppRole } from '../../types/database';

interface TopBarProps {
  onMobileMenuToggle: () => void;
  onOpenNewStoreModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMobileMenuToggle,
  onOpenNewStoreModal,
}) => {
  const {
    stores,
    selectedStoreId,
    setSelectedStoreId,
    currentStore,
    setIsSearchOpen,
    setIsNotificationsOpen,
    setActiveTab,
    addToast,
  } = useApp();

  const {
    profile,
    role,
    isConfigured,
    signOut,
  } = useAuth();

  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const roleBadgeColors: Record<AppRole, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    MANAGER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    STORE_STAFF: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    VIEWER: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  };

  const isTohriyo =
    profile?.username?.toLowerCase() === 'tohriyo' ||
    profile?.email?.toLowerCase().includes('tohriyo') ||
    profile?.is_super_admin === true ||
    (role === 'ADMIN' && profile?.name?.toLowerCase().includes('tohriyo'));

  const handleSignOutClick = async () => {
    await signOut();
    setIsUserDropdownOpen(false);
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Active security session terminated.',
    });
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left zone: Mobile toggle & Search trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:hidden flex items-center shrink-0">
            <img
              src="/product-studio-logo.png"
              alt="Product STUDIO"
              className="h-7 w-auto object-contain max-w-[120px]"
            />
          </div>

          {/* Global Search Bar Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-700">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="truncate">Search products, SKU, barcode, suppliers...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right zone: Branch Selector, Notifications, Supabase Status & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Branch / Store Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsStoreDropdownOpen(!isStoreDropdownOpen);
                setIsUserDropdownOpen(false);
              }}
              aria-label="Select operating store branch"
              aria-expanded={isStoreDropdownOpen}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <StoreIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[190px]">
                {currentStore ? currentStore.name : 'All Branches (Central)'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isStoreDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsStoreDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider">
                    OPERATING BRANCH
                  </div>

                  <button
                    onClick={() => {
                      setSelectedStoreId('all');
                      setIsStoreDropdownOpen(false);
                      addToast({
                        type: 'info',
                        title: 'Viewing Central All-Store View',
                      });
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                      selectedStoreId === 'all'
                        ? 'bg-slate-50 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <p className="text-xs font-medium">All Branches</p>
                      <p className="text-[11px] text-slate-400">Consolidated enterprise view</p>
                    </div>
                    {selectedStoreId === 'all' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStoreId(store.id);
                        setIsStoreDropdownOpen(false);
                        addToast({
                          type: 'info',
                          title: `Switched store to ${store.name}`,
                        });
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        selectedStoreId === store.id
                          ? 'bg-slate-50 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate">
                        <p className="text-xs font-medium">{store.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{store.code} · {store.manager_name}</p>
                      </div>
                      {selectedStoreId === store.id && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setIsStoreDropdownOpen(false);
                      onOpenNewStoreModal();
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                    <span>Add New Store Branch...</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            aria-label="Open notifications and stock alerts drawer"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User Profile & Auth RBAC Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserDropdownOpen(!isUserDropdownOpen);
                setIsStoreDropdownOpen(false);
              }}
              aria-label="User profile and role menu"
              aria-expanded={isUserDropdownOpen}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center tracking-tight">
                {(profile?.name || profile?.username || 'Admin')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="hidden sm:block truncate text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
                    {profile?.name || profile?.username || 'User'}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      roleBadgeColors[role]?.bg || 'bg-slate-100'
                    } ${roleBadgeColors[role]?.text || 'text-slate-700'} ${
                      roleBadgeColors[role]?.border || 'border-slate-200'
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 text-xs animate-in fade-in-50 zoom-in-95">
                  {/* Profile info */}
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 text-sm">
                        {profile?.name || 'Active Operator'}
                      </p>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        @{profile?.username || 'user'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {profile?.email || `${profile?.username || 'user'}@mybimi.jp`}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          roleBadgeColors[role]?.bg
                        } ${roleBadgeColors[role]?.text} ${roleBadgeColors[role]?.border}`}
                      >
                        {role} ROLE
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isConfigured ? 'Supabase Live' : 'Verified Secure'}
                      </span>
                    </div>
                  </div>

                  {/* Navigation & Admin Shortcuts */}
                  <div className="p-2 space-y-1">
                    {isTohriyo && (
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setActiveTab('super-admin');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 font-semibold flex items-center justify-between transition-colors cursor-pointer border border-amber-200/80"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs">Security & Monitor</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          SUPER ADMIN
                        </span>
                      </button>
                    )}

                    {role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setActiveTab('users');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2 transition-colors cursor-pointer text-xs"
                      >
                        <Users className="w-4 h-4 text-slate-500" />
                        <span>User Role Setup & Staff</span>
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-slate-100 my-1" />

                  {/* Action buttons */}
                  <div className="px-2 pb-1">
                    <button
                      onClick={handleSignOutClick}
                      className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out (Lock Studio)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
