import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Clock,
  Search,
  Check,
  ExternalLink,
  MessageSquare,
  Globe,
  DollarSign,
  Filter,
  Grid,
  List,
  Star,
  Edit2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Package,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { Supplier, Product, ProductSupplier } from '../types/database';
import { SupplierFormModal } from '../components/suppliers/SupplierFormModal';
import { SupplierDetailDrawer } from '../components/suppliers/SupplierDetailDrawer';

export const SuppliersView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast } = useApp();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Drawers
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierForDrawer, setSelectedSupplierForDrawer] = useState<Supplier | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [supList, prodList, psList] = await Promise.all([
        dataService.getSuppliers(),
        dataService.getProducts(),
        dataService.getProductSuppliers(),
      ]);
      setSuppliers(supList);
      setProducts(prodList);
      setProductSuppliers(psList);

      // Keep drawer in sync if open
      if (selectedSupplierForDrawer) {
        const found = supList.find((s) => s.id === selectedSupplierForDrawer.id);
        if (found) setSelectedSupplierForDrawer(found);
      }
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
      setError(err?.message || 'Failed to query supplier directory. Click retry to reconnect.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [refreshKey]);

  // Unique countries and currencies
  const countries = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => {
      if (s.country) set.add(s.country);
    });
    return Array.from(set).sort();
  }, [suppliers]);

  const currencies = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach((s) => {
      if (s.currency) set.add(s.currency);
    });
    return Array.from(set).sort();
  }, [suppliers]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // Search text
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.contact_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.whatsapp && s.whatsapp.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q));

      // Status
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.is_active) ||
        (statusFilter === 'inactive' && !s.is_active);

      // Country
      const matchCountry = countryFilter === 'all' || s.country === countryFilter;

      // Currency
      const matchCurrency = currencyFilter === 'all' || s.currency === currencyFilter;

      return matchQuery && matchStatus && matchCountry && matchCurrency;
    });
  }, [suppliers, searchQuery, statusFilter, countryFilter, currencyFilter]);

  // Key metrics
  const activeCount = suppliers.filter((s) => s.is_active).length;
  const avgLeadTime =
    suppliers.length > 0
      ? (suppliers.reduce((sum, s) => sum + (s.lead_time_days || 0), 0) / suppliers.length).toFixed(1)
      : '0';
  const multiSupplierProductsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    productSuppliers.forEach((ps) => {
      counts[ps.product_id] = (counts[ps.product_id] || 0) + 1;
    });
    return Object.values(counts).filter((c) => c > 1).length;
  }, [productSuppliers]);

  // Toggle active/inactive
  const handleToggleActive = async (s: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dataService.updateSupplier(s.id, { is_active: !s.is_active });
      addToast({
        type: 'success',
        title: s.is_active ? 'Supplier Deactivated' : 'Supplier Activated',
        message: `${s.name} is now ${!s.is_active ? 'active' : 'inactive'}.`,
      });
      loadAll();
      triggerRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Supplier Management</h1>
            <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
              {suppliers.length} Vendors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Vendor master registry, commercial payment terms, procurement currencies, and multi-supplier sourcing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingSupplier(null);
              setIsFormModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Suppliers</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900">{suppliers.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Approved vendor network</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Partners</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-700">{activeCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {suppliers.length > 0 ? Math.round((activeCount / suppliers.length) * 100) : 0}% operational readiness
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Lead Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {avgLeadTime} <span className="text-sm font-normal text-slate-500">days</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Procurement transit window</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Multi-Sourced SKUs</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-purple-700">{multiSupplierProductsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Products with 2+ suppliers</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier name, code, contact, phone, WhatsApp..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Quick Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All ({suppliers.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'inactive' ? 'bg-white text-slate-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Inactive ({suppliers.length - activeCount})
              </button>
            </div>

            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono focus:outline-none"
            >
              <option value="all">All Currencies</option>
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid Cards"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table Directory"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State Banner with Retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadAll}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading supplier network directory...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center shadow-2xs space-y-3">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No Suppliers Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No vendor records matched your search or status filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => {
            const linkedLinks = productSuppliers.filter((ps) => ps.supplier_id === s.id);
            const cleanPhone = s.whatsapp?.replace(/[^0-9+]/g, '') || s.phone?.replace(/[^0-9+]/g, '');
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}` : null;

            return (
              <div
                key={s.id}
                onClick={() => setSelectedSupplierForDrawer(s)}
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm group"
              >
                <div>
                  {/* Top Bar: Code, Name, Status, Action */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {s.code}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">ID: {s.id}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-1.5 group-hover:text-blue-600 transition-colors">
                        {s.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Contact: <strong className="text-slate-800">{s.contact_name}</strong>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleToggleActive(s, e)}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          s.is_active
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSupplier(s);
                          setIsFormModalOpen(true);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Supplier Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Supplier Attributes: All 14 fields */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Lead Time:</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {s.lead_time_days} days
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Currency & Terms:</span>
                      </div>
                      <span className="font-mono text-slate-700 text-right truncate max-w-[180px]">
                        <strong>{s.currency}</strong> · {s.payment_terms}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Country:</span>
                      </div>
                      <span className="font-medium text-slate-900">{s.country || 'Japan'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Phone:</span>
                      </div>
                      <span className="font-mono text-slate-800">{s.phone}</span>
                    </div>

                    {s.whatsapp && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700 font-medium">WhatsApp:</span>
                        </div>
                        <span className="font-mono text-emerald-800 font-medium">{s.whatsapp}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Email:</span>
                      </div>
                      <span className="truncate max-w-[180px] text-slate-700">{s.email}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-400">Address:</span>
                      </div>
                      <span className="text-right text-[11px] text-slate-500 line-clamp-1 truncate">
                        {s.address}
                      </span>
                    </div>

                    {s.website && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Website:</span>
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span className="truncate max-w-[170px]">{s.website.replace('https://', '')}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    )}

                    {s.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg line-clamp-2 italic">
                        "{s.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Ribbon */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-slate-600">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong className="text-slate-900 font-bold">{linkedLinks.length}</strong> items supplied
                    </span>
                  </div>

                  <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px] font-semibold">
                    View Catalog <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier / ID</th>
                  <th className="py-3 px-3">Contact Person</th>
                  <th className="py-3 px-3">Channels (WhatsApp / Email)</th>
                  <th className="py-3 px-3">Country</th>
                  <th className="py-3 px-3 text-center">Lead Time</th>
                  <th className="py-3 px-3">Terms & Currency</th>
                  <th className="py-3 px-3 text-center">Supplied SKUs</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSuppliers.map((s) => {
                  const linkedCount = productSuppliers.filter((ps) => ps.supplier_id === s.id).length;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSupplierForDrawer(s)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {s.code}
                          </span>
                          <span className="font-bold text-slate-900">{s.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {s.id}</p>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800">
                        {s.contact_name}
                      </td>

                      <td className="py-3 px-3 space-y-0.5 font-mono text-[11px]">
                        {s.whatsapp && (
                          <div className="flex items-center gap-1 text-emerald-700">
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>{s.whatsapp}</span>
                          </div>
                        )}
                        <div className="text-slate-500">{s.email}</div>
                        <div className="text-slate-400">{s.phone}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-900">{s.country || 'Japan'}</span>
                        <p className="text-[10px] text-slate-400 line-clamp-1 truncate max-w-[140px]">{s.address}</p>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {s.lead_time_days}d
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900">{s.currency}</span>
                        <p className="text-[11px] text-slate-500">{s.payment_terms}</p>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {linkedCount}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => handleToggleActive(s, e)}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors ${
                            s.is_active
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSupplier(s);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupplierForDrawer(s);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          >
                            Catalog
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Create/Edit Modal */}
      {isFormModalOpen && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingSupplier(null);
          }}
          onSuccess={() => {
            loadAll();
            triggerRefresh();
          }}
        />
      )}

      {/* Supplier Detail Drawer */}
      {selectedSupplierForDrawer && (
        <SupplierDetailDrawer
          supplier={selectedSupplierForDrawer}
          allProducts={products}
          onClose={() => setSelectedSupplierForDrawer(null)}
          onEdit={(sup) => {
            setEditingSupplier(sup);
            setIsFormModalOpen(true);
          }}
          onRefresh={() => {
            loadAll();
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
};
