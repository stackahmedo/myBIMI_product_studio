import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  SlidersHorizontal,
  Code2,
  Info,
  Clock,
  Eye,
  Send,
  AlertCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Wifi,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Square,
  CheckSquare,
  Copy,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { websiteSyncService } from '../services/websiteSyncService';
import {
  Product,
  Category,
  WebsitePublishingState,
  WebsiteSyncLog,
  WebsiteSyncConfig,
} from '../types/database';
import { BarcodeSvg } from '../components/common/BarcodeSvg';

export const WebsiteSyncView: React.FC = () => {
  const { currentUser, refreshKey, triggerRefresh, addToast, setActiveTab } = useApp();

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [syncLogs, setSyncLogs] = useState<WebsiteSyncLog[]>([]);
  const [syncConfig, setSyncConfig] = useState<WebsiteSyncConfig>(websiteSyncService.getConfig());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Filters & Selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Logs table state
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'Success' | 'Failed'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Modals state
  const [inspectPayloadProduct, setInspectPayloadProduct] = useState<Product | null>(null);
  const [inspectErrorProduct, setInspectErrorProduct] = useState<Product | null>(null);
  const [inspectLogItem, setInspectLogItem] = useState<WebsiteSyncLog | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Health check state
  const [healthResult, setHealthResult] = useState<{ ok: boolean; latencyMs: number; message: string } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, logs] = await Promise.all([
        dataService.getProducts(),
        dataService.getCategories(),
        dataService.getWebsiteSyncLogs(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSyncLogs(logs);
      setSyncConfig(websiteSyncService.getConfig());
    } catch (err) {
      console.error('Failed to load website sync data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Initial Health Check
  useEffect(() => {
    async function check() {
      try {
        const res = await websiteSyncService.healthCheck();
        setHealthResult(res);
      } catch {
        setHealthResult({ ok: false, latencyMs: 0, message: 'Endpoint unreachable' });
      }
    }
    check();
  }, []);

  const handleRunHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await websiteSyncService.healthCheck();
      setHealthResult(res);
      addToast({
        type: res.ok ? 'success' : 'error',
        title: res.ok ? 'API Cluster Healthy' : 'API Unreachable',
        message: `${res.message} (${res.latencyMs}ms)`,
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Metrics counts
  const publishedCount = useMemo(() => {
    return products.filter((p) => p.publishing_state === 'Published').length;
  }, [products]);

  const pendingCount = useMemo(() => {
    return products.filter(
      (p) => p.publishing_state === 'Ready to Publish' || p.has_pending_changes
    ).length;
  }, [products]);

  const failedCount = useMemo(() => {
    return products.filter(
      (p) => p.publishing_state === 'Sync Error' || p.website_sync_status === 'error'
    ).length;
  }, [products]);

  const draftCount = useMemo(() => {
    return products.filter((p) => p.publishing_state === 'Draft' || !p.publishing_state).length;
  }, [products]);

  const unpublishedCount = useMemo(() => {
    return products.filter((p) => p.publishing_state === 'Unpublished').length;
  }, [products]);

  const recentErrorsList = useMemo(() => {
    return syncLogs.filter((l) => l.status === 'Failed');
  }, [syncLogs]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // State filter
      if (stateFilter === 'published' && p.publishing_state !== 'Published') return false;
      if (stateFilter === 'ready' && p.publishing_state !== 'Ready to Publish' && !p.has_pending_changes) return false;
      if (stateFilter === 'error' && p.publishing_state !== 'Sync Error') return false;
      if (stateFilter === 'draft' && p.publishing_state !== 'Draft') return false;
      if (stateFilter === 'unpublished' && p.publishing_state !== 'Unpublished') return false;

      // Category filter
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchNameJa = (p.name_ja || '').toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
        if (!matchName && !matchNameJa && !matchSku && !matchBarcode) return false;
      }

      return true;
    });
  }, [products, stateFilter, categoryFilter, searchQuery]);

  // Filtered logs list
  const filteredLogs = useMemo(() => {
    return syncLogs.filter((log) => {
      if (logFilterStatus !== 'all' && log.status !== logFilterStatus) return false;
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase();
        const matchSku = log.product_sku.toLowerCase().includes(q);
        const matchName = log.product_name.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchResult = log.result.toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchAction && !matchResult) return false;
      }
      return true;
    });
  }, [syncLogs, logFilterStatus, logSearchQuery]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // --- ACTIONS ---

  // 1. Publish Product
  const handlePublish = async (product: Product) => {
    setIsSyncing(true);
    try {
      const res = await dataService.publishProductToWebsite(product.id, currentUser?.name);
      await loadData();
      triggerRefresh();
      if (res.publishing_state === 'Published') {
        addToast({
          type: 'success',
          title: 'Published to Website',
          message: `${product.sku} is now live on the My BIMI online catalog.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Publishing Issue',
          message: res.website_sync_error || 'Validation error reported by storefront adapter.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Publish Failed',
        message: err?.message || 'Sync failed.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Update Website (for existing live products)
  const handleUpdateWebsite = async (product: Product) => {
    setIsSyncing(true);
    try {
      const res = await dataService.updateProductOnWebsite(product.id, currentUser?.name);
      await loadData();
      triggerRefresh();
      if (res.publishing_state === 'Published') {
        addToast({
          type: 'success',
          title: 'Website Updated',
          message: `Staged catalog changes for ${product.sku} pushed live.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: res.website_sync_error || 'Adapter error.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Failed to update website.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Unpublish Product
  const handleUnpublish = async (product: Product) => {
    setIsSyncing(true);
    try {
      await dataService.unpublishProductFromWebsite(product.id, currentUser?.name);
      await loadData();
      triggerRefresh();
      addToast({
        type: 'info',
        title: 'Product Unpublished',
        message: `${product.sku} removed from public storefront.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Unpublish Failed',
        message: err?.message || 'Failed to unpublish.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Retry Sync (for error items)
  const handleRetrySync = async (product: Product) => {
    setIsSyncing(true);
    try {
      const res = await dataService.retryProductWebsiteSync(product.id, currentUser?.name);
      await loadData();
      triggerRefresh();
      if (res.publishing_state === 'Published') {
        addToast({
          type: 'success',
          title: 'Error Resolved',
          message: `Sync payload for ${product.sku} re-validated and pushed successfully.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Retry Failed',
          message: res.website_sync_error || 'Error persists.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Retry Failed',
        message: err?.message || 'Retry failed.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Batch Sync Selected Products
  const handleSyncSelected = async () => {
    if (selectedProductIds.length === 0) return;
    setIsSyncing(true);
    try {
      const res = await dataService.syncSelectedProducts(selectedProductIds, currentUser?.name);
      await loadData();
      triggerRefresh();
      setSelectedProductIds([]);
      addToast({
        type: res.failed === 0 ? 'success' : 'info',
        title: 'Batch Sync Finished',
        message: `Successfully processed ${res.success} products (${res.failed} errors).`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 6. Sync All Changed Products
  const handleSyncAllChanged = async () => {
    setIsSyncing(true);
    try {
      const res = await dataService.syncAllChangedProducts(currentUser?.name);
      await loadData();
      triggerRefresh();
      addToast({
        type: 'success',
        title: 'All Staged Products Synced',
        message: `Pushed updates for ${res.success} staged products to live website.`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Status badge styling helper
  const renderPublishingBadge = (state?: WebsitePublishingState, hasPending?: boolean) => {
    switch (state) {
      case 'Published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Published</span>
            {hasPending && (
              <span className="ml-1 px-1 py-0.1 bg-amber-200 text-amber-900 rounded text-[9px] font-bold">
                Edits Staged
              </span>
            )}
          </span>
        );
      case 'Ready to Publish':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Ready to Publish</span>
          </span>
        );
      case 'Sync Error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Sync Error</span>
          </span>
        );
      case 'Unpublished':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Unpublished</span>
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Draft</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          PAGE HEADER
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Website & E-Commerce Synchronization</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
              PIM Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            External catalog publishing, staging management, and high-speed API transaction logs.
          </p>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Health status pill */}
          <button
            onClick={handleRunHealthCheck}
            disabled={isCheckingHealth}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-slate-700 cursor-pointer"
            title="Click to re-ping API health"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthResult?.ok ? 'bg-emerald-500' : 'bg-rose-500'
              } ${isCheckingHealth ? 'animate-ping' : ''}`}
            />
            <span className="font-mono text-[11px]">
              {healthResult?.latencyMs ? `${healthResult.latencyMs}ms` : 'API Live'}
            </span>
          </button>

          {/* Sync Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-slate-700 cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync Settings</span>
          </button>

          {/* Sync All Changed Products Button */}
          <button
            onClick={handleSyncAllChanged}
            disabled={isSyncing || pendingCount === 0}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync All Changed ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          KEY METRICS STRIP: Published, Pending, Failed, Last Sync, Recent Errors
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Published */}
        <div
          onClick={() => setStateFilter(stateFilter === 'published' ? 'all' : 'published')}
          className={`bg-white border rounded-xl p-4 shadow-2xs cursor-pointer transition-all ${
            stateFilter === 'published' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Published
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{publishedCount}</span>
            <span className="text-xs text-slate-400 font-mono">
              / {products.length} ({products.length ? Math.round((publishedCount / products.length) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Live on storefront</span>
        </div>

        {/* Metric 2: Pending / Ready to Publish */}
        <div
          onClick={() => setStateFilter(stateFilter === 'ready' ? 'all' : 'ready')}
          className={`bg-white border rounded-xl p-4 shadow-2xs cursor-pointer transition-all ${
            stateFilter === 'ready' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pending
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-amber-700">{pendingCount}</span>
            <span className="text-xs text-slate-400 font-mono">staged</span>
          </div>
          <span className="text-[10px] text-amber-600 font-medium mt-1 block">Ready to publish</span>
        </div>

        {/* Metric 3: Failed / Sync Error */}
        <div
          onClick={() => setStateFilter(stateFilter === 'error' ? 'all' : 'error')}
          className={`bg-white border rounded-xl p-4 shadow-2xs cursor-pointer transition-all ${
            stateFilter === 'error' ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Failed
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className={`text-2xl font-bold font-mono ${failedCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {failedCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">errors</span>
          </div>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">
            {failedCount > 0 ? 'Requires attention' : 'No active errors'}
          </span>
        </div>

        {/* Metric 4: Last Sync */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Last Sync
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-sm font-bold font-mono text-slate-900 truncate">
              {syncLogs[0] ? new Date(syncLogs[0].timestamp).toLocaleTimeString() : 'Recent'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block truncate">
            {syncConfig.adapter_type.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Metric 5: Recent Errors */}
        <div
          onClick={() => {
            setLogFilterStatus('Failed');
            const el = document.getElementById('sync-logs-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-2xs cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Recent Errors
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{recentErrorsList.length}</span>
            <span className="text-xs text-slate-400 font-mono">logged</span>
          </div>
          <span className="text-[10px] text-blue-600 font-medium mt-1 block hover:underline">
            View transaction logs →
          </span>
        </div>
      </div>

      {/* =========================================================================
          SAFEGUARD NOTIFICATION CARD (Internal edits do NOT auto-publish)
          ========================================================================= */}
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Staged Publishing Governance Active</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 font-mono">
                ENFORCED
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Internal master catalog edits <strong>do not automatically go public</strong> without your explicit sign-off.
              When you adjust prices, barcodes, or specs, changes are safely staged as <em>"Ready to Publish"</em> until you trigger an update.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            Configure Rules
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRODUCTS SYNCHRONIZATION CATALOG
          ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Controls Bar: Tabs, Search, Category filter */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Publishing State Tab Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All Products', count: products.length },
              { id: 'published', label: 'Published', count: publishedCount },
              { id: 'ready', label: 'Ready to Publish', count: pendingCount },
              { id: 'error', label: 'Sync Error', count: failedCount },
              { id: 'draft', label: 'Draft', count: draftCount },
              { id: 'unpublished', label: 'Unpublished', count: unpublishedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  stateFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    stateFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, JAN, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Floating Bulk Actions Bar if any items selected */}
        {selectedProductIds.length > 0 && (
          <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-400">
                {selectedProductIds.length} products selected
              </span>
              <span className="text-slate-400">|</span>
              <button
                onClick={() => setSelectedProductIds([])}
                className="text-slate-300 hover:text-white underline cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncSelected}
                disabled={isSyncing}
                className="px-3 py-1 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Selected ({selectedProductIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-8">
                  <button onClick={handleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-700">
                    {selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length ? (
                      <CheckSquare className="w-4 h-4 text-slate-900" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Product Item</th>
                <th className="py-3 px-3">Codes</th>
                <th className="py-3 px-3 text-right">Online Price</th>
                <th className="py-3 px-3 text-center">Publishing State</th>
                <th className="py-3 px-3">Last Synced</th>
                <th className="py-3 px-3 text-right">Sync Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No products found matching the active state or search filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const isReady = p.publishing_state === 'Ready to Publish' || p.has_pending_changes;
                  const isError = p.publishing_state === 'Sync Error';
                  const isPublished = p.publishing_state === 'Published';
                  const isDraft = p.publishing_state === 'Draft' || !p.publishing_state;
                  const isUnpublished = p.publishing_state === 'Unpublished';

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-slate-50' : ''
                      } ${isError ? 'bg-rose-50/30' : ''}`}
                    >
                      {/* Select checkbox */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleSelectProduct(p.id)}
                          className="cursor-pointer text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-slate-900" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product Thumbnail & Names */}
                      <td className="py-3 px-3">
                        <div className="flex items-start gap-2.5 min-w-[200px]">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Globe className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{p.name_ja || p.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{p.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* SKU and Barcode */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] space-y-0.5">
                          <span className="font-bold text-slate-800 block">{p.sku}</span>
                          <span className="text-slate-400 text-[10px] block">JAN: {p.barcode || '—'}</span>
                        </div>
                      </td>

                      {/* Online Selling Price */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-bold text-slate-900 text-xs block">
                          ¥{p.base_retail_price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          税込 ¥{Math.round(p.base_retail_price * (1 + p.tax_rate)).toLocaleString()}
                        </span>
                      </td>

                      {/* Publishing State Badge */}
                      <td className="py-3 px-3 text-center">
                        {renderPublishingBadge(p.publishing_state, p.has_pending_changes)}
                        {p.website_sync_error && (
                          <button
                            onClick={() => setInspectErrorProduct(p)}
                            className="mt-1 text-[10px] text-rose-600 hover:underline block mx-auto cursor-pointer"
                          >
                            View error details
                          </button>
                        )}
                      </td>

                      {/* Last Synced */}
                      <td className="py-3 px-3 text-[11px] text-slate-500 font-mono">
                        {p.last_synced_at ? new Date(p.last_synced_at).toLocaleString() : 'Never synced'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Main State Action Button */}
                          {isDraft && (
                            <button
                              onClick={() => handlePublish(p)}
                              disabled={isSyncing}
                              className="px-2.5 py-1 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors cursor-pointer text-[11px]"
                            >
                              Publish
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => handleUpdateWebsite(p)}
                              disabled={isSyncing}
                              className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded hover:bg-amber-700 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Update Website</span>
                            </button>
                          )}

                          {isPublished && !p.has_pending_changes && (
                            <button
                              onClick={() => handleUpdateWebsite(p)}
                              disabled={isSyncing}
                              className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold rounded hover:bg-slate-200 transition-colors cursor-pointer text-[11px]"
                            >
                              Update Website
                            </button>
                          )}

                          {isError && (
                            <button
                              onClick={() => handleRetrySync(p)}
                              disabled={isSyncing}
                              className="px-2.5 py-1 bg-rose-600 text-white font-semibold rounded hover:bg-rose-700 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry Sync</span>
                            </button>
                          )}

                          {isUnpublished && (
                            <button
                              onClick={() => handlePublish(p)}
                              disabled={isSyncing}
                              className="px-2.5 py-1 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors cursor-pointer text-[11px]"
                            >
                              Publish
                            </button>
                          )}

                          {/* Unpublish button for live products */}
                          {isPublished && (
                            <button
                              onClick={() => handleUnpublish(p)}
                              disabled={isSyncing}
                              className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title="Unpublish product"
                            >
                              Unpublish
                            </button>
                          )}

                          {/* Inspect Payload button */}
                          <button
                            onClick={() => setInspectPayloadProduct(p)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                            title="Inspect API Payload JSON"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          AUDIT LOG: Complete Sync Transactions Ledger
          Product, Action, Request, Result, Status, Error, User, Date/time
          ========================================================================= */}
      <div id="sync-logs-section" className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Website Sync Audit Ledger</span>
            </h3>
            <p className="text-xs text-slate-500">
              Chronological ledger of payload transmissions, webhook acknowledgements, and sync diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              {(['all', 'Success', 'Failed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setLogFilterStatus(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    logFilterStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Result / Response</th>
                <th className="py-2.5 px-3">Error Diagnostic</th>
                <th className="py-2.5 px-3">Authorized User</th>
                <th className="py-2.5 px-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No sync log transactions recorded matching this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{log.product_name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{log.product_sku}</span>
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.status === 'Success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status} {log.http_code ? `(${log.http_code})` : ''}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-sans text-slate-600 truncate max-w-xs" title={log.result}>
                      {log.result}
                    </td>

                    <td className="py-2.5 px-3 font-sans text-rose-600 truncate max-w-xs" title={log.error}>
                      {log.error || <span className="text-slate-300 font-mono">—</span>}
                    </td>

                    <td className="py-2.5 px-3 font-sans text-slate-600">{log.user}</td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setInspectLogItem(log)}
                        className="text-blue-600 hover:underline cursor-pointer text-[10px]"
                      >
                        View JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: SYNC PAYLOAD INSPECTOR
          ========================================================================= */}
      {inspectPayloadProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Live Website API Payload Inspector</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    SKU: {inspectPayloadProduct.sku} · {inspectPayloadProduct.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectPayloadProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Transmitted JSON payload according to configured sync fields:</span>
                <button
                  onClick={() => {
                    const p = websiteSyncService.buildPayload(inspectPayloadProduct);
                    navigator.clipboard.writeText(JSON.stringify(p, null, 2));
                    addToast({
                      type: 'info',
                      title: 'Copied Payload',
                      message: 'JSON payload copied to clipboard.',
                    });
                  }}
                  className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {JSON.stringify(websiteSyncService.buildPayload(inspectPayloadProduct), null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                Endpoint: {syncConfig.endpoint_url} (HTTP PUT / POST)
              </span>
              <button
                onClick={() => setInspectPayloadProduct(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: INSPECT LOG JSON
          ========================================================================= */}
      {inspectLogItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Sync Transaction Payload #{inspectLogItem.id}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {inspectLogItem.product_sku} · {new Date(inspectLogItem.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectLogItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Request Body:</span>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-48">
                {inspectLogItem.request}
              </pre>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Result Message:</span>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono">
                {inspectLogItem.result}
              </p>
            </div>

            {inspectLogItem.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-mono">
                <strong>Error:</strong> {inspectLogItem.error}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setInspectLogItem(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ERROR DIAGNOSTICS & RETRY
          ========================================================================= */}
      {inspectErrorProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-slate-900">Website Synchronization Failure</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {inspectErrorProduct.sku} · {inspectErrorProduct.name}
                </p>
              </div>
              <button
                onClick={() => setInspectErrorProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <strong>Error Diagnostic:</strong>
              <p className="font-mono text-[11px] leading-relaxed">
                {inspectErrorProduct.website_sync_error || 'Validation rejected by external storefront.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <p>• Internal Product Studio data is protected and has <strong>not been corrupted</strong>.</p>
              <p>• Check that the product price is valid, JAN barcode is compliant, and category tags exist.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setInspectErrorProduct(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRetrySync(inspectErrorProduct);
                  setInspectErrorProduct(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Sync Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: SYNC SETTINGS & FIELD MAPPING
          ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-base text-slate-900">Website Sync Configuration & Fields</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rule 1: Staged Publishing vs Auto-Sync */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Internal Edits Auto-Sync Safeguard</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    When <strong>DISABLED</strong> (Recommended), internal edits will NOT automatically go public.
                    They remain safely staged in <em>"Ready to Publish"</em> until you trigger manual publish.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={syncConfig.auto_sync_on_edit}
                    onChange={(e) => {
                      const updated = websiteSyncService.updateConfig({ auto_sync_on_edit: e.target.checked });
                      setSyncConfig(updated);
                      addToast({
                        type: 'info',
                        title: 'Auto-Sync Setting Changed',
                        message: e.target.checked
                          ? 'Auto-sync enabled: Edits will push to live website immediately.'
                          : 'Staging safeguard active: Edits will require manual publish.',
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900" />
                </label>
              </div>
            </div>

            {/* Rule 2: API Adapter Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Storefront API Adapter
              </label>
              <select
                value={syncConfig.adapter_type}
                onChange={(e) => {
                  const updated = websiteSyncService.updateConfig({ adapter_type: e.target.value as any });
                  setSyncConfig(updated);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="bimi_headless">My BIMI Headless E-Commerce API (Tokyo Region)</option>
                <option value="shopify_webhook">Shopify Admin REST Storefront Webhook</option>
                <option value="mock_simulation">Local Diagnostics Sandbox (Simulation)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Server-side credentials configured in environment variables (WEBSITE_SYNC_API_URL / WEBSITE_SYNC_API_KEY).
              </p>
            </div>

            {/* Rule 3: Fields That May Sync */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Configured Sync Fields
              </label>
              <p className="text-xs text-slate-500">
                Select which product attributes are packaged into the external website payload:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                {[
                  { key: 'name', label: 'Product name' },
                  { key: 'name_ja', label: 'Japanese name' },
                  { key: 'image', label: 'Product image' },
                  { key: 'category', label: 'Category' },
                  { key: 'description', label: 'Description' },
                  { key: 'price', label: 'Price' },
                  { key: 'offer_price', label: 'Offer price' },
                  { key: 'stock_status', label: 'Stock status' },
                  { key: 'origin', label: 'Origin' },
                  { key: 'weight', label: 'Weight' },
                  { key: 'barcode', label: 'Barcode' },
                  { key: 'featured', label: 'Featured' },
                  { key: 'new_arrival', label: 'New Arrival' },
                ].map((f) => {
                  const isChecked = (syncConfig.sync_fields as any)[f.key];
                  return (
                    <label
                      key={f.key}
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = websiteSyncService.updateConfig({
                            sync_fields: {
                              ...syncConfig.sync_fields,
                              [f.key]: e.target.checked,
                            },
                          });
                          setSyncConfig(updated);
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0"
                      />
                      <span className="font-medium text-slate-700">{f.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Health check & actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleRunHealthCheck}
                disabled={isCheckingHealth}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                {isCheckingHealth ? 'Pinging API...' : 'Test Connection'}
              </button>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
