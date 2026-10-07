import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  CheckCircle2,
  Clock,
  RefreshCw,
  Download,
  ExternalLink,
  FolderSync,
  AlertCircle,
  FileJson,
  Shield,
  Save,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { dataService } from '../../services/dataService';
import {
  securityMonitoringService,
  GDriveBackupConfig,
  GDriveBackupLog,
} from '../../services/securityMonitoringService';

export const GDriveBackupCard: React.FC = () => {
  const { profile, role } = useAuth();
  const { addToast } = useApp();

  const [config, setConfig] = useState<GDriveBackupConfig>({
    folderUrl: '',
    autoBackupEnabled: true,
    frequency: 'realtime',
    lastBackupStatus: 'IDLE',
  });

  const [folderInput, setFolderInput] = useState('');
  const [frequency, setFrequency] = useState<'realtime' | 'hourly' | 'daily'>('realtime');
  const [autoBackup, setAutoBackup] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [logs, setLogs] = useState<GDriveBackupLog[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    const current = securityMonitoringService.getGDriveConfig();
    setConfig(current);
    setFolderInput(current.folderUrl || '');
    setFrequency(current.frequency || 'realtime');
    setAutoBackup(current.autoBackupEnabled !== false);
    setLogs(securityMonitoringService.getGDriveBackupLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      const cleanUrl = folderInput.trim();
      let folderId = '';
      if (cleanUrl.includes('/folders/')) {
        const parts = cleanUrl.split('/folders/')[1];
        folderId = parts.split('?')[0].split('/')[0];
      }

      const updated = securityMonitoringService.saveGDriveConfig({
        folderUrl: cleanUrl,
        folderId: folderId || undefined,
        autoBackupEnabled: autoBackup,
        frequency,
      });

      setConfig(updated);
      setSuccessMsg('Google Drive folder settings saved successfully.');
      addToast({
        type: 'success',
        title: 'Google Drive Config Saved',
        message: cleanUrl
          ? 'Backup destination target successfully configured.'
          : 'Google Drive settings updated.',
      });
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to Save',
        message: 'Could not update Google Drive configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      // 1. Gather all database records
      const [products, stores, categories, suppliers, storePrices] = await Promise.all([
        dataService.getProducts(),
        dataService.getStores(),
        dataService.getCategories(),
        dataService.getSuppliers(),
        dataService.getProductStorePrices(),
      ]);

      const dataPayload = {
        metadata: {
          system: 'PRODUCT STUDIO by My BIMI',
          version: '2.5.0',
          exportedAt: new Date().toISOString(),
          exportedBy: profile?.name || profile?.username || 'Admin',
          role: role,
          environment: 'Production Cloud Matrix',
        },
        gdriveTargetFolder: config.folderUrl || 'Google Drive Root',
        counts: {
          products: products.length,
          stores: stores.length,
          categories: categories.length,
          suppliers: suppliers.length,
          storePrices: storePrices.length,
        },
        products,
        stores,
        categories,
        suppliers,
        storePrices,
        users: securityMonitoringService.getAllUsers().map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.role,
          is_active: u.is_active,
          approval_status: u.approval_status,
          created_at: u.created_at,
        })),
        auditLogs: securityMonitoringService.getDataEdits().slice(0, 200),
      };

      // 2. Perform backup in security service
      const res = await securityMonitoringService.performGDriveBackup(
        dataPayload,
        profile?.name || profile?.username || 'Admin'
      );

      // 3. Trigger direct browser download of snapshot
      const blob = new Blob([JSON.stringify(dataPayload, null, 2)], {
        type: 'application/json',
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = res.log.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      loadData();

      addToast({
        type: 'success',
        title: 'Google Drive Backup Generated',
        message: `Successfully packaged ${res.log.recordCount} records into ${res.log.fileName}. File downloaded and linked to Google Drive.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Backup Failed',
        message: err.message || 'Error occurred while generating backup snapshot.',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const hasValidFolder = Boolean(config.folderUrl && config.folderUrl.trim().length > 0);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#005A43] flex items-center justify-center shrink-0 shadow-inner">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Google Drive Automated Cloud Backup
                </h2>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ADMIN ROLE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically packages product catalog, inventory matrices, retail pricing, and audit logs to your Google Drive folder.
              </p>
            </div>
          </div>

          {/* Quick Trigger Button */}
          <button
            type="button"
            onClick={handleBackupNow}
            disabled={isBackingUp}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#005A43] hover:bg-[#004735] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
          >
            {isBackingUp ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <HardDrive className="w-4 h-4" />
            )}
            <span>{isBackingUp ? 'Packaging Backup...' : 'Backup Now to Google Drive'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Drive Target Folder</span>
              <FolderSync className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-slate-800 truncate">
              {hasValidFolder ? 'Configured & Active' : 'Not Linked Yet'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {config.folderUrl || 'Enter folder link below'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Auto-Sync Status</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xs font-semibold text-slate-800">
              {config.autoBackupEnabled ? 'Automated Sync Active' : 'Manual Trigger Only'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
              Frequency: {config.frequency || 'realtime'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Last Snapshot</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xs font-semibold text-slate-800">
              {config.lastBackupAt
                ? new Date(config.lastBackupAt).toLocaleDateString() +
                  ' ' +
                  new Date(config.lastBackupAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'No backups yet'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {config.totalRecordsBackedUp
                ? `${config.totalRecordsBackedUp} records synchronized`
                : 'Ready for initial backup'}
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="p-4 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-[#005A43]" />
              <span>Google Drive Folder Configuration</span>
            </h3>
            {hasValidFolder && (
              <a
                href={config.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#005A43] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open in Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Google Drive Folder Link / URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#005A43] focus:bg-white font-mono"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Drive Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Paste the shareable link of your target Google Drive folder. Backup packages will be automatically routed here.
            </p>
          </div>

          {/* Sync Frequency & Toggle */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-xs font-semibold text-slate-800">Auto-Backup Enabled</p>
                <p className="text-[11px] text-slate-500">Synchronize data automatically on change</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#005A43]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-xs font-semibold text-slate-800">Backup Frequency</p>
                <p className="text-[11px] text-slate-500">Automated cycle schedule</p>
              </div>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#005A43]"
              >
                <option value="realtime">Real-time (On Change)</option>
                <option value="hourly">Hourly Interval</option>
                <option value="daily">Daily Midnight</option>
              </select>
            </div>
          </div>

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Backup Logs History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Google Drive Backup History ({logs.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">Timestamped JSON archives</span>
          </div>

          {logs.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              No backups performed yet. Click "Backup Now to Google Drive" to generate your first complete snapshot.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Date & Time</th>
                      <th className="px-4 py-2.5">Archive File</th>
                      <th className="px-4 py-2.5 text-center">Records</th>
                      <th className="px-4 py-2.5 text-center">Size</th>
                      <th className="px-4 py-2.5">Triggered By</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-mono text-[11px] font-semibold flex items-center gap-1.5">
                          <FileJson className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-xs">{log.fileName}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 font-semibold font-mono">
                          {log.recordCount}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">
                          {(log.fileSizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {log.triggeredBy}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {log.folderUrl && log.folderUrl.startsWith('http') && (
                            <a
                              href={log.folderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#005A43] hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <span>Drive Folder</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
