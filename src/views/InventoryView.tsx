import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  SlidersHorizontal,
  Search,
  Plus,
  AlertTriangle,
  History,
  X,
  Check,
  Building,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Package,
  Layers,
  Calendar,
  Truck,
  TrendingDown,
  TrendingUp,
  Tag,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { Product, StoreProduct, StockMovement, StoreId, Category, StockMovementType } from '../types/database';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { StockTransferModal } from '../components/inventory/StockTransferModal';
import { InventoryDashboardWidgets } from '../components/inventory/InventoryDashboardWidgets';

export const InventoryView: React.FC = () => {
  const { stores, selectedStoreId, setSelectedStoreId, currentUser, refreshKey, triggerRefresh, addToast, setActiveTab } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Sub-tabs: 'matrix' | 'movements' | 'analytics'
  const [activeTabMode, setActiveTabMode] = useState<'matrix' | 'movements' | 'analytics'>('matrix');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');

  // Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStoreFilter, setLedgerStoreFilter] = useState('all');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all');

  // Modals state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [modalTargetProductId, setModalTargetProductId] = useState<string | undefined>(undefined);
  const [modalTargetStoreId, setModalTargetStoreId] = useState<StoreId | undefined>(undefined);

  // Inventory Metrics State
  const [inventoryMetrics, setInventoryMetrics] = useState<{
    totalValuationCost: number;
    totalValuationRetail: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    storeValuations: { store: any; costValue: number; retailValue: number; units: number }[];
    topStockedProducts: { product: Product; totalStock: number; totalCostValue: number; totalRetailValue: number }[];
    recentMovements: StockMovement[];
  }>({
    totalValuationCost: 0,
    totalValuationRetail: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    storeValuations: [],
    topStockedProducts: [],
    recentMovements: [],
  });

  const loadInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodList, spList, moveList, catList, metrics] = await Promise.all([
        dataService.getProducts(),
        dataService.getStoreProducts(),
        dataService.getStockMovements(),
        dataService.getCategories(),
        dataService.getInventoryMetrics(selectedStoreId !== 'all' ? selectedStoreId : undefined),
      ]);
      setProducts(prodList);
      setStoreProducts(spList);
      setMovements(moveList);
      setCategories(catList);
      setInventoryMetrics(metrics);
    } catch (err: any) {
      console.error('Failed to load inventory:', err);
      setError(err?.message || 'Failed to load inventory ledger. Click retry to reconnect.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, [refreshKey, selectedStoreId]);

  // Quick Open Modal Handlers
  const handleOpenAdjustment = (productId?: string, storeId?: StoreId) => {
    setModalTargetProductId(productId);
    setModalTargetStoreId(storeId);
    setIsAdjustModalOpen(true);
  };

  const handleOpenTransfer = (productId?: string, fromStoreId?: StoreId) => {
    setModalTargetProductId(productId);
    setModalTargetStoreId(fromStoreId);
    setIsTransferModalOpen(true);
  };

  // Helper for product category name
  const getCategoryName = (catId: string) => {
    const c = categories.find((cat) => cat.id === catId);
    return c ? c.name : 'General';
  };

  // Processed products for the Matrix
  const processedProducts = useMemo(() => {
    return products
      .map((p) => {
        const storeEntries = stores.map((st) => {
          const sp = storeProducts.find((item) => item.product_id === p.id && item.store_id === st.id);
          const stock = sp ? sp.stock_quantity : 0;
          const reorderLevel = sp?.reorder_level ?? p.reorder_level ?? (p.min_stock_alert + 5);
          const isOut = stock === 0;
          const isLow = stock > 0 && stock <= p.min_stock_alert;
          const isReorder = stock > p.min_stock_alert && stock <= reorderLevel;

          return {
            store: st,
            sp,
            stock,
            reorderLevel,
            isOut,
            isLow,
            isReorder,
            location: sp?.shelf_location || 'Unassigned',
          };
        });

        // Consolidated units
        const totalStock = storeEntries.reduce((sum, se) => sum + se.stock, 0);
        const anyOut = storeEntries.some((se) => se.isOut);
        const anyLow = storeEntries.some((se) => se.isLow);
        const totalCostValuation = totalStock * p.cost_price;
        const totalRetailValuation = totalStock * p.base_retail_price;

        return {
          product: p,
          storeEntries,
          totalStock,
          anyOut,
          anyLow,
          totalCostValuation,
          totalRetailValuation,
        };
      })
      .filter(({ product, storeEntries, totalStock, anyOut, anyLow }) => {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          q === '' ||
          product.name.toLowerCase().includes(q) ||
          product.name_ja.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q) ||
          product.barcode.includes(q);

        const matchCat = categoryFilter === 'all' || product.category_id === categoryFilter;

        let matchLevel = true;
        if (stockLevelFilter === 'low') {
          matchLevel = anyLow;
        } else if (stockLevelFilter === 'out') {
          matchLevel = anyOut || totalStock === 0;
        } else if (stockLevelFilter === 'in') {
          matchLevel = totalStock > 0 && !anyLow;
        }

        return matchSearch && matchCat && matchLevel;
      });
  }, [products, storeProducts, stores, categories, searchQuery, categoryFilter, stockLevelFilter]);

  // Filtered Movements for Ledger
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const q = ledgerSearch.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        m.product_name.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        (m.reference && m.reference.toLowerCase().includes(q)) ||
        (m.reference_doc && m.reference_doc.toLowerCase().includes(q)) ||
        m.notes.toLowerCase().includes(q) ||
        m.performed_by.toLowerCase().includes(q);

      const matchStore = ledgerStoreFilter === 'all' || m.store_id === ledgerStoreFilter;
      const matchType = ledgerTypeFilter === 'all' || m.type === ledgerTypeFilter;

      return matchSearch && matchStore && matchType;
    });
  }, [movements, ledgerSearch, ledgerStoreFilter, ledgerTypeFilter]);

  // Movement badge color styling
  const movementBadgeClasses: Record<string, string> = {
    'Stock In': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Return': 'bg-teal-50 text-teal-700 border-teal-200',
    'Transfer In': 'bg-blue-50 text-blue-700 border-blue-200',
    'Transfer Out': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Sale': 'bg-purple-50 text-purple-700 border-purple-200',
    'Adjustment': 'bg-amber-50 text-amber-700 border-amber-200',
    'Damaged': 'bg-orange-50 text-orange-700 border-orange-200',
    'Waste': 'bg-rose-50 text-rose-700 border-rose-200',
    'Expired': 'bg-red-50 text-red-700 border-red-200',
    'Stock Out': 'bg-slate-100 text-slate-700 border-slate-200',
    received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sale: 'bg-purple-50 text-purple-700 border-purple-200',
    waste: 'bg-rose-50 text-rose-700 border-rose-200',
    transfer_in: 'bg-blue-50 text-blue-700 border-blue-200',
    transfer_out: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    adjustment: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory & Stock by Shop</h1>
            <span className="text-[11px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
              Multi-Branch Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store-specific inventory balances, reorder points, inter-branch transfer workflows, and immutable stock movement ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-tab view toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              onClick={() => setActiveTabMode('matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTabMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Branch Stock Matrix
            </button>
            <button
              onClick={() => setActiveTabMode('movements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === 'movements'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Stock Ledger ({movements.length})</span>
            </button>
            <button
              onClick={() => setActiveTabMode('analytics')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTabMode === 'analytics'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Valuation & Health
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenTransfer()}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Transfer Stock</span>
            </button>

            <button
              onClick={() => handleOpenAdjustment()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stock Adjustment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadInventoryData}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Reconnection</span>
          </button>
        </div>
      )}

      {/* Interactive Inventory Dashboard Widgets */}
      <InventoryDashboardWidgets
        metrics={inventoryMetrics}
        onFilterLowStock={() => {
          setActiveTabMode('matrix');
          setStockLevelFilter(stockLevelFilter === 'low' ? 'all' : 'low');
        }}
        onFilterOutOfStock={() => {
          setActiveTabMode('matrix');
          setStockLevelFilter(stockLevelFilter === 'out' ? 'all' : 'out');
        }}
        onViewAllMovements={() => setActiveTabMode('movements')}
        activeFilter={stockLevelFilter === 'low' ? 'low' : stockLevelFilter === 'out' ? 'out' : 'all'}
      />

      {/* Tab 1: Branch Stock Matrix */}
      {activeTabMode === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, SKU or barcode..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStockLevelFilter('all')}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                    stockLevelFilter === 'all'
                      ? 'border-slate-900 bg-slate-900 text-white font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setStockLevelFilter('low')}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                    stockLevelFilter === 'low'
                      ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Low Stock (≤ Min Alert)
                </button>
                <button
                  type="button"
                  onClick={() => setStockLevelFilter('out')}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                    stockLevelFilter === 'out'
                      ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Out of Stock (0 Units)
                </button>
              </div>
            </div>

            {(searchQuery || categoryFilter !== 'all' || stockLevelFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStockLevelFilter('all');
                }}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 font-medium">
                    <th className="py-3 px-4 font-medium">PRODUCT IDENTITY</th>
                    <th className="py-3 px-3 font-medium text-center">THRESHOLDS</th>

                    {/* Store Columns */}
                    {stores.map((st) => (
                      <th key={st.id} className="py-3 px-4 font-medium text-right bg-slate-50/40 border-l border-slate-100">
                        <div className="flex items-center justify-end gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.name.toUpperCase()}</span>
                        </div>
                      </th>
                    ))}

                    <th className="py-3 px-4 font-medium text-right border-l border-slate-100">TOTAL STOCK</th>
                    <th className="py-3 px-4 font-medium text-right">VALUATION</th>
                    <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {processedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5 + stores.length} className="py-12 text-center text-slate-400">
                        <p className="text-sm font-medium">No inventory records match the selected filters.</p>
                        <p className="text-xs mt-1">Try resetting search keywords or category filters.</p>
                      </td>
                    </tr>
                  ) : (
                    processedProducts.map(({ product, storeEntries, totalStock, totalCostValuation }) => {
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Product */}
                          <td className="py-3.5 px-4 min-w-[200px]">
                            <div className="flex items-center gap-2.5">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200/80 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-400 font-bold text-[10px]">
                                  BIMI
                                </div>
                              )}
                              <div className="truncate">
                                <p className="font-bold text-slate-900 truncate">{product.name}</p>
                                <p className="text-[11px] text-slate-500 font-jp truncate">{product.name_ja}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>{product.sku}</span>
                                  <span>·</span>
                                  <span>{getCategoryName(product.category_id)}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Thresholds */}
                          <td className="py-3.5 px-3 text-center font-mono">
                            <span className="text-[11px] text-slate-700 block font-semibold">
                              Min: {product.min_stock_alert} {product.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Reorder: {product.reorder_level || product.min_stock_alert + 5}
                            </span>
                          </td>

                          {/* Store Columns */}
                          {storeEntries.map((se) => {
                            return (
                              <td
                                key={se.store.id}
                                className={`py-3.5 px-4 text-right tabular-nums border-l border-slate-100 ${
                                  se.isOut ? 'bg-rose-50/40' : se.isLow ? 'bg-amber-50/30' : ''
                                }`}
                              >
                                <div className="flex flex-col items-end">
                                  <span className="font-mono font-bold text-sm text-slate-900">
                                    {se.stock} {product.unit}
                                  </span>

                                  {se.isOut ? (
                                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 rounded mt-0.5">
                                      OUT OF STOCK
                                    </span>
                                  ) : se.isLow ? (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded mt-0.5">
                                      LOW STOCK
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                      Shelf: {se.location}
                                    </span>
                                  )}

                                  <button
                                    onClick={() => handleOpenAdjustment(product.id, se.store.id)}
                                    className="text-[10px] text-slate-500 hover:text-slate-900 underline mt-1 cursor-pointer"
                                  >
                                    Adjust
                                  </button>
                                </div>
                              </td>
                            );
                          })}

                          {/* Total Stock */}
                          <td className="py-3.5 px-4 text-right tabular-nums border-l border-slate-100 font-mono">
                            <span className="font-bold text-slate-900 text-sm block">
                              {totalStock} {product.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Consolidated
                            </span>
                          </td>

                          {/* Valuation */}
                          <td className="py-3.5 px-4 text-right tabular-nums font-mono">
                            <span className="font-bold text-slate-900 block">
                              ¥{totalCostValuation.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Cost basis
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenTransfer(product.id)}
                                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Transfer to another branch"
                              >
                                <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                                <span>Transfer</span>
                              </button>

                              <button
                                onClick={() => handleOpenAdjustment(product.id)}
                                className="px-2.5 py-1 text-[11px] font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Adjust stock level"
                              >
                                <Plus className="w-3 h-3 text-slate-500" />
                                <span>Adjust</span>
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
        </div>
      )}

      {/* Tab 2: Stock Movement History Ledger */}
      {activeTabMode === 'movements' && (
        <div className="space-y-4">
          {/* Ledger Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="Search ledger by product, SKU, user, ref doc, or notes..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>

              {/* Store Filter */}
              <select
                value={ledgerStoreFilter}
                onChange={(e) => setLedgerStoreFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Movement Type Filter */}
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Movement Types</option>
                <option value="Stock In">Stock In</option>
                <option value="Stock Out">Stock Out</option>
                <option value="Sale">Sale</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Transfer In">Transfer In</option>
                <option value="Transfer Out">Transfer Out</option>
                <option value="Damaged">Damaged</option>
                <option value="Waste">Waste</option>
                <option value="Expired">Expired</option>
                <option value="Return">Return</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Displaying {filteredMovements.length} audit records
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 font-medium">
                    <th className="py-3 px-4 font-medium">DATE / TIME</th>
                    <th className="py-3 px-4 font-medium">PRODUCT IDENTITY</th>
                    <th className="py-3 px-4 font-medium">BRANCH STORE</th>
                    <th className="py-3 px-3 font-medium">MOVEMENT TYPE</th>
                    <th className="py-3 px-4 font-medium text-right">QUANTITY</th>
                    <th className="py-3 px-4 font-medium text-right">PREV → NEW BALANCE</th>
                    <th className="py-3 px-4 font-medium">REFERENCE CODE</th>
                    <th className="py-3 px-4 font-medium">NOTES / JUSTIFICATION</th>
                    <th className="py-3 px-4 font-medium">OPERATOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No stock movement ledger records match the active query.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isPositive = m.quantity_change > 0;
                      const dateObj = new Date(m.created_at);
                      const prevVal = m.previous_stock ?? (m.balance_after - m.quantity_change);
                      const newVal = m.new_stock ?? m.balance_after;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            <span className="block font-bold">{m.product_name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{m.sku}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {m.store_name}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                movementBadgeClasses[m.type] || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-sm tabular-nums whitespace-nowrap">
                            <span className={isPositive ? 'text-emerald-700' : 'text-slate-900'}>
                              {isPositive ? `+${m.quantity_change}` : m.quantity_change}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                            <span className="text-slate-400">{prevVal}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span className="font-bold text-slate-900">{newVal}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {m.reference || m.reference_doc || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={m.notes}>
                            {m.notes}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {m.performed_by}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory Valuation & Health Analytics */}
      {activeTabMode === 'analytics' && (
        <div className="space-y-6">
          {/* Valuation breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((st) => {
              const sv = inventoryMetrics.storeValuations.find((item) => item.store.id === st.id);
              const costVal = sv ? sv.costValue : 0;
              const retailVal = sv ? sv.retailValue : 0;
              const units = sv ? sv.units : 0;
              const unrealizedMargin = retailVal > 0 ? Math.round(((retailVal - costVal) / retailVal) * 100) : 0;

              return (
                <div key={st.id} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-500" />
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{st.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono">{st.code} · Manager: {st.manager_name}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">{units} total units</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-sans">COST VALUATION</span>
                      <span className="font-bold text-slate-900 text-base">¥{costVal.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-sans">RETAIL VALUE</span>
                      <span className="font-bold text-slate-900 text-base">¥{retailVal.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-sans">PROJECTED MARGIN</span>
                      <span className="font-bold text-emerald-700 text-base">{unrealizedMargin}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Depleted and Low stock critical lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Out of Stock Items */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-rose-600 pb-2 border-b border-slate-100">
                <AlertOctagon className="w-4 h-4" />
                <h3 className="text-xs font-bold text-slate-900">Critical: Depleted Shelves ({inventoryMetrics.outOfStockCount})</h3>
              </div>
              <div className="space-y-2">
                {products
                  .filter((p) => {
                    const total = storeProducts
                      .filter((sp) => sp.product_id === p.id)
                      .reduce((sum, sp) => sum + sp.stock_quantity, 0);
                    return total === 0;
                  })
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                      </div>
                      <button
                        onClick={() => handleOpenAdjustment(p.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-white border border-rose-200 rounded-md hover:bg-rose-50 cursor-pointer"
                      >
                        Restock
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Low Stock Items */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-amber-600 pb-2 border-b border-slate-100">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-xs font-bold text-slate-900">Reorder Alert Triggered ({inventoryMetrics.lowStockCount})</h3>
              </div>
              <div className="space-y-2">
                {products
                  .filter((p) => {
                    const total = storeProducts
                      .filter((sp) => sp.product_id === p.id)
                      .reduce((sum, sp) => sum + sp.stock_quantity, 0);
                    return total > 0 && total <= p.min_stock_alert;
                  })
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Min alert: {p.min_stock_alert} {p.unit}</span>
                      </div>
                      <button
                        onClick={() => handleOpenTransfer(p.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-white border border-amber-200 rounded-md hover:bg-amber-50 cursor-pointer"
                      >
                        Rebalance
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <StockAdjustmentModal
          products={products}
          stores={stores}
          initialProductId={modalTargetProductId}
          initialStoreId={modalTargetStoreId}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setModalTargetProductId(undefined);
            setModalTargetStoreId(undefined);
          }}
          onSuccess={() => {
            triggerRefresh();
          }}
        />
      )}

      {/* Stock Transfer Modal */}
      {isTransferModalOpen && (
        <StockTransferModal
          products={products}
          stores={stores}
          initialProductId={modalTargetProductId}
          initialFromStoreId={modalTargetStoreId}
          onClose={() => {
            setIsTransferModalOpen(false);
            setModalTargetProductId(undefined);
            setModalTargetStoreId(undefined);
          }}
          onSuccess={() => {
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
};
