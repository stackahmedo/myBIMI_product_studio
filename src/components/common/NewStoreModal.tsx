import React, { useState } from 'react';
import { X, Store, MapPin, Phone, User, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dataService } from '../../services/dataService';

interface NewStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewStoreModal: React.FC<NewStoreModalProps> = ({ isOpen, onClose }) => {
  const { reloadStores, setSelectedStoreId, addToast, triggerRefresh } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    setIsSubmitting(true);
    try {
      const created = await dataService.addStore({
        name,
        code: code.toUpperCase(),
        address: address || 'Tokyo, Japan',
        phone: phone || '03-0000-0000',
        manager_name: managerName || 'Branch Manager',
        is_active: true,
        opened_at: new Date().toISOString(),
      });

      await reloadStores();
      setSelectedStoreId(created.id);
      triggerRefresh();
      addToast({
        type: 'success',
        title: 'New Store Branch Created',
        message: `${created.name} (${created.code}) is now active in the system.`,
      });
      onClose();
      // reset
      setName('');
      setCode('');
      setAddress('');
      setPhone('');
      setManagerName('');
    } catch {
      addToast({
        type: 'error',
        title: 'Failed to create branch store',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in-50">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-10 animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Add New Store Branch</h3>
              <p className="text-xs text-slate-400">Scale BIMI retail network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Store Branch Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BIMI Supa – Asakusa"
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Branch Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. ASK-03"
                className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Store Manager
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Manager name"
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-900"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Address & Ward
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 2-5-1 Asakusa, Taito-ku, Tokyo"
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-900"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contact Phone
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 03-3841-9920"
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-900"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name || !code}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Register Store'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
