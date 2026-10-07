import React from 'react';
import {
  Boxes,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  History,
  Store as StoreIcon,
  ArrowRight,
  Package,
} from 'lucide-react';
import { Product, Store, StockMovement } from '../../types/database';

interface InventoryDashboardWidgetsProps {
  metrics: {
    totalValuationCost: number;
    totalValuationRetail: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    storeValuations: { store: Store; costValue: number; retailValue: number; units: number }[];
    topStockedProducts: { product: Product; totalStock: number; totalCostValue: number; totalRetailValue: number }[];
    recentMovements: StockMovement[];
  };
  onFilterLowStock: () => void;
  onFilterOutOfStock: () => void;
  onViewAllMovements: () => void;
  activeFilter: 'all' | 'low' | 'out';
}

export const InventoryDashboardWidgets: React.FC<InventoryDashboardWidgetsProps> = ({
  metrics,
  onFilterLowStock,
  onFilterOutOfStock,
  onViewAllMovements,
  activeFilter,
}) => {
  return (
    <div className="space-y-4">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Inventory Value */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">TOTAL INVENTORY VALUE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">
              ¥{metrics.totalValuationCost.toLocaleString()}
            </span>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center justify-between">
              <span>Retail: ¥{metrics.totalValuationRetail.toLocaleString()}</span>
              <span>{metrics.totalUnits} units</span>
            </div>
          </div>
        </div>

        {/* Low Stock Widget */}
        <div
          onClick={onFilterLowStock}
          className={`bg-white border rounded-xl p-4 shadow-2xs cursor-pointer transition-colors ${
            activeFilter === 'low'
              ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">LOW STOCK ITEMS</span>
            {activeFilter === 'low' && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">FILTERED</span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold font-mono text-amber-700">{metrics.lowStockCount}</span>
            <span className="text-[10px] text-slate-400 font-medium">Requires Reorder</span>
          </div>
        </div>

        {/* Out of Stock Widget */}
        <div
          onClick={onFilterOutOfStock}
          className={`bg-white border rounded-xl p-4 shadow-2xs cursor-pointer transition-colors ${
            activeFilter === 'out'
              ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">OUT OF STOCK</span>
            {metrics.outOfStockCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xl font-bold font-mono ${metrics.outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {metrics.outOfStockCount}
            </span>
            <span className={`text-[10px] font-medium ${metrics.outOfStockCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
              Depleted Shelves
            </span>
          </div>
        </div>

        {/* Branch Breakdown Widget */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">BRANCH DISTRIBUTION</span>
          <div className="mt-1 space-y-1">
            {metrics.storeValuations.map((sv) => (
              <div key={sv.store.id} className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600 truncate max-w-[100px]">{sv.store.code}:</span>
                <span className="font-bold text-slate-900">{sv.units} pcs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Most Stocked Products & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Most Stocked Products */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900">Most Stocked Products</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Top by Units</span>
            </div>

            <div className="space-y-2">
              {metrics.topStockedProducts.map((item, idx) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-4 h-4 rounded font-mono text-[10px] bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.product.sku}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-slate-900">
                      {item.totalStock} {item.product.unit}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ¥{item.totalCostValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Stock Movements Feed */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-900">Recent Stock Movements</h3>
              </div>
              <button
                onClick={onViewAllMovements}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {metrics.recentMovements.slice(0, 5).map((sm) => {
                const isPositive = sm.quantity_change > 0;
                const dateObj = new Date(sm.created_at);

                return (
                  <div
                    key={sm.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="truncate pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{sm.product_name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-500 truncate">{sm.store_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600 uppercase tracking-wider">{sm.type}</span>
                        <span>·</span>
                        <span>{sm.notes}</span>
                        <span>·</span>
                        <span>{sm.performed_by}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span
                        className={`font-bold text-sm ${
                          isPositive ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {isPositive ? `+${sm.quantity_change}` : sm.quantity_change}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Bal: {sm.new_stock ?? sm.balance_after}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
