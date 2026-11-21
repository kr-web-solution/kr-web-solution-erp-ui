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
export const DELIVERY_MAX_STAGE = 14;
export const HANDOVER_PHASE = 13;
export const MAINTENANCE_PHASE = 14;

export const PIPELINE_STAGES: PipelineStageDef[] = [
  {
    number: 1,
    key: 'enquiry',
    name: 'Client Enquiry',
    client_label: 'Enquiry received',
    client_message: 'We have received your enquiry and will be in touch shortly.',
    deliverable: 'Enquiry logged',
  },
  {
    number: 2,
    key: 'discovery',
    name: 'Discovery & Requirements',
    client_label: 'Understanding your needs',
    client_message: 'We are gathering requirements, budget, and scope.',
    deliverable: 'Discovery notes',
  },
  {
    number: 3,
    key: 'quotation',
    name: 'Quotation & Approval',
    client_label: 'Quotation in progress',
    client_message: 'We are preparing and finalising your commercial proposal.',
    deliverable: 'Approved quotation',
  },
  {
    number: 4,
    key: 'contract',
    name: 'Contract & Advance Payment',
    client_label: 'Contract & advance',
    client_message: 'Agreement and advance payment are being completed.',
    deliverable: 'Signed contract',
  },
  {
    number: 5,
    key: 'requirements',
    name: 'Requirement Analysis',
    client_label: 'Gathering requirements',
    client_message: 'We are documenting what you need so the solution matches your goals.',
    deliverable: 'SRS Document',
  },
  {
    number: 6,
    key: 'feasibility',
    name: 'Feasibility Study & Planning',
    client_label: 'Planning the project',
    client_message: 'We are confirming budget, technology, and timeline before build starts.',
    deliverable: 'Project Plan',
  },
  {
    number: 7,
    key: 'architecture',
    name: 'System Architecture & Database Design',
    client_label: 'Designing the system',
    client_message: 'We are designing the architecture, database, and integrations.',
    deliverable: 'Architecture Document',
  },
  {
    number: 8,
    key: 'uiux',
    name: 'UI/UX Design',
    client_label: 'Designing the experience',
    client_message: 'We are designing screens, flows, and the look of your product.',
    deliverable: 'Approved UI Design',
  },
  {
    number: 9,
    key: 'environment',
    name: 'Environment & Infrastructure Setup',
    client_label: 'Setting up environments',
    client_message: 'We are preparing development, staging, and production environments.',
    deliverable: 'Development Environment',
  },
  {
    number: 10,
    key: 'development',
    name: 'Development / Implementation',
    client_label: 'Building your product',
    client_message: 'Our team is building the application and integrating services.',
    deliverable: 'Working Application',
  },
  {
    number: 11,
    key: 'testing',
    name: 'Testing & Quality Assurance',
    client_label: 'Testing quality',
    client_message: 'We are testing the product thoroughly before your acceptance review.',
    deliverable: 'Tested Application',
  },
  {
    number: 12,
    key: 'deployment',
    name: 'Deployment & Release',
    client_label: 'Going live',
    client_message: 'We are publishing your application to production.',
    deliverable: 'Live Application',
  },
  {
    number: 13,
    key: 'handover',
    name: 'Documentation & Handover',
    client_label: 'Handover & docs',
    client_message: 'We are preparing documentation, training, and handover materials.',
    deliverable: 'Handover Package',
  },
  {
    number: 14,
    key: 'maintenance',
    name: 'Maintenance & Continuous Improvement',
    client_label: 'Ongoing support',
    client_message: 'Your product is live and under continuous maintenance and improvement.',
    deliverable: 'Maintained Product',
  },
];

/** Sales board columns (01–05) — delivery lives on Projects. */
export const SALES_PIPELINE_STAGES = PIPELINE_STAGES.filter((s) => s.number <= SALES_MAX_STAGE);

/** Delivery phases shown on Project Delivery tab (05–14). */
export const DELIVERY_STAGES = PIPELINE_STAGES.filter(
  (s) => s.number >= DELIVERY_MIN_STAGE && s.number <= DELIVERY_MAX_STAGE
);

export const FEATURE_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'estimation_pending', label: 'Estimation pending' },
  { value: 'quotation_sent', label: 'Quotation sent' },
  { value: 'awaiting_approval', label: 'Awaiting approval' },
  { value: 'revision_requested', label: 'Revision requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_development', label: 'In development' },
  { value: 'testing', label: 'Testing' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const FEATURE_REQUEST_TYPES = [
  { value: 'new_feature', label: 'New Feature' },
  { value: 'feature_enhancement', label: 'Feature Enhancement' },
  { value: 'existing_feature_modification', label: 'Existing Feature Modification' },
  { value: 'third_party_integration', label: 'Third-party Integration' },
  { value: 'scope_extension', label: 'Scope Extension' },
  { value: 'bug_fix', label: 'Bug Fix' },
] as const;

export const FEATURE_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export function stageLabel(stage: number, mode: 'founder' | 'worker' | 'client' = 'founder') {
  const def = PIPELINE_STAGES.find((s) => s.number === stage);
  if (!def) return `Stage ${stage}`;
  return mode === 'client' ? def.client_label : def.name;
}

export function stageDeliverable(stage: number) {
  return PIPELINE_STAGES.find((s) => s.number === stage)?.deliverable || '';
}

export function stageMessage(stage: number) {
  return PIPELINE_STAGES.find((s) => s.number === stage)?.client_message || '';
}

export function isInDelivery(stage: number) {
  return stage > SALES_MAX_STAGE;
}

export function formatPaise(paise?: number | null) {
  if (paise == null) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}
