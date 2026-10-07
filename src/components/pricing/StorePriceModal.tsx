import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Info,
  Check,
  Building,
  Globe,
} from 'lucide-react';
import { Product, Store, ProductStorePrice, StoreId } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';

interface StorePriceModalProps {
  product: Product;
  initialStoreId?: StoreId | 'website' | 'all';
  stores: Store[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StorePriceModal: React.FC<StorePriceModalProps> = ({
  product,
  initialStoreId = 'all',
  stores,
  onClose,
  onSuccess,
}) => {
  const { currentUser, addToast } = useApp();

  const [selectedTarget, setSelectedTarget] = useState<StoreId | 'website' | 'all'>(initialStoreId);
  const [regularPrice, setRegularPrice] = useState<number>(product.base_retail_price);
  const [hasOffer, setHasOffer] = useState<boolean>(false);
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [offerStartDate, setOfferStartDate] = useState<string>('');
  const [offerEndDate, setOfferEndDate] = useState<string>('');
  const [wholesalePrice, setWholesalePrice] = useState<number>(Math.round(product.base_retail_price * 0.85));
  const [onlinePrice, setOnlinePrice] = useState<number>(product.base_retail_price);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing pricing for chosen store target
  useEffect(() => {
    async function loadCurrentStorePrice() {
      if (selectedTarget === 'all') {
        setRegularPrice(product.base_retail_price);
        setHasOffer(false);
        setOfferPrice('');
        setOfferStartDate('');
        setOfferEndDate('');
        setWholesalePrice(Math.round(product.base_retail_price * 0.85));
        setOnlinePrice(product.base_retail_price);
      } else {
        const psp = await dataService.getEffectiveStorePrice(product.id, selectedTarget);
        if (psp) {
          setRegularPrice(psp.regular_price);
          if (psp.offer_price) {
            setHasOffer(true);
            setOfferPrice(psp.offer_price);
            setOfferStartDate(psp.offer_start_date ? psp.offer_start_date.substring(0, 10) : '');
            setOfferEndDate(psp.offer_end_date ? psp.offer_end_date.substring(0, 10) : '');
          } else {
            setHasOffer(false);
            setOfferPrice('');
            setOfferStartDate('');
            setOfferEndDate('');
          }
          setWholesalePrice(psp.wholesale_price ?? Math.round(psp.regular_price * 0.85));
          setOnlinePrice(psp.online_price ?? psp.regular_price);
        }
      }
    }
    loadCurrentStorePrice();
  }, [product, selectedTarget]);

  // Derived financial metrics
  const effectiveSellingPrice = hasOffer && typeof offerPrice === 'number' && offerPrice > 0
    ? offerPrice
    : regularPrice;

  const costPrice = product.cost_price;
  const isBelowCost = effectiveSellingPrice < costPrice;
  const unitProfit = effectiveSellingPrice - costPrice;
  const marginPercent = effectiveSellingPrice > 0
    ? Math.round(((effectiveSellingPrice - costPrice) / effectiveSellingPrice) * 1000) / 10
    : 0;
  const markupPercent = costPrice > 0
    ? Math.round(((effectiveSellingPrice - costPrice) / costPrice) * 1000) / 10
    : 0;
  const taxMultiplier = 1 + product.tax_rate;
  const taxIncludedPrice = Math.round(effectiveSellingPrice * taxMultiplier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regularPrice <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Price',
        message: 'Regular price must be greater than ¥0.',
      });
      return;
    }

    if (!reason.trim()) {
      addToast({
        type: 'error',
        title: 'Reason Required',
        message: 'Please provide a business justification for this price modification.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalOfferPrice = hasOffer && typeof offerPrice === 'number' && offerPrice > 0
        ? offerPrice
        : null;

      const finalStartDate = hasOffer && offerStartDate
        ? new Date(offerStartDate + 'T00:00:00Z').toISOString()
        : null;

      const finalEndDate = hasOffer && offerEndDate
        ? new Date(offerEndDate + 'T23:59:59Z').toISOString()
        : null;

      if (selectedTarget === 'all') {
        // Update all retail stores
        for (const st of stores) {
          await dataService.setProductStorePrice({
            productId: product.id,
            storeId: st.id,
            regularPrice,
            offerPrice: finalOfferPrice,
            wholesalePrice,
            onlinePrice,
            offerStartDate: finalStartDate,
            offerEndDate: finalEndDate,
            reason,
            updatedBy: currentUser.name,
          });
        }
        // Also update website channel
        await dataService.setProductStorePrice({
          productId: product.id,
          storeId: 'website',
          regularPrice,
          offerPrice: finalOfferPrice,
          wholesalePrice,
          onlinePrice,
          offerStartDate: finalStartDate,
          offerEndDate: finalEndDate,
          reason,
          updatedBy: currentUser.name,
        });

        // Sync product base retail price
        await dataService.updateProduct(product.id, {
          base_retail_price: regularPrice,
        });
      } else {
        await dataService.setProductStorePrice({
          productId: product.id,
          storeId: selectedTarget,
          regularPrice,
          offerPrice: finalOfferPrice,
          wholesalePrice,
          onlinePrice,
          offerStartDate: finalStartDate,
          offerEndDate: finalEndDate,
          reason,
          updatedBy: currentUser.name,
        });
      }

      addToast({
        type: isBelowCost ? 'warning' : 'success',
        title: isBelowCost ? 'Price Updated with Warning' : 'Price Updated Successfully',
        message: `Updated pricing for ${product.name}. A permanent price history record has been logged.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Price Update Failed',
        message: err.message || 'Unable to save price change.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden z-10 my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              ¥
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manage Multi-Store Pricing</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {product.sku} · {product.name}
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
          {/* Target Branch Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Select Target Channel / Branch
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTarget('all')}
                className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-colors cursor-pointer ${
                  selectedTarget === 'all'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-[11px]">All Branches</span>
                <span className={`text-[10px] block mt-0.5 ${selectedTarget === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Global Sync
                </span>
              </button>

              {stores.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedTarget(st.id)}
                  className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-colors cursor-pointer ${
                    selectedTarget === st.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold text-[11px] truncate">{st.name.replace('BIMI Supa – ', '')}</span>
                  <span className={`text-[10px] block mt-0.5 ${selectedTarget === st.id ? 'text-slate-300' : 'text-slate-400'}`}>
                    {st.code} Branch
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setSelectedTarget('website')}
                className={`px-3 py-2 text-xs rounded-lg border font-medium text-left transition-colors cursor-pointer ${
                  selectedTarget === 'website'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block font-bold text-[11px]">Website Online</span>
                <span className={`text-[10px] block mt-0.5 ${selectedTarget === 'website' ? 'text-slate-300' : 'text-slate-400'}`}>
                  Shopify Channel
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Regular Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Regular Selling Price (JPY) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">¥</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard tax-excluded shelf retail price
              </span>
            </div>

            {/* Wholesale Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Wholesale / B2B Price (JPY)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">¥</span>
                <input
                  type="number"
                  min={1}
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                For restaurant & commercial bulk accounts
              </span>
            </div>
          </div>

          {/* Promotional Offer Price Section */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableOffer"
                  checked={hasOffer}
                  onChange={(e) => setHasOffer(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="enableOffer" className="text-xs font-bold text-slate-900 cursor-pointer">
                  Activate Promotional Offer / Campaign Price
                </label>
              </div>
              {hasOffer && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  SPECIAL OFFER ACTIVE
                </span>
              )}
            </div>

            {hasOffer && (
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Promotional Offer Price (JPY) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">¥</span>
                    <input
                      type="number"
                      min={1}
                      required={hasOffer}
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 150"
                      className="w-full pl-7 pr-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Offer Start Date
                    </label>
                    <input
                      type="date"
                      value={offerStartDate}
                      onChange={(e) => setOfferStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Offer Expiry Date
                    </label>
                    <input
                      type="date"
                      value={offerEndDate}
                      onChange={(e) => setOfferEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Financial Calculation Strip */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Purchase Cost (Supplier):</span>
              <span className="font-mono font-bold text-slate-900">¥{Math.round(costPrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Effective Selling Price:</span>
              <span className="font-mono font-bold text-slate-900">¥{Math.round(effectiveSellingPrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tax-Included Price ({(product.tax_rate * 100).toFixed(0)}% Tax):</span>
              <span className="font-mono font-medium text-slate-900">¥{Math.round(taxIncludedPrice).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Unit Profit & Gross Margin:</span>
              <div className="text-right">
                <span className={`font-mono font-bold text-sm ${isBelowCost ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isBelowCost ? '-' : '+'}¥{Math.round(Math.abs(unitProfit)).toLocaleString()} ({marginPercent}%)
                </span>
                <span className="text-[10px] text-slate-400 block">Markup: {markupPercent}%</span>
              </div>
            </div>
          </div>

          {/* Below Cost Warning Alert */}
          {isBelowCost && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Warning: Selling Price Below Product Cost</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">
                  The effective selling price (¥{Math.round(effectiveSellingPrice).toLocaleString()}) is lower than the purchase cost
                  (¥{Math.round(costPrice).toLocaleString()}), generating a loss of ¥{Math.round(Math.abs(unitProfit)).toLocaleString()} per unit sold.
                  Please ensure this loss-leader or clearance decision is authorized.
                </p>
              </div>
            </div>
          )}

          {/* Reason for Price Adjustment (Mandatory) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Reason for Price Adjustment <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Competitive price match, Seasonal produce markdown, Weekend flyer promo"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Required by retail audit governance. Recorded permanently in immutable price history.
            </span>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Operator: {currentUser.name}
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
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isBelowCost
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Apply & Save Price'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
