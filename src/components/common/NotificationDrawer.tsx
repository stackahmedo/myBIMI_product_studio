import React from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationDrawer: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen, setActiveTab } = useApp();

  if (!isNotificationsOpen) return null;

  const notifications = [
    {
      id: 'notif-1',
      type: 'error',
      title: 'Website Sync Error: Uji Matcha (100g)',
      description: 'E-commerce API rejected taxonomy payload. 1 product out of sync.',
      time: '18 minutes ago',
      actionTab: 'website-sync' as const,
    },
    {
      id: 'notif-2',
      type: 'warning',
      title: 'Out of Stock Alert: Dashimaki Bento',
      description: 'BIMI Supa – Shin-Koiwa reached 0 balance after lunch peak rush.',
      time: '1 hour ago',
      actionTab: 'inventory' as const,
    },
    {
      id: 'notif-3',
      type: 'warning',
      title: 'Low Stock Alert: Uji Matcha 100g',
      description: 'Shin-Koiwa balance is 6 cans (minimum alert threshold: 15).',
      time: '2 hours ago',
      actionTab: 'inventory' as const,
    },
    {
      id: 'notif-4',
      type: 'success',
      title: 'Toyosu Fresh Delivery Received',
      description: '15 platters of Bluefin Tuna Sashimi checked in at Shin-Koiwa.',
      time: 'Today 06:30',
      actionTab: 'purchasing' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={() => setIsNotificationsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Notifications & Alerts</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time store operations feed</p>
            </div>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex items-start gap-3"
              >
                {n.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                {n.type === 'warning' && (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                {n.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">{n.title}</p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.description}</p>
                  <button
                    onClick={() => {
                      setActiveTab(n.actionTab);
                      setIsNotificationsOpen(false);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <span>View in {n.actionTab.replace('-', ' ')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <span className="text-xs text-slate-400">All alerts monitored across BIMI stores</span>
          </div>
        </div>
      </div>
    </div>
  );
};
