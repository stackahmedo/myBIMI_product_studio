import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Copy,
  Archive,
  Trash2,
  Tag,
  ArrowUpDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { Product, Category, Brand, Supplier, StoreProduct, ProductStatus, ProductStorePrice } from '../types/database';
import { ProductDetail360 } from '../components/products/ProductDetail360';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { DeleteConfirmModal } from '../components/products/DeleteConfirmModal';
import { BarcodeSvg } from '../components/common/BarcodeSvg';

export const ProductsView: React.FC = () => {
  const { stores, selectedStoreId, setActiveTab, refreshKey, triggerRefresh, addToast } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [productStorePrices, setProductStorePrices] = useState<ProductStorePrice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debounce search input to avoid recalculating on rapid keystrokes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInputValue);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View Mode: 'list' or 'grid'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column Selector
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    sku: true,
    barcode: true,
    name: true,
    nameJa: true,
    category: true,
    origin: true,
    stock: true,
    price: true,
    status: true,
    lastUpdated: true,
    actions: true,
  });

  // Modals & Drawers
  const [selectedProduct360, setSelectedProduct360] = useState<Product | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodList, spList, pspList, catList, brandList, supList] = await Promise.all([
        dataService.getProducts(),
        dataService.getStoreProducts(),
        dataService.getProductStorePrices(),
        dataService.getCategories(),
        dataService.getBrands(),
        dataService.getSuppliers(),
      ]);
      setProducts(prodList);
      setStoreProducts(spList);
      setProductStorePrices(pspList);
      setCategories(catList);
      setBrands(brandList);
      setSuppliers(supList);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(err?.message || 'Failed to load catalog from database. Check your network or database configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Unique list of countries of origin for filter
  const originList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.country_of_origin) set.add(p.country_of_origin);
    });
    return Array.from(set).sort();
  }, [products]);

  const getProductStock = (productId: string) => {
    if (selectedStoreId !== 'all') {
      const sp = storeProducts.find((item) => item.product_id === productId && item.store_id === selectedStoreId);
      return sp ? sp.stock_quantity : 0;
    }
    return storeProducts
      .filter((item) => item.product_id === productId)
      .reduce((acc, curr) => acc + curr.stock_quantity, 0);
  };

  const getProductPriceInfo = (productId: string, basePrice: number) => {
    if (selectedStoreId !== 'all') {
      const psp = productStorePrices.find(
        (item) => item.product_id === productId && item.store_id === selectedStoreId
      );
      if (psp) {
        return {
          regular: psp.regular_price,
          offer: psp.offer_price,
          effective: psp.offer_price ?? psp.regular_price,
          hasOffer: !!psp.offer_price,
        };
      }
      const sp = storeProducts.find((item) => item.product_id === productId && item.store_id === selectedStoreId);
      const regular = sp ? sp.retail_price : basePrice;
      return { regular, offer: null, effective: regular, hasOffer: false };
    }
    return { regular: basePrice, offer: null, effective: basePrice, hasOffer: false };
  };

  const getProductPrice = (productId: string, basePrice: number) => {
    return getProductPriceInfo(productId, basePrice).effective;
  };

  // Filtered & Sorted Products
  const processedProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          q === '' ||
          p.name.toLowerCase().includes(q) ||
          p.name_ja.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q));

        // Category
        const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;

        // Brand
        const matchesBrand = brandFilter === 'all' || p.brand_id === brandFilter;

        // Origin
        const matchesOrigin = originFilter === 'all' || p.country_of_origin === originFilter;

        // Status
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesCategory && matchesBrand && matchesOrigin && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortBy === 'price') {
          diff = a.base_retail_price - b.base_retail_price;
        } else if (sortBy === 'stock') {
          diff = getProductStock(a.id) - getProductStock(b.id);
        } else if (sortBy === 'updated') {
          diff = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [products, searchQuery, categoryFilter, brandFilter, originFilter, statusFilter, sortBy, sortOrder, storeProducts, selectedStoreId]);

  // Paginated Slice
  const totalItems = processedProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage, pageSize]);

  // Handlers for Product Actions
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormModalMode('create');
    setFormModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormModalMode('edit');
    setFormModalOpen(true);
    if (selectedProduct360?.id === p.id) {
      setSelectedProduct360(null);
    }
  };

  const handleOpenDuplicate = (p: Product) => {
    setEditingProduct(p);
    setFormModalMode('duplicate');
    setFormModalOpen(true);
  };

  const handleArchive = async (p: Product) => {
    try {
      await dataService.archiveProduct(p.id);
      triggerRefresh();
      if (selectedProduct360?.id === p.id) {
        setSelectedProduct360(null);
      }
      addToast({
        type: 'info',
        title: 'Product Archived',
        message: `${p.name} has been archived.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message,
      });
    }
  };

  const handlePromptDelete = (p: Product) => {
    setDeletingProduct(p);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (p: Product) => {
    try {
      await dataService.deleteProduct(p.id);
      triggerRefresh();
      if (selectedProduct360?.id === p.id) {
        setSelectedProduct360(null);
      }
      addToast({
        type: 'success',
        title: 'Product Deleted',
        message: `Removed ${p.name} from catalog.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  const handlePrintTag = (p: Product) => {
    setActiveTab('price-tags');
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || 'General';
  const getBrandName = (id: string) => brands.find((b) => b.id === id)?.name || 'Generic';

  const statusBadgeStyle: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Draft: 'bg-slate-100 text-slate-700 border border-slate-200',
    'Out of Stock': 'bg-rose-50 text-rose-700 border border-rose-200',
    Discontinued: 'bg-amber-50 text-amber-700 border border-amber-200',
    Archived: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Title, Description, and Primary + Add Product Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Product Master Catalog
            </h1>
            <span className="text-xs text-slate-400 font-mono">
              ({totalItems} {totalItems === 1 ? 'Product' : 'Products'})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive catalog master: SKU, barcodes, multi-store stock, origin, and tax rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
        {/* Top line: Search, View Mode, Column Selector */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              placeholder="Search by English name, Japanese name, SKU, barcode, subcategory..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Right controls: View Toggle & Column Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Product Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Column Selector Dropdown */}
            {viewMode === 'list' && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Columns</span>
                </button>

                {showColumnMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowColumnMenu(false)} />
                    <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-2 text-xs space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Toggle Columns
                      </div>
                      {Object.keys(visibleColumns).map((colKey) => {
                        const key = colKey as keyof typeof visibleColumns;
                        return (
                          <label
                            key={key}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer capitalize"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns[key]}
                              onChange={(e) =>
                                setVisibleColumns({
                                  ...visibleColumns,
                                  [key]: e.target.checked,
                                })
                              }
                              className="rounded border-slate-300 text-slate-900 focus:ring-0"
                            />
                            <span className="text-slate-700 font-medium">
                              {key === 'nameJa' ? 'Japanese Name' : key}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Second line: Filter dropdowns (Category, Brand, Origin, Status, Sort) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand */}
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Origin */}
          <select
            value={originFilter}
            onChange={(e) => {
              setOriginFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Origins</option>
            {originList.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Discontinued">Discontinued</option>
            <option value="Archived">Archived</option>
          </select>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="updated">Last Updated</option>
              <option value="name">Product Name</option>
              <option value="price">Retail Price</option>
              <option value="stock">Stock Quantity</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg bg-slate-50"
              title={`Sorting ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Filters shortcut if active */}
          {(categoryFilter !== 'all' || brandFilter !== 'all' || originFilter !== 'all' || statusFilter !== 'all' || searchInputValue !== '' || searchQuery !== '') && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setBrandFilter('all');
                setOriginFilter('all');
                setStatusFilter('all');
                setSearchInputValue('');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-900 ml-auto"
            >
              Clear Filters
            </button>
          )}
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
            onClick={loadData}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Main Content: Table or Grid View */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading product catalog and multi-store pricing...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 font-medium">
                  {visibleColumns.image && <th className="py-3 px-3 w-12 font-medium">IMAGE</th>}
                  {visibleColumns.sku && <th className="py-3 px-3 font-medium">SKU</th>}
                  {visibleColumns.barcode && <th className="py-3 px-3 font-medium">BARCODE</th>}
                  {visibleColumns.name && <th className="py-3 px-3 font-medium">ENGLISH NAME</th>}
                  {visibleColumns.nameJa && <th className="py-3 px-3 font-medium">JAPANESE NAME</th>}
                  {visibleColumns.category && <th className="py-3 px-3 font-medium">CATEGORY</th>}
                  {visibleColumns.origin && <th className="py-3 px-3 font-medium">ORIGIN</th>}
                  {visibleColumns.stock && (
                    <th className="py-3 px-3 font-medium text-right">
                      STOCK ({selectedStoreId === 'all' ? 'TOTAL' : 'STORE'})
                    </th>
                  )}
                  {visibleColumns.price && <th className="py-3 px-3 font-medium text-right">PRICE (JPY)</th>}
                  {visibleColumns.status && <th className="py-3 px-3 font-medium">STATUS</th>}
                  {visibleColumns.lastUpdated && <th className="py-3 px-3 font-medium">LAST UPDATED</th>}
                  {visibleColumns.actions && <th className="py-3 px-3 font-medium text-right">ACTIONS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400">
                      No products found matching your active filters.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const stock = getProductStock(p.id);
                    const priceInfo = getProductPriceInfo(p.id, p.base_retail_price);
                    const price = priceInfo.effective;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setSelectedProduct360(p)}
                      >
                        {/* Image */}
                        {visibleColumns.image && (
                          <td className="py-2.5 px-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400 stroke-1" />
                              )}
                            </div>
                          </td>
                        )}

                        {/* SKU */}
                        {visibleColumns.sku && (
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {p.sku}
                          </td>
                        )}

                        {/* Barcode */}
                        {visibleColumns.barcode && (
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {p.barcode || '—'}
                          </td>
                        )}

                        {/* English Name & Badges */}
                        {visibleColumns.name && (
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 group-hover:text-slate-950 max-w-xs truncate">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.is_bestseller && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded">
                                  Bestseller
                                </span>
                              )}
                              {p.is_new_arrival && (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Japanese Name */}
                        {visibleColumns.nameJa && (
                          <td className="py-2.5 px-3 font-medium text-slate-600 max-w-xs truncate">
                            {p.name_ja || '—'}
                          </td>
                        )}

                        {/* Category */}
                        {visibleColumns.category && (
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-medium text-slate-800">{getCategoryName(p.category_id)}</span>
                            {p.subcategory && (
                              <span className="text-[10px] text-slate-400 block">{p.subcategory}</span>
                            )}
                          </td>
                        )}

                        {/* Origin */}
                        {visibleColumns.origin && (
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                            {p.country_of_origin || 'Japan'}
                          </td>
                        )}

                        {/* Stock */}
                        {visibleColumns.stock && (
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            {stock === 0 ? (
                              <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                                0 Out
                              </span>
                            ) : stock <= p.min_stock_alert ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                                {stock} Low
                              </span>
                            ) : (
                              <span className="font-bold text-slate-900">{stock} {p.unit}</span>
                            )}
                          </td>
                        )}

                        {/* Price */}
                        {visibleColumns.price && (
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="font-bold text-slate-900">¥{Math.round(price).toLocaleString()}</span>
                                {priceInfo.hasOffer && (
                                  <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1 rounded font-sans">
                                    Offer
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans block">
                                税込 ¥{Math.round(price * (1 + p.tax_rate)).toLocaleString()}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Status */}
                        {visibleColumns.status && (
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md ${
                                statusBadgeStyle[p.status] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        )}

                        {/* Last Updated */}
                        {visibleColumns.lastUpdated && (
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(p.updated_at).toLocaleDateString()}
                          </td>
                        )}

                        {/* Actions */}
                        {visibleColumns.actions && (
                          <td
                            className="py-2.5 px-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedProduct360(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                title="View Product 360"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenDuplicate(p)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                                title="Duplicate Product"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handlePromptDelete(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedProducts.map((p) => {
            const stock = getProductStock(p.id);
            const priceInfo = getProductPriceInfo(p.id, p.base_retail_price);
            const price = priceInfo.effective;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProduct360(p)}
                className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Thumbnail & Badges */}
                  <div className="w-full aspect-4/3 bg-slate-50 rounded-lg border border-slate-200/80 overflow-hidden relative mb-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-10 h-10 stroke-1" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xs ${
                          statusBadgeStyle[p.status] || 'bg-white text-slate-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {p.is_bestseller && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50/90 backdrop-blur-2xs border border-amber-200 px-1 rounded shadow-2xs">
                          Bestseller
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SKU & Category */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                    <span>{p.sku}</span>
                    <span>{p.country_of_origin}</span>
                  </div>

                  {/* Title & Japanese Name */}
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-slate-950 line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {p.name_ja}
                  </p>
                </div>

                {/* Pricing & Stock Footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ¥{Math.round(price).toLocaleString()}
                      </span>
                      {priceInfo.hasOffer && (
                        <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1 rounded font-sans">
                          Offer
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      税込 ¥{Math.round(price * (1 + p.tax_rate)).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Stock</span>
                    <span className="font-mono font-bold text-slate-800">
                      {stock} {p.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <span className="text-slate-400 ml-2">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
          </span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 text-xs font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product 360 Detail View Drawer */}
      {selectedProduct360 && (
        <ProductDetail360
          product={selectedProduct360}
          stores={stores}
          categories={categories}
          brands={brands}
          suppliers={suppliers}
          onClose={() => setSelectedProduct360(null)}
          onEdit={handleOpenEdit}
          onDuplicate={handleOpenDuplicate}
          onArchive={handleArchive}
          onDelete={handlePromptDelete}
          onPrintTag={handlePrintTag}
        />
      )}

      {/* Add / Edit / Duplicate Large Modal */}
      <ProductFormModal
        isOpen={formModalOpen}
        mode={formModalMode}
        initialProduct={editingProduct}
        stores={stores}
        categories={categories}
        brands={brands}
        suppliers={suppliers}
        onClose={() => setFormModalOpen(false)}
        onSuccess={(product, message) => {
          triggerRefresh();
          addToast({
            type: 'success',
            title: message,
          });
          // Refresh 360 view if it was open
          if (selectedProduct360?.id === product.id) {
            setSelectedProduct360(product);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        product={deletingProduct}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
