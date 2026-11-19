'use client';

import React from 'react';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price_paise?: number;
  rate_rupees?: number;
  amount_paise?: number;
}

export type PaperInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'proof_pending'
  | 'cancelled'
  | 'void'
  | string;

export interface PaperInvoiceProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress?: string;
  clientGstin?: string;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  items: InvoiceLineItem[];
  subtotalPaise: number;
  taxPaise: number;
  taxRatePercent?: number;
  totalPaise: number;
  /** @deprecated prefer `status` */
  isPaid?: boolean;
  status?: PaperInvoiceStatus;
  invoiceType?: string;
  projectName?: string;
  notes?: string;
  bankDetails?: string;
  logoSrc?: string;
  className?: string;
}

const STATUS_STAMP: Record<
  string,
  { label: string; color: string; border: string }
> = {
  paid: { label: 'PAID', color: '#16A34A', border: '#16A34A' },
  draft: { label: 'DRAFT', color: '#64748B', border: '#94A3B8' },
  overdue: { label: 'OVERDUE', color: '#B91C1C', border: '#B91C1C' },
  proof_pending: { label: 'PROOF SUBMITTED', color: '#A16207', border: '#EAB308' },
  cancelled: { label: 'CANCELLED', color: '#64748B', border: '#94A3B8' },
  void: { label: 'VOID', color: '#64748B', border: '#94A3B8' },
  sent: { label: 'SENT', color: '#2563EB', border: '#2563EB' },
};

function docTitle(invoiceType?: string, taxPaise?: number, taxRate?: number) {
  if (invoiceType === 'credit_note') return 'CREDIT NOTE';
  if (invoiceType === 'late_fee') return 'LATE FEE INVOICE';
  if ((taxPaise || 0) > 0 || (taxRate || 0) > 0) return 'TAX INVOICE';
  return 'INVOICE';
}

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PaperInvoice({
  invoiceNumber,
  issueDate,
  dueDate,
  clientName,
  clientAddress,
  clientGstin,
  companyName = 'KR Web Solution',
  companyAddress = 'Salem, Tamil Nadu, India',
  companyGstin,
  items = [],
  subtotalPaise,
  taxPaise,
  taxRatePercent = 0,
  totalPaise,
  isPaid = false,
  status,
  invoiceType,
  projectName,
  notes,
  bankDetails,
  logoSrc = '/brand/krws-mark.png',
  className = '',
}: PaperInvoiceProps) {
  const formatRupees = (paise: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);

  const effectiveStatus = (status || (isPaid ? 'paid' : 'sent')).toLowerCase();
  const stamp = STATUS_STAMP[effectiveStatus];
  const title = docTitle(invoiceType, taxPaise, taxRatePercent);
  const showGst = taxPaise > 0 || taxRatePercent > 0;

  return (
    <div
      className={`relative w-full max-w-[760px] mx-auto overflow-hidden bg-white border border-[#E6E8EE] rounded-2xl shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] text-[#0F172A] select-none ${className}`}
    >
      {/* Brand accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#E32B2B] via-[#FADC59] to-[#12141C]" />

      {/* Logo watermark */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <img
          src={logoSrc}
          alt=""
          className="h-[55%] w-[55%] max-w-[340px] object-contain opacity-[0.06]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
          }}
        />
      </div>

      {/* Status stamp */}
      {stamp && (
        <div
          className="pointer-events-none absolute top-[42%] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 -rotate-12 select-none rounded-xl border-[3px] px-6 py-2 text-center font-extrabold tracking-[0.2em] opacity-80"
          style={{ color: stamp.color, borderColor: stamp.border }}
        >
          <span className="block text-3xl sm:text-4xl">{stamp.label}</span>
        </div>
      )}

      <div className="relative z-[1] p-6 sm:p-9">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 pb-6">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#12141C] p-1.5 shadow-sm">
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold tracking-tight text-[#0F172A] truncate">
                  {companyName}
                </p>
                <p className="text-[11px] text-[#64748B] max-w-xs leading-snug">
                  {companyAddress}
                </p>
              </div>
            </div>
            {companyGstin && (
              <p className="text-[11px] font-mono text-[#64748B]">
                GSTIN:{' '}
                <span className="font-semibold text-[#0F172A]">{companyGstin}</span>
              </p>
            )}
          </div>

          <div className="text-right space-y-1 shrink-0">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-[0.04em] text-[#E32B2B]">
              {title}
            </h2>
            <div className="text-xs font-mono font-bold text-[#0F172A]">{invoiceNumber}</div>
            <div className="text-[11px] text-[#64748B]">
              Issue:{' '}
              <span className="font-mono text-[#0F172A]">{formatDate(issueDate)}</span>
            </div>
            <div className="text-[11px] text-[#64748B]">
              Due:{' '}
              <span
                className={`font-mono font-semibold ${
                  effectiveStatus === 'overdue' ? 'text-[#B91C1C]' : 'text-[#0F172A]'
                }`}
              >
                {formatDate(dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-[#E32B2B]/80 via-[#E6E8EE] to-transparent" />

        {/* Bill to + project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 py-5">
          <div>
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.14em] mb-1.5">
              Billed to
            </div>
            <div className="text-sm font-bold text-[#0F172A]">
              {clientName || 'Client Name'}
            </div>
            {clientAddress && (
              <p className="text-xs text-[#64748B] mt-1 whitespace-pre-line leading-relaxed max-w-sm">
                {clientAddress}
              </p>
            )}
            {clientGstin && (
              <p className="text-xs font-mono text-[#64748B] mt-1">
                GSTIN: <span className="font-semibold text-[#0F172A]">{clientGstin}</span>
              </p>
            )}
          </div>
          {projectName && (
            <div className="sm:text-right">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.14em] mb-1.5">
                Project
              </div>
              <p className="text-sm font-semibold text-[#0F172A]">{projectName}</p>
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="rounded-xl border border-[#E6E8EE] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#12141C] text-white">
                <th className="text-left py-2.5 px-3 w-10 font-semibold">#</th>
                <th className="text-left py-2.5 px-2 font-semibold">Description</th>
                <th className="text-right py-2.5 px-2 w-14 font-semibold">Qty</th>
                <th className="text-right py-2.5 px-2 w-24 font-semibold">Rate</th>
                <th className="text-right py-2.5 px-3 w-28 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const rate = item.rate_rupees ?? (item.unit_price_paise ?? 0) / 100;
                const amount = item.amount_paise ?? item.quantity * rate * 100;
                return (
                  <tr
                    key={item.id || idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}
                  >
                    <td className="py-2.5 px-3 font-mono text-[#64748B]">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-medium text-[#0F172A]">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                      ₹{rate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                      {formatRupees(amount)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="pt-5 flex flex-col items-end">
          <div className="w-full max-w-[280px] space-y-2 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums text-[#0F172A]">
                {formatRupees(subtotalPaise)}
              </span>
            </div>
            {showGst && (
              <div className="flex justify-between text-[#64748B]">
                <span>GST ({taxRatePercent}%)</span>
                <span className="font-mono tabular-nums text-[#0F172A]">
                  {formatRupees(taxPaise)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center rounded-xl border border-[#FADC59]/50 bg-[#FEF6D8] px-3 py-2.5 text-[#5B4300]">
              <span className="font-bold text-sm">
                {invoiceType === 'credit_note' ? 'Credit total' : 'Total payable'}
              </span>
              <span className="font-mono font-extrabold text-base tabular-nums">
                {formatRupees(totalPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {(bankDetails || notes) && (
          <div className="mt-8 pt-4 border-t border-[#E6E8EE] text-[11px] text-[#64748B] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bankDetails && (
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] text-[#0F172A] mb-1">
                  Bank / UPI
                </span>
                <p className="font-mono whitespace-pre-line leading-relaxed">{bankDetails}</p>
              </div>
            )}
            {notes && (
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] text-[#0F172A] mb-1">
                  Terms &amp; notes
                </span>
                <p className="whitespace-pre-line leading-relaxed">{notes}</p>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-[10px] text-[#94A3B8]">
          Computer-generated document · {companyName}
        </p>
      </div>
    </div>
  );
}
