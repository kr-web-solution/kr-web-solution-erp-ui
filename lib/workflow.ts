import { PipelineStageDef } from './types';

export const ENQUIRY_SOURCES = [
  { value: 'instagram_ads', label: 'Instagram Ads' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referral' },
  { value: 'email', label: 'Email' },
] as const;

export const LOST_REASONS = [
  { value: 'price', label: 'Price' },
  { value: 'timing', label: 'Timing' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'no_response', label: 'No response' },
  { value: 'other', label: 'Other' },
] as const;

export const SALES_MAX_STAGE = 5;
export const DELIVERY_MIN_STAGE = 5;
export const DELIVERY_MAX_STAGE = 11;

export const PIPELINE_STAGES: PipelineStageDef[] = [
  { number: 1, key: 'enquiry', name: 'Client Enquiry', client_label: 'Enquiry received', client_message: 'We have received your enquiry and will be in touch shortly.' },
  { number: 2, key: 'discovery', name: 'Discovery & Requirements', client_label: 'Understanding your needs', client_message: 'We are gathering requirements, budget, and scope.' },
  { number: 3, key: 'quotation', name: 'Quotation & Approval', client_label: 'Quotation in progress', client_message: 'We are preparing and finalising your commercial proposal.' },
  { number: 4, key: 'contract', name: 'Contract & Advance Payment', client_label: 'Contract & advance', client_message: 'Agreement and advance payment are being completed.' },
  { number: 5, key: 'onboarding', name: 'Project Onboarding & Planning', client_label: 'Project kickoff', client_message: 'Your project is being set up with milestones and the delivery team.' },
  { number: 6, key: 'design_dev', name: 'Design & Development', client_label: 'Design & development', client_message: 'We are building your product and reviewing progress regularly.' },
  { number: 7, key: 'qa', name: 'Internal QA & Testing', client_label: 'Quality assurance', client_message: 'Quality assurance is in progress before your review.' },
  { number: 8, key: 'uat', name: 'Client Review & UAT', client_label: 'Your review (UAT)', client_message: 'Waiting for your demo feedback and final acceptance.' },
  { number: 9, key: 'deploy', name: 'Deployment & Handover', client_label: 'Going live', client_message: 'We are deploying to production and preparing handover.' },
  { number: 10, key: 'closure', name: 'Closure & Warranty', client_label: 'Project closure', client_message: 'Final billing and warranty period are being completed.' },
  { number: 11, key: 'maintenance', name: 'Maintenance (AMC)', client_label: 'Maintenance plan', client_message: 'Your paid maintenance / support retainer is active.' },
];

/** Sales board columns (01–05) — delivery lives on Projects. */
export const SALES_PIPELINE_STAGES = PIPELINE_STAGES.filter((s) => s.number <= SALES_MAX_STAGE);

/** Delivery phases shown on Project Delivery tab (05–11). */
export const DELIVERY_STAGES = PIPELINE_STAGES.filter(
  (s) => s.number >= DELIVERY_MIN_STAGE && s.number <= DELIVERY_MAX_STAGE
);

export const FEATURE_STATUSES = [
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export function stageLabel(stage: number, mode: 'founder' | 'worker' | 'client' = 'founder') {
  const def = PIPELINE_STAGES.find((s) => s.number === stage);
  if (!def) return `Stage ${stage}`;
  return mode === 'client' ? def.client_label : def.name;
}

export function isInDelivery(stage: number) {
  return stage > SALES_MAX_STAGE;
}

export function formatPaise(paise?: number | null) {
  if (paise == null) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}
