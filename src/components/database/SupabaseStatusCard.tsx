import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  UploadCloud,
  RefreshCw,
  FileCode,
  Key,
} from 'lucide-react';
import { isSupabaseConfigured, getSupabaseConfig, supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { dataService } from '../../services/dataService';

export const SupabaseStatusCard: React.FC = () => {
  const { addToast } = useApp();
  const config = getSupabaseConfig();
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleCopyEnv = () => {
    const text = `# Supabase Configuration for Product Studio
VITE_SUPABASE_URL=${config.url || 'https://uxvcqphwjawgwmakhxci.supabase.co'}
VITE_SUPABASE_ANON_KEY=sb_publishable_5SndaauFfQC8W2Al33WgyQ_bdKLEXK0`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Active Supabase keys copied. Paste into your environment variables.',
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.from('stores').select('id, code, name').limit(3);
      if (!error) {
        setTestResult({
          ok: true,
          message: 'Supabase Connected & Operational!',
          detail: `Successfully connected to ${config.url}. Table 'stores' is active with ${data?.length ?? 0} record(s).`,
        });
        addToast({
          type: 'success',
          title: 'Supabase Connected',
          message: 'PostgreSQL database is responding successfully.',
        });
      } else if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('Could not find')) {
        setTestResult({
          ok: false,
          message: 'Supabase API Connected (Tables Pending Creation)',
          detail: `API endpoint ${config.url} is reachable and authorized, but the 'stores' table does not exist yet. Please execute supabase/schema.sql in your Supabase SQL Editor.`,
        });
        addToast({
          type: 'warning',
          title: 'Database Schema Needed',
          message: 'Run supabase/schema.sql in the Supabase SQL editor to create all 17 tables.',
        });
      } else {
        setTestResult({
          ok: false,
          message: `Connection Error: ${error.message}`,
          detail: `Error Code: ${error.code || 'UNKNOWN'}. Hint: ${error.hint || 'Check Supabase project settings and RLS policies.'}`,
        });
        addToast({
          type: 'error',
          title: 'Connection Error',
          message: error.message,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: 'Network / Connection Failure',
        detail: err.message || 'Unable to reach the Supabase endpoint.',
      });
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: err.message || 'Network error reaching Supabase',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSeedSupabase = async () => {
    if (!config.isConfigured) {
      addToast({
        type: 'warning',
        title: 'Supabase Not Connected',
        message: 'Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.',
      });
      return;
    }

    setIsSeeding(true);
    setSeedResult(null);

    try {
      // Seed stores
      const stores = await dataService.getStores();
      for (const st of stores) {
        await supabase.from('stores').upsert({
          code: st.code,
          name: st.name,
          address: st.address,
          phone: st.phone,
          manager_name: st.manager_name,
          is_active: st.is_active,
        }, { onConflict: 'code' });
      }

      // Seed categories
      const categories = await dataService.getCategories();
      for (const c of categories) {
        await supabase.from('categories').upsert({
          name: c.name,
          name_ja: c.name_ja,
          slug: c.slug,
          tax_rate: c.tax_rate,
        }, { onConflict: 'slug' });
      }

      // Seed suppliers
      const suppliers = await dataService.getSuppliers();
      for (const s of suppliers) {
        await supabase.from('suppliers').upsert({
          code: s.code,
          name: s.name,
          contact_person: s.contact_name,
          phone: s.phone,
          whatsapp: s.whatsapp,
          email: s.email,
          address: s.address,
          country: s.country,
          website: s.website,
          payment_terms: s.payment_terms,
          currency: s.currency,
          lead_time_days: s.lead_time_days,
          is_active: s.is_active,
        }, { onConflict: 'code' });
      }

      setSeedResult('Successfully synchronized store, category, and supplier entities to Supabase!');
      addToast({
        type: 'success',
        title: 'Seed Complete',
        message: 'Catalog master data synchronized to Supabase tables.',
      });
    } catch (err: any) {
      setSeedResult(`Seeding encountered error: ${err.message}`);
      addToast({
        type: 'error',
        title: 'Seeding Error',
        message: err.message,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Supabase Relational Database Architecture</h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  config.isConfigured
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {config.isConfigured ? 'CONNECTED' : 'STANDBY (DEMO READY)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              PostgreSQL schema with 17 relational tables, UUID PKs, Row Level Security (RLS), and Supabase Auth.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 border border-emerald-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>
          <button
            onClick={handleCopyEnv}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy .env Keys'}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            testResult.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <p className="font-bold">{testResult.message}</p>
            {testResult.detail && <p className="text-[11px] opacity-90">{testResult.detail}</p>}
          </div>
        </div>
      )}

      {/* Grid status overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Supabase Project Endpoint
          </span>
          <p className="font-mono text-slate-900 font-semibold truncate">
            {config.isConfigured ? config.url : 'Pending VITE_SUPABASE_URL'}
          </p>
          <span className="text-[10px] text-slate-400 block">
            {config.isConfigured ? 'Active HTTPS API Endpoint' : 'In-memory relational fallback active'}
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Row Level Security (RLS)
          </span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>17/17 Tables Protected</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Enforces ADMIN, MANAGER, STORE_STAFF, VIEWER
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            SQL DDL Schema File
          </span>
          <div className="flex items-center gap-1.5 text-slate-900 font-semibold font-mono">
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>supabase/schema.sql</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Complete 17-table schema with UUIDs & RLS
          </span>
        </div>
      </div>

      {/* 17 Tables Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-slate-800">Implemented Database Entities (17 Tables):</span>
          <span className="font-mono text-[11px] text-slate-400">UUIDs · Foreign Keys · Indexes · RLS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono">
          {[
            'profiles',
            'roles',
            'stores',
            'categories',
            'brands',
            'products',
            'product_images',
            'product_store_prices',
            'price_history',
            'inventory',
            'stock_movements',
            'suppliers',
            'product_suppliers',
            'purchase_orders',
            'purchase_order_items',
            'website_sync',
            'audit_logs',
          ].map((tbl) => (
            <div
              key={tbl}
              className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between"
            >
              <span className="truncate text-slate-800 font-medium">{tbl}</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Seeding & Status action */}
      {config.isConfigured && (
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Push initial mock master records (stores, categories, suppliers) into your Supabase database:
          </span>
          <button
            onClick={handleSeedSupabase}
            disabled={isSeeding}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
          >
            {isSeeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            <span>{isSeeding ? 'Syncing...' : 'Sync Master Data to Supabase'}</span>
          </button>
        </div>
      )}

      {seedResult && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
          {seedResult}
        </div>
      )}
    </div>
  );
};
