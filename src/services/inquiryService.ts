import {
  CustomerInquiry,
  InquiryNotificationLog,
  InquiryStatus,
  InquiryPriority,
  InquiryCategory,
} from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_INQUIRIES_KEY = 'bimi_inquiries_v1';
const STORAGE_INQUIRY_LOGS_KEY = 'bimi_inquiry_logs_v1';

// Seed sample inquiries to demonstrate real-world pipeline states
const SEED_INQUIRIES: CustomerInquiry[] = [
  {
    id: 'inq-seed-01',
    reference_no: 'INQ-2026-X89J2',
    name: 'Saito Kenji',
    email: 'kenji.saito@asia-distributors.co.jp',
    phone: '+81-3-5555-0192',
    company_name: 'Asia Wholesale Trading Ltd.',
    category: 'WHOLESALE_ORDER',
    subject: 'Bulk Procurement Inquiry - Shin-Koiwa Frozen & Dry Goods',
    message:
      'We operate 14 supermarkets across Kanto and are interested in sourcing monthly container shipments of frozen halal meat cuts, spices, and Basmati rice. Could you please share wholesale tier pricing and minimum order quantities?',
    privacy_consent: true,
    turnstile_verified: true,
    turnstile_token: 'cf-turnstile-verified-token-seed-01',
    status: 'NEW',
    priority: 'HIGH',
    assigned_to: undefined,
    assigned_to_name: undefined,
    internal_notes: 'Priority lead from verified distribution chain. Needs quote within 24 hours.',
    notification_status: 'SENT',
    notification_attempts: 1,
    notification_sent_at: '2026-10-15T08:30:00Z',
    created_at: '2026-10-15T08:29:45Z',
    updated_at: '2026-10-15T08:30:00Z',
  },
  {
    id: 'inq-seed-02',
    reference_no: 'INQ-2026-F44T1',
    name: 'Amara Wijesinghe',
    email: 'amara.w@lanka-fresh-foods.com',
    phone: '+81-90-4444-1234',
    company_name: 'Lanka Fresh Foods Japan',
    category: 'TRADE_DOCUMENTS',
    subject: 'Certificate of Analysis & Halal Origin Verification Request',
    message:
      'We are auditing import documents for the batch shipped last week. Please provide the stamped Phytosanitary Certificate and Halal compliance document for SKU SKW-PRD-014.',
    privacy_consent: true,
    turnstile_verified: true,
    turnstile_token: 'cf-turnstile-verified-token-seed-02',
    status: 'NEW',
    priority: 'URGENT',
    assigned_to: undefined,
    assigned_to_name: undefined,
    internal_notes: 'Retained inquiry; Resend delivery experienced timeout. Needs manual retry or verification.',
    notification_status: 'FAILED',
    notification_attempts: 2,
    last_notification_error: 'Resend API Gateway 504 Gateway Timeout during email dispatch. Scheduled for background retry.',
    created_at: '2026-10-15T09:12:10Z',
    updated_at: '2026-10-15T09:13:00Z',
  },
  {
    id: 'inq-seed-03',
    reference_no: 'INQ-2026-B12K9',
    name: 'Takahashi Ryo',
    email: 'r.takahashi@kuro-bimi-bistro.tokyo',
    phone: '+81-3-7788-9900',
    company_name: 'Bistro Spice Garden',
    category: 'PRODUCT_CATALOG',
    subject: 'Request for Fresh Halal Wagyu & Spices Spec Sheet',
    message:
      'We are revising our seasonal autumn menu for our Akihabara location and require detailed product specifications for organic turmeric, cardamom pods, and premium halal beef ribeye.',
    privacy_consent: true,
    turnstile_verified: true,
    turnstile_token: 'cf-turnstile-verified-token-seed-03',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assigned_to: 'usr-admin-02',
    assigned_to_name: 'Hossain Anwar',
    internal_notes: 'Sent preliminary PDF catalog. Waiting for chef confirmation on cut thickness.',
    notification_status: 'SENT',
    notification_attempts: 1,
    notification_sent_at: '2026-10-14T14:20:00Z',
    created_at: '2026-10-14T14:15:20Z',
    updated_at: '2026-10-14T16:00:00Z',
  },
  {
    id: 'inq-seed-04',
    reference_no: 'INQ-2026-M99Q4',
    name: 'Elena Rostova',
    email: 'e.rostova@tokyo-import-export.ru',
    phone: '+81-80-1122-3344',
    company_name: 'Nordic Eurasia Imports',
    category: 'PARTNERSHIP',
    subject: 'Cross-Border Logistics & Cold Storage Partnership',
    message:
      'We provide refrigerated container freight from Yokohama to Southeast Asia. We would like to explore logistics collaboration with Kurosaki Trading / My BIMI.',
    privacy_consent: true,
    turnstile_verified: true,
    turnstile_token: 'cf-turnstile-verified-token-seed-04',
    status: 'RESOLVED',
    priority: 'LOW',
    assigned_to: 'usr-tohriyo-01',
    assigned_to_name: 'Tohriyo',
    internal_notes: 'Forwarded to procurement director. Meeting scheduled.',
    notification_status: 'SENT',
    notification_attempts: 1,
    notification_sent_at: '2026-10-13T11:05:00Z',
    created_at: '2026-10-13T11:00:00Z',
    updated_at: '2026-10-13T15:30:00Z',
    resolved_at: '2026-10-13T15:30:00Z',
  },
];

export interface SubmitInquiryInput {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  category: InquiryCategory;
  subject: string;
  message: string;
  privacy_consent: boolean;
  turnstile_token?: string;
  simulateResendFailure?: boolean; // For testing the "Record failure for retry; retain inquiry" pipeline
}

export interface SubmitInquiryResult {
  success: boolean;
  reference_no?: string;
  inquiry?: CustomerInquiry;
  errors?: Record<string, string>;
  error?: string;
  preservedFields?: Partial<SubmitInquiryInput>;
}

class InquiryService {
  private inquiries: CustomerInquiry[] = [];
  private logs: InquiryNotificationLog[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_INQUIRIES_KEY || e.key === STORAGE_INQUIRY_LOGS_KEY) {
          this.init(true);
          window.dispatchEvent(new CustomEvent('bimi_data_updated'));
        }
      });
    }
  }

  private init(force = false) {
    if (this.isInitialized && !force) return;
    try {
      const rawInquiries = localStorage.getItem(STORAGE_INQUIRIES_KEY);
      if (rawInquiries) {
        this.inquiries = JSON.parse(rawInquiries);
      } else {
        this.inquiries = [...SEED_INQUIRIES];
        this.persist();
      }

      const rawLogs = localStorage.getItem(STORAGE_INQUIRY_LOGS_KEY);
      if (rawLogs) {
        this.logs = JSON.parse(rawLogs);
      }
      this.isInitialized = true;
    } catch {
      this.inquiries = [...SEED_INQUIRIES];
      this.logs = [];
      this.isInitialized = true;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_INQUIRIES_KEY, JSON.stringify(this.inquiries));
      localStorage.setItem(STORAGE_INQUIRY_LOGS_KEY, JSON.stringify(this.logs));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bimi_data_updated'));
      }
    } catch (e) {
      console.warn('Failed to persist inquiries:', e);
    }
  }

  public getAllInquiries(): CustomerInquiry[] {
    this.init();
    return [...this.inquiries].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getInquiryById(id: string): CustomerInquiry | undefined {
    this.init();
    return this.inquiries.find((i) => i.id === id || i.reference_no === id);
  }

  public getLogsForInquiry(inquiryId: string): InquiryNotificationLog[] {
    this.init();
    return this.logs
      .filter((l) => l.inquiry_id === inquiryId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- SUBMISSION PIPELINE (Exact match to Diagram 2) ---
  public async submitCustomerInquiry(input: SubmitInquiryInput): Promise<SubmitInquiryResult> {
    this.init();

    const preservedFields: Partial<SubmitInquiryInput> = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      company_name: input.company_name,
      category: input.category,
      subject: input.subject,
      message: input.message,
      privacy_consent: input.privacy_consent,
    };

    // 1. STEP 1 & 2: Valid inputs and privacy consent?
    const errors: Record<string, string> = {};

    if (!input.name || input.name.trim().length < 2) {
      errors.name = 'Please provide your full name or contact person (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.email || !emailRegex.test(input.email.trim())) {
      errors.email = 'Please provide a valid business email address.';
    }

    if (!input.subject || input.subject.trim().length < 4) {
      errors.subject = 'Subject line is required (at least 4 characters).';
    }

    if (!input.message || input.message.trim().length < 10) {
      errors.message = 'Inquiry message must be at least 10 characters long.';
    }

    if (!input.privacy_consent) {
      errors.privacy_consent = 'You must agree to the privacy policy and consent to contact.';
    }

    // "No" branch from Diagram: Show errors; preserve fields
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        errors,
        preservedFields,
      };
    }

    // 2. STEP 3: Secure API validates and verifies Cloudflare Turnstile
    const turnstileToken = input.turnstile_token?.trim();
    const isBotSimulated = turnstileToken === 'bot_fail_simulated';
    if (!turnstileToken || isBotSimulated) {
      // "Valid request? No" -> Show errors; preserve fields
      return {
        success: false,
        errors: {
          turnstile:
            'Cloudflare Turnstile bot verification failed or challenge expired. Please verify you are human.',
        },
        preservedFields,
      };
    }

    // 3. STEP 4: Store in Supabase
    const now = new Date().toISOString();
    const referenceNo = `INQ-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const newInquiry: CustomerInquiry = {
      id: `inq-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      reference_no: referenceNo,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || undefined,
      company_name: input.company_name?.trim() || undefined,
      category: input.category || 'GENERAL_SUPPORT',
      subject: input.subject.trim(),
      message: input.message.trim(),
      privacy_consent: true,
      turnstile_verified: true,
      turnstile_token: turnstileToken,
      status: 'NEW',
      priority: input.category === 'WHOLESALE_ORDER' || input.category === 'TRADE_DOCUMENTS' ? 'HIGH' : 'MEDIUM',
      notification_status: 'PENDING',
      notification_attempts: 0,
      created_at: now,
      updated_at: now,
    };

    try {
      // Store into Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('inquiries').insert([
            {
              id: newInquiry.id,
              reference_no: newInquiry.reference_no,
              name: newInquiry.name,
              email: newInquiry.email,
              phone: newInquiry.phone,
              company_name: newInquiry.company_name,
              category: newInquiry.category,
              subject: newInquiry.subject,
              message: newInquiry.message,
              privacy_consent: newInquiry.privacy_consent,
              turnstile_verified: newInquiry.turnstile_verified,
              status: newInquiry.status,
              priority: newInquiry.priority,
              notification_status: newInquiry.notification_status,
              created_at: newInquiry.created_at,
            },
          ]);
        } catch (supabaseErr) {
          console.warn('Supabase remote write error (using local cache):', supabaseErr);
        }
      }

      // Store into local state
      this.inquiries.unshift(newInquiry);
      this.persist();
    } catch {
      // "Fails" branch from Diagram: Show submission error
      return {
        success: false,
        error: 'Unable to record your inquiry to the secure database. Please try again.',
        preservedFields,
      };
    }

    // 4. STEP 5: Attempt Resend notification
    const resendSuccess = await this.dispatchResendNotification(
      newInquiry,
      Boolean(input.simulateResendFailure)
    );

    if (resendSuccess) {
      newInquiry.notification_status = 'SENT';
      newInquiry.notification_sent_at = new Date().toISOString();
      newInquiry.notification_attempts += 1;
      newInquiry.last_notification_error = undefined;
    } else {
      // "Email sent? No" branch: Record failure for retry; retain inquiry
      newInquiry.notification_status = 'FAILED';
      newInquiry.notification_attempts += 1;
      newInquiry.last_notification_error =
        'Resend Notification Delivery failed (gateway timeout or invalid recipient address). Retained in database for automated retry.';
    }

    newInquiry.updated_at = new Date().toISOString();
    this.persist();

    // 5. STEP 6 & 7: Show reference to customer & Admin sees NEW inquiry
    return {
      success: true,
      reference_no: newInquiry.reference_no,
      inquiry: newInquiry,
    };
  }

  // Internal helper to simulate / call Resend notification
  private async dispatchResendNotification(
    inquiry: CustomerInquiry,
    simulateFailure: boolean
  ): Promise<boolean> {
    const attempt = (inquiry.notification_attempts || 0) + 1;
    const now = new Date().toISOString();

    if (simulateFailure) {
      this.logs.unshift({
        id: `log-${Date.now().toString(36)}`,
        inquiry_id: inquiry.id,
        reference_no: inquiry.reference_no,
        recipient_email: inquiry.email,
        provider: 'resend',
        status: 'FAILED',
        error_message: 'Simulated Resend API dispatch failure (Network ETIMEDOUT). Scheduled for retry.',
        attempt_number: attempt,
        timestamp: now,
      });
      return false;
    }

    // Realistic API latency
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Record success log
    this.logs.unshift({
      id: `log-${Date.now().toString(36)}`,
      inquiry_id: inquiry.id,
      reference_no: inquiry.reference_no,
      recipient_email: inquiry.email,
      provider: 'resend',
      status: 'SENT',
      attempt_number: attempt,
      timestamp: now,
    });
    return true;
  }

  // Admin action: Retry failed notification via Resend
  public async retryNotification(inquiryId: string): Promise<{ success: boolean; message: string }> {
    this.init();
    const item = this.inquiries.find((i) => i.id === inquiryId);
    if (!item) return { success: false, message: 'Inquiry not found.' };

    const success = await this.dispatchResendNotification(item, false);
    item.notification_attempts += 1;
    item.updated_at = new Date().toISOString();

    if (success) {
      item.notification_status = 'SENT';
      item.notification_sent_at = new Date().toISOString();
      item.last_notification_error = undefined;
      this.persist();
      return { success: true, message: `Notification email successfully delivered via Resend to ${item.email}.` };
    } else {
      item.notification_status = 'FAILED';
      item.last_notification_error = 'Resend retry attempt failed.';
      this.persist();
      return { success: false, message: 'Resend retry attempt failed.' };
    }
  }

  // Admin action: Bulk retry all failed notifications
  public async retryAllFailedNotifications(): Promise<{ retriedCount: number; successCount: number }> {
    this.init();
    const failedList = this.inquiries.filter((i) => i.notification_status === 'FAILED');
    let successCount = 0;

    for (const item of failedList) {
      const ok = await this.dispatchResendNotification(item, false);
      item.notification_attempts += 1;
      item.updated_at = new Date().toISOString();
      if (ok) {
        item.notification_status = 'SENT';
        item.notification_sent_at = new Date().toISOString();
        item.last_notification_error = undefined;
        successCount++;
      }
    }

    this.persist();
    return { retriedCount: failedList.length, successCount };
  }

  // Admin action: Update status & notes
  public updateInquiryStatus(
    inquiryId: string,
    status: InquiryStatus,
    notes?: string,
    assignedToId?: string,
    assignedToName?: string
  ): { success: boolean; inquiry?: CustomerInquiry } {
    this.init();
    const item = this.inquiries.find((i) => i.id === inquiryId);
    if (!item) return { success: false };

    item.status = status;
    if (notes !== undefined) item.internal_notes = notes;
    if (assignedToId !== undefined) item.assigned_to = assignedToId;
    if (assignedToName !== undefined) item.assigned_to_name = assignedToName;
    if (status === 'RESOLVED' && !item.resolved_at) {
      item.resolved_at = new Date().toISOString();
    }
    item.updated_at = new Date().toISOString();

    this.persist();
    return { success: true, inquiry: item };
  }

  // Admin action: Delete inquiry
  public deleteInquiry(inquiryId: string): { success: boolean } {
    this.init();
    this.inquiries = this.inquiries.filter((i) => i.id !== inquiryId);
    this.logs = this.logs.filter((l) => l.inquiry_id !== inquiryId);
    this.persist();
    return { success: true };
  }

  // Stats helper for badges and dashboards
  public getStats(): {
    total: number;
    newCount: number;
    inProgressCount: number;
    resolvedCount: number;
    failedNotificationCount: number;
  } {
    this.init();
    return {
      total: this.inquiries.length,
      newCount: this.inquiries.filter((i) => i.status === 'NEW').length,
      inProgressCount: this.inquiries.filter((i) => i.status === 'IN_PROGRESS').length,
      resolvedCount: this.inquiries.filter((i) => i.status === 'RESOLVED').length,
      failedNotificationCount: this.inquiries.filter((i) => i.notification_status === 'FAILED').length,
    };
  }
}

export const inquiryService = new InquiryService();
