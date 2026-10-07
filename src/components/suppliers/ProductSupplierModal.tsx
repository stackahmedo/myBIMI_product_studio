import React, { useState, useMemo } from 'react';
import { X, Star, DollarSign, Clock, Package, Check, Building2, AlertTriangle, Info, History } from 'lucide-react';
import { Product, Supplier, ProductSupplier } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';

interface ProductSupplierModalProps {
  product: Product;
  suppliers: Supplier[];
  existingLink?: ProductSupplier | null;
  onClose: () => void;
  onSuccess: (savedLink: ProductSupplier) => void;
}

export const ProductSupplierModal: React.FC<ProductSupplierModalProps> = ({
  product,
  suppliers,
  existingLink,
  onClose,
  onSuccess,
}) => {
  const { currentUser, addToast } = useApp();
  const isEditing = Boolean(existingLink);

  const [supplierId, setSupplierId] = useState<string>(
    existingLink?.supplier_id || (suppliers.length > 0 ? suppliers[0].id : '')
  );
  const [supplierProductCode, setSupplierProductCode] = useState<string>(
    existingLink?.supplier_product_code || `${product.sku}-SUP`
  );
  const [purchasePrice, setPurchasePrice] = useState<number>(
    existingLink?.purchase_price ?? product.cost_price
  );
  const [currency, setCurrency] = useState<string>(
    existingLink?.currency || 'JPY'
  );
  const [moq, setMoq] = useState<number>(existingLink?.moq ?? 10);
  const [packQuantity, setPackQuantity] = useState<number>(existingLink?.pack_quantity ?? 10);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(
    existingLink?.lead_time_days ?? 2
  );
  const [isPreferred, setIsPreferred] = useState<boolean>(
    existingLink ? existingLink.is_preferred : false
  );
  const [notes, setNotes] = useState<string>(existingLink?.notes || '');
  const [priceChangeReason, setPriceChangeReason] = useState<string>('Contract price review & renegotiation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected supplier details
  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId),
    [suppliers, supplierId]
  );

  // When changing supplier in create mode, prefill defaults
  const handleSupplierChange = (newSupId: string) => {
    setSupplierId(newSupId);
    const sup = suppliers.find((s) => s.id === newSupId);
    if (sup && !isEditing) {
      setCurrency(sup.currency || 'JPY');
      setLeadTimeDays(sup.lead_time_days || 2);
    }
  };

  const isPriceChanged = isEditing && existingLink && existingLink.purchase_price !== purchasePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      addToast({
        type: 'error',
        title: 'Supplier Required',
        message: 'Please choose a supplier from the list.',
      });
      return;
    }

    if (purchasePrice <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Purchase Price',
        message: 'Purchase cost must be greater than zero.',
      });
      return;
    }

    if (isPriceChanged && !priceChangeReason.trim()) {
      addToast({
        type: 'error',
        title: 'Reason Required',
        message: 'Please provide a justification for this supplier price modification.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await dataService.upsertProductSupplier(
        {
          id: existingLink?.id,
          product_id: product.id,
          supplier_id: supplierId,
          supplier_name: selectedSupplier?.name || 'Unknown Supplier',
          supplier_code: selectedSupplier?.code,
          product_name: product.name,
          product_sku: product.sku,
          supplier_product_code: supplierProductCode.trim() || product.sku,
          purchase_price: Number(purchasePrice),
          currency: currency.trim().toUpperCase(),
          moq: Number(moq) || 1,
          pack_quantity: Number(packQuantity) || 1,
          lead_time_days: Number(leadTimeDays) || 2,
          is_preferred: isPreferred,
          notes: notes.trim(),
        },
        currentUser.name,
        priceChangeReason.trim()
      );

      addToast({
        type: 'success',
        title: isEditing ? 'Supplier Sourcing Updated' : 'Supplier Linked to Product',
        message: `${selectedSupplier?.name} terms saved for ${product.name}. ${isPreferred ? 'Marked as Preferred Supplier.' : ''}`,
      });

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to Save Supplier Link',
        message: err.message || 'Unable to update supplier terms.',
      });
    } finally {
      setIsSubmitting(false);
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
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? `Edit Supplier Terms: ${existingLink?.supplier_name}` : `Link Sourcing Supplier to ${product.name}`}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                SKU: {product.sku} · Many-to-Many Multi-Vendor Procurement
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Supplier Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Select Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              disabled={isEditing}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none disabled:bg-slate-50"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) · {s.country} · {s.currency}
                </option>
              ))}
            </select>
            {selectedSupplier && (
              <p className="text-[11px] text-slate-400 mt-1">
                Contact: {selectedSupplier.contact_name} ({selectedSupplier.phone}) · Payment: {selectedSupplier.payment_terms}
              </p>
            )}
          </div>

          {/* Supplier Product Code (SKU) & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Supplier Product Code / SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={supplierProductCode}
                onChange={(e) => setSupplierProductCode(e.target.value)}
                placeholder="e.g. TYO-TUNA-3MIX"
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Purchase Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="JPY">JPY (¥)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="THB">THB (฿)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>
          </div>

          {/* Purchase Price & Last Purchase Price Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Unit Purchase Price <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full text-sm font-mono font-bold pl-3 pr-10 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">
                  {currency}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Catalog Retail Price: ¥{product.base_retail_price.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Benchmark & Variance
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xs font-mono text-slate-500">
                  Last Price: {existingLink?.last_purchase_price ? `¥${existingLink.last_purchase_price.toLocaleString()}` : '—'}
                </span>
                {existingLink && purchasePrice !== existingLink.purchase_price && (
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      purchasePrice > existingLink.purchase_price
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {purchasePrice > existingLink.purchase_price ? '+' : ''}
                    {purchasePrice - existingLink.purchase_price} {currency}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MOQ, Pack Quantity & Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                MOQ (Min Order Qty)
              </label>
              <input
                type="number"
                min={1}
                required
                value={moq}
                onChange={(e) => setMoq(Number(e.target.value))}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{product.unit || 'units'}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Pack / Carton Size
              </label>
              <input
                type="number"
                min={1}
                required
                value={packQuantity}
                onChange={(e) => setPackQuantity(Number(e.target.value))}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Units per outer box</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Lead Time (Days)
              </label>
              <input
                type="number"
                min={1}
                required
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Order to delivery</span>
            </div>
          </div>

          {/* If Price Changed: Required Reason for Audit Log */}
          {isPriceChanged && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Price Modification Justification (Recorded in Price History)</span>
              </div>
              <input
                type="text"
                required
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                placeholder="e.g. Fuel surcharge adjustment, New wholesale tier..."
                className="w-full text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>
          )}

          {/* Preferred Supplier Toggle */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPreferred ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-200 text-slate-500'}`}>
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Mark as Preferred Supplier
                </span>
                <span className="text-[11px] text-slate-500 block">
                  This vendor will be the primary source, setting default purchase cost and auto-PO target.
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPreferred}
                onChange={(e) => setIsPreferred(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Sourcing Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Procurement & Quality Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Master distributor agreement, requires inspection on arrival..."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 resize-none focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Audited by: {currentUser.name}
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
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Terms' : 'Link Supplier'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
