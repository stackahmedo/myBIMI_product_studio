import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  DollarSign,
  Tag,
  Truck,
  ShoppingCart,
  RefreshCw,
  BarChart3,
  Users,
  ScrollText,
  Settings,
  X,
  Store as StoreIcon,
  Shield,
  ShieldAlert,
  Lock,
  LogOut,
  FileText,
} from 'lucide-react';
import { useApp, NavTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { securityMonitoringService } from '../../services/securityMonitoringService';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'amber' | 'neutral';
  requiredRole?: 'ADMIN' | 'MANAGER' | 'ANY';
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, stores, selectedStoreId } = useApp();
  const { role, profile, signOut } = useAuth();
  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState(0);

  React.useEffect(() => {
    const checkPending = () => {
      const pending = securityMonitoringService.getPendingAccounts();
      setPendingApprovalsCount(pending.length);
    };
    checkPending();
    const interval = setInterval(checkPending, 2000);
    return () => clearInterval(interval);
  }, []);

  const isTohriyo =
    profile?.username?.toLowerCase() === 'tohriyo' ||
    profile?.email?.toLowerCase().includes('tohriyo') ||
    profile?.is_super_admin === true ||
    (role === 'ADMIN' && profile?.name?.toLowerCase().includes('tohriyo'));

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiredRole: 'ANY' },
    { id: 'products', label: 'Products', icon: Package, requiredRole: 'ANY' },
    { id: 'inventory', label: 'Inventory', icon: Boxes, requiredRole: 'ANY' },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, requiredRole: 'MANAGER' },
    { id: 'price-tags', label: 'Price Tags', icon: Tag, requiredRole: 'ANY' },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, requiredRole: 'MANAGER' },
    { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart, requiredRole: 'MANAGER' },
    { id: 'trade-doc', label: 'Trade Doc', icon: FileText, requiredRole: 'ANY' },
    { id: 'website-sync', label: 'Website Sync', icon: RefreshCw, badge: '1 Alert', badgeVariant: 'amber', requiredRole: 'ANY' },
    { id: 'reports', label: 'Reports', icon: BarChart3, requiredRole: 'MANAGER' },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Approval` : undefined,
      badgeVariant: 'amber',
      requiredRole: 'ADMIN',
    },
    { id: 'audit-log', label: 'Audit Log', icon: ScrollText, requiredRole: 'MANAGER' },
    { id: 'settings', label: 'Settings', icon: Settings, requiredRole: 'ADMIN' },
    ...(isTohriyo
      ? [
          {
            id: 'super-admin' as NavTab,
            label: 'Security & Monitor',
            icon: ShieldAlert,
            badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : 'tohriyo',
            badgeVariant: 'amber' as const,
            requiredRole: 'ADMIN' as const,
          },
        ]
      : []),
  ];

  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const isItemRestricted = (item: NavItem) => {
    if (item.requiredRole === 'ADMIN' && role !== 'ADMIN') return true;
    if (item.requiredRole === 'MANAGER' && role !== 'ADMIN' && role !== 'MANAGER') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <img
              src="/product-studio-logo.png"
              alt="Product STUDIO by My BIMI"
              className="h-9 w-auto object-contain max-w-[170px]"
            />
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current store banner in sidebar */}
        <div className="px-3 pt-3 pb-1">
          <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2.5">
            <StoreIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-semibold text-slate-600 leading-none truncate">
                {selectedStoreId === 'all'
                  ? 'Central Master HQ'
                  : stores.find((s) => s.id === selectedStoreId)?.name || 'Selected Branch'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 leading-none font-mono">
                {stores.length} Active {stores.length === 1 ? 'Store' : 'Stores'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const restricted = isItemRestricted(item);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : restricted
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : restricted ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {restricted && (
                    <Lock className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                  )}

                  {item.badge && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded leading-none ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeVariant === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom authenticated session & sign out */}
        <div className="p-3 border-t border-slate-100 text-slate-500 space-y-2">
          <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-semibold truncate flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">{profile?.name || profile?.username || 'Operator'}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                {role}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="truncate">@{profile?.username || 'user'}</span>
              <button
                onClick={() => signOut()}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
