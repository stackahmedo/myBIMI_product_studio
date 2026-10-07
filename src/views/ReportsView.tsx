import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, JapaneseYen, Layers, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { Product, StoreProduct, Category } from '../types/database';

export const ReportsView: React.FC = () => {
  const { stores } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, sp, c] = await Promise.all([
          dataService.getProducts(),
          dataService.getStoreProducts(),
          dataService.getCategories(),
        ]);
        setProducts(p);
        setStoreProducts(sp);
        setCategories(c);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute Valuation per Store
  const storeValuations = stores.map((st) => {
    let costVal = 0;
    let retailVal = 0;
    let units = 0;

    storeProducts
      .filter((sp) => sp.store_id === st.id)
      .forEach((sp) => {
        const p = products.find((item) => item.id === sp.product_id);
        if (p) {
          costVal += sp.stock_quantity * p.cost_price;
          retailVal += sp.stock_quantity * sp.retail_price;
          units += sp.stock_quantity;
        }
      });

    const potentialProfit = retailVal - costVal;
    const overallMargin = retailVal > 0 ? Math.round((potentialProfit / retailVal) * 100) : 0;

    return {
      store: st,
      costVal,
      retailVal,
      units,
      potentialProfit,
      overallMargin,
    };
  });

  const totalCostValuation = storeValuations.reduce((sum, item) => sum + item.costVal, 0);
  const totalRetailValuation = storeValuations.reduce((sum, item) => sum + item.retailVal, 0);

  // Compute category breakdown
  const categoryStats = categories.map((cat) => {
    const catProds = products.filter((p) => p.category_id === cat.id);
    let catUnits = 0;
    let catCostVal = 0;

    catProds.forEach((p) => {
      const sps = storeProducts.filter((sp) => sp.product_id === p.id);
      const stock = sps.reduce((sum, sp) => sum + sp.stock_quantity, 0);
      catUnits += stock;
      catCostVal += stock * p.cost_price;
    });

    return {
      category: cat,
      productCount: catProds.length,
      units: catUnits,
      costValuation: catCostVal,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory & Financial Reports</h1>
        <p className="text-xs text-slate-500 mt-1">
          Stock valuation by branch, margin distribution, and retail profit potential.
        </p>
      </div>

      {/* Aggregate KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total Asset Valuation (Cost)</span>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-2">
            ¥{totalCostValuation.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Acquisition value in storage</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Retail Sales Potential</span>
          <p className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-2">
            ¥{totalRetailValuation.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">At active shelf prices</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Unrealized Gross Margin</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 tabular-nums mt-2">
            ¥{(totalRetailValuation - totalCostValuation).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 font-mono mt-1">
            Avg {totalRetailValuation > 0 ? Math.round(((totalRetailValuation - totalCostValuation) / totalRetailValuation) * 100) : 0}% margin
          </p>
        </div>
      </div>

      {/* Store Comparison Grid */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Branch Inventory Valuation Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {storeValuations.map((item) => (
            <div
              key={item.store.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">{item.store.name}</h3>
                  <span className="font-mono text-xs text-slate-400">{item.store.code}</span>
                </div>
                <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {item.overallMargin}% Margin
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Units</span>
                  <span className="font-mono font-bold text-slate-800">{item.units.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Cost Value</span>
                  <span className="font-mono font-bold text-slate-800">¥{item.costVal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Retail Value</span>
                  <span className="font-mono font-bold text-slate-800">¥{item.retailVal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900">Category Valuation Distribution</h2>
          <span className="text-xs text-slate-400 font-mono">{categories.length} Categories</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 font-medium">
                <th className="py-3 px-4 font-medium">CATEGORY</th>
                <th className="py-3 px-4 font-medium text-right">MASTER PRODUCTS</th>
                <th className="py-3 px-4 font-medium text-right">TOTAL UNITS IN STOCK</th>
                <th className="py-3 px-4 font-medium text-right">COST VALUATION</th>
                <th className="py-3 px-4 font-medium text-right">% OF TOTAL INVENTORY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {categoryStats.map((item) => {
                const percentage = totalCostValuation > 0
                  ? Math.round((item.costValuation / totalCostValuation) * 100)
                  : 0;

                return (
                  <tr key={item.category.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{item.category.name}</p>
                      <p className="text-[11px] text-slate-400">{item.category.name_ja}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {item.productCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-800">
                      {item.units.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      ¥{item.costValuation.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-900 h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-slate-600 w-8">{percentage}%</span>
                      </div>
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
