export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'converted' | 'lost';
export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'call' | 'meeting' | 'email' | 'whatsapp' | 'note';
  summary: string;
  createdAt: string;
  performedByName: string;
}

export interface Lead {
  id: string;
  companyId?: string;
  contactId?: string;
  title: string;
  source: string;
  serviceId?: string;
  status: LeadStatus;
  priority: LeadPriority;
  budgetPaise: number;
  ownerUserId: string;
  nextFollowUpAt?: string;
  createdAt: string;
  notes?: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  ownerName?: string;
  activities?: LeadActivity[];
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  city?: string;
  state?: string;
  website?: string;
  gstin?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  isPrimary?: boolean;
}

export interface Deal {
  id: string;
  leadId?: string;
  companyId: string;
  contactId: string;
  title: string;
  stage: 'discovery' | 'proposal' | 'negotiation' | 'won' | 'lost';
  valuePaise: number;
  expectedCloseDate: string;
  ownerUserId: string;
  createdAt: string;
}

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  amountPaise: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  dealId?: string;
  companyId: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  validUntil: string;
  items: QuotationLineItem[];
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  companyId: string;
  status: 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  budgetPaise: number;
  progressPercent: number;
  startDate: string;
  targetEndDate: string;
  managerUserId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  totalPaise: number;
  paidPaise: number;
  dueDate: string;
  issuedAt: string;
}

