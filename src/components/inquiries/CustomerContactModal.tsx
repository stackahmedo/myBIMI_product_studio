import React, { useState } from 'react';
import {
  X,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  User,
  FileQuestion,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { InquiryCategory, CustomerInquiry } from '../../types/database';
import { inquiryService, SubmitInquiryInput } from '../../services/inquiryService';

interface CustomerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (inquiry: CustomerInquiry) => void;
}

export const CustomerContactModal: React.FC<CustomerContactModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<InquiryCategory>('WHOLESALE_ORDER');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Cloudflare Turnstile state
  const [turnstileVerified, setTurnstileVerified] = useState(true);
  const [simulateTurnstileBotFail, setSimulateTurnstileBotFail] = useState(false);

  // Resend failure simulation toggle (to test Diagram branch: "Record failure for retry; retain inquiry")
  const [simulateResendFailure, setSimulateResendFailure] = useState(false);

  // Submission UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedInquiry, setSubmittedInquiry] = useState<CustomerInquiry | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen) return null;

  const handleCopyReference = () => {
    if (!submittedInquiry?.reference_no) return;
    navigator.clipboard.writeText(submittedInquiry.reference_no);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setCategory('WHOLESALE_ORDER');
    setSubject('');
    setMessage('');
    setPrivacyConsent(false);
    setTurnstileVerified(true);
    setSimulateTurnstileBotFail(false);
    setSimulateResendFailure(false);
    setFieldErrors({});
    setSubmissionError(null);
    setSubmittedInquiry(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmissionError(null);
    setIsSubmitting(true);

    const turnstileToken = simulateTurnstileBotFail
      ? 'bot_fail_simulated'
      : `cf-turnstile-token-${Date.now().toString(36)}`;

    const payload: SubmitInquiryInput = {
      name,
      email,
      phone,
      company_name: companyName,
      category,
      subject,
      message,
      privacy_consent: privacyConsent,
      turnstile_token: turnstileToken,
      simulateResendFailure,
    };

    // Execute submission pipeline (Diagram 2)
    const result = await inquiryService.submitCustomerInquiry(payload);

    setIsSubmitting(false);

    if (!result.success) {
      if (result.errors) {
        // Diagram: "Show errors; preserve fields"
        setFieldErrors(result.errors);
      }
      if (result.error) {
        // Diagram: "Show submission error"
        setSubmissionError(result.error);
      }
      // Note: All inputs (name, email, message, etc.) remain in state (preserved fields!)
      return;
    }

    if (result.inquiry) {
      // Diagram: "Show reference to customer"
      setSubmittedInquiry(result.inquiry);
      if (onSuccess) {
        onSuccess(result.inquiry);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Mail className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">
                  Kurosaki Trading Co., Ltd.
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Public Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Official Wholesale & Trade Inquiries Pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submittedInquiry ? (
          /* STEP 6: Show reference to customer */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-in zoom-in-75">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                Inquiry Received Successfully!
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Thank you for contacting Kurosaki Trading. Your inquiry has been secured in our system and routed to our sales and operations directors.
              </p>
            </div>

            {/* Reference Ticket Card */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Customer Tracking Reference
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-mono font-bold text-indigo-900 tracking-wide">
                      {submittedInquiry.reference_no}
                    </span>
                    <button
                      onClick={handleCopyReference}
                      className="p-1.5 rounded-md hover:bg-white text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                      title="Copy Reference"
                    >
                      {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    STATUS: {submittedInquiry.status}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Turnstile Verified
                  </span>
                </div>
              </div>

              {/* Inquiry Details Summary */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Contact Name</span>
                  <p className="font-semibold text-slate-800">{submittedInquiry.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Email Address</span>
                  <p className="font-semibold text-slate-800">{submittedInquiry.email}</p>
                </div>
                {submittedInquiry.company_name && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">Company / Partner</span>
                    <p className="font-semibold text-slate-800">{submittedInquiry.company_name}</p>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 block">Topic / Category</span>
                  <p className="font-semibold text-slate-800">{submittedInquiry.category}</p>
                </div>
              </div>

              {/* Resend Status Notification Banner */}
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                  submittedInquiry.notification_status === 'SENT'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {submittedInquiry.notification_status === 'SENT' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Resend Email Dispatched</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Confirmation email sent to {submittedInquiry.email} and notification forwarded to Kurosaki Trading staff.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Resend Email Delivery Queued</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Inquiry safely retained in Supabase. Resend email dispatch experienced a temporary delay and is queued for automated background retry.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Submit Another Inquiry
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
              >
                Done & Return to Admin
              </button>
            </div>
          </div>
        ) : (
          /* STEP 1: Form Inputs & Submission */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Global submission error */}
            {submissionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submissionError}</span>
              </div>
            )}

            {/* Row 1: Contact Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kenji Saito"
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-1 transition-colors ${
                    fieldErrors.name
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-indigo-600'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Business Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kenji@company.co.jp"
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-1 transition-colors ${
                    fieldErrors.email
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-indigo-600'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            {/* Row 2: Company & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tokyo Supermarket Chain"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+81-3-0000-0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Row 3: Category & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                  Inquiry Topic *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InquiryCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="WHOLESALE_ORDER">Wholesale Order</option>
                  <option value="PRODUCT_CATALOG">Product Catalog / Spec</option>
                  <option value="TRADE_DOCUMENTS">Trade & Halal Docs</option>
                  <option value="PARTNERSHIP">Partnership & Freight</option>
                  <option value="GENERAL_SUPPORT">General Support</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Monthly Procurement for Shin-Koiwa Frozen Meat"
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-1 transition-colors ${
                    fieldErrors.subject
                      ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-slate-200 focus:ring-indigo-600'
                  }`}
                />
                {fieldErrors.subject && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.subject}</p>
                )}
              </div>
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Detailed Message *</label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {message.length} chars (min 10)
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide quantities, specifications, target delivery dates, or question details..."
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-900 focus:outline-none focus:ring-1 transition-colors ${
                  fieldErrors.message
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200 focus:ring-indigo-600'
                }`}
              />
              {fieldErrors.message && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.message}</p>
              )}
            </div>

            {/* Cloudflare Turnstile Bot Defense Box */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    simulateTurnstileBotFail
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 text-xs">Cloudflare Turnstile</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                        simulateTurnstileBotFail
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {simulateTurnstileBotFail ? 'SIMULATED BOT FAIL' : 'CHALLENGE PASSED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Invisible bot challenge verification before server-side API processing.
                  </p>
                </div>
              </div>

              {/* Bot Simulation Switch for testing */}
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={simulateTurnstileBotFail}
                  onChange={(e) => setSimulateTurnstileBotFail(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                />
                <span className="text-rose-700">Test Bot Rejection</span>
              </label>
            </div>
            {fieldErrors.turnstile && (
              <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.turnstile}</p>
            )}

            {/* Resend Failure Simulation Toggle (to test Diagram retry branch) */}
            <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px] font-semibold text-indigo-900">
                  Resend Notification Pipeline Test:
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={simulateResendFailure}
                  onChange={(e) => setSimulateResendFailure(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Simulate Resend Fail (Test Retry Queue)</span>
              </label>
            </div>

            {/* Mandatory Privacy Consent */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className={`mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 ${
                    fieldErrors.privacy_consent ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                <span className="text-slate-600 leading-tight">
                  I agree to the processing of my business inquiry details in accordance with the{' '}
                  <strong className="text-slate-800 underline">Kurosaki Trading Privacy Policy</strong> and consent to being contacted by sales staff. *
                </span>
              </label>
              {fieldErrors.privacy_consent && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {fieldErrors.privacy_consent}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
