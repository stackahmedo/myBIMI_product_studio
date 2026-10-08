import React from 'react';
import { FileText } from 'lucide-react';

export const TradeDocView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Trade Doc
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commercial invoices, export declarations, and shipping documents
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
          <FileText className="w-7 h-7 text-slate-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Trade Documentation</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Trade document workspace is ready.
        </p>
      </div>
    </div>
  );
};
