import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  History,
  AlertTriangle,
  Users,
  Search,
  RefreshCw,
  Trash2,
  Download,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  Database,
  Lock,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  securityMonitoringService,
  UserSessionRecord,
  UserActivityRecord,
  DataEditRecord,
  CrashLogRecord,
} from '../services/securityMonitoringService';

export const SuperAdminView: React.FC = () => {
  const { profile } = useAuth();
  const { addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'edits' | 'crashes'>('users');
  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [activities, setActivities] = useState<UserActivityRecord[]>([]);
  const [edits, setEdits] = useState<DataEditRecord[]>([]);
  const [crashes, setCrashes] = useState<CrashLogRecord[]>([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('all');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('all');
  const [expandedCrashId, setExpandedCrashId] = useState<string | null>(null);

  const reloadData = () => {
    setSessions(securityMonitoringService.getSessions());
    setActivities(securityMonitoringService.getActivities());
    setEdits(securityMonitoringService.getDataEdits());
    setCrashes(securityMonitoringService.getCrashLogs());
  };

  useEffect(() => {
    reloadData();
    const interval = setInterval(reloadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filtered edits
  const filteredEdits = edits.filter((e) => {
    const matchesSearch =
      e.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntity = selectedEntityFilter === 'all' || e.entity_type === selectedEntityFilter;
    return matchesSearch && matchesEntity;
  });

  // Filtered crashes
  const filteredCrashes = crashes.filter((c) => {
    const matchesSearch =
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.error_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverityFilter === 'all' || c.severity === selectedSeverityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleSimulateError = () => {
    securityMonitoringService.recordCrash(
      new Error(`Manual Diagnostic Test Exception (Triggered by Super Admin ${profile?.name || 'tohriyo'})`),
      'SuperAdminView > DiagnosticsTesterComponent',
      'WARNING',
      { id: profile?.id, username: profile?.username || 'tohriyo' }
    );
    reloadData();
    addToast({
      type: 'warning',
      title: 'Diagnostic Event Recorded',
      message: 'A simulated test exception has been captured in the Crash Error Log.',
    });
  };

  const handleClearCrashes = () => {
    securityMonitoringService.clearCrashLogs();
    reloadData();
    addToast({
      type: 'info',
      title: 'Crash Logs Cleared',
      message: 'All recorded crash exceptions have been purged.',
    });
  };

  const handleClearEdits = () => {
    securityMonitoringService.clearDataEdits();
    reloadData();
    addToast({
      type: 'info',
      title: 'Edit History Cleared',
      message: 'All recorded data mutation history has been cleared.',
    });
  };

  const handleExportEditsCsv = () => {
    const headers = ['Timestamp', 'Entity', 'Entity Name', 'Action', 'Changed By', 'Role', 'Description'];
    const rows = filteredEdits.map((e) => [
      e.timestamp,
      e.entity_type,
      `"${e.entity_name.replace(/"/g, '""')}"`,
      e.action,
      e.user_name,
      e.user_role,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bimi_data_edits_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Super Admin Monitoring & Security Core</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {profile?.username === 'tohriyo' ? 'tohriyo · SUPER_ADMIN' : 'ADMIN CONTROL'}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Real-time user session surveillance, immutable data modification audit trail, and client runtime crash diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={reloadData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/60 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Uses Monitoring ({sessions.filter((s) => s.status === 'ONLINE').length} Online)</span>
          </button>

          <button
            onClick={() => setActiveTab('edits')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'edits'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Data Edit History ({edits.length} Records)</span>
          </button>

          <button
            onClick={() => setActiveTab('crashes')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'crashes'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Crash Error Log ({crashes.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. USER USES MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Online Sessions
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {sessions.filter((s) => s.status === 'ONLINE').length}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Currently active operators connected to studio</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Operator Logins
              </span>
              <p className="text-2xl font-bold text-slate-900 font-mono">{sessions.length}</p>
              <p className="text-[11px] text-slate-500">All-time authenticated logins recorded</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                User Activity Events
              </span>
              <p className="text-2xl font-bold text-slate-900 font-mono">{activities.length}</p>
              <p className="text-[11px] text-slate-500">Interactions & state operations captured</p>
            </div>
          </div>

          {/* Active Sessions Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">User Session Surveillance</h2>
                <p className="text-xs text-slate-500">Real-time status of authenticated operators</p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {sessions.length} sessions tracked
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No active session logs recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Login Time</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4">Client Endpoint</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {sessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-sans font-bold text-[10px] flex items-center justify-center">
                              {sess.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 font-sans">{sess.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">@{sess.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sess.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {sess.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(sess.login_time).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(sess.last_active_time).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{sess.ip_client}</td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sess.status === 'ONLINE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {sess.status === 'ONLINE' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {sess.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Activity Stream */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">User Usage Activity Stream</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recent user actions recorded.</p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {act.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">@{act.username}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                            {act.action}
                          </span>
                        </div>
                        {act.details && <p className="text-slate-500 text-[11px] mt-0.5">{act.details}</p>}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DATA EDIT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'edits' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search edits by product, user, or change description..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedEntityFilter}
                onChange={(e) => setSelectedEntityFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Entities</option>
                <option value="product">Products</option>
                <option value="price">Pricing</option>
                <option value="inventory">Inventory</option>
                <option value="user">Users</option>
                <option value="store">Stores</option>
                <option value="supplier">Suppliers</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleExportEditsCsv}
                disabled={filteredEdits.length === 0}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleClearEdits}
                disabled={edits.length === 0}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          </div>

          {/* Edits List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {filteredEdits.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No data edit records match your criteria. When operators create or modify products, prices, or inventory, diffs appear here.
              </div>
            ) : (
              filteredEdits.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                          item.action === 'CREATE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.action === 'DELETE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.action}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {item.entity_type}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900">{item.entity_name}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
                      <span>{item.user_name} ({item.user_role})</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">{item.description}</p>

                  {/* Diffs */}
                  {item.diff && item.diff.length > 0 && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 font-mono text-[11px]">
                      {item.diff.map((d, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold">{d.field}:</span>
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded line-through">
                            {String(d.before)}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                            {String(d.after)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CRASH & ERROR LOG */}
      {/* ========================================================================= */}
      {activeTab === 'crashes' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search crash error messages, stack traces..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedSeverityFilter}
                onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="ERROR">Error</option>
                <option value="WARNING">Warning</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleSimulateError}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Test Error</span>
              </button>

              <button
                onClick={handleClearCrashes}
                disabled={crashes.length === 0}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Errors</span>
              </button>
            </div>
          </div>

          {/* Crash Logs List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {filteredCrashes.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-slate-700">Zero Crash Exceptions Active</span>
                <span className="text-[11px] text-slate-400">
                  Client runtime, API calls, and UI components are operating cleanly with zero errors.
                </span>
              </div>
            ) : (
              filteredCrashes.map((c) => {
                const isExpanded = expandedCrashId === c.id;

                return (
                  <div key={c.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${
                            c.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : c.severity === 'ERROR'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.severity}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 font-mono">{c.error_name}</h3>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                        {c.username && <span>User: @{c.username}</span>}
                        <span>•</span>
                        <span>{new Date(c.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-rose-700 font-mono bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                      {c.message}
                    </p>

                    {c.component_stack && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        Component Source: {c.component_stack}
                      </p>
                    )}

                    {/* Expandable Stack Trace */}
                    {c.stack && (
                      <div>
                        <button
                          onClick={() => setExpandedCrashId(isExpanded ? null : c.id)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Hide Stack Trace' : 'View Full Stack Trace'}</span>
                        </button>

                        {isExpanded && (
                          <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-64">
                            {c.stack}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
