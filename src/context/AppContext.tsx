import React, { createContext, useContext, useState, useEffect } from 'react';
import { Store, UserProfile, StoreId } from '../types/database';
import { dataService } from '../services/dataService';

export type NavTab =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'pricing'
  | 'price-tags'
  | 'suppliers'
  | 'purchasing'
  | 'website-sync'
  | 'reports'
  | 'users'
  | 'audit-log'
  | 'settings'
  | 'super-admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface AppContextType {
  stores: Store[];
  selectedStoreId: StoreId | 'all';
  setSelectedStoreId: (storeId: StoreId | 'all') => void;
  currentStore: Store | null;
  users: UserProfile[];
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  reloadStores: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<StoreId | 'all'>('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'user-001',
    name: 'Kenji Tanaka',
    email: 'k.tanaka@mybimi.jp',
    role: 'super_admin',
    is_active: true,
    last_login_at: new Date().toISOString(),
  });
  const getInitialTab = (): NavTab => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as NavTab;
      const validTabs: NavTab[] = [
        'dashboard', 'products', 'inventory', 'pricing', 'price-tags',
        'suppliers', 'purchasing', 'website-sync', 'reports', 'users', 'audit-log', 'settings'
      ];
      if (validTabs.includes(hash)) return hash;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTab;
      if (validTabs.includes(tabParam)) return tabParam;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<NavTab>(getInitialTab);

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavTab;
      const validTabs: NavTab[] = [
        'dashboard', 'products', 'inventory', 'pricing', 'price-tags',
        'suppliers', 'purchasing', 'website-sync', 'reports', 'users', 'audit-log', 'settings'
      ];
      if (validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const reloadStores = async () => {
    const list = await dataService.getStores();
    setStores(list);
  };

  useEffect(() => {
    async function init() {
      const storeList = await dataService.getStores();
      setStores(storeList);
      const userList = await dataService.getUsers();
      setUsers(userList);
      if (userList.length > 0) {
        setCurrentUser(userList[0]);
      }
    }
    init();
  }, [refreshKey]);

  // Global keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const currentStore = selectedStoreId === 'all' ? null : stores.find((s) => s.id === selectedStoreId) || null;

  return (
    <AppContext.Provider
      value={{
        stores,
        selectedStoreId,
        setSelectedStoreId,
        currentStore,
        users,
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        isSearchOpen,
        setIsSearchOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        refreshKey,
        triggerRefresh,
        toasts,
        addToast,
        removeToast,
        reloadStores,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
