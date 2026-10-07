import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Boxes,
  Check,
  Building,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
  Trash2,
} from 'lucide-react';
import { Product, Store, StoreId, StockMovementType } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';

interface StockAdjustmentModalProps {
  products: Product[];
  stores: Store[];
  initialProductId?: string;
  initialStoreId?: StoreId;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  products,
  stores,
  initialProductId,
  initialStoreId,
  onClose,
  onSuccess,
}) => {
  const { currentUser, addToast } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products.length > 0 ? products[0].id : '')
  );
  const [selectedStoreId, setSelectedStoreId] = useState<StoreId>(
    initialStoreId || (stores.length > 0 ? stores[0].id : 'store-shin-koiwa')
  );
  const [movementType, setMovementType] = useState<StockMovementType>('Adjustment');
  const [adjustmentMode, setAdjustmentMode] = useState<'relative' | 'physical_count'>('relative');
  const [quantityInput, setQuantityInput] = useState<number>(5);
  const [physicalCountInput, setPhysicalCountInput] = useState<number>(0);
  const [reference, setReference] = useState<string>(`ADJ-${Date.now().toString(36).toUpperCase()}`);
  const [reason, setReason] = useState<string>('Physical inventory cycle count reconciliation');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDestructiveConfirm, setShowDestructiveConfirm] = useState(false);

  // Find selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Get current stock at this store
  const [currentStock, setCurrentStock] = useState<number>(0);

  React.useEffect(() => {
    async function fetchStock() {
      if (!selectedProductId || !selectedStoreId) return;
      const sp = await dataService.getStoreProductByStoreAndProduct(selectedStoreId, selectedProductId);
      const stock = sp ? sp.stock_quantity : 0;
      setCurrentStock(stock);
      setPhysicalCountInput(stock);
    }
    fetchStock();
  }, [selectedProductId, selectedStoreId]);

  // Calculate new stock and delta
  const { delta, newStock, isDestructive } = useMemo(() => {
    let d = 0;
    let n = currentStock;

    if (adjustmentMode === 'physical_count') {
      n = Math.max(0, physicalCountInput);
      d = n - currentStock;
    } else {
      const absQty = Math.abs(quantityInput);
      switch (movementType) {
        case 'Stock In':
        case 'Return':
        case 'Transfer In':
        case 'received':
          d = absQty;
          n = currentStock + absQty;
          break;
        case 'Stock Out':
        case 'Sale':
        case 'Damaged':
        case 'Waste':
        case 'Expired':
        case 'Transfer Out':
        case 'sale':
        case 'waste':
          d = -absQty;
          n = Math.max(0, currentStock - absQty);
          break;
        case 'Adjustment':
        case 'adjustment':
        default:
          d = quantityInput;
          n = Math.max(0, currentStock + quantityInput);
          break;
      }
    }

    const destructiveTypes: StockMovementType[] = ['Waste', 'Damaged', 'Expired', 'waste'];
    const isDestr =
      destructiveTypes.includes(movementType) ||
      (d < 0 && Math.abs(d) >= 15) ||
      (currentStock > 0 && n === 0);

    return { delta: d, newStock: n, isDestructive: isDestr };
  }, [currentStock, adjustmentMode, physicalCountInput, movementType, quantityInput]);

  const valuationImpact = selectedProduct ? Math.abs(delta) * selectedProduct.cost_price : 0;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !selectedStoreId) {
      addToast({
        type: 'error',
        title: 'Selection Incomplete',
        message: 'Please choose both a product and a branch store.',
      });
      return;
    }

    if (!reason.trim()) {
      addToast({
        type: 'error',
        title: 'Reason Required',
        message: 'A business reason is mandatory for stock audit logging.',
      });
      return;
    }

    if (adjustmentMode === 'relative' && quantityInput === 0) {
      addToast({
        type: 'warning',
        title: 'Zero Quantity',
        message: 'Adjustment quantity must be greater than zero.',
      });
      return;
    }

    // If destructive action, prompt confirmation dialog
    if (isDestructive && !showDestructiveConfirm) {
      setShowDestructiveConfirm(true);
      return;
    }

    executeAdjustment();
  };

  const executeAdjustment = async () => {
    setIsSubmitting(true);
    try {
      const qtyToPass =
        adjustmentMode === 'physical_count'
          ? physicalCountInput
          : delta;

      const res = await dataService.adjustStock({
        productId: selectedProductId,
        storeId: selectedStoreId,
        type: movementType,
        quantity: qtyToPass,
        isPhysicalCountOverride: adjustmentMode === 'physical_count',
        reason: reason.trim(),
        reference: reference.trim(),
        notes: notes.trim(),
        userName: currentUser.name,
      });

      addToast({
        type: isDestructive ? 'warning' : 'success',
        title: 'Stock Adjustment Applied',
        message: `Inventory updated for ${selectedProduct?.name}: ${res.previousStock} → ${res.newStock} units (${res.movement.type}).`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Adjustment Failed',
        message: err.message || 'Unable to record stock adjustment.',
      });
    } finally {
      setIsSubmitting(false);
      setShowDestructiveConfirm(false);
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
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Stock Movement / Adjustment</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Store-specific inventory ledger with immutable audit trail
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

        {/* Confirmation Overlay for Destructive Actions */}
        {showDestructiveConfirm ? (
          <div className="p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900">
                Confirm {movementType} Inventory Write-Off
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                You are about to write off <strong className="text-slate-900">{Math.abs(delta)} {selectedProduct?.unit || 'units'}</strong> of{' '}
                <strong className="text-slate-900">{selectedProduct?.name}</strong> at{' '}
                <strong className="text-slate-900">{stores.find((s) => s.id === selectedStoreId)?.name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-800">
              <div className="flex justify-between">
                <span>Stock Balance Change:</span>
                <span className="font-mono font-bold">
                  {currentStock} → {newStock} ({delta} units)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Inventory Cost Valuation Write-Down:</span>
                <span className="font-mono font-bold text-rose-900">
                  -¥{valuationImpact.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reason:</span>
                <span className="font-medium">{reason}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              This inventory write-off will be permanently registered in the store stock ledger and audit trail.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDestructiveConfirm(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Back & Review
              </button>
              <button
                type="button"
                onClick={executeAdjustment}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording...' : 'Confirm Write-Off'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
            {/* Store & Product Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  1. Branch Store <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value as StoreId)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {stores.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  2. Select Product <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Stock Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Current On-Hand Stock:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {currentStock} {selectedProduct?.unit || 'pcs'}
                </span>
                {currentStock === 0 ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    OUT OF STOCK
                  </span>
                ) : currentStock <= (selectedProduct?.min_stock_alert || 10) ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    LOW STOCK (Min: {selectedProduct?.min_stock_alert})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    IN STOCK
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Cost: ¥{selectedProduct?.cost_price.toLocaleString()}
              </div>
            </div>

            {/* Movement Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                3. Movement Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {(
                  [
                    'Stock In',
                    'Stock Out',
                    'Adjustment',
                    'Damaged',
                    'Waste',
                    'Expired',
                    'Return',
                    'Sale',
                    'Transfer In',
                    'Transfer Out',
                  ] as StockMovementType[]
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMovementType(type)}
                    className={`px-2.5 py-1.5 rounded-lg border font-medium text-center transition-colors cursor-pointer text-[11px] ${
                      movementType === type
                        ? 'border-slate-900 bg-slate-900 text-white font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustment Mode (Relative Delta vs Physical Count) */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">4. Input Mode</span>
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="adjMode"
                      checked={adjustmentMode === 'relative'}
                      onChange={() => setAdjustmentMode('relative')}
                      className="text-slate-900"
                    />
                    <span>Delta Quantity</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="adjMode"
                      checked={adjustmentMode === 'physical_count'}
                      onChange={() => setAdjustmentMode('physical_count')}
                      className="text-slate-900"
                    />
                    <span>Physical Shelf Count</span>
                  </label>
                </div>
              </div>

              {adjustmentMode === 'relative' ? (
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Quantity to Move ({selectedProduct?.unit || 'units'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(Math.abs(Number(e.target.value)))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Direction determined by movement type ({movementType}: {delta >= 0 ? `+${delta}` : delta} units)
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Verified Physical Stock Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={physicalCountInput}
                    onChange={(e) => setPhysicalCountInput(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Current stock ({currentStock}) will be updated to target ({physicalCountInput}). Delta: {delta >= 0 ? `+${delta}` : delta} units.
                  </span>
                </div>
              )}
            </div>

            {/* Impact Calculation Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Stock Transition:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentStock} → <span className="text-emerald-700 font-bold">{newStock} {selectedProduct?.unit}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Net Quantity Delta:</span>
                <span className={`font-mono font-bold ${delta >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {delta >= 0 ? `+${delta}` : delta} {selectedProduct?.unit}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                <span>Inventory Cost Impact:</span>
                <span className="font-mono font-medium text-slate-900">
                  {delta >= 0 ? '+' : '-'}¥{valuationImpact.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Destructive Action Warning */}
            {isDestructive && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">Important Inventory Action Warning</p>
                  <p className="mt-0.5 text-rose-700">
                    Recording as <span className="font-semibold">{movementType}</span> will permanently reduce stock and write down inventory value.
                    A confirmation dialog will appear upon submission.
                  </p>
                </div>
              </div>
            )}

            {/* Reference & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Reference Document Code
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. ADJ-2026-101, PO-998"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Reason for Adjustment <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Broken in transit, Routine count discrepancy"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Internal Audit Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details regarding the stock discrepancy or inspection results..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 resize-none"
              />
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
                  disabled={isSubmitting}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isDestructive
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording...' : isDestructive ? 'Review & Confirm Write-Off' : 'Record Stock Movement'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
