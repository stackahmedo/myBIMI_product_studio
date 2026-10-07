import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Globe,
  MessageSquare,
  Package,
  Plus,
  Edit2,
  Trash2,
  Star,
  ExternalLink,
  History,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Supplier, ProductSupplier, SupplierPriceHistoryRecord, Product } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';
import { ProductSupplierModal } from './ProductSupplierModal';

interface SupplierDetailDrawerProps {
  supplier: Supplier;
  allProducts: Product[];
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
  onRefresh: () => void;
}

export const SupplierDetailDrawer: React.FC<SupplierDetailDrawerProps> = ({
  supplier,
  allProducts,
  onClose,
  onEdit,
  onRefresh,
}) => {
  const { addToast } = useApp();

  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [priceHistory, setPriceHistory] = useState<SupplierPriceHistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'history' | 'profile'>('products');
  const [loading, setLoading] = useState(true);

  // Link Product Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProductSupplier | null>(null);
  const [targetProductForLink, setTargetProductForLink] = useState<Product | null>(null);

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [psList, sphList] = await Promise.all([
        dataService.getProductSuppliers(undefined, supplier.id),
        dataService.getSupplierPriceHistory(undefined, supplier.id),
      ]);
      setProductSuppliers(psList);
      setPriceHistory(sphList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [supplier.id]);

  const handleSetPreferred = async (productId: string) => {
    try {
      await dataService.setPreferredSupplier(productId, supplier.id);
      addToast({
        type: 'success',
        title: 'Preferred Supplier Updated',
        message: `${supplier.name} is now the primary preferred source for this product.`,
      });
      loadSupplierData();
      onRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    }
  };

  const handleUnlinkProduct = async (linkId: string, prodName: string) => {
    if (!window.confirm(`Unlink ${supplier.name} from supplying ${prodName}?`)) return;
    try {
      await dataService.removeProductSupplier(linkId);
      addToast({
        type: 'info',
        title: 'Supplier Unlinked',
        message: `Removed sourcing link for ${prodName}.`,
      });
      loadSupplierData();
      onRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to unlink',
        message: err.message,
      });
    }
  };

  // WhatsApp formatted link
  const cleanPhone = supplier.whatsapp?.replace(/[^0-9+]/g, '') || supplier.phone?.replace(/[^0-9+]/g, '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}` : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{supplier.name}</h2>
                  <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {supplier.code}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      supplier.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {supplier.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {supplier.country} · Lead Time: {supplier.lead_time_days} days · Terms: {supplier.payment_terms}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(supplier)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3 h-3 text-slate-400" />
                <span>Edit</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Contact & Action Ribbon */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              )}

              {supplier.email && (
                <a
                  href={`mailto:${supplier.email}`}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Vendor</span>
                </a>
              )}

              {supplier.phone && (
                <a
                  href={`tel:${supplier.phone}`}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{supplier.phone}</span>
                </a>
              )}

              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>

            <div className="font-mono text-[11px] text-slate-500">
              Currency: <strong className="text-slate-900">{supplier.currency}</strong>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white border-b border-slate-200/80 px-6 flex items-center gap-4 text-xs font-medium text-slate-500">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Supplied Products ({productSuppliers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Vendor Price History ({priceHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Company Profile & Terms
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tab 1: Supplied Products */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Procurement Catalog from this Vendor</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Items purchased through {supplier.name} with negotiated wholesale pricing.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (allProducts.length > 0) {
                        setTargetProductForLink(allProducts[0]);
                        setEditingLink(null);
                        setIsLinkModalOpen(true);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Supply Product</span>
                  </button>
                </div>

                {productSuppliers.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                    <Package className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium text-slate-600">No master products currently linked to this supplier.</p>
                    <button
                      onClick={() => {
                        if (allProducts.length > 0) {
                          setTargetProductForLink(allProducts[0]);
                          setEditingLink(null);
                          setIsLinkModalOpen(true);
                        }
                      }}
                      className="text-xs font-semibold text-slate-900 underline cursor-pointer"
                    >
                      Click here to link products to this vendor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productSuppliers.map((ps) => {
                      const matchedProduct = allProducts.find((p) => p.id === ps.product_id);
                      return (
                        <div
                          key={ps.id}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            ps.is_preferred
                              ? 'bg-amber-50/20 border-amber-300 ring-1 ring-amber-200/50'
                              : 'bg-white border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {matchedProduct?.image_url ? (
                                <img
                                  src={matchedProduct.image_url}
                                  alt={ps.product_name}
                                  className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">
                                  BIMI
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs text-slate-900">{ps.product_name}</h4>
                                  {ps.is_preferred && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-current" />
                                      <span>Preferred Source</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>SKU: {ps.product_sku}</span>
                                  <span>·</span>
                                  <span>Supplier Code: <strong>{ps.supplier_product_code}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-base text-slate-900 block">
                                ¥{ps.purchase_price.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {ps.currency} Unit Cost
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600 font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">MOQ</span>
                              <span className="font-bold text-slate-900">{ps.moq} {matchedProduct?.unit || 'units'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">PACK / CARTON</span>
                              <span className="font-bold text-slate-900">{ps.pack_quantity} units/box</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">LEAD TIME</span>
                              <span className="font-bold text-slate-900">{ps.lead_time_days} days</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <span className="text-[11px] text-slate-400 font-mono">
                              Last updated: {new Date(ps.last_updated).toLocaleDateString()}
                            </span>

                            <div className="flex items-center gap-2">
                              {!ps.is_preferred && (
                                <button
                                  onClick={() => handleSetPreferred(ps.product_id)}
                                  className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Make this supplier the preferred source for this product"
                                >
                                  <Star className="w-3 h-3" />
                                  <span>Set as Preferred</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (matchedProduct) {
                                    setTargetProductForLink(matchedProduct);
                                    setEditingLink(ps);
                                    setIsLinkModalOpen(true);
                                  }
                                }}
                                className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                              >
                                Edit Terms
                              </button>

                              <button
                                onClick={() => handleUnlinkProduct(ps.id, ps.product_name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Unlink product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Supplier Price History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900">Historical Vendor Price Changes</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Immutable audit ledger</span>
                </div>

                {priceHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No price revisions logged for this supplier yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {priceHistory.map((sph) => {
                      const isUp = sph.new_price > sph.old_price;
                      return (
                        <div
                          key={sph.id}
                          className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{sph.product_name}</span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-slate-400 line-through">¥{sph.old_price.toLocaleString()}</span>
                              <span className="text-slate-400">→</span>
                              <span className={`font-bold ${isUp ? 'text-rose-600' : 'text-emerald-700'}`}>
                                ¥{sph.new_price.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Reason: {sph.reason}</span>
                            <span className="font-mono text-slate-400">
                              {new Date(sph.effective_date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono">
                            Recorded by {sph.changed_by}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Full Profile & Terms */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">COMPANY NAME</span>
                      <span className="font-bold text-slate-900 text-sm">{supplier.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">SUPPLIER ID / CODE</span>
                      <span className="font-mono font-bold text-slate-900">{supplier.code}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">CONTACT PERSON</span>
                      <span className="font-semibold text-slate-900">{supplier.contact_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">COUNTRY OF ORIGIN</span>
                      <span className="font-semibold text-slate-900">{supplier.country}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">PAYMENT TERMS</span>
                      <span className="font-mono font-semibold text-slate-900">{supplier.payment_terms}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">STANDARD LEAD TIME</span>
                      <span className="font-mono font-semibold text-slate-900">{supplier.lead_time_days} days</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">WAREHOUSE / BILLING ADDRESS</span>
                    <span className="text-slate-700">{supplier.address}</span>
                  </div>

                  {supplier.notes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">INTERNAL PROCUREMENT NOTES</span>
                      <p className="text-slate-600 italic mt-0.5">{supplier.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Supplier Modal for linking or editing products */}
      {isLinkModalOpen && targetProductForLink && (
        <ProductSupplierModal
          product={targetProductForLink}
          suppliers={[supplier]}
          existingLink={editingLink}
          onClose={() => {
            setIsLinkModalOpen(false);
            setEditingLink(null);
          }}
          onSuccess={() => {
            loadSupplierData();
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
