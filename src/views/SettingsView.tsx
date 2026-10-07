import React, { useState } from 'react';
import {
  Settings,
  Store as StoreIcon,
  Plus,
  Database,
  Check,
  Globe,
  Sliders,
  FileCode,
  Copy,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { SupabaseStatusCard } from '../components/database/SupabaseStatusCard';

export const SettingsView: React.FC = () => {
  const { stores, reloadStores, triggerRefresh, addToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'stores' | 'tax' | 'supabase'>('stores');
  const [copiedSql, setCopiedSql] = useState(false);

  // New store quick form
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCode, setNewStoreCode] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreManager, setNewStoreManager] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreCode) return;

    setIsAdding(true);
    try {
      const created = await dataService.addStore({
        name: newStoreName,
        code: newStoreCode.toUpperCase(),
        address: newStoreAddress || 'Tokyo, Japan',
        phone: '03-5500-0000',
        manager_name: newStoreManager || 'Operations Lead',
        is_active: true,
        opened_at: new Date().toISOString(),
      });

      await reloadStores();
      triggerRefresh();
      addToast({
        type: 'success',
        title: 'Branch Added Successfully',
        message: `${created.name} (${created.code}) is configured across the multi-store matrix.`,
      });
      setNewStoreName('');
      setNewStoreCode('');
      setNewStoreAddress('');
      setNewStoreManager('');
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to add branch',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const copyDdl = () => {
    navigator.clipboard.writeText(`-- BIMI Product Studio PostgreSQL DDL
CREATE TABLE stores (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE);
CREATE TABLE products (id TEXT PRIMARY KEY, sku TEXT UNIQUE, barcode TEXT, cost_price NUMERIC, base_retail_price NUMERIC);
CREATE TABLE store_products (id TEXT PRIMARY KEY, product_id TEXT, store_id TEXT, retail_price NUMERIC, stock_quantity INT);`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    addToast({
      type: 'info',
      title: 'SQL DDL Copied to Clipboard',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">System & Branch Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Store branch registry, multi-store architecture, tax configurations, and Supabase integration.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('stores')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeSubTab === 'stores'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Branch Stores ({stores.length})
        </button>
        <button
          onClick={() => setActiveSubTab('tax')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeSubTab === 'tax'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Tax & Currency
        </button>
        <button
          onClick={() => setActiveSubTab('supabase')}
          className={`pb-2.5 text-xs font-semibold px-2 transition-colors border-b-2 ${
            activeSubTab === 'supabase'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Supabase & Database Layer
        </button>
      </div>

      {/* Tab 1: Stores */}
      {activeSubTab === 'stores' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Stores List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <h2 className="text-xs font-semibold text-slate-900 mb-3">
                Active Retail Store Branches
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                The Product Studio architecture supports unlimited stores dynamically.
              </p>

              <div className="space-y-3">
                {stores.map((st, index) => (
                  <div
                    key={st.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                        <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {st.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{st.address}</p>
                      <p className="text-[11px] text-slate-400">
                        Manager: <strong className="text-slate-700">{st.manager_name}</strong> · Phone: {st.phone}
                      </p>
                    </div>

                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      OPERATIONAL
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add Store Form (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs h-fit">
            <h3 className="text-xs font-semibold text-slate-900 mb-1">
              Add New Store Branch
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Instantly provisions inventory slots for all master products.
            </p>

            <form onSubmit={handleAddStore} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIMI Supa – Asakusa"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASK-03"
                    value={newStoreCode}
                    onChange={(e) => setNewStoreCode(e.target.value)}
                    className="w-full text-xs font-mono uppercase px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Store Manager
                  </label>
                  <input
                    type="text"
                    placeholder="Manager"
                    value={newStoreManager}
                    onChange={(e) => setNewStoreManager(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2-5-1 Asakusa, Taito-ku, Tokyo"
                  value={newStoreAddress}
                  onChange={(e) => setNewStoreAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isAdding || !newStoreName || !newStoreCode}
                className="w-full mt-2 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Adding Store...' : 'Create Store Branch'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Tax & Currency */}
      {activeSubTab === 'tax' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs max-w-2xl space-y-4">
          <h2 className="text-xs font-semibold text-slate-900">
            Japanese Consumption Tax (消費税) Rules
          </h2>
          <p className="text-xs text-slate-500">
            Configured in accordance with Japan National Tax Agency standards.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">Reduced Tax Rate (軽減税率)</p>
                <p className="text-[11px] text-slate-500">Applies to fresh food, groceries, and non-alcoholic beverages</p>
              </div>
              <span className="font-mono text-sm font-bold text-slate-900">8.0%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">Standard Tax Rate (標準税率)</p>
                <p className="text-[11px] text-slate-500">Applies to alcoholic drinks, non-food goods, tableware & services</p>
              </div>
              <span className="font-mono text-sm font-bold text-slate-900">10.0%</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">Currency Formatting</p>
                <p className="text-[11px] text-slate-500">Default national currency symbol</p>
              </div>
              <span className="font-mono text-sm font-bold text-slate-900">JPY (¥)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Supabase & Database Architecture */}
      {activeSubTab === 'supabase' && (
        <div className="max-w-4xl">
          <SupabaseStatusCard />
        </div>
      )}
    </div>
  );
};
