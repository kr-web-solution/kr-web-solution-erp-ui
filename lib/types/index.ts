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
  is_active?: boolean;
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
  pan?: string | null;
  state_code?: string | null;
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
  pan: string;
  state_code: string;
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
  pan: '',
  state_code: '',
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

export interface ProjectClientBrief {
  id: string;
  name: string;
  is_primary?: boolean;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  client_name?: string | null;
  client_ids?: string[];
  clients?: ProjectClientBrief[];
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
  status_reason?: string | null;
  reopened_at?: string | null;
  reopened_by?: string | null;
  development_completed_at?: string | null;
  development_completed_by?: string | null;
  client_accepted_at?: string | null;
  client_accepted_by?: string | null;
  project_closed_at?: string | null;
  project_closed_by?: string | null;
  closed_reason?: string | null;
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

export interface ProjectPhaseNote {
  stage_number: number;
  body?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

export interface ProjectDeliveryDetail extends Project {
  checklist_items: ProjectChecklistItem[];
  checklist_progress_percent: number;
  phase_notes?: ProjectPhaseNote[];
}

export type ProjectFeatureStatus =
  | 'submitted'
  | 'under_review'
  | 'estimation_pending'
  | 'quotation_sent'
  | 'awaiting_approval'
  | 'revision_requested'
  | 'approved'
  | 'in_development'
  | 'testing'
  | 'delivered'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  // legacy aliases (pre-migration)
  | 'requested'
  | 'in_progress'
  | 'done';

export type ProjectFeatureRequestType =
  | 'new_feature'
  | 'feature_enhancement'
  | 'existing_feature_modification'
  | 'third_party_integration'
  | 'scope_extension'
  | 'bug_fix'
  | 'change_request'
  | 'enhancement';

export type ProjectFeaturePriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectDocKind = 'quotation' | 'agreement' | 'other';

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
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
  doc_type: 'note' | 'link' | 'spec' | 'attachment' | string;
  original_filename?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  created_by?: string | null;
  created_at: string;
}

export interface ProjectFeature {
  id: string;
  project_id: string;
  cr_number?: string | null;
  title: string;
  description?: string | null;
  business_purpose?: string | null;
  request_type?: ProjectFeatureRequestType | string;
  expected_functionality?: string | null;
  priority?: ProjectFeaturePriority | string;
  expected_date?: string | null;
  acceptance_criteria?: string | null;
  status: ProjectFeatureStatus | string;
  quoted_paise?: number | null;
  is_billable?: boolean;
  submitted_by?: string | null;
  project_name?: string | null;
  client_name?: string | null;
  created_at: string;
  updated_at: string;
  docs: ProjectFeatureDoc[];
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'proof_pending'
  | 'cancelled'
  | 'void';
export type InvoiceType =
  | 'project'
  | 'maintenance'
  | 'late_fee'
  | 'credit_note'
  | 'debit_note'
  | 'custom_dev'
  | 'amc'
  | 'advance'
  | 'balance'
  | 'hosting'
  | 'services'
  | 'licensing'
  | 'mixed';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_rate_paise: number;
  amount_paise?: number;
  line_kind?: string | null;
  hsn_sac?: string | null;
  unit?: string | null;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount_paise: number;
  method?: string | null;
  reference?: string | null;
  paid_at?: string | null;
  note?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  ledger?: string | null;
  client_id: string;
  client_name?: string | null;
  client_attn?: string | null;
  client_designation?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  client_city?: string | null;
  client_state?: string | null;
  client_pincode?: string | null;
  client_gstin?: string | null;
  client_pan?: string | null;
  client_state_code?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  project_ref?: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal_paise: number;
  tax_rate_percent: number;
  tax_paise: number;
  total_paise: number;
  place_of_supply?: string | null;
  supply_type?: string | null;
  cgst_paise?: number;
  sgst_paise?: number;
  igst_paise?: number;
  discount_paise?: number;
  round_off_paise?: number;
  amount_paid_paise?: number;
  balance_due_paise?: number;
  po_number?: string | null;
  amount_in_words?: string | null;
  notes?: string | null;
  resolved_terms?: string[];
  payments?: InvoicePayment[];
  upi_id_override?: string | null;
  upi_qr_url?: string | null;
  period_months?: number;
  covers_from?: string | null;
  covers_to?: string | null;
  monthly_rate_paise?: number | null;
  paid_at?: string | null;
  period_key?: string | null;
  parent_invoice_id?: string | null;
  parent_invoice_number?: string | null;
  reminder_count?: number;
  last_reminder_at?: string | null;
  overdue_notified_at?: string | null;
  email_status?: 'pending' | 'sent' | 'failed';
  email_error?: string | null;
  email_retry_count?: number;
  last_emailed_at?: string | null;
  payment_proof_filename?: string | null;
  payment_proof_content_type?: string | null;
  payment_proof_uploaded_at?: string | null;
  payment_proof_note?: string | null;
  has_payment_proof?: boolean;
  payment_verified_at?: string | null;
  created_at: string;
  items: InvoiceItem[];
  payment_upi_id?: string | null;
  payment_upi_qr_url?: string | null;
  payment_bank_beneficiary_name?: string | null;
  payment_bank_name?: string | null;
  payment_bank_account_number?: string | null;
  payment_bank_ifsc?: string | null;
  payment_paypal_id?: string | null;
  payment_bank_upi_details?: string | null;
  payment_bank_wire_instructions?: string | null;
  payment_wire_lines?: string[];
  gst_enabled?: boolean;
  /** null = follow Settings; true/false = per-invoice override */
  gst_enabled_override?: boolean | null;
  /** Unpaid + latest in series + no children — GST series switch allowed */
  can_change_gst?: boolean;
  /** Lowest free number if GST were toggled to the opposite series */
  gst_toggle_preview_number?: string | null;
  /** Unpaid + tip of number series — delete allowed */
  can_delete?: boolean;
  company_name?: string | null;
  company_address?: string | null;
  company_gstin?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_website?: string | null;
  company_tagline?: string | null;
  company_logo_url?: string | null;
  company_pan?: string | null;
  company_state?: string | null;
  company_state_code?: string | null;
  gst_unregistered?: boolean;
  default_sac_code?: string | null;
  payment_terms?: string | null;
  /** True only when paid/cancelled/void — identity frozen at that time. */
  document_locked?: boolean;
  snapshot_frozen_at?: string | null;
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

export interface AuditLogEntry {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  actor_name?: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_fields: string[];
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string | null;
  created_at: string;
}

export interface GstRegistration {
  id: string;
  gstin: string;
  legal_name?: string | null;
  address?: string | null;
  state?: string | null;
  state_code: string;
  effective_from: string;
  effective_to?: string | null;
  is_primary: boolean;
  is_active: boolean;
}

export interface CompanySettings {
  company_name: string;
  company_address?: string | null;
  company_gstin?: string | null;
  company_logo_url?: string | null;
  company_logo_content_hash?: string | null;
  gst_registrations?: GstRegistration[];
  company_phone?: string | null;
  company_website?: string | null;
  company_tagline?: string | null;
  company_pan?: string | null;
  company_state?: string | null;
  company_state_code?: string | null;
  gst_unregistered?: boolean;
  default_sac_code?: string | null;
  invoice_terms_by_type?: Record<string, string[]>;
  invoice_prefix: string;
  invoice_next_number: number;
  invoice_sequences?: Record<string, number>;
  invoice_prefix_scheme?: Array<{
    service: string;
    code: string;
    prefix: string;
    example: string;
    gst?: 'on' | 'off' | string;
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
  bank_paypal_id?: string | null;
  bank_upi_details?: string | null;
  bank_wire_instructions?: string | null;
  bank_upi_qr_url?: string | null;
  smtp_host?: string | null;
  smtp_port: number;
  smtp_username?: string | null;
  smtp_has_password?: boolean;
  smtp_use_tls: boolean;
  smtp_from_name?: string | null;
  smtp_from_email?: string | null;
  /** When false, scheduler/auto invoice emails are skipped (manual Send still works). */
  smtp_auto_send_enabled?: boolean;
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
  period?: string;
  period_label?: string;
  billed_paise?: number;
  collected_paise?: number;
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
  deliverable?: string;
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
