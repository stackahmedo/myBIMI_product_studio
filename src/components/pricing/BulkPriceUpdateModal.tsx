import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  Building,
  Globe,
  Layers,
  Info,
} from 'lucide-react';
import { Product, Store, StoreId } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';

interface BulkPriceUpdateModalProps {
  selectedProducts: Product[];
  stores: Store[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkPriceUpdateModal: React.FC<BulkPriceUpdateModalProps> = ({
  selectedProducts,
  stores,
  onClose,
  onSuccess,
}) => {
  const { currentUser, addToast } = useApp();

  // Target stores selection
  const [selectedStores, setSelectedStores] = useState<(StoreId | 'website')[]>([
    ...stores.map((s) => s.id),
    'website',
  ]);

  // Target Price field
  const [priceTarget, setPriceTarget] = useState<'regular' | 'offer' | 'wholesale' | 'online'>('regular');

  // Adjustment method
  const [adjustmentMethod, setAdjustmentMethod] = useState<'amount_inc' | 'amount_dec' | 'percent_inc' | 'percent_dec' | 'fixed'>('amount_inc');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(10);

  // Scheduling
  const [scheduleFuture, setScheduleFuture] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [offerStartDate, setOfferStartDate] = useState<string>('');
  const [offerEndDate, setOfferEndDate] = useState<string>('');

  // Required reason
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle store target
  const toggleStore = (storeId: StoreId | 'website') => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const selectAllStores = () => {
    setSelectedStores([...stores.map((s) => s.id), 'website']);
  };

  // Preview calculations and below-cost warning detection
  const previewAnalysis = useMemo(() => {
    let belowCostCount = 0;
    const samplePreview = selectedProducts.slice(0, 5).map((p) => {
      let currentVal = p.base_retail_price;
      let calculated = currentVal;

      if (adjustmentMethod === 'amount_inc') {
        calculated = Math.round(currentVal + adjustmentValue);
      } else if (adjustmentMethod === 'amount_dec') {
        calculated = Math.max(1, Math.round(currentVal - adjustmentValue));
      } else if (adjustmentMethod === 'percent_inc') {
        calculated = Math.round(currentVal * (1 + adjustmentValue / 100));
      } else if (adjustmentMethod === 'percent_dec') {
        calculated = Math.max(1, Math.round(currentVal * (1 - adjustmentValue / 100)));
      } else if (adjustmentMethod === 'fixed') {
        calculated = Math.max(1, Math.round(adjustmentValue));
      }

      const isBelow = calculated < p.cost_price;
      if (isBelow) belowCostCount++;

      return {
        product: p,
        oldPrice: currentVal,
        newPrice: calculated,
        costPrice: p.cost_price,
        isBelow,
        diff: calculated - currentVal,
      };
    });

    // Count full below-cost occurrences across all selected items
    const totalBelowCostProducts = selectedProducts.filter((p) => {
      let currentVal = p.base_retail_price;
      let calculated = currentVal;
      if (adjustmentMethod === 'amount_inc') calculated = Math.round(currentVal + adjustmentValue);
      else if (adjustmentMethod === 'amount_dec') calculated = Math.max(1, Math.round(currentVal - adjustmentValue));
      else if (adjustmentMethod === 'percent_inc') calculated = Math.round(currentVal * (1 + adjustmentValue / 100));
      else if (adjustmentMethod === 'percent_dec') calculated = Math.max(1, Math.round(currentVal * (1 - adjustmentValue / 100)));
      else if (adjustmentMethod === 'fixed') calculated = Math.max(1, Math.round(adjustmentValue));
      return calculated < p.cost_price;
    });

    return {
      samplePreview,
      totalBelowCostCount: totalBelowCostProducts.length,
      belowCostProducts: totalBelowCostProducts,
    };
  }, [selectedProducts, adjustmentMethod, adjustmentValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStores.length === 0) {
      addToast({
        type: 'error',
        title: 'No Channels Selected',
        message: 'Please select at least one branch or channel to update.',
      });
      return;
    }

    if (!reason.trim()) {
      addToast({
        type: 'error',
        title: 'Price-Change Reason Required',
        message: 'A mandatory audit justification must be entered before applying bulk price adjustments.',
      });
      return;
    }

    let calculatedType: 'amount' | 'percentage' | 'fixed_regular' | 'fixed_offer' = 'amount';
    let numericAdjustment = adjustmentValue;

    if (adjustmentMethod === 'amount_inc') {
      calculatedType = 'amount';
      numericAdjustment = Math.abs(adjustmentValue);
    } else if (adjustmentMethod === 'amount_dec') {
      calculatedType = 'amount';
      numericAdjustment = -Math.abs(adjustmentValue);
    } else if (adjustmentMethod === 'percent_inc') {
      calculatedType = 'percentage';
      numericAdjustment = Math.abs(adjustmentValue);
    } else if (adjustmentMethod === 'percent_dec') {
      calculatedType = 'percentage';
      numericAdjustment = -Math.abs(adjustmentValue);
    } else if (adjustmentMethod === 'fixed') {
      calculatedType = priceTarget === 'offer' ? 'fixed_offer' : 'fixed_regular';
      numericAdjustment = Math.abs(adjustmentValue);
    }

    setIsSubmitting(true);
    try {
      const res = await dataService.bulkUpdatePrices({
        productIds: selectedProducts.map((p) => p.id),
        storeIds: selectedStores,
        adjustmentType: calculatedType,
        adjustmentValue: numericAdjustment,
        priceTarget,
        scheduleDate: scheduleFuture && scheduleDate ? new Date(scheduleDate).toISOString() : null,
        offerStartDate: offerStartDate ? new Date(offerStartDate + 'T00:00:00Z').toISOString() : null,
        offerEndDate: offerEndDate ? new Date(offerEndDate + 'T23:59:59Z').toISOString() : null,
        reason: reason.trim(),
        updatedBy: currentUser.name,
      });

      addToast({
        type: res.warningsCount > 0 ? 'warning' : 'success',
        title: 'Bulk Price Update Complete',
        message: `Updated ${res.updatedCount} price records across ${selectedProducts.length} products. ${
          res.warningsCount > 0 ? `(${res.warningsCount} items triggered below-cost warnings).` : ''
        }`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bulk Update Failed',
        message: err.message || 'An error occurred during bulk pricing execution.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bulk Multi-Store Price Adjustment</h3>
              <p className="text-[11px] text-slate-500">
                Applying adjustments across <span className="font-semibold text-slate-900">{selectedProducts.length} selected products</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Channel / Store Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-800">
                1. Target Stores & Channels ({selectedStores.length} selected)
              </label>
              <button
                type="button"
                onClick={selectAllStores}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold"
              >
                Select All Channels
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {stores.map((st) => {
                const isSelected = selectedStores.includes(st.id);
                return (
                  <label
                    key={st.id}
                    onClick={() => toggleStore(st.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 text-slate-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-slate-900 w-3.5 h-3.5"
                    />
                    <div className="truncate">
                      <span className="block truncate">{st.name.replace('BIMI Supa – ', '')}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{st.code}</span>
                    </div>
                  </label>
                );
              })}

              {/* Website Channel */}
              <label
                onClick={() => toggleStore('website')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  selectedStores.includes('website')
                    ? 'border-slate-900 bg-slate-50 text-slate-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedStores.includes('website')}
                  onChange={() => {}}
                  className="rounded text-slate-900 w-3.5 h-3.5"
                />
                <div className="truncate">
                  <span className="block">Website Online</span>
                  <span className="text-[10px] text-slate-400 font-normal">E-commerce API</span>
                </div>
              </label>
            </div>
          </div>

          {/* Price Target & Adjustment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                2. Price Field Target
              </label>
              <select
                value={priceTarget}
                onChange={(e) => setPriceTarget(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="regular">Regular Selling Price</option>
                <option value="offer">Offer / Promotional Price</option>
                <option value="wholesale">Wholesale / B2B Price</option>
                <option value="online">Website Online Price</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                3. Adjustment Strategy
              </label>
              <select
                value={adjustmentMethod}
                onChange={(e) => setAdjustmentMethod(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="amount_inc">Increase by ¥ Amount (+¥)</option>
                <option value="amount_dec">Decrease by ¥ Amount (-¥)</option>
                <option value="percent_inc">Increase by Percentage (+%)</option>
                <option value="percent_dec">Decrease by Percentage (-%)</option>
                <option value="fixed">Set Exact Fixed Value (¥)</option>
              </select>
            </div>
          </div>

          {/* Adjustment Value Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Adjustment Magnitude {adjustmentMethod.includes('percent') ? '(Percentage %)' : '(Yen ¥)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">
                {adjustmentMethod.includes('percent') ? '%' : '¥'}
              </span>
              <input
                type="number"
                min={1}
                required
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                placeholder={adjustmentMethod.includes('percent') ? 'e.g. 5' : 'e.g. 20'}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Future Schedule / Offer Expiry */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scheduleToggle"
                checked={scheduleFuture}
                onChange={(e) => setScheduleFuture(e.target.checked)}
                className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="scheduleToggle" className="text-xs font-bold text-slate-900 cursor-pointer">
                Schedule Future Activation or Offer Expiry Window
              </label>
            </div>

            {scheduleFuture && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Offer Start Date
                  </label>
                  <input
                    type="date"
                    value={offerStartDate}
                    onChange={(e) => setOfferStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Offer Expiry (End) Date
                  </label>
                  <input
                    type="date"
                    value={offerEndDate}
                    onChange={(e) => setOfferEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time Below-Cost Warning & Impact Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              4. Calculation Impact Preview & Cost Guardrails
            </label>

            {previewAnalysis.totalBelowCostCount > 0 && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">
                    Below-Cost Warning: {previewAnalysis.totalBelowCostCount} of {selectedProducts.length} product(s) will fall below purchase cost!
                  </p>
                  <p className="mt-0.5 text-rose-700 text-[11px]">
                    Affected products:{' '}
                    {previewAnalysis.belowCostProducts.map((p) => `${p.name} (Cost: ¥${p.cost_price})`).join(', ')}.
                  </p>
                </div>
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3 font-medium">SAMPLE PRODUCT</th>
                    <th className="py-2 px-3 font-medium text-right">COST</th>
                    <th className="py-2 px-3 font-medium text-right">CURRENT</th>
                    <th className="py-2 px-3 font-medium text-right">PROPOSED</th>
                    <th className="py-2 px-3 font-medium text-right">IMPACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {previewAnalysis.samplePreview.map((item) => (
                    <tr key={item.product.id} className={item.isBelow ? 'bg-rose-50/40' : ''}>
                      <td className="py-2 px-3 font-sans truncate max-w-[180px]">
                        <span className="font-semibold text-slate-900 block truncate">{item.product.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">¥{Math.round(item.costPrice).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-600">¥{Math.round(item.oldPrice).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ¥{Math.round(item.newPrice).toLocaleString()}
                        {item.isBelow && <span className="ml-1 text-[10px] text-rose-600 font-bold">⚠️ BELOW COST</span>}
                      </td>
                      <td className={`py-2 px-3 text-right font-semibold ${item.diff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {item.diff >= 0 ? `+¥${Math.round(item.diff)}` : `-¥${Math.round(Math.abs(item.diff))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedProducts.length > 5 && (
                <div className="py-1.5 px-3 bg-slate-50 text-[10px] text-slate-500 border-t border-slate-100 text-center">
                  + {selectedProducts.length - 5} more selected products will receive this update
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              5. Price-Change Reason <span className="text-rose-500">* (Mandatory for Retail Audit Trail)</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Q4 supplier cost increase adjustment, Weekend fresh produce promo, Competitor price match"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Never overwrites price history. Logs immutable records.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? 'Applying...'
                    : `Execute Bulk Update (${selectedProducts.length * selectedStores.length} records)`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
