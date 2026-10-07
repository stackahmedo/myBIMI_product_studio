import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  AlertTriangle,
  Check,
  Building,
  ArrowRight,
  Boxes,
  Truck,
  Info,
} from 'lucide-react';
import { Product, Store, StoreId } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';

interface StockTransferModalProps {
  products: Product[];
  stores: Store[];
  initialProductId?: string;
  initialFromStoreId?: StoreId;
  initialToStoreId?: StoreId;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  products,
  stores,
  initialProductId,
  initialFromStoreId,
  initialToStoreId,
  onClose,
  onSuccess,
}) => {
  const { currentUser, addToast } = useApp();

  const [productId, setProductId] = useState<string>(
    initialProductId || (products.length > 0 ? products[0].id : '')
  );
  const [fromStoreId, setFromStoreId] = useState<StoreId>(
    initialFromStoreId || (stores.length > 0 ? stores[0].id : 'store-shin-koiwa')
  );
  const [toStoreId, setToStoreId] = useState<StoreId>(
    initialToStoreId || (stores.length > 1 ? stores[1].id : 'store-yotsugi')
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [reference, setReference] = useState<string>(`TRF-${Date.now().toString(36).toUpperCase()}`);
  const [reason, setReason] = useState<string>('Inter-store inventory balancing');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Store stocks state
  const [fromStock, setFromStock] = useState<number>(0);
  const [toStock, setToStock] = useState<number>(0);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const fromStore = useMemo(
    () => stores.find((s) => s.id === fromStoreId),
    [stores, fromStoreId]
  );

  const toStore = useMemo(
    () => stores.find((s) => s.id === toStoreId),
    [stores, toStoreId]
  );

  // Fetch stocks at both locations
  useEffect(() => {
    async function loadStocks() {
      if (!productId) return;
      const [spFrom, spTo] = await Promise.all([
        dataService.getStoreProductByStoreAndProduct(fromStoreId, productId),
        dataService.getStoreProductByStoreAndProduct(toStoreId, productId),
      ]);
      setFromStock(spFrom ? spFrom.stock_quantity : 0);
      setToStock(spTo ? spTo.stock_quantity : 0);
    }
    loadStocks();
  }, [productId, fromStoreId, toStoreId]);

  // Quick swap from/to
  const handleSwapStores = () => {
    const prevFrom = fromStoreId;
    setFromStoreId(toStoreId);
    setToStoreId(prevFrom);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productId || !fromStoreId || !toStoreId) {
      addToast({
        type: 'error',
        title: 'Incomplete Transfer Details',
        message: 'Please choose product, source branch, and destination branch.',
      });
      return;
    }

    if (fromStoreId === toStoreId) {
      addToast({
        type: 'error',
        title: 'Identical Branches',
        message: 'Origin and destination branches must be different.',
      });
      return;
    }

    if (quantity <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Quantity',
        message: 'Transfer quantity must be at least 1 unit.',
      });
      return;
    }

    if (quantity > fromStock) {
      addToast({
        type: 'error',
        title: 'Insufficient Inventory',
        message: `Cannot transfer ${quantity} units. ${fromStore?.name} only has ${fromStock} units on hand.`,
      });
      return;
    }

    if (!reason.trim()) {
      addToast({
        type: 'error',
        title: 'Reason Required',
        message: 'Please provide a reason for inter-branch transfer logging.',
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const executeTransfer = async () => {
    setIsSubmitting(true);
    try {
      const res = await dataService.transferStock({
        productId,
        fromStoreId,
        toStoreId,
        quantity: Number(quantity),
        reason: reason.trim(),
        reference: reference.trim(),
        notes: notes.trim(),
        userName: currentUser.name,
      });

      addToast({
        type: 'success',
        title: 'Store Transfer Completed',
        message: `Successfully transferred ${quantity} ${selectedProduct?.unit || 'units'} of ${selectedProduct?.name} from ${fromStore?.name} to ${toStore?.name}. Two balanced stock movements registered.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Transfer Failed',
        message: err.message || 'Unable to execute transfer.',
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inter-Branch Stock Transfer</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Store-to-store reallocation with balanced Transfer Out & Transfer In ledger records
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

        {/* Confirmation Dialog Step */}
        {showConfirmDialog ? (
          <div className="p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">
                Confirm Inter-Store Transfer
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Please verify the reallocation details below before applying the transaction.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-900">{selectedProduct?.name} ({selectedProduct?.sku})</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transfer Quantity:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {quantity} {selectedProduct?.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">DISPATCH FROM</span>
                  <span className="font-bold text-slate-900 block truncate">{fromStore?.name}</span>
                  <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                    Stock: {fromStock} → <strong className="text-rose-600 font-bold">{fromStock - quantity}</strong>
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-medium">RECEIVE AT</span>
                  <span className="font-bold text-slate-900 block truncate">{toStore?.name}</span>
                  <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                    Stock: {toStock} → <strong className="text-emerald-700 font-bold">{toStock + Number(quantity)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-600">
                <span>Reason:</span>
                <span className="font-medium text-slate-900">{reason}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              This operation automatically updates stock balances and generates two permanent ledger movements.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={executeTransfer}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Transferring...' : 'Confirm & Execute Transfer'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
            {/* Store Selection (From Store -> To Store) */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                1. Select Origin & Destination Branches
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-2">
                {/* From Store */}
                <div className="sm:col-span-5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    From Store (Origin)
                  </span>
                  <select
                    value={fromStoreId}
                    onChange={(e) => setFromStoreId(e.target.value as StoreId)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none"
                  >
                    {stores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] font-mono text-slate-500 block pt-0.5">
                    Available: <strong className="text-slate-900">{fromStock} {selectedProduct?.unit || 'units'}</strong>
                  </span>
                </div>

                {/* Swap Button */}
                <div className="sm:col-span-1 flex justify-center py-1 sm:py-0">
                  <button
                    type="button"
                    onClick={handleSwapStores}
                    className="p-2 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
                    title="Swap Source and Destination"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* To Store */}
                <div className="sm:col-span-5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    To Store (Destination)
                  </span>
                  <select
                    value={toStoreId}
                    onChange={(e) => setToStoreId(e.target.value as StoreId)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none"
                  >
                    {stores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] font-mono text-slate-500 block pt-0.5">
                    Current: <strong className="text-slate-900">{toStock} {selectedProduct?.unit || 'units'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                2. Product to Transfer <span className="text-rose-500">*</span>
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input with Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  3. Quantity to Transfer ({selectedProduct?.unit || 'units'}) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400">Quick:</span>
                  {[5, 10, 20].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuantity(Math.min(preset, fromStock))}
                      className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-mono text-[10px]"
                    >
                      {preset}
                    </button>
                  ))}
                  {fromStock > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(fromStock)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px]"
                    >
                      All ({fromStock})
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={fromStock}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {fromStock < quantity && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Requested quantity exceeds available stock ({fromStock} units)</span>
                </p>
              )}
            </div>

            {/* Transfer Reason Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                4. Transfer Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="Inter-store inventory balancing">Inter-store inventory balancing</option>
                <option value="Weekend high demand replenishment">Weekend high demand replenishment</option>
                <option value="Surplus stock relocation">Surplus stock relocation</option>
                <option value="Emergency branch stockout support">Emergency branch stockout support</option>
                <option value="Flyer campaign stock allocation">Flyer campaign stock allocation</option>
                <option value="Shelf reset & category reorganization">Shelf reset & category reorganization</option>
              </select>
            </div>

            {/* Reference & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Transfer Reference Code
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TRF-SKW-YTG-101"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Driver / Dispatch Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Hand-delivered via morning logistics run"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            {/* Real-time Preview Strip */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-600">
                <span>{fromStore?.name}:</span>
                <span className="font-bold text-slate-900">
                  {fromStock} → <span className="text-rose-600 font-bold">{Math.max(0, fromStock - quantity)}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>{toStore?.name}:</span>
                <span className="font-bold text-slate-900">
                  {toStock} → <span className="text-emerald-700 font-bold">{toStock + Number(quantity)}</span>
                </span>
              </div>
            </div>

            {/* Footer */}
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
                  disabled={isSubmitting || fromStock < quantity || quantity <= 0}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Review Transfer</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
