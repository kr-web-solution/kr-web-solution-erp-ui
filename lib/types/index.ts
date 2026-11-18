export type UserRole = 'admin' | 'founder_ceo' | 'worker' | 'client' | 'lead';
export type PartyType = 'staff' | 'client' | 'lead';

export interface RoleBrief {
  id: string;
  code: string;
  name: string;
  party_type: PartyType;
  description?: string | null;
}

export interface ClientPartyBrief {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface LeadPartyBrief {
  id: string;
  name: string;
  company: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  role_id: string;
  party_type: PartyType;
  client_id?: string | null;
  lead_id?: string | null;
  is_active: boolean;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  created_at: string;
  role_info?: RoleBrief | null;
  client?: ClientPartyBrief | null;
  lead?: LeadPartyBrief | null;
  password_set?: boolean;
  profile_completed?: boolean;
  missing_profile_fields?: string[];
}

export interface Client {
  id: string;
  name: string;
  primary_contact_name?: string | null;
  designation?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  notes?: string | null;
  projects_count?: number;
  invoices_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientFormValues {
  name: string;
  primary_contact_name: string;
  designation: string;
  contact_email: string;
  contact_phone: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  notes: string;
}

export const emptyClientForm = (): ClientFormValues => ({
  name: '',
  primary_contact_name: '',
  designation: '',
  contact_email: '',
  contact_phone: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstin: '',
  notes: '',
});

export type LeadStatus = 'new' | 'contacted' | 'proposal' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: LeadStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'lead' | 'running' | 'on_hold' | 'stopped' | 'completed';

export interface MaintenanceConfig {
  amount_paise: number;
  send_day: number;
  due_after_days?: number;
  reminder_every_days?: number;
  starts_on?: string;
  ends_on?: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  client_name?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_paise?: number | null; // Null for worker role
  development_days?: number | null;
  advance_paise?: number | null;
  balance_paise?: number | null;
  invoiced_paise?: number | null; // Project invoices subtots (ex-GST)
  remaining_paise?: number | null; // budget - invoiced
  advance_invoice_id?: string | null;
  balance_invoice_id?: string | null;
  go_live_at?: string | null;
  status: ProjectStatus;
  delivery_phase?: number;
  delivery_phase_name?: string | null;
  engagement_id?: string | null;
  workers: User[];
  maintenance_status?: 'active' | 'paused' | 'none';
  maintenance_amount_paise?: number;
  maintenance_send_day?: number;
  maintenance_due_after_days?: number;
  maintenance_next_run_date?: string;
  maintenance_prorata_invoice_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectChecklistItem {
  id: string;
  project_id: string;
  stage_number: number;
  item_key: string;
  label: string;
  sort_order: number;
  is_done: boolean;
  done_at?: string | null;
  done_by?: string | null;
}

export interface ProjectDeliveryDetail extends Project {
  checklist_items: ProjectChecklistItem[];
  checklist_progress_percent: number;
}

export type ProjectFeatureStatus =
  | 'requested'
  | 'approved'
  | 'in_progress'
  | 'done'
  | 'rejected';

export type ProjectDocKind = 'quotation' | 'agreement' | 'other';

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  doc_kind: ProjectDocKind | string;
  uploaded_by?: string | null;
  created_at: string;
}

export interface ProjectFeatureDoc {
  id: string;
  feature_id: string;
  title: string;
  body_or_url: string;
  doc_type: 'note' | 'link' | 'spec' | string;
  created_by?: string | null;
  created_at: string;
}

export interface ProjectFeature {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: ProjectFeatureStatus | string;
  quoted_paise?: number | null;
  created_at: string;
  updated_at: string;
  docs: ProjectFeatureDoc[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'void';
export type InvoiceType =
  | 'project'
  | 'maintenance'
  | 'late_fee'
  | 'credit_note'
  | 'custom_dev'
  | 'amc'
  | 'advance'
  | 'balance'
  | 'hosting'
  | 'services'
  | 'licensing';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_rate_paise: number;
  amount_paise?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  client_id: string;
  client_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal_paise: number;
  tax_rate_percent: number;
  tax_paise: number;
  total_paise: number;
  notes?: string | null;
  upi_id_override?: string | null;
  upi_qr_url?: string | null;
  period_months?: number;
  covers_from?: string | null;
  covers_to?: string | null;
  monthly_rate_paise?: number | null;
  paid_at?: string | null;
  period_key?: string | null;
  parent_invoice_id?: string | null;
  reminder_count?: number;
  last_reminder_at?: string | null;
  overdue_notified_at?: string | null;
  email_status?: 'pending' | 'sent' | 'failed';
  email_error?: string | null;
  email_retry_count?: number;
  last_emailed_at?: string | null;
  created_at: string;
  items: InvoiceItem[];
  payment_upi_id?: string | null;
  payment_upi_qr_url?: string | null;
  payment_bank_beneficiary_name?: string | null;
  payment_bank_name?: string | null;
  payment_bank_account_number?: string | null;
  payment_bank_ifsc?: string | null;
  payment_bank_upi_details?: string | null;
  gst_enabled?: boolean;
}

export interface RecurringInvoice {
  id: string;
  client_id: string;
  client_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  amount_paise: number;
  send_day: number;
  due_after_days: number;
  reminder_every_days: number;
  starts_on: string;
  ends_on?: string | null;
  line_items_template: InvoiceItem[];
  tax_rate_percent: number;
  day_of_month: number;
  next_run_date: string;
  active: boolean;
  notes?: string | null;
  created_at: string;
}

export interface LateFeeAction {
  id: string;
  invoice_id: string;
  invoice_number?: string | null;
  client_name?: string | null;
  fee_paise: number;
  fee_type: 'fixed' | 'percent';
  fee_value: number;
  reason: string;
  send_on: string;
  repeat_every_days?: number | null;
  reminder_every_hours?: number | null;
  next_reminder_at?: string | null;
  repeat_count: number;
  status: 'pending' | 'scheduled' | 'sent' | 'waived' | 'extended';
  decided_by?: string | null;
  decided_at?: string | null;
  late_fee_invoice_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LateFeeDecisionRequest {
  action: 'send_now' | 'schedule' | 'waive' | 'extend';
  fee_type: 'fixed' | 'percent';
  fee_value: number;
  reason: string;
  send_on?: string;
  repeat_every_days?: number;
  extend_days?: number;
  reminder_every_hours?: number;
}

export interface Note {
  id: string;
  entity_type: 'client' | 'lead';
  entity_id: string;
  author_id?: string | null;
  author_name?: string | null;
  body: string;
  created_at: string;
}

export interface CompanySettings {
  company_name: string;
  company_address?: string | null;
  company_gstin?: string | null;
  company_logo_url?: string | null;
  invoice_prefix: string;
  invoice_next_number: number;
  invoice_sequences?: Record<string, number>;
  invoice_prefix_scheme?: Array<{
    service: string;
    code: string;
    prefix: string;
    example: string;
  }>;
  default_tax_rate: number;
  gst_enabled?: boolean;
  pf_enabled?: boolean;
  pf_employee_percent?: number;
  esi_enabled?: boolean;
  esi_employee_percent?: number;
  pt_enabled?: boolean;
  pt_paise?: number;
  payment_terms?: string | null;
  bank_beneficiary_name?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_upi_id?: string | null;
  bank_upi_details?: string | null;
  bank_upi_qr_url?: string | null;
  smtp_host?: string | null;
  smtp_port: number;
  smtp_username?: string | null;
  smtp_has_password?: boolean;
  smtp_use_tls: boolean;
  smtp_from_name?: string | null;
  smtp_from_email?: string | null;
  invoice_cc_email?: string | null;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'project' | 'lead' | 'invoice';
  title: string;
  subtitle?: string | null;
  status: string;
  date: string;
}

export interface RevenueMonthPoint {
  month: string;
  year_month: string;
  billed_paise: number;
  collected_paise: number;
}

export interface DashboardSummary {
  running_projects_count: number;
  open_leads_count: number;
  unpaid_invoices_total_paise: number;
  overdue_invoices_count: number;
  failed_email_invoices_count?: number;
  recent_items: RecentActivityItem[];
  needs_action_invoices?: LateFeeAction[];
  revenue_by_month?: RevenueMonthPoint[];
}

export type EngagementKind = 'project' | 'amc_only';
export type EngagementStatus = 'active' | 'on_hold' | 'lost' | 'maintenance' | 'completed';
export type EnquirySource =
  | 'instagram_ads'
  | 'cold_call'
  | 'website'
  | 'whatsapp'
  | 'referral'
  | 'email';
export type LostReason = 'price' | 'timing' | 'competitor' | 'no_response' | 'other';

export interface EngagementChecklistItem {
  id: string;
  engagement_id: string;
  stage_number: number;
  item_key: string;
  label: string;
  sort_order: number;
  is_done: boolean;
  done_at?: string | null;
  done_by?: string | null;
}

export type EngagementDocKind = 'enquiry' | 'brief' | 'quote' | 'other';

export interface EngagementDocument {
  id: string;
  engagement_id: string;
  title: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  doc_kind: EngagementDocKind | string;
  uploaded_by?: string | null;
  created_at: string;
}

export interface EngagementListItem {
  id: string;
  title: string;
  company_name: string;
  contact_name: string;
  enquiry_source?: string | null;
  engagement_kind: EngagementKind;
  current_stage: number;
  stage_name?: string | null;
  client_stage_label?: string | null;
  status: EngagementStatus;
  estimated_budget_paise?: number | null;
  quoted_paise?: number | null;
  advance_paise?: number | null;
  pipeline_value_paise?: number | null;
  client_id?: string | null;
  client_name?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  warranty_ends_on?: string | null;
  amc_active: boolean;
  checklist_progress_percent: number;
  document_count?: number;
  created_at: string;
  updated_at: string;
}

export interface EngagementDetail extends EngagementListItem {
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  notes?: string | null;
  lost_reason?: string | null;
  lost_note?: string | null;
  advance_invoice_id?: string | null;
  final_invoice_id?: string | null;
  recurring_invoice_id?: string | null;
  owner_user_id?: string | null;
  owner_name?: string | null;
  client_message?: string | null;
  checklist_items: EngagementChecklistItem[];
  documents?: EngagementDocument[];
  recurring?: RecurringInvoice | null;
  recent_maintenance_invoices?: Invoice[];
}

export interface PipelineStageCount {
  stage: number;
  name: string;
  count: number;
}

export interface PipelineSummary {
  stages: PipelineStageCount[];
  open_value_paise: number;
  lost_this_month: number;
  maintenance_active: number;
}

export interface PipelineStageDef {
  number: number;
  key: string;
  name: string;
  client_label: string;
  client_message: string;
}

/* ----------------- Staff / Worker management ----------------- */

export interface LeaveBalance {
  casual_allowance: number;
  casual_used: number;
  casual_remaining: number;
  sick_allowance: number;
  sick_used: number;
  sick_remaining: number;
  unpaid_used: number;
  casual_allowance_hours?: number;
  casual_used_hours?: number;
  casual_remaining_hours?: number;
  sick_allowance_hours?: number;
  sick_used_hours?: number;
  sick_remaining_hours?: number;
  unpaid_used_hours?: number;
}

export interface PayslipPreview {
  user_id: string;
  month_key: string;
  monthly_gross_paise: number;
  hourly_rate_paise: number;
  hours_per_month: number;
  unpaid_hours: number;
  unpaid_deduction_paise: number;
}

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole | string;
  is_active: boolean;
  department?: string | null;
  job_title?: string | null;
  reports_to_user_id?: string | null;
  reports_to_name?: string | null;
  joined_on?: string | null;
  phone?: string | null;
  address?: string | null;
  bank_account?: string | null;
  bank_ifsc?: string | null;
  pending_bank_account?: string | null;
  pending_bank_ifsc?: string | null;
  monthly_gross_paise?: number | null;
  hourly_rate_paise?: number | null;
  casual_leave_days: number;
  sick_leave_days: number;
  leave_balance?: LeaveBalance | null;
  created_at?: string | null;
}

export interface WorkTask {
  id: string;
  work_date: string;
  title: string;
  project_id?: string | null;
  project_name?: string | null;
  assignee_user_id: string;
  assignee_name?: string | null;
  created_by_user_id?: string | null;
  status: 'todo' | 'doing' | 'done' | string;
  created_at: string;
}

export interface AttendanceDay {
  id: string;
  user_id: string;
  user_name?: string | null;
  work_date: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  correction_reason?: string | null;
  correction_note?: string | null;
  correction_status?: string | null;
}

export interface CompanyHoliday {
  id: string;
  holiday_date: string;
  name: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name?: string | null;
  leave_type: 'casual' | 'sick' | 'unpaid' | string;
  start_date: string;
  end_date: string;
  half_day: boolean;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  decided_by_user_id?: string | null;
  decided_at?: string | null;
  created_at: string;
}

export interface ExpenseClaim {
  id: string;
  user_id: string;
  user_name?: string | null;
  expense_date: string;
  category: 'travel' | 'food' | 'other' | string;
  amount_paise: number;
  note?: string | null;
  receipt_object_key?: string | null;
  receipt_original_filename?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | string;
  decided_by_user_id?: string | null;
  decided_at?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface StaffDocument {
  id: string;
  user_id: string;
  title: string;
  kind: 'offer' | 'id' | 'other' | string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by?: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  created_by_user_id?: string | null;
  created_by_name?: string | null;
  created_at: string;
}

export interface Payslip {
  id: string;
  user_id: string;
  user_name?: string | null;
  month_key: string;
  gross_paise: number;
  deductions_paise: number;
  net_paise: number;
  note?: string | null;
  created_at: string;
}

export interface StaffHome {
  profile: StaffProfile;
  today_tasks: WorkTask[];
  today_attendance?: AttendanceDay | null;
  projects: { id: string; name: string; status: string }[];
  leave_balance: LeaveBalance;
  open_expenses: ExpenseClaim[];
  latest_announcement?: Announcement | null;
  latest_payslip?: Payslip | null;
}

export interface StaffInbox {
  pending_leave: LeaveRequest[];
  pending_corrections: AttendanceDay[];
  pending_expenses: ExpenseClaim[];
  pending_bank_changes: StaffProfile[];
}

export type CompanyExpenseSection = 'recurring' | 'daily' | 'upgrade' | 'other';

export interface CompanyExpense {
  id: string;
  expense_date: string;
  section: CompanyExpenseSection | string;
  category: string;
  title: string;
  vendor?: string | null;
  amount_paise: number;
  note?: string | null;
  receipt_object_key?: string | null;
  receipt_original_filename?: string | null;
  renewal_interval_months?: number | null;
  next_renewal_on?: string | null;
  due_status?: 'overdue' | 'due_soon' | 'upcoming' | string | null;
  created_by_user_id?: string | null;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyExpenseSectionTotal {
  section: CompanyExpenseSection | string;
  total_paise: number;
}

export interface CompanyExpenseList {
  items: CompanyExpense[];
  section_totals: CompanyExpenseSectionTotal[];
  month_total_paise: number;
  largest?: CompanyExpense | null;
  upcoming_renewals: CompanyExpense[];
}
