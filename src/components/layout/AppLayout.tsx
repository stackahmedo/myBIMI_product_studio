import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { NewStoreModal } from '../common/NewStoreModal';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newStoreModalOpen, setNewStoreModalOpen] = useState(false);
  const { toasts, removeToast } = useApp();

  return (
    <div className="app-layout-root min-h-screen bg-[#F8F9FA] text-slate-800 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="app-main-area flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopBar
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          onOpenNewStoreModal={() => setNewStoreModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal />
      <NotificationDrawer />
      <NewStoreModal
        isOpen={newStoreModalOpen}
        onClose={() => setNewStoreModalOpen(false)}
      />

      {/* Toast Notification Container (Never visible in print) */}
      <div className="no-print toast-notification-container fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/90 shadow-lg text-xs animate-in slide-in-from-bottom-3"
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{toast.title}</p>
              {toast.message && (
                <p className="text-slate-500 mt-0.5 leading-normal">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
