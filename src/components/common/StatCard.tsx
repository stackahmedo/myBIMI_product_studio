import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: 'neutral' | 'emerald' | 'amber' | 'rose';
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  badge,
  onClick,
}) => {
  const badgeClasses = {
    neutral: 'text-slate-600 bg-slate-100',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    rose: 'text-rose-700 bg-rose-50',
  }[badge?.variant || 'neutral'];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500 tracking-tight">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {badge && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${badgeClasses}`}>
            {badge.text}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="mt-1 text-xs text-slate-400 font-normal truncate">
          {sublabel}
        </p>
      )}
    </div>
  );
};
