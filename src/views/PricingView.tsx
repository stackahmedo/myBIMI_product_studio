import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  History,
  Search,
  Edit2,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Layers,
  Filter,
  ArrowUpDown,
  Tag,
  Store as StoreIcon,
  Globe,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { Product, StoreProduct, PriceHistoryRecord, StoreId, ProductStorePrice, Category } from '../types/database';
import { StorePriceModal } from '../components/pricing/StorePriceModal';
import { BulkPriceUpdateModal } from '../components/pricing/BulkPriceUpdateModal';

export const PricingView: React.FC = () => {
  const { stores, currentUser, refreshKey, triggerRefresh, addToast, setActiveTab } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productStorePrices, setProductStorePrices] = useState<ProductStorePrice[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab: 'matrix' vs 'history'
  const [activeViewTab, setActiveViewTab] = useState<'matrix' | 'history'>('matrix');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filterBelowCostOnly, setFilterBelowCostOnly] = useState(false);
  const [filterActiveOffersOnly, setFilterActiveOffersOnly] = useState(false);
  const [filterVariancesOnly, setFilterVariancesOnly] = useState(false);

  // Checkbox multi-selection for bulk operations
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStoreId, setEditingStoreId] = useState<StoreId | 'website' | 'all'>('all');
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // History Tab Filter
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStoreFilter, setHistoryStoreFilter] = useState('all');

  const loadPricingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodList, pspList, phList, catList] = await Promise.all([
        dataService.getProducts(),
        dataService.getProductStorePrices(),
        dataService.getPriceHistory(),
        dataService.getCategories(),
      ]);
      setProducts(prodList);
      setProductStorePrices(pspList);
      setPriceHistory(phList);
      setCategories(catList);
    } catch (err: any) {
      console.error('Failed to load pricing:', err);
      setError(err?.message || 'Failed to query branch pricing matrix. Click retry to reconnect.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricingData();
  }, [refreshKey]);

  // Helper to get prices for a product
  const getProductPricesMap = (productId: string) => {
    const list = productStorePrices.filter((psp) => psp.product_id === productId);
    const map = new Map<string, ProductStorePrice>();
    list.forEach((psp) => map.set(psp.store_id, psp));
    return map;
  };

  // Analysis helpers
  const analyzedProducts = useMemo(() => {
    return products.map((p) => {
      const priceMap = getProductPricesMap(p.id);

      // Check prices across stores
      const storePrices = stores.map((st) => {
        const psp = priceMap.get(st.id);
        const regular = psp ? psp.regular_price : p.base_retail_price;
        const offer = psp?.offer_price ?? null;
        const effective = offer ?? regular;
        const isBelow = effective < p.cost_price;
        return {
          store: st,
          psp,
          regular,
          offer,
          effective,
          isBelow,
          hasOffer: !!offer,
        };
      });

      const websitePsp = priceMap.get('website');
      const websitePrice = websitePsp?.online_price ?? websitePsp?.regular_price ?? p.base_retail_price;
      const websiteOffer = websitePsp?.offer_price ?? null;
      const websiteEffective = websiteOffer ?? websitePrice;
      const websiteIsBelow = websiteEffective < p.cost_price;

      // Has price variance between retail stores?
      const distinctRegularPrices = new Set(storePrices.map((sp) => sp.regular));
      const hasPriceVariance = distinctRegularPrices.size > 1;

      // Any below cost?
      const anyBelowCost = storePrices.some((sp) => sp.isBelow) || websiteIsBelow;

      // Has any active offer?
      const hasAnyOffer = storePrices.some((sp) => sp.hasOffer) || !!websiteOffer;

      return {
        product: p,
        storePrices,
        websitePrice,
        websiteOffer,
        websiteEffective,
        websiteIsBelow,
        hasPriceVariance,
        anyBelowCost,
        hasAnyOffer,
      };
    });
  }, [products, productStorePrices, stores]);

  // Filtered products list
  const filteredAnalyzed = useMemo(() => {
    return analyzedProducts.filter(({ product, anyBelowCost, hasAnyOffer, hasPriceVariance }) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        product.name.toLowerCase().includes(q) ||
        product.name_ja.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.barcode.includes(q);

      const matchesCat = categoryFilter === 'all' || product.category_id === categoryFilter;
      const matchesBelowCost = !filterBelowCostOnly || anyBelowCost;
      const matchesOffer = !filterActiveOffersOnly || hasAnyOffer;
      const matchesVariance = !filterVariancesOnly || hasPriceVariance;

      return matchesSearch && matchesCat && matchesBelowCost && matchesOffer && matchesVariance;
    });
  }, [
    analyzedProducts,
    searchQuery,
    categoryFilter,
    filterBelowCostOnly,
    filterActiveOffersOnly,
    filterVariancesOnly,
  ]);

  // Overall KPIs
  const totalProductsCount = products.length;
  const variancesCount = analyzedProducts.filter((a) => a.hasPriceVariance).length;
  const activeOffersCount = analyzedProducts.filter((a) => a.hasAnyOffer).length;
  const belowCostCount = analyzedProducts.filter((a) => a.anyBelowCost).length;

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(filteredAnalyzed.map((a) => a.product.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredAnalyzed.length > 0 &&
    filteredAnalyzed.every((a) => selectedProductIds.includes(a.product.id));

  // Quick Open Modal
  const openSingleProductPriceModal = (product: Product, storeId: StoreId | 'website' | 'all' = 'all') => {
    setEditingProduct(product);
    setEditingStoreId(storeId);
  };

  // Selected products for bulk modal
  const selectedProductObjects = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  // History Tab Filtered
  const filteredPriceHistory = useMemo(() => {
    return priceHistory.filter((ph) => {
      const q = historySearchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        ph.product_name.toLowerCase().includes(q) ||
        (ph.sku && ph.sku.toLowerCase().includes(q)) ||
        ph.reason.toLowerCase().includes(q) ||
        ph.changed_by.toLowerCase().includes(q);

      const matchStore = historyStoreFilter === 'all' || ph.store_id === historyStoreFilter;
      return matchSearch && matchStore;
    });
  }, [priceHistory, historySearchQuery, historyStoreFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Multi-Store Pricing System</h1>
            <span className="text-[11px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
              PostgreSQL / Supabase Schema
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized product_store_prices repository. Manage independent branch prices, promotional offers, margins, and immutable audit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              onClick={() => setActiveViewTab('matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeViewTab === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pricing Matrix
            </button>
            <button
              onClick={() => setActiveViewTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'history'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History ({priceHistory.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (selectedProductIds.length === 0) {
                // If none selected, default to select all visible
                setSelectedProductIds(filteredAnalyzed.map((a) => a.product.id));
              }
              setBulkModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Bulk Price Adjustment</span>
          </button>
        </div>
      </div>

      {/* Error state with retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadPricingData}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">TOTAL PRICED ITEMS</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">{totalProductsCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">Catalog Master</span>
          </div>
        </div>

        {/* Store Variances */}
        <div
          onClick={() => setFilterVariancesOnly(!filterVariancesOnly)}
          className={`bg-white border rounded-xl p-4 shadow-2xs cursor-pointer transition-colors ${
            filterVariancesOnly ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">STORE PRICE VARIANCES</span>
            {filterVariancesOnly && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">FILTERED</span>}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-700">{variancesCount}</span>
            <span className="text-[10px] text-slate-400">Shin-Koiwa vs Yotsugi</span>
          </div>
        </div>

        {/* Active Promotional Offers */}
        <div
          onClick={() => setFilterActiveOffersOnly(!filterActiveOffersOnly)}
          className={`bg-white border rounded-xl p-4 shadow-2xs cursor-pointer transition-colors ${
            filterActiveOffersOnly ? 'border-purple-400 ring-2 ring-purple-100 bg-purple-50/20' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">ACTIVE PROMO OFFERS</span>
            {filterActiveOffersOnly && <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1 rounded">FILTERED</span>}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-purple-700">{activeOffersCount}</span>
            <span className="text-[10px] text-slate-400">Campaign Rates</span>
          </div>
        </div>

        {/* Below Cost Warnings */}
        <div
          onClick={() => setFilterBelowCostOnly(!filterBelowCostOnly)}
          className={`border rounded-xl p-4 shadow-2xs cursor-pointer transition-colors ${
            belowCostCount > 0
              ? filterBelowCostOnly
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-100'
                : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/70'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">BELOW-COST WARNINGS</span>
            {belowCostCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xl font-bold font-mono ${belowCostCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {belowCostCount}
            </span>
            <span className={`text-[10px] font-medium ${belowCostCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
              {belowCostCount > 0 ? 'Cost Guardrail Alert' : 'Healthy Margins'}
            </span>
          </div>
        </div>
      </div>

      {activeViewTab === 'matrix' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Bar */}
              <div className="relative min-w-[260px] flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by English/Japanese name, SKU or barcode..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Category Filter */}
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

              {/* Quick Filter Badges */}
              <button
                type="button"
                onClick={() => setFilterVariancesOnly(!filterVariancesOnly)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                  filterVariancesOnly
                    ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Price Variances Only
              </button>

              <button
                type="button"
                onClick={() => setFilterActiveOffersOnly(!filterActiveOffersOnly)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                  filterActiveOffersOnly
                    ? 'border-purple-400 bg-purple-50 text-purple-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Promotional Offers
              </button>

              <button
                type="button"
                onClick={() => setFilterBelowCostOnly(!filterBelowCostOnly)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer ${
                  filterBelowCostOnly
                    ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⚠️ Below Cost ({belowCostCount})
              </button>
            </div>

            {(searchQuery || categoryFilter !== 'all' || filterBelowCostOnly || filterActiveOffersOnly || filterVariancesOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setFilterBelowCostOnly(false);
                  setFilterActiveOffersOnly(false);
                  setFilterVariancesOnly(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Sticky / Floating Bulk Bar if Items Selected */}
          {selectedProductIds.length > 0 && (
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center justify-center">
                  {selectedProductIds.length}
                </span>
                <span className="text-xs font-semibold">
                  {selectedProductIds.length} product{selectedProductIds.length > 1 ? 's' : ''} selected for bulk adjustment
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Configure Bulk Update...
                </button>
                <button
                  onClick={() => setSelectedProductIds([])}
                  className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Pricing Comparison Matrix Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 font-medium">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-slate-900 w-3.5 h-3.5 cursor-pointer"
                        title="Select All Filtered Products"
                      />
                    </th>
                    <th className="py-3 px-4 font-medium">PRODUCT IDENTITY</th>
                    <th className="py-3 px-3 font-medium text-right">PURCHASE COST</th>
                    
                    {/* Store Columns */}
                    {stores.map((st) => (
                      <th key={st.id} className="py-3 px-4 font-medium text-right bg-slate-50/30 border-l border-slate-100">
                        <div className="flex items-center justify-end gap-1.5">
                          <StoreIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.name.toUpperCase()}</span>
                        </div>
                      </th>
                    ))}

                    {/* Website Channel Column */}
                    <th className="py-3 px-4 font-medium text-right bg-slate-50/30 border-l border-slate-100">
                      <div className="flex items-center justify-end gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>WEBSITE (ONLINE)</span>
                      </div>
                    </th>

                    <th className="py-3 px-3 font-medium text-center">VARIANCE</th>
                    <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAnalyzed.length === 0 ? (
                    <tr>
                      <td colSpan={6 + stores.length} className="py-12 text-center text-slate-400">
                        <p className="text-sm font-medium">No products match the selected pricing filters.</p>
                        <p className="text-xs mt-1">Try clearing search terms or resetting filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAnalyzed.map((item) => {
                      const p = item.product;
                      const isSelected = selectedProductIds.includes(p.id);

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            isSelected ? 'bg-slate-50/80' : ''
                          } ${item.anyBelowCost ? 'bg-rose-50/20' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectProduct(p.id)}
                              className="rounded text-slate-900 w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>

                          {/* Product */}
                          <td className="py-3.5 px-4 min-w-[200px]">
                            <div className="flex items-center gap-2.5">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
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
                                <p className="font-bold text-slate-900 truncate">{p.name}</p>
                                <p className="text-[11px] text-slate-500 font-jp truncate">{p.name_ja}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>{p.sku}</span>
                                  <span>·</span>
                                  <span>JAN: {p.barcode}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Purchase Cost */}
                          <td className="py-3.5 px-3 text-right font-mono text-slate-600 font-medium tabular-nums">
                            ¥{Math.round(p.cost_price).toLocaleString()}
                          </td>

                          {/* Store Columns */}
                          {item.storePrices.map((sp) => {
                            const margin = Math.round(((sp.effective - p.cost_price) / sp.effective) * 100);

                            return (
                              <td
                                key={sp.store.id}
                                className={`py-3.5 px-4 text-right tabular-nums border-l border-slate-100 ${
                                  sp.isBelow ? 'bg-rose-50/50' : ''
                                }`}
                              >
                                <div className="flex flex-col items-end">
                                  <button
                                    onClick={() => openSingleProductPriceModal(p, sp.store.id)}
                                    className="font-mono font-bold text-xs hover:underline cursor-pointer text-slate-900 group flex items-center gap-1"
                                    title={`Click to edit price for ${sp.store.name}`}
                                  >
                                    <span>¥{Math.round(sp.regular).toLocaleString()}</span>
                                    <Edit2 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>

                                  {/* Offer badge if active */}
                                  {sp.offer && (
                                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1 rounded mt-0.5 font-mono">
                                      Offer: ¥{Math.round(sp.offer).toLocaleString()}
                                    </span>
                                  )}

                                  {/* Below cost warning tag */}
                                  {sp.isBelow && (
                                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 rounded mt-0.5">
                                      ⚠️ BELOW COST
                                    </span>
                                  )}

                                  {/* Margin */}
                                  <span className={`text-[10px] font-mono mt-0.5 ${
                                    sp.isBelow ? 'text-rose-600 font-bold' : margin < 25 ? 'text-amber-600' : 'text-emerald-700'
                                  }`}>
                                    {margin}% margin
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Website Channel Column */}
                          <td className={`py-3.5 px-4 text-right tabular-nums border-l border-slate-100 ${
                            item.websiteIsBelow ? 'bg-rose-50/50' : ''
                          }`}>
                            <div className="flex flex-col items-end">
                              <button
                                onClick={() => openSingleProductPriceModal(p, 'website')}
                                className="font-mono font-bold text-xs hover:underline cursor-pointer text-slate-900 group flex items-center gap-1"
                                title="Click to edit website online price"
                              >
                                <span>¥{Math.round(item.websitePrice).toLocaleString()}</span>
                                <Edit2 className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>

                              {item.websiteOffer && (
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1 rounded mt-0.5 font-mono">
                                  Offer: ¥{Math.round(item.websiteOffer).toLocaleString()}
                                </span>
                              )}

                              {item.websiteIsBelow && (
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 rounded mt-0.5">
                                  ⚠️ BELOW COST
                                </span>
                              )}

                              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                Shopify Sync
                              </span>
                            </div>
                          </td>

                          {/* Price Variance Badge */}
                          <td className="py-3.5 px-3 text-center">
                            {item.hasPriceVariance ? (
                              <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                DIFFERING
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">
                                Uniform
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openSingleProductPriceModal(p, 'all')}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Edit2 className="w-3 h-3 text-slate-400" />
                              <span>Edit Prices</span>
                            </button>
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

      {/* Audit History Tab */}
      {activeViewTab === 'history' && (
        <div className="space-y-4">
          {/* History Search & Store Filter */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Filter price history by product, SKU, reason, or operator..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>

              <select
                value={historyStoreFilter}
                onChange={(e) => setHistoryStoreFilter(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="all">All Stores & Channels</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="website">My BIMI Online Store</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Displaying {filteredPriceHistory.length} immutable ledger records
            </div>
          </div>

          {/* History Ledger Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 font-medium">
                    <th className="py-3 px-4 font-medium">TIMESTAMP</th>
                    <th className="py-3 px-4 font-medium">PRODUCT</th>
                    <th className="py-3 px-4 font-medium">STORE / CHANNEL</th>
                    <th className="py-3 px-3 font-medium">TYPE</th>
                    <th className="py-3 px-4 font-medium text-right">PREV PRICE</th>
                    <th className="py-3 px-4 font-medium text-right">NEW PRICE</th>
                    <th className="py-3 px-3 font-medium text-right">MARGIN %</th>
                    <th className="py-3 px-4 font-medium">CHANGE REASON</th>
                    <th className="py-3 px-4 font-medium">OPERATOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPriceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No price change audit entries match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPriceHistory.map((ph) => {
                      const dateObj = new Date(ph.created_at);
                      const isCostAlert = ph.is_below_cost;

                      return (
                        <tr key={ph.id} className={`hover:bg-slate-50/60 ${isCostAlert ? 'bg-rose-50/20' : ''}`}>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            <span className="block">{ph.product_name}</span>
                            {ph.sku && <span className="text-[10px] text-slate-400 font-mono">{ph.sku}</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {ph.store_name}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] font-mono uppercase font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {ph.price_type || 'regular'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400 line-through tabular-nums">
                            ¥{ph.old_price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                            ¥{ph.new_price.toLocaleString()}
                            {isCostAlert && (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1 rounded ml-1">
                                Below Cost
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                            {ph.new_margin_percent ?? ph.margin_percent ?? '-'}%
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={ph.reason}>
                            {ph.reason}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {ph.changed_by}
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

      {/* Edit Single Product Store Price Modal */}
      {editingProduct && (
        <StorePriceModal
          product={editingProduct}
          initialStoreId={editingStoreId}
          stores={stores}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            triggerRefresh();
          }}
        />
      )}

      {/* Bulk Price Adjustment Modal */}
      {bulkModalOpen && (
        <BulkPriceUpdateModal
          selectedProducts={selectedProductObjects.length > 0 ? selectedProductObjects : products}
          stores={stores}
          onClose={() => setBulkModalOpen(false)}
          onSuccess={() => {
            triggerRefresh();
            setSelectedProductIds([]);
          }}
        />
      )}
    </div>
  );
};
