import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Store as StoreIcon, Truck, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Store, Supplier } from '../../types/database';
import { dataService } from '../../services/dataService';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, setActiveTab, setSelectedStoreId } = useApp();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      dataService.getProducts().then(setProducts);
      dataService.getStores().then(setStores);
      dataService.getSuppliers().then(setSuppliers);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredProducts = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.name_ja.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      )
    : products.slice(0, 4);

  const filteredStores = q
    ? stores.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      )
    : [];

  const filteredSuppliers = q
    ? suppliers.filter(
        (sup) =>
          sup.name.toLowerCase().includes(q) ||
          sup.code.toLowerCase().includes(q) ||
          sup.contact_name.toLowerCase().includes(q)
      )
    : [];

  const handleSelectProduct = () => {
    setActiveTab('products');
    setIsSearchOpen(false);
  };

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    setActiveTab('inventory');
    setIsSearchOpen(false);
  };

  const handleSelectSupplier = () => {
    setActiveTab('suppliers');
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in-50">
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95">
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type product name, Japanese name, SKU, barcode, supplier..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Products Section */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 tracking-wider">
              PRODUCTS ({filteredProducts.length})
            </div>
            {filteredProducts.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">No matching products found</p>
            ) : (
              <div className="space-y-0.5">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={handleSelectProduct}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-slate-950 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {p.name_ja} · <span className="font-mono">{p.sku}</span> · <span className="font-mono">{p.barcode}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-semibold text-slate-900 tabular-nums">
                        ¥{p.base_retail_price.toLocaleString()}
                      </p>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stores Section */}
          {filteredStores.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 tracking-wider">
                STORES ({filteredStores.length})
              </div>
              <div className="space-y-0.5">
                {filteredStores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStore(s.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <StoreIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-900">{s.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{s.address}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {s.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers Section */}
          {filteredSuppliers.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 tracking-wider">
                SUPPLIERS ({filteredSuppliers.length})
              </div>
              <div className="space-y-0.5">
                {filteredSuppliers.map((sup) => (
                  <button
                    key={sup.id}
                    onClick={handleSelectSupplier}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-7 h-7 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium text-slate-900">{sup.name}</p>
                        <p className="text-[11px] text-slate-400">{sup.contact_name} · Lead: {sup.lead_time_days} days</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {sup.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search master database across all branches</span>
          <div className="flex items-center gap-1 text-[10px]">
            <span>Navigate</span>
            <CornerDownLeft className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
