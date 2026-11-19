'use client';

import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

export type StatusType =
  | 'project'
  | 'invoice'
  | 'lead'
  | 'maintenance'
  | 'email';

export interface StatusBadgeProps {
  type: StatusType;
  status: string;
  isLateFee?: boolean;
  errorTooltip?: string;
  className?: string;
}

interface BadgeConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const PROJECT_STATUS: Record<string, BadgeConfig> = {
  lead: { label: 'Not started', bg: 'bg-[#EEF1F5]', text: 'text-[#64748B]', border: 'border-[#E6E8EE]', dot: 'bg-[#64748B]' },
  running: { label: 'Running', bg: 'bg-[#E8F7EE]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20', dot: 'bg-[#16A34A]' },
  on_hold: { label: 'On Hold', bg: 'bg-[#FEF6D8]', text: 'text-[#5B4300]', border: 'border-[#FADC59]/30', dot: 'bg-[#FADC59]' },
  stopped: { label: 'Stopped', bg: 'bg-[#FDECEC]', text: 'text-[#B91C1C]', border: 'border-[#B91C1C]/20', dot: 'bg-[#B91C1C]' },
  completed: { label: 'Completed', bg: 'bg-[#E8F0FE]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20', dot: 'bg-[#2563EB]' },
  // Engagement pipeline statuses (reused via type="project")
  active: { label: 'Active', bg: 'bg-[#E8F7EE]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20', dot: 'bg-[#16A34A]' },
  lost: { label: 'Lost', bg: 'bg-[#EEF1F5]', text: 'text-[#64748B]', border: 'border-[#E6E8EE]', dot: 'bg-[#64748B]' },
  maintenance: { label: 'AMC', bg: 'bg-[#FEF6D8]', text: 'text-[#5B4300]', border: 'border-[#FADC59]/30', dot: 'bg-[#FADC59]' },
};

const INVOICE_STATUS: Record<string, BadgeConfig> = {
  draft: { label: 'Draft', bg: 'bg-[#EEF1F5]', text: 'text-[#64748B]', border: 'border-[#E6E8EE]', dot: 'bg-[#64748B]' },
  sent: { label: 'Sent', bg: 'bg-[#E8F0FE]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20', dot: 'bg-[#2563EB]' },
  paid: { label: 'Paid', bg: 'bg-[#E8F7EE]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20', dot: 'bg-[#16A34A]' },
  overdue: { label: 'Overdue', bg: 'bg-[#FDECEC]', text: 'text-[#B91C1C]', border: 'border-[#B91C1C]/20', dot: 'bg-[#B91C1C]' },
  proof_pending: {
    label: 'Proof submitted',
    bg: 'bg-[#FEF6D8]',
    text: 'text-[#5B4300]',
    border: 'border-[#FADC59]/30',
    dot: 'bg-[#FADC59]',
  },

  cancelled: { label: 'Cancelled', bg: 'bg-[#EEF1F5]', text: 'text-[#64748B]', border: 'border-[#E6E8EE]', dot: 'bg-[#94A3B8]' },
  void: { label: 'Void', bg: 'bg-[#EEF1F5]', text: 'text-[#64748B]', border: 'border-[#E6E8EE]', dot: 'bg-[#94A3B8]' },
  credit_note: { label: 'Credit note', bg: 'bg-[#FEF6D8]', text: 'text-[#5B4300]', border: 'border-[#FADC59]/30', dot: 'bg-[#FADC59]' },
};

const LEAD_STATUS: Record<string, BadgeConfig> = {
  new: { label: 'New', bg: 'bg-[#E8F0FE]', text: 'text-[#2563EB]', border: 'border-[#2563EB]/20', dot: 'bg-[#2563EB]' },
  contacted: { label: 'Contacted', bg: 'bg-[#FEF6D8]', text: 'text-[#5B4300]', border: 'border-[#FADC59]/30', dot: 'bg-[#FADC59]' },
  proposal: { label: 'Proposal', bg: 'bg-[#F1EAFE]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]/20', dot: 'bg-[#7C3AED]' },
  won: { label: 'Won', bg: 'bg-[#E8F7EE]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20', dot: 'bg-[#16A34A]' },
  lost: { label: 'Lost', bg: 'bg-[#EEF1F5]', text: 'text-[#64748B]', border: 'border-[#E6E8EE]', dot: 'bg-[#64748B]' },
};

const MAINTENANCE_STATUS: Record<string, BadgeConfig> = {
  active: { label: 'Active', bg: 'bg-[#E8F7EE]', text: 'text-[#16A34A]', border: 'border-[#16A34A]/20', dot: 'bg-[#16A34A]' },
  paused: { label: 'Paused', bg: 'bg-[#FEF6D8]', text: 'text-[#5B4300]', border: 'border-[#FADC59]/30', dot: 'bg-[#FADC59]' },
};

export function StatusBadge({
  type,
  status,
  isLateFee = false,
  errorTooltip,
  className = '',
}: StatusBadgeProps) {
  const normStatus = status.toLowerCase().replace(/[\s-]/g, '_');

  // Handle Email Delivery status
  if (type === 'email') {
    if (normStatus === 'sent') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7EE] text-[#16A34A] border border-[#16A34A]/20 ${className}`}
          title="Email delivered"
        >
          <Check className="w-3 h-3 stroke-[2.5]" />
          <span>Sent</span>
        </span>
      );
    }
    if (normStatus === 'failed') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#B91C1C]/20 ${className}`}
          title={errorTooltip || 'Delivery failed'}
        >
          <AlertCircle className="w-3 h-3 stroke-[2.5]" />
          <span>Failed</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF1F5] text-[#64748B] border border-[#E6E8EE] ${className}`}
        title="Pending dispatch"
      >
        <Clock className="w-3 h-3 stroke-[2.5]" />
        <span>Pending</span>
      </span>
    );
  }

  // Lookup map
  let config: BadgeConfig | undefined;
  if (type === 'project') config = PROJECT_STATUS[normStatus];
  else if (type === 'invoice') config = INVOICE_STATUS[normStatus];
  else if (type === 'lead') config = LEAD_STATUS[normStatus];
  else if (type === 'maintenance') config = MAINTENANCE_STATUS[normStatus];

  if (!config) {
    config = {
      label: status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      bg: 'bg-[#EEF1F5]',
      text: 'text-[#64748B]',
      border: 'border-[#E6E8EE]',
      dot: 'bg-[#64748B]',
    };
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
        <span>{config.label}</span>
      </span>

      {isLateFee && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F1EAFE] text-[#7C3AED] border border-[#7C3AED]/20 uppercase">
          Late fee
        </span>
      )}
    </div>
  );
}
