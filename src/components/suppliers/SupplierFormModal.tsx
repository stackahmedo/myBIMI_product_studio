import React, { useState } from 'react';
import { X, Building2, Check, Globe, Phone, Mail, MapPin, Clock, DollarSign, MessageSquare, AlertCircle } from 'lucide-react';
import { Supplier } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useApp } from '../../context/AppContext';

interface SupplierFormModalProps {
  supplier?: Supplier | null;
  onClose: () => void;
  onSuccess: (supplier: Supplier) => void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  supplier,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useApp();
  const isEditing = Boolean(supplier);

  const [name, setName] = useState(supplier?.name || '');
  const [code, setCode] = useState(supplier?.code || `SUP-${Math.floor(100 + Math.random() * 900)}`);
  const [contactName, setContactName] = useState(supplier?.contact_name || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [whatsapp, setWhatsapp] = useState(supplier?.whatsapp || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [country, setCountry] = useState(supplier?.country || 'Japan');
  const [website, setWebsite] = useState(supplier?.website || '');
  const [paymentTerms, setPaymentTerms] = useState(supplier?.payment_terms || 'Net 30 days');
  const [currency, setCurrency] = useState(supplier?.currency || 'JPY');
  const [leadTimeDays, setLeadTimeDays] = useState(supplier?.lead_time_days || 2);
  const [notes, setNotes] = useState(supplier?.notes || '');
  const [isActive, setIsActive] = useState(supplier ? supplier.is_active : true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Supplier company name is required.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let saved: Supplier;
      if (isEditing && supplier) {
        saved = await dataService.updateSupplier(supplier.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          contact_name: contactName.trim() || 'Wholesale Representative',
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim(),
          address: address.trim(),
          country: country.trim(),
          website: website.trim(),
          payment_terms: paymentTerms.trim(),
          currency: currency.trim().toUpperCase(),
          lead_time_days: Number(leadTimeDays) || 2,
          notes: notes.trim(),
          is_active: isActive,
        });
        addToast({
          type: 'success',
          title: 'Supplier Updated',
          message: `${saved.name} details have been saved.`,
        });
      } else {
        saved = await dataService.addSupplier({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          contact_name: contactName.trim() || 'Wholesale Representative',
          phone: phone.trim() || '03-0000-0000',
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim() || 'orders@vendor.jp',
          address: address.trim() || 'Tokyo, Japan',
          country: country.trim() || 'Japan',
          website: website.trim(),
          payment_terms: paymentTerms.trim() || 'Net 30 days',
          currency: currency.trim().toUpperCase() || 'JPY',
          lead_time_days: Number(leadTimeDays) || 2,
          notes: notes.trim(),
          is_active: isActive,
        });
        addToast({
          type: 'success',
          title: 'Supplier Registered',
          message: `${saved.name} (${saved.code}) added to vendor registry.`,
        });
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Operation Failed',
        message: err.message || 'Unable to save supplier record.',
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? `Edit Supplier: ${supplier?.name}` : 'Register New Wholesale Supplier'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Vendor terms, procurement currency, and contact channels
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
          {/* Section: Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Toyosu Central Fish Wholesalers Ltd."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Vendor Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUP-001"
                className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Person & Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Hiroshi Ogawa"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Office Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03-5569-1234"
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                <span>WhatsApp</span>
                <span className="text-[10px] text-emerald-600 font-mono font-normal">Direct Chat</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+81 90-1234-5678"
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Email & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="orders@supplier.co.jp"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://supplier.co.jp"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Address & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Physical / Warehouse Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 6-6-1 Toyosu, Koto-ku, Tokyo 135-0061"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="Japan">Japan (日本)</option>
                <option value="Thailand">Thailand</option>
                <option value="Singapore">Singapore</option>
                <option value="South Korea">South Korea</option>
                <option value="Taiwan">Taiwan</option>
                <option value="China">China</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Indonesia">Indonesia</option>
                <option value="United States">United States</option>
                <option value="Italy">Italy</option>
                <option value="Other">Other International</option>
              </select>
            </div>
          </div>

          {/* Commercial Terms: Payment Terms, Currency, Lead Time */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
              Commercial & Procurement Terms
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                >
                  <option value="Net 15 days">Net 15 days</option>
                  <option value="Net 30 days">Net 30 days</option>
                  <option value="Net 45 days">Net 45 days</option>
                  <option value="Net 60 days">Net 60 days</option>
                  <option value="End of month">End of month (月末締め)</option>
                  <option value="LC at sight">LC at sight</option>
                  <option value="Advance Payment">Advance Payment</option>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Invoicing Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                >
                  <option value="JPY">JPY (¥)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="THB">THB (฿)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Standard Lead Time (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Internal Sourcing & Procurement Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Primary contact for fresh fish auction, delivers directly to Shin-Koiwa loading dock..."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 resize-none focus:outline-none"
            />
          </div>

          {/* Active / Inactive Status */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
              <span className="text-xs font-semibold text-slate-800">
                {isActive ? 'Active Vendor Partner' : 'Inactive (Archive)'}
              </span>
            </div>

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
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Supplier' : 'Register Supplier'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
