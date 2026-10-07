import React, { useEffect, useState } from 'react';
import {
  Package,
  Boxes,
  JapaneseYen,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  History,
  Store as StoreIcon,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { StatCard } from '../components/common/StatCard';
import { Product, StockMovement, PriceHistoryRecord, StoreProduct, Category } from '../types/database';

export const DashboardView: React.FC = () => {
  const { selectedStoreId, currentStore, stores, setActiveTab, refreshKey, triggerRefresh, addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalStock: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    syncErrorsCount: 0,
    recentProducts: [] as Product[],
    recentMovements: [] as StockMovement[],
    recentPriceChanges: [] as PriceHistoryRecord[],
  });
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const storeFilter = selectedStoreId === 'all' ? undefined : selectedStoreId;
        const [dashMetrics, spList, catList] = await Promise.all([
          dataService.getDashboardMetrics(storeFilter),
          dataService.getStoreProducts(),
          dataService.getCategories(),
        ]);
        setMetrics(dashMetrics);
        setStoreProducts(spList);
        setCategories(catList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedStoreId, refreshKey]);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      const res = await dataService.triggerSync();
      triggerRefresh();
      addToast({
        type: 'success',
        title: 'Catalog Synchronized',
        message: `Synced ${res.successCount} product(s) to BIMI Online Store and POS branches.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Sync Failed',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'General';
  };

  const getProductStockForStore = (productId: string, storeId?: string) => {
    if (storeId && storeId !== 'all') {
      const sp = storeProducts.find((item) => item.product_id === productId && item.store_id === storeId);
      return sp ? sp.stock_quantity : 0;
    }
    return storeProducts
      .filter((item) => item.product_id === productId)
      .reduce((acc, curr) => acc + curr.stock_quantity, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200/80 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white border border-slate-200/80 rounded-xl" />
          <div className="h-80 bg-white border border-slate-200/80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Operations Dashboard
            </h1>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-600">
              {currentStore ? currentStore.name : 'All BIMI Branches'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inventory levels, multi-store pricing, and synchronization health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync All Stores'}</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Master Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label="Total Products"
          value={metrics.totalProducts}
          sublabel="Active master catalog items"
          icon={Package}
          onClick={() => setActiveTab('products')}
        />
        <StatCard
          label="Total Stock"
          value={metrics.totalStock.toLocaleString()}
          sublabel={selectedStoreId === 'all' ? 'All stores combined' : `${currentStore?.name}`}
          icon={Boxes}
          onClick={() => setActiveTab('inventory')}
        />
        <StatCard
          label="Inventory Value"
          value={`¥${metrics.inventoryValue.toLocaleString()}`}
          sublabel="At purchase cost"
          icon={JapaneseYen}
          onClick={() => setActiveTab('reports')}
        />
        <StatCard
          label="Low Stock"
          value={metrics.lowStockCount}
          sublabel="Under alert threshold"
          icon={AlertTriangle}
          badge={{
            text: metrics.lowStockCount > 0 ? 'Requires attention' : 'Healthy',
            variant: metrics.lowStockCount > 0 ? 'amber' : 'emerald',
          }}
          onClick={() => setActiveTab('inventory')}
        />
        <StatCard
          label="Out of Stock"
          value={metrics.outOfStockCount}
          sublabel="0 inventory units"
          icon={AlertOctagon}
          badge={{
            text: metrics.outOfStockCount > 0 ? 'Urgent restock' : 'Zero items',
            variant: metrics.outOfStockCount > 0 ? 'rose' : 'neutral',
          }}
          onClick={() => setActiveTab('inventory')}
        />
        <StatCard
          label="Sync Errors"
          value={metrics.syncErrorsCount}
          sublabel="E-commerce & POS queue"
          icon={RefreshCw}
          badge={{
            text: metrics.syncErrorsCount > 0 ? '1 action needed' : 'All synced',
            variant: metrics.syncErrorsCount > 0 ? 'amber' : 'emerald',
          }}
          onClick={() => setActiveTab('website-sync')}
        />
      </div>

      {/* Store Breakdown Strip (when in All Branches mode) */}
      {selectedStoreId === 'all' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-semibold text-slate-900">Branch Network Overview</h2>
              <span className="text-[11px] text-slate-400">· {stores.length} Retail Locations</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Manage Stores</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stores.map((store) => {
              const storeStock = storeProducts
                .filter((sp) => sp.store_id === store.id)
                .reduce((acc, curr) => acc + curr.stock_quantity, 0);

              let storeValuation = 0;
              storeProducts
                .filter((sp) => sp.store_id === store.id)
                .forEach((sp) => {
                  const p = metrics.recentProducts.find((i) => i.id === sp.product_id);
                  if (p) storeValuation += sp.stock_quantity * p.cost_price;
                });

              return (
                <div
                  key={store.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{store.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {store.code} · Manager: {store.manager_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900 tabular-nums">
                      {storeStock.toLocaleString()} units
                    </p>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                      Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Recently Updated Products & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recently Updated Products (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recently Updated Products</h2>
              <p className="text-xs text-slate-400 mt-0.5">Master product catalog updates</p>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {metrics.recentProducts.map((p) => {
              const currentStock = getProductStockForStore(p.id, selectedStoreId);
              const margin = Math.round(((p.base_retail_price - p.cost_price) / p.base_retail_price) * 100);

              return (
                <div
                  key={p.id}
                  onClick={() => setActiveTab('products')}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">{p.sku}</span>
                        <span>·</span>
                        <span>{getCategoryName(p.category_id)}</span>
                        <span>·</span>
                        <span className="font-mono">{p.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs font-semibold text-slate-900 tabular-nums">
                        ¥{p.base_retail_price.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">
                        {margin}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                      {currentStock === 0 ? (
                        <span className="text-rose-600 font-medium">Out of stock</span>
                      ) : currentStock <= p.min_stock_alert ? (
                        <span className="text-amber-600 font-medium">Low: {currentStock} units</span>
                      ) : (
                        <span>{currentStock} units in stock</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Stock Movement (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Stock Movement</h2>
              <p className="text-xs text-slate-400 mt-0.5">Physical counts, sales & transfers</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {metrics.recentMovements.map((m) => {
              const isPositive = m.quantity_change > 0;
              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {m.product_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="capitalize">{m.type.replace('_', ' ')}</span>
                      <span>·</span>
                      <span className="truncate">{m.store_name}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        isPositive ? 'text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {isPositive ? `+${m.quantity_change}` : m.quantity_change}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Bal: {m.balance_after}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Price Changes (Section requirement) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900">Recent Price Changes</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical retail price modifications and gross margin impacts
            </p>
          </div>
          <button
            onClick={() => setActiveTab('pricing')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Pricing Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-medium">
                <th className="py-2.5 font-medium">PRODUCT</th>
                <th className="py-2.5 font-medium">BRANCH</th>
                <th className="py-2.5 font-medium text-right">OLD PRICE</th>
                <th className="py-2.5 font-medium text-right">NEW PRICE</th>
                <th className="py-2.5 font-medium text-right">MARGIN DELTA</th>
                <th className="py-2.5 font-medium">REASON / NOTES</th>
                <th className="py-2.5 font-medium">CHANGED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.recentPriceChanges.map((ph) => {
                const newMargin = ph.new_margin_percent ?? ph.margin_percent ?? 0;
                const oldMargin = ph.old_margin_percent ?? newMargin;
                const marginDelta = Math.round((newMargin - oldMargin) * 10) / 10;
                return (
                  <tr key={ph.id} className="hover:bg-slate-50/60">
                    <td className="py-3 font-semibold text-slate-900 pr-4">
                      {ph.product_name}
                    </td>
                    <td className="py-3 text-slate-500 whitespace-nowrap">
                      {ph.store_name}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-400 line-through tabular-nums">
                      ¥{ph.old_price.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      ¥{ph.new_price.toLocaleString()}
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-medium px-1.5 py-0.5 rounded ${
                          marginDelta >= 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        {marginDelta >= 0 ? '+' : ''}
                        {marginDelta}%
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 max-w-xs truncate">
                      {ph.reason}
                    </td>
                    <td className="py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {ph.changed_by}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
