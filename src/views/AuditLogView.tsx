import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Filter, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { AuditLogEntry } from '../types/database';

export const AuditLogView: React.FC = () => {
  const { refreshKey } = useApp();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const auditEntries = await dataService.getAuditLogs();
        setLogs(auditEntries);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const filteredLogs = logs.filter((log) => {
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesSearch =
      searchQuery === '' ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesEntity && matchesSearch;
  });

  const getEntityBadge = (type: AuditLogEntry['entity_type']) => {
    const styles: Record<string, string> = {
      product: 'text-blue-700 bg-blue-50',
      price: 'text-emerald-700 bg-emerald-50',
      inventory: 'text-purple-700 bg-purple-50',
      sync: 'text-amber-700 bg-amber-50',
      supplier: 'text-teal-700 bg-teal-50',
      store: 'text-indigo-700 bg-indigo-50',
      user: 'text-slate-700 bg-slate-100',
    };
    return (
      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${styles[type] || 'text-slate-600 bg-slate-100'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological, tamper-evident log of product master updates, price changes, and inventory actions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by description, user name or action..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Entity Domains</option>
            <option value="product">Product Master</option>
            <option value="price">Price Changes</option>
            <option value="inventory">Inventory Movements</option>
            <option value="sync">Website & POS Sync</option>
            <option value="store">Branch Stores</option>
            <option value="supplier">Suppliers</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No audit records match your query.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getEntityBadge(log.entity_type)}
                      <span className="font-mono text-xs font-semibold text-slate-800 capitalize">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-900 mt-1 leading-relaxed">
                      {log.description}
                    </p>

                    {/* Diff Inspection Details if available */}
                    {log.diff && log.diff.length > 0 && (
                      <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] font-mono space-y-1">
                        {log.diff.map((d, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">{d.field}:</span>
                            <span className="text-rose-600 line-through">{d.before}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-emerald-700 font-bold">{d.after}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-800">{log.user_name}</p>
                    <p className="text-[11px] text-slate-400">{log.user_role}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
