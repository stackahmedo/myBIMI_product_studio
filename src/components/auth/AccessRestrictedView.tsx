import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AppRole } from '../../types/database';

interface AccessRestrictedViewProps {
  requiredRole?: string;
  featureName?: string;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  requiredRole = 'ADMIN or MANAGER',
  featureName = 'this management section',
}) => {
  const { role, switchDemoRole } = useAuth();
  const { setActiveTab } = useApp();

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xs text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 inline-block mb-2">
            PERMISSION DENIED (403)
          </span>
          <h2 className="text-base font-bold text-slate-900">
            Access Restricted for Role: {role}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Your current security credentials ({role}) do not have permission to access {featureName}. Required authorization level: <strong>{requiredRole}</strong>.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left text-xs space-y-1.5 font-mono">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Role Permission Matrix:
          </span>
          <p className="text-slate-600 text-[11px]">
            • <strong>ADMIN</strong>: Full access to all operations & users
          </p>
          <p className="text-slate-600 text-[11px]">
            • <strong>MANAGER</strong>: Products, Pricing, Inventory, Suppliers, Reports
          </p>
          <p className="text-slate-600 text-[11px]">
            • <strong>STORE_STAFF</strong>: View products, Stock updates, Price tags
          </p>
          <p className="text-slate-600 text-[11px]">
            • <strong>VIEWER</strong>: Read-only catalog observation
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => switchDemoRole('ADMIN')}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Elevate to ADMIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
