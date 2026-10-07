import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Calendar, Truck, Store as StoreIcon, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { PurchaseOrder, Supplier, StoreId } from '../types/database';

export const PurchasingView: React.FC = () => {
  const { stores, currentUser, refreshKey, triggerRefresh, addToast } = useApp();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);

  // New PO State
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poStoreId, setPoStoreId] = useState<StoreId>('store-shin-koiwa');
  const [poAmount, setPoAmount] = useState(150000);
  const [poItemsCount, setPoItemsCount] = useState(4);
  const [poNotes, setPoNotes] = useState('Weekly standard restock order');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [poList, supList] = await Promise.all([
          dataService.getPurchaseOrders(),
          dataService.getSuppliers(),
        ]);
        setOrders(poList);
        setSuppliers(supList);
        if (supList.length > 0) setPoSupplierId(supList[0].id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === poSupplierId);
    const st = stores.find((s) => s.id === poStoreId);
    if (!sup || !st) return;

    try {
      await dataService.addPurchaseOrder({
        po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        supplier_id: sup.id,
        supplier_name: sup.name,
        destination_store_id: st.id,
        destination_store_name: st.name,
        status: 'ordered',
        total_amount: Number(poAmount),
        order_date: new Date().toISOString(),
        expected_delivery_date: new Date(Date.now() + sup.lead_time_days * 86400000).toISOString(),
        created_by: currentUser.name,
        items_count: Number(poItemsCount),
        notes: poNotes,
      });

      triggerRefresh();
      setIsNewPoModalOpen(false);
      addToast({
        type: 'success',
        title: 'Purchase Order Issued',
        message: `Order submitted to ${sup.name} for delivery to ${st.name}.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to create PO',
        message: err.message,
      });
    }
  };

  const statusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'received':
        return <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">RECEIVED</span>;
      case 'ordered':
        return <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">ORDERED</span>;
      case 'draft':
        return <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold">DRAFT</span>;
      default:
        return <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Procurement & Purchasing Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase orders, inbound batch schedules, and receiving store allocations.
          </p>
        </div>

        <button
          onClick={() => setIsNewPoModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 font-medium">
                <th className="py-3 px-4 font-medium">PO NUMBER</th>
                <th className="py-3 px-4 font-medium">SUPPLIER</th>
                <th className="py-3 px-4 font-medium">DESTINATION BRANCH</th>
                <th className="py-3 px-4 font-medium">STATUS</th>
                <th className="py-3 px-4 font-medium text-right">TOTAL AMOUNT</th>
                <th className="py-3 px-4 font-medium">ORDER DATE</th>
                <th className="py-3 px-4 font-medium">EXPECTED DELIVERY</th>
                <th className="py-3 px-4 font-medium">BUYER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {po.po_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {po.supplier_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {po.destination_store_name}
                  </td>
                  <td className="py-3.5 px-4">
                    {statusBadge(po.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    ¥{po.total_amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(po.order_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {new Date(po.expected_delivery_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {po.created_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New PO Modal */}
      {isNewPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="fixed inset-0" onClick={() => setIsNewPoModalOpen(false)} />

          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-10">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Draft Purchase Order</h3>
                <p className="text-xs text-slate-400">Order inventory from verified suppliers</p>
              </div>
              <button
                onClick={() => setIsNewPoModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} · Lead: {s.lead_time_days}d)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Destination Receiving Branch <span className="text-rose-500">*</span>
                </label>
                <select
                  value={poStoreId}
                  onChange={(e) => setPoStoreId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                >
                  {stores.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Total Amount (JPY)
                  </label>
                  <input
                    type="number"
                    value={poAmount}
                    onChange={(e) => setPoAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Line Items
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={poItemsCount}
                    onChange={(e) => setPoItemsCount(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Order Notes</label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Urgent morning sashimi delivery"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPoModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
