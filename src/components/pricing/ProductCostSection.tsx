import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  AlertOctagon,
  Percent,
  Check,
  Save,
  HelpCircle,
  Truck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Product, Store, ProductStorePrice } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';

interface ProductCostSectionProps {
  product: Product;
  stores?: Store[];
  storePrices?: ProductStorePrice[];
  onUpdateSuccess?: () => void;
}

export const ProductCostSection: React.FC<ProductCostSectionProps> = ({
  product,
  stores = [],
  storePrices = [],
  onUpdateSuccess,
}) => {
  const { addToast } = useApp();

  // Selected selling price source
  const [sellingPriceMode, setSellingPriceMode] = useState<string>('default'); // 'default' | storeId

  // Editable cost components
  const [purchaseCost, setPurchaseCost] = useState<number>(product.cost_price || 0);
  const [freightCost, setFreightCost] = useState<number>(product.freight_cost || 0);
  const [customsDuty, setCustomsDuty] = useState<number>(product.customs_duty || 0);
  const [otherCost, setOtherCost] = useState<number>(product.other_cost || 0);
  const [isSaving, setIsSaving] = useState(false);

  // Active selling price based on selection
  const activeSellingPrice = useMemo(() => {
    if (sellingPriceMode === 'default') {
      return product.base_retail_price;
    }
    const psp = storePrices.find((p) => p.store_id === sellingPriceMode);
    if (psp) {
      return psp.offer_price ?? psp.regular_price;
    }
    return product.base_retail_price;
  }, [sellingPriceMode, product.base_retail_price, storePrices]);

  // Automated Calculations as required:
  // Landed Cost = Purchase Cost + Freight + Customs + Other Cost
  // Gross Profit = Selling Price - Landed Cost
  // Margin % = (Gross Profit / Selling Price) * 100
  const landedCost = useMemo(() => {
    return Number(purchaseCost) + Number(freightCost) + Number(customsDuty) + Number(otherCost);
  }, [purchaseCost, freightCost, customsDuty, otherCost]);

  const grossProfit = useMemo(() => {
    return activeSellingPrice - landedCost;
  }, [activeSellingPrice, landedCost]);

  const marginPercent = useMemo(() => {
    if (activeSellingPrice <= 0) return 0;
    return Number(((grossProfit / activeSellingPrice) * 100).toFixed(1));
  }, [grossProfit, activeSellingPrice]);

  // Warning conditions:
  // 1. Negative margin
  const isNegativeMargin = grossProfit < 0 || marginPercent < 0;
  // 2. Very low margin (e.g. below 15%)
  const isVeryLowMargin = !isNegativeMargin && marginPercent < 15;
  // 3. Supplier cost higher than selling price
  const isSupplierCostHigher = purchaseCost > activeSellingPrice;

  const handleSaveCosts = async () => {
    setIsSaving(true);
    try {
      await dataService.updateProductCostBreakdown(product.id, {
        cost_price: Number(purchaseCost),
        freight_cost: Number(freightCost),
        customs_duty: Number(customsDuty),
        other_cost: Number(otherCost),
      });

      addToast({
        type: 'success',
        title: 'Cost Structure Saved',
        message: `Landed cost parameters updated for ${product.name} (Landed: ¥${landedCost.toLocaleString()}).`,
      });

      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Landed Cost & Profitability Calculator
            </h3>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              Unit Economics
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Automatic calculation of total landed procurement cost, gross profit, and operating margin %.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selling Price Source Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Selling Benchmark:</span>
            <select
              value={sellingPriceMode}
              onChange={(e) => setSellingPriceMode(e.target.value)}
              className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none font-mono"
            >
              <option value="default">Default Base (¥{product.base_retail_price.toLocaleString()})</option>
              {stores.map((st) => {
                const sp = storePrices.find((p) => p.store_id === st.id);
                const pr = sp ? sp.offer_price ?? sp.regular_price : product.base_retail_price;
                return (
                  <option key={st.id} value={st.id}>
                    {st.name} (¥{pr.toLocaleString()})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleSaveCosts}
            disabled={isSaving}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Costs'}</span>
          </button>
        </div>
      </div>

      {/* Warnings Banner */}
      <div className="space-y-2">
        {/* Warning 1: Supplier Cost Higher Than Selling Price */}
        {isSupplierCostHigher && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">CRITICAL: Supplier Purchase Cost Exceeds Selling Price!</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                The supplier purchase cost (¥{purchaseCost.toLocaleString()}) alone is higher than the active selling price (¥{activeSellingPrice.toLocaleString()}) by ¥{(purchaseCost - activeSellingPrice).toLocaleString()}. Immediate price adjustment or vendor renegotiation required.
              </p>
            </div>
          </div>
        )}

        {/* Warning 2: Negative Margin */}
        {isNegativeMargin && !isSupplierCostHigher && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">NEGATIVE MARGIN: Product Selling at a Loss ({marginPercent}%)</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                After accounting for freight, duties, and handling, the total landed cost (¥{landedCost.toLocaleString()}) exceeds the selling price (¥{activeSellingPrice.toLocaleString()}). Unit loss: ¥{Math.abs(grossProfit).toLocaleString()} per {product.unit || 'piece'}.
              </p>
            </div>
          </div>
        )}

        {/* Warning 3: Very Low Margin */}
        {isVeryLowMargin && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">WARNING: Very Low Gross Margin ({marginPercent}%)</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                The current gross margin is below the recommended 15% grocery retail threshold. Operational handling or promotion expenses may turn this item unprofitable.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4 Interactive Cost Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Purchase Cost */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase">
            1. Purchase Cost
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(Number(e.target.value))}
              className="w-full pl-6 pr-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-400">¥</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Ex-factory / FOB vendor cost</span>
        </div>

        {/* Freight */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase">
            2. Freight / Shipping
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={freightCost}
              onChange={(e) => setFreightCost(Number(e.target.value))}
              className="w-full pl-6 pr-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-400">¥</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Ocean / truck delivery per unit</span>
        </div>

        {/* Customs */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase">
            3. Customs & Tariff
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={customsDuty}
              onChange={(e) => setCustomsDuty(Number(e.target.value))}
              className="w-full pl-6 pr-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-400">¥</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Import duty & port clearance</span>
        </div>

        {/* Other Cost */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 uppercase">
            4. Other Direct Cost
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={otherCost}
              onChange={(e) => setOtherCost(Number(e.target.value))}
              className="w-full pl-6 pr-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-400">¥</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Cold storage, staging, pallet fee</span>
        </div>
      </div>

      {/* KPI Cards: Landed Cost, Selling Price, Gross Profit, Margin % */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Landed Cost */}
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-2xs">
          <span className="text-[10px] text-slate-400 font-mono block uppercase">
            TOTAL LANDED COST
          </span>
          <span className="font-mono font-bold text-xl text-white mt-1 block">
            ¥{landedCost.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            ¥{purchaseCost} + ¥{freightCost} + ¥{customsDuty} + ¥{otherCost}
          </span>
        </div>

        {/* Selling Price */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs">
          <span className="text-[10px] text-slate-500 font-mono block uppercase">
            SELLING PRICE (NET)
          </span>
          <span className="font-mono font-bold text-xl text-slate-900 mt-1 block">
            ¥{activeSellingPrice.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            税込 ¥{Math.round(activeSellingPrice * (1 + product.tax_rate)).toLocaleString()} (8%)
          </span>
        </div>

        {/* Gross Profit */}
        <div className={`p-4 rounded-xl shadow-2xs border ${isNegativeMargin ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200/80'}`}>
          <span className="text-[10px] text-slate-500 font-mono block uppercase">
            GROSS PROFIT
          </span>
          <span className={`font-mono font-bold text-xl mt-1 block ${grossProfit < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {grossProfit >= 0 ? `+¥${grossProfit.toLocaleString()}` : `-¥${Math.abs(grossProfit).toLocaleString()}`}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Selling − Landed Cost
          </span>
        </div>

        {/* Margin % */}
        <div className={`p-4 rounded-xl shadow-2xs border ${isNegativeMargin ? 'bg-rose-50 border-rose-300' : isVeryLowMargin ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className="text-[10px] text-slate-500 font-mono block uppercase">
            MARGIN %
          </span>
          <span className={`font-mono font-bold text-xl mt-1 block ${isNegativeMargin ? 'text-rose-600' : isVeryLowMargin ? 'text-amber-800' : 'text-emerald-700'}`}>
            {marginPercent}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
            Gross Profit / Selling × 100
          </span>
        </div>
      </div>

      {/* Visual Calculation Breakdown Formula Strip */}
      <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-lg text-xs font-mono text-slate-600 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400">Formula:</span>
          <span>Landed Cost (<strong>¥{landedCost.toLocaleString()}</strong>)</span>
          <span>=</span>
          <span>Purchase (¥{purchaseCost})</span>
          <span>+</span>
          <span>Freight (¥{freightCost})</span>
          <span>+</span>
          <span>Customs (¥{customsDuty})</span>
          <span>+</span>
          <span>Other (¥{otherCost})</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
          <span>Gross Profit (<strong>¥{grossProfit.toLocaleString()}</strong>)</span>
          <span>=</span>
          <span>Selling (¥{activeSellingPrice.toLocaleString()})</span>
          <span>−</span>
          <span>Landed Cost (¥{landedCost.toLocaleString()})</span>
          <span className="mx-2 text-slate-300">|</span>
          <span>Margin % = <strong>{marginPercent}%</strong></span>
        </div>
      </div>
    </div>
  );
};
