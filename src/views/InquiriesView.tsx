import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Plus,
  ExternalLink,
  ShieldCheck,
  Mail,
  Building2,
  User,
  Phone,
  Send,
  Trash2,
  Copy,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Inbox,
  ArrowUpDown,
} from 'lucide-react';
import { CustomerInquiry, InquiryStatus, InquiryCategory } from '../types/database';
import { inquiryService } from '../services/inquiryService';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CustomerContactModal } from '../components/inquiries/CustomerContactModal';

export const InquiriesView: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const { role, profile } = useAuth();

  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Filters & Search
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | InquiryStatus | 'FAILED_NOTIFICATION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Drawer / Detail editing states
  const [drawerNotes, setDrawerNotes] = useState('');
  const [drawerStatus, setDrawerStatus] = useState<InquiryStatus>('NEW');
  const [isRetryingResend, setIsRetryingResend] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const loadData = () => {
    const list = inquiryService.getAllInquiries();
    setInquiries(list);

    // Sync selected inquiry if drawer is open
    if (selectedInquiry) {
      const refreshed = list.find((i) => i.id === selectedInquiry.id);
      if (refreshed) {
        setSelectedInquiry(refreshed);
        setDrawerNotes(refreshed.internal_notes || '');
        setDrawerStatus(refreshed.status);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener('bimi_data_updated', handleUpdate);
    return () => window.removeEventListener('bimi_data_updated', handleUpdate);
  }, []);

  const stats = useMemo(() => {
    return inquiryService.getStats();
  }, [inquiries]);

  // Filtered List
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      // Tab filter
      if (activeTabFilter === 'FAILED_NOTIFICATION') {
        if (inq.notification_status !== 'FAILED') return false;
      } else if (activeTabFilter !== 'ALL') {
        if (inq.status !== activeTabFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && inq.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = inq.reference_no.toLowerCase().includes(q);
        const matchesName = inq.name.toLowerCase().includes(q);
        const matchesEmail = inq.email.toLowerCase().includes(q);
        const matchesCompany = (inq.company_name || '').toLowerCase().includes(q);
        const matchesSubject = inq.subject.toLowerCase().includes(q);
        const matchesMessage = inq.message.toLowerCase().includes(q);
        if (!matchesRef && !matchesName && !matchesEmail && !matchesCompany && !matchesSubject && !matchesMessage) {
          return false;
        }
      }

      return true;
    });
  }, [inquiries, activeTabFilter, categoryFilter, searchQuery]);

  const handleOpenDetail = (inq: CustomerInquiry) => {
    setSelectedInquiry(inq);
    setDrawerNotes(inq.internal_notes || '');
    setDrawerStatus(inq.status);
  };

  const handleSaveDrawer = () => {
    if (!selectedInquiry) return;
    const res = inquiryService.updateInquiryStatus(
      selectedInquiry.id,
      drawerStatus,
      drawerNotes.trim(),
      profile?.id,
      profile?.name || profile?.username || 'Staff'
    );

    if (res.success && res.inquiry) {
      setSelectedInquiry(res.inquiry);
      loadData();
      triggerRefresh();
      addToast({
        type: 'success',
        title: 'Inquiry Updated',
        message: `Inquiry ${selectedInquiry.reference_no} status set to [${drawerStatus}].`,
      });
    }
  };

  const handleRetrySingleResend = async (inquiryId: string) => {
    setIsRetryingResend(true);
    const res = await inquiryService.retryNotification(inquiryId);
    setIsRetryingResend(false);
    loadData();
    triggerRefresh();

    addToast({
      type: res.success ? 'success' : 'error',
      title: res.success ? 'Resend Delivery Succeeded' : 'Retry Failed',
      message: res.message,
    });
  };

  const handleRetryAllFailed = async () => {
    const res = await inquiryService.retryAllFailedNotifications();
    loadData();
    triggerRefresh();
    addToast({
      type: 'info',
      title: 'Batch Notification Retry',
      message: `Retried ${res.retriedCount} pending notifications (${res.successCount} succeeded).`,
    });
  };

  const handleDelete = (inquiryId: string, refNo: string) => {
    if (window.confirm(`Permanently delete inquiry ${refNo}? This action cannot be undone.`)) {
      inquiryService.deleteInquiry(inquiryId);
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }
      loadData();
      triggerRefresh();
      addToast({
        type: 'info',
        title: 'Inquiry Deleted',
        message: `Record ${refNo} removed from database.`,
      });
    }
  };

  const handleCopyRef = (refNo: string) => {
    navigator.clipboard.writeText(refNo);
    setCopiedRef(refNo);
    setTimeout(() => setCopiedRef(null), 2000);
    addToast({
      type: 'info',
      title: 'Copied',
      message: `Reference ${refNo} copied to clipboard.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Inquiries & Customer Ingestion
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              Pipeline Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inbound requests from Public Website, verified via Cloudflare Turnstile and delivered via Resend.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {stats.failedNotificationCount > 0 && (
            <button
              onClick={handleRetryAllFailed}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>Retry {stats.failedNotificationCount} Failed Resend</span>
            </button>
          )}

          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Customer Form</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Inbound</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{stats.total}</p>
          <span className="text-[11px] text-slate-400">All recorded inquiries</span>
        </div>

        {/* NEW (Highlighted) */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-white p-4 rounded-xl border border-indigo-200 shadow-2xs relative overflow-hidden">
          {stats.newCount > 0 && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950">New Inquiries</span>
            <MessageSquareText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-900 mt-1 font-mono">{stats.newCount}</p>
          <span className="text-[11px] text-indigo-600/80 font-medium">Awaiting staff review</span>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In Progress</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{stats.inProgressCount}</p>
          <span className="text-[11px] text-blue-600 font-medium">Under active handling</span>
        </div>

        {/* Resend Retry Needed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Resend Retries</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.failedNotificationCount}
          </p>
          <span className="text-[11px] text-amber-700 font-medium">Queued for retry</span>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTabFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTabFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Inquiries ({stats.total})
          </button>
          <button
            onClick={() => setActiveTabFilter('NEW')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTabFilter === 'NEW'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>NEW</span>
            {stats.newCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white text-indigo-700">
                {stats.newCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTabFilter('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTabFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            In Progress ({stats.inProgressCount})
          </button>
          <button
            onClick={() => setActiveTabFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTabFilter === 'RESOLVED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolved ({stats.resolvedCount})
          </button>
          <button
            onClick={() => setActiveTabFilter('FAILED_NOTIFICATION')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              activeTabFilter === 'FAILED_NOTIFICATION'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Retries Needed ({stats.failedNotificationCount})</span>
          </button>
        </div>

        {/* Search & Topic Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Reference, Customer, Company, Email, Message keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Topic Categories</option>
              <option value="WHOLESALE_ORDER">Wholesale Order</option>
              <option value="PRODUCT_CATALOG">Product Catalog / Spec</option>
              <option value="TRADE_DOCUMENTS">Trade Documents</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="GENERAL_SUPPORT">General Support</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Reference No</th>
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Topic & Subject</th>
                <th className="py-3 px-3">Bot Check</th>
                <th className="py-3 px-3">Resend Status</th>
                <th className="py-3 px-3">Inquiry Status</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold text-slate-700">No matching inquiries found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Use "+ Simulate Customer Form" to submit a test inquiry through the live pipeline.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inq) => {
                  const isNew = inq.status === 'NEW';
                  return (
                    <tr
                      key={inq.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isNew ? 'bg-indigo-50/20 font-medium' : ''
                      }`}
                    >
                      {/* Reference No */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{inq.reference_no}</span>
                          <button
                            onClick={() => handleCopyRef(inq.reference_no)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copy Reference"
                          >
                            {copiedRef === inq.reference_no ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer & Company */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-semibold">{inq.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {inq.email}
                        </div>
                        {inq.company_name && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{inq.company_name}</span>
                          </div>
                        )}
                      </td>

                      {/* Topic & Subject */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {inq.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs truncate mt-0.5">
                          {inq.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                          {inq.message}
                        </p>
                      </td>

                      {/* Turnstile Bot Check */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          Passed
                        </span>
                      </td>

                      {/* Resend Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {inq.notification_status === 'SENT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Delivered
                          </span>
                        ) : inq.notification_status === 'FAILED' ? (
                          <button
                            onClick={() => handleRetrySingleResend(inq.id)}
                            disabled={isRetryingResend}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                            title="Click to retry sending via Resend"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Retry Resend</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            inq.status === 'NEW'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : inq.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : inq.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {inq.status === 'NEW' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          )}
                          {inq.status}
                        </span>
                      </td>

                      {/* Received Time */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                        {new Date(inq.created_at).toLocaleDateString()}{' '}
                        {new Date(inq.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetail(inq)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 hover:text-indigo-900 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Contact Ingestion Form Modal (Public Pipeline Simulation) */}
      <CustomerContactModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={() => {
          loadData();
          triggerRefresh();
        }}
      />

      {/* Admin Inquiry Detail Drawer */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in-50">
          <div className="bg-white max-w-xl w-full h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-wider block">
                  Inquiry Ticket Review
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="font-bold text-base font-mono tracking-tight text-white">
                    {selectedInquiry.reference_no}
                  </h3>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.2 rounded-full font-bold border ${
                      selectedInquiry.status === 'NEW'
                        ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40'
                        : selectedInquiry.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                        : 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                    }`}
                  >
                    {selectedInquiry.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Customer Info Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Customer & Organization Profile
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contact Name</span>
                    <p className="font-bold text-slate-800 text-sm">{selectedInquiry.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Email</span>
                    <a
                      href={`mailto:${selectedInquiry.email}?subject=RE: ${selectedInquiry.reference_no} - ${selectedInquiry.subject}`}
                      className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <span>{selectedInquiry.email}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {selectedInquiry.company_name && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Company / Partner</span>
                      <p className="font-semibold text-slate-800">{selectedInquiry.company_name}</p>
                    </div>
                  )}
                  {selectedInquiry.phone && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone</span>
                      <p className="font-semibold text-slate-800">{selectedInquiry.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inquiry Message Body */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Subject & Full Message
                </span>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                  <h4 className="font-bold text-sm text-slate-900">{selectedInquiry.subject}</h4>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-xs">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>

              {/* System Verification & Resend Pipeline Status */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Pipeline Auditing & Delivery Log
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cloudflare Turnstile</span>
                    <span className="text-emerald-700 font-bold inline-flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Passed & Token Validated
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Resend Email Gateway</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`font-bold inline-flex items-center gap-1 ${
                          selectedInquiry.notification_status === 'SENT'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {selectedInquiry.notification_status === 'SENT' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Dispatched ({selectedInquiry.notification_attempts} attempt)
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Failed ({selectedInquiry.notification_attempts} attempts)
                          </>
                        )}
                      </span>

                      {selectedInquiry.notification_status === 'FAILED' && (
                        <button
                          onClick={() => handleRetrySingleResend(selectedInquiry.id)}
                          disabled={isRetryingResend}
                          className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px] hover:bg-amber-300 transition-colors cursor-pointer"
                        >
                          Retry Resend
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {selectedInquiry.last_notification_error && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono">
                    {selectedInquiry.last_notification_error}
                  </div>
                )}
              </div>

              {/* Staff Management & Notes */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Internal Staff Handling & Status
                </span>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Update Workflow Status
                  </label>
                  <select
                    value={drawerStatus}
                    onChange={(e) => setDrawerStatus(e.target.value as InquiryStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="NEW">NEW (Unread / Needs Review)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Under Discussion)</option>
                    <option value="RESOLVED">RESOLVED (Replied / Quoted)</option>
                    <option value="ARCHIVED">ARCHIVED (Closed)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Internal Staff Notes (Private)
                  </label>
                  <textarea
                    rows={3}
                    value={drawerNotes}
                    onChange={(e) => setDrawerNotes(e.target.value)}
                    placeholder="Add quotation status, assignee follow-up notes, or customer phone records..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {(role === 'ADMIN' || profile?.username === 'tohriyo') && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedInquiry.id, selectedInquiry.reference_no)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                  title="Delete Inquiry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <a
                  href={`mailto:${selectedInquiry.email}?subject=RE: ${selectedInquiry.reference_no} - ${selectedInquiry.subject}`}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Reply via Email</span>
                </a>

                <button
                  type="button"
                  onClick={handleSaveDrawer}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
