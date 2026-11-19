'use client';

import React from 'react';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price_paise?: number;
  rate_rupees?: number;
  amount_paise?: number;
  line_kind?: string | null;
  detail?: string | null;
  period_label?: string | null;
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

export interface PaperInvoiceBankDetails {
  beneficiaryName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  upiId?: string | null;
  /** Legacy single-blob fallback */
  blob?: string | null;
}

export interface PaperInvoiceProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPincode?: string;
  clientCountry?: string;
  clientGstin?: string;
  clientAttn?: string;
  clientDesignation?: string;
  clientEmail?: string;
  clientPhone?: string;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTagline?: string;
  items: InvoiceLineItem[];
  subtotalPaise: number;
  taxPaise: number;
  taxRatePercent?: number;
  discountPaise?: number;
  otherChargesPaise?: number;
  creditAdjustmentPaise?: number;
  totalPaise: number;
  /** @deprecated prefer `status` */
  isPaid?: boolean;
  status?: PaperInvoiceStatus;
  invoiceType?: string;
  ledger?: string | null;
  projectName?: string;
  projectRef?: string | null;
  periodLabel?: string | null;
  coversFrom?: string | null;
  coversTo?: string | null;
  notes?: string;
  terms?: string | null;
  bankDetails?: string | PaperInvoiceBankDetails;
  upiQrSrc?: string | null;
  parentInvoiceNumber?: string | null;
  paidAt?: string | null;
  logoSrc?: string;
  className?: string;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: 'DRAFT', bg: '#FFC947', fg: '#111111' },
  proof_pending: { label: 'PROOF PENDING', bg: '#FFC947', fg: '#111111' },
  paid: { label: 'PAID', bg: '#16A34A', fg: '#FFFFFF' },
  overdue: { label: 'OVERDUE', bg: '#DC2626', fg: '#FFFFFF' },
  cancelled: { label: 'CANCELLED', bg: '#DC2626', fg: '#FFFFFF' },
  void: { label: 'VOID', bg: '#525252', fg: '#FFFFFF' },
  sent: { label: 'SENT', bg: '#333333', fg: '#FFFFFF' },
};

const TYPE_LABELS: Record<string, string> = {
  custom_dev: 'Custom Development',
  development: 'Development',
  project: 'Project',
  amc: 'Maintenance / AMC',
  maintenance: 'Maintenance / AMC',
  mixed: 'Mixed Billing',
  advance: 'Advance',
  balance: 'Balance',
  hosting: 'Hosting',
  services: 'Services',
  licensing: 'Licensing',
  late_fee: 'Late Fee',
  credit_note: 'Credit Note',
};

function docTitle(invoiceType?: string, taxPaise?: number, taxRate?: number) {
  if (invoiceType === 'credit_note') return 'CREDIT NOTE';
  if (invoiceType === 'late_fee') return 'LATE FEE INVOICE';
  if ((taxPaise || 0) > 0 || (taxRate || 0) > 0) return 'TAX INVOICE';
  return 'INVOICE';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function invoiceTypeLabel(invoiceType?: string) {
  if (!invoiceType) return null;
  return TYPE_LABELS[invoiceType] || invoiceType.replace(/_/g, ' ');
}

function splitDescription(description: string): { title: string; detail?: string } {
  const parts = description.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { title: description };
  return { title: parts[0], detail: parts.slice(1).join(' ') };
}

function normalizeBank(
  bankDetails?: string | PaperInvoiceBankDetails
): PaperInvoiceBankDetails | null {
  if (!bankDetails) return null;
  if (typeof bankDetails === 'string') {
    const blob = bankDetails.trim();
    if (!blob) return null;
    const parsed: PaperInvoiceBankDetails = { blob };
    const beneficiary = blob.match(/Beneficiary:\s*([^|]+)/i)?.[1]?.trim();
    const bank = blob.match(/Bank:\s*([^|]+)/i)?.[1]?.trim();
    const account = blob.match(/A\/?C:\s*([^|]+)/i)?.[1]?.trim();
    const ifsc = blob.match(/IFSC:\s*([^|]+)/i)?.[1]?.trim();
    const upi = blob.match(/UPI:\s*([^|]+)/i)?.[1]?.trim();
    if (beneficiary) parsed.beneficiaryName = beneficiary;
    if (bank) parsed.bankName = bank;
    if (account) parsed.accountNumber = account;
    if (ifsc) parsed.ifsc = ifsc;
    if (upi) parsed.upiId = upi;
    return parsed;
  }
  const hasAny =
    bankDetails.beneficiaryName ||
    bankDetails.bankName ||
    bankDetails.accountNumber ||
    bankDetails.ifsc ||
    bankDetails.upiId ||
    bankDetails.blob;
  return hasAny ? bankDetails : null;
}

function defaultTerms(status: string, invoiceType?: string): string[] {
  if (invoiceType === 'credit_note') {
    return [
      'This credit note adjusts the referenced parent invoice.',
      'No payment is requested against this credit note.',
      'Retain this document for your accounting records.',
    ];
  }
  if (status === 'draft') {
    return [
      'This is a draft invoice and is not a final demand for payment.',
      'Final terms apply once the invoice is issued to the client.',
      'Please contact KR Web Solution for clarifications before payment.',
    ];
  }
  if (status === 'paid') {
    return [
      'This invoice has been marked as paid. No further payment is due.',
      'Retain this document for your accounting records.',
      'For billing queries, contact billing@krwebsolution.com.',
    ];
  }
  if (status === 'cancelled' || status === 'void') {
    return [
      'This invoice has been cancelled / voided and is not payable.',
      'Do not transfer funds against this document.',
      'Contact KR Web Solution if a replacement invoice is required.',
    ];
  }
  if (status === 'overdue') {
    return [
      'Payment is overdue. Please settle the outstanding balance immediately.',
      'Late fees may apply as per the agreed commercial terms.',
      'Share UTR / payment proof after transfer for faster reconciliation.',
    ];
  }
  return [
    'Payment is due within the stated due date.',
    'Please include the invoice number in the payment reference / UTR.',
    'For billing queries, contact billing@krwebsolution.com.',
  ];
}

function parseTermsList(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/\n+|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((line) => line.replace(/^\d+[\).\-\s]+/, '').trim())
    .filter(Boolean);
}

export function PaperInvoice({
  invoiceNumber,
  issueDate,
  dueDate,
  clientName,
  clientAddress,
  clientCity,
  clientState,
  clientPincode,
  clientCountry = 'India',
  clientGstin,
  clientAttn,
  clientDesignation,
  clientEmail,
  clientPhone,
  companyName = 'KR Web Solution',
  companyAddress = 'Salem, Tamil Nadu, India',
  companyGstin,
  companyEmail = 'billing@krwebsolution.com',
  companyPhone,
  companyWebsite = 'www.krwebsolution.com',
  companyTagline = 'Web Development | Cloud | Software Solutions',
  items = [],
  subtotalPaise,
  taxPaise,
  taxRatePercent = 0,
  discountPaise = 0,
  otherChargesPaise = 0,
  creditAdjustmentPaise = 0,
  totalPaise,
  isPaid = false,
  status,
  invoiceType,
  ledger,
  projectName,
  projectRef,
  periodLabel,
  coversFrom,
  coversTo,
  notes,
  terms,
  bankDetails,
  upiQrSrc,
  parentInvoiceNumber,
  paidAt,
  logoSrc = '/brand/krws-mark.png',
  className = '',
}: PaperInvoiceProps) {
  const effectiveStatus = (status || (isPaid ? 'paid' : 'sent')).toLowerCase();
  const badge = STATUS_BADGE[effectiveStatus];
  const title = docTitle(invoiceType, taxPaise, taxRatePercent);
  const showGst = taxPaise > 0 || taxRatePercent > 0;
  const isCredit = invoiceType === 'credit_note';
  const bank = normalizeBank(bankDetails);
  const typeLabel = invoiceTypeLabel(invoiceType);
  const computedPeriod =
    periodLabel ||
    (coversFrom || coversTo
      ? `${formatDate(coversFrom)}${coversTo ? ` – ${formatDate(coversTo)}` : ''}`
      : null);

  const placeLine = [clientCity, clientState, clientPincode].filter(Boolean).join(', ');
  const notesList = parseTermsList(notes);
  const termsList = parseTermsList(terms);
  const footerNotes =
    notesList.length > 0
      ? notesList
      : termsList.length > 0
        ? termsList
        : defaultTerms(effectiveStatus, invoiceType);

  const totalLabel = isCredit
    ? 'CREDIT TOTAL'
    : effectiveStatus === 'paid'
      ? 'TOTAL'
      : effectiveStatus === 'cancelled' || effectiveStatus === 'void'
        ? 'TOTAL (NOT PAYABLE)'
        : 'TOTAL DUE';

  const showBank = !isCredit && !!bank;
  const showQr = !isCredit && !!upiQrSrc;

  return (
    <div
      className={`relative mx-auto w-full max-w-[794px] overflow-hidden bg-white text-[#111111] shadow-[0_18px_48px_-28px_rgba(17,17,17,0.45)] select-none print:shadow-none ${className}`}
      style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}
    >
      {/* Subtle KR watermark */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
        aria-hidden
      >
        <img
          src={logoSrc}
          alt=""
          className="h-[220px] w-[220px] object-contain opacity-[0.04] grayscale"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
          }}
        />
      </div>

      <div className="relative z-[1] px-6 py-7 sm:px-8 sm:py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 max-w-[58%]">
            <div className="flex items-start gap-3">
              <img
                src={logoSrc}
                alt="KR Web Solution"
                className="h-[68px] w-[96px] object-contain object-left"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
                }}
              />
              <div className="min-w-0 pt-1">
                <p className="text-[20px] font-bold leading-tight tracking-tight text-[#111111]">
                  {companyName}
                </p>
                {companyTagline && (
                  <p className="mt-0.5 text-[11px] font-medium text-[#737373]">{companyTagline}</p>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1 text-[11px] leading-relaxed text-[#525252]">
              {companyAddress && (
                <p className="whitespace-pre-line">
                  <span className="mr-1.5 inline-block w-3 text-center text-[#737373]">⌂</span>
                  {companyAddress}
                </p>
              )}
              {companyEmail && (
                <p>
                  <span className="mr-1.5 inline-block w-3 text-center text-[#737373]">✉</span>
                  {companyEmail}
                </p>
              )}
              {companyWebsite && (
                <p>
                  <span className="mr-1.5 inline-block w-3 text-center text-[#737373]">◎</span>
                  {companyWebsite.replace(/^https?:\/\//, '')}
                </p>
              )}
              {companyPhone && (
                <p>
                  <span className="mr-1.5 inline-block w-3 text-center text-[#737373]">☎</span>
                  {companyPhone}
                </p>
              )}
              {companyGstin && (
                <p className="font-mono text-[10px] text-[#737373]">
                  GSTIN: <span className="font-semibold text-[#111111]">{companyGstin}</span>
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <h2 className="text-[32px] font-bold leading-none tracking-[0.04em] text-[#111111]">
              {title}
            </h2>
            <div className="mt-3 space-y-1.5 text-[11px] text-[#525252]">
              <p>
                <span className="text-[#737373]">
                  {isCredit ? 'Credit Note #:' : 'Invoice #:'}
                </span>{' '}
                <span className="font-semibold text-[#111111]">{invoiceNumber}</span>
              </p>
              <p>
                <span className="text-[#737373]">Issue Date:</span>{' '}
                <span className="font-medium text-[#111111]">{formatDate(issueDate)}</span>
              </p>
              {!isCredit && (
                <p>
                  <span className="text-[#737373]">Due Date:</span>{' '}
                  <span className="font-medium text-[#111111]">{formatDate(dueDate)}</span>
                </p>
              )}
              {parentInvoiceNumber && (
                <p>
                  <span className="text-[#737373]">Ref Invoice:</span>{' '}
                  <span className="font-medium text-[#111111]">{parentInvoiceNumber}</span>
                </p>
              )}
              {effectiveStatus === 'paid' && paidAt && (
                <p>
                  <span className="text-[#737373]">Paid On:</span>{' '}
                  <span className="font-medium text-[#111111]">{formatDate(paidAt)}</span>
                </p>
              )}
            </div>
            {badge && (
              <div
                className="mt-3 inline-flex items-center rounded-[4px] px-3 py-1.5 text-[10px] font-bold tracking-[0.12em]"
                style={{ backgroundColor: badge.bg, color: badge.fg }}
              >
                {badge.label}
              </div>
            )}
          </div>
        </div>

        <div className="my-5 h-px bg-[#222222]" />

        {/* Bill to + Project */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[55%_1fr]">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111]">
              Bill To
            </p>
            <p className="text-[16px] font-bold leading-snug text-[#111111]">
              {clientName || 'Client Name'}
            </p>
            <div className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-[#525252]">
              {(clientAttn || clientDesignation) && (
                <p>
                  {[clientAttn, clientDesignation].filter(Boolean).join(' · ')}
                </p>
              )}
              {clientEmail && <p>{clientEmail}</p>}
              {clientPhone && <p>{clientPhone}</p>}
              {clientAddress && <p className="whitespace-pre-line">{clientAddress}</p>}
              {placeLine && <p>{placeLine}</p>}
              {clientCountry && <p>{clientCountry}</p>}
              {clientGstin && (
                <p className="font-mono text-[10px]">
                  GSTIN: <span className="font-semibold text-[#111111]">{clientGstin}</span>
                </p>
              )}
            </div>
          </div>

          {(projectName || typeLabel || projectRef || computedPeriod || ledger) && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111]">
                Project Details
              </p>
              <div className="space-y-1.5 text-[11px] text-[#525252]">
                {projectName && (
                  <p>
                    <span className="text-[#737373]">Project Name:</span>{' '}
                    <span className="font-semibold text-[#111111]">{projectName}</span>
                  </p>
                )}
                {typeLabel && (
                  <p>
                    <span className="text-[#737373]">Type:</span>{' '}
                    <span className="font-medium text-[#111111]">{typeLabel}</span>
                  </p>
                )}
                {projectRef && (
                  <p>
                    <span className="text-[#737373]">Project Ref.:</span>{' '}
                    <span className="font-medium text-[#111111]">{projectRef}</span>
                  </p>
                )}
                {computedPeriod && (
                  <p>
                    <span className="text-[#737373]">Period:</span>{' '}
                    <span className="font-medium text-[#111111]">{computedPeriod}</span>
                  </p>
                )}
                {ledger && ledger !== 'development' && (
                  <p>
                    <span className="text-[#737373]">Billing Category:</span>{' '}
                    <span className="font-medium capitalize text-[#111111]">{ledger}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Line items */}
        <div className="mt-6 overflow-hidden rounded-[4px] border border-[#E5E5E5]">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#222222] text-white">
                <th className="w-[6%] px-3 py-2.5 text-left font-bold">#</th>
                <th className="w-[50%] px-2 py-2.5 text-left font-bold">Item &amp; Description</th>
                <th className="w-[10%] px-2 py-2.5 text-center font-bold">Qty</th>
                <th className="w-[16%] px-2 py-2.5 text-right font-bold">Rate (INR)</th>
                <th className="w-[18%] px-3 py-2.5 text-right font-bold">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const rate = item.rate_rupees ?? (item.unit_price_paise ?? 0) / 100;
                const amount = item.amount_paise ?? Math.round(item.quantity * rate * 100);
                const split = item.detail
                  ? { title: item.description, detail: item.detail }
                  : splitDescription(item.description);
                return (
                  <tr
                    key={item.id || idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}
                  >
                    <td className="border-t border-[#E5E5E5] px-3 py-2.5 align-top text-[#737373]">
                      {idx + 1}
                    </td>
                    <td className="border-t border-[#E5E5E5] px-2 py-2.5 align-top">
                      <p className="font-semibold text-[#111111]">{split.title}</p>
                      {split.detail && (
                        <p className="mt-0.5 text-[10px] leading-relaxed text-[#737373]">
                          {split.detail}
                        </p>
                      )}
                      {item.period_label && (
                        <p className="mt-0.5 text-[10px] text-[#737373]">{item.period_label}</p>
                      )}
                    </td>
                    <td className="border-t border-[#E5E5E5] px-2 py-2.5 text-center align-top tabular-nums text-[#111111]">
                      {item.quantity}
                    </td>
                    <td className="border-t border-[#E5E5E5] px-2 py-2.5 text-right align-top tabular-nums text-[#111111]">
                      {formatRupees(Math.round(rate * 100))}
                    </td>
                    <td className="border-t border-[#E5E5E5] px-3 py-2.5 text-right align-top font-semibold tabular-nums text-[#111111]">
                      {formatRupees(amount)}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="border-t border-[#E5E5E5] px-3 py-8 text-center text-[#737373]"
                  >
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bank + totals */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            {showBank && (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111]">
                  Bank &amp; Payment Details
                </p>
                <div className="space-y-1 text-[11px] text-[#525252]">
                  {bank?.beneficiaryName && (
                    <p>
                      <span className="text-[#737373]">Beneficiary Name:</span>{' '}
                      <span className="font-medium text-[#111111]">{bank.beneficiaryName}</span>
                    </p>
                  )}
                  {bank?.bankName && (
                    <p>
                      <span className="text-[#737373]">Bank:</span>{' '}
                      <span className="font-medium text-[#111111]">{bank.bankName}</span>
                    </p>
                  )}
                  {bank?.accountNumber && (
                    <p>
                      <span className="text-[#737373]">Account Number:</span>{' '}
                      <span className="font-medium text-[#111111]">{bank.accountNumber}</span>
                    </p>
                  )}
                  {bank?.ifsc && (
                    <p>
                      <span className="text-[#737373]">IFSC Code:</span>{' '}
                      <span className="font-medium text-[#111111]">{bank.ifsc}</span>
                    </p>
                  )}
                  {bank?.upiId && (
                    <p>
                      <span className="text-[#737373]">UPI ID:</span>{' '}
                      <span className="font-medium text-[#111111]">{bank.upiId}</span>
                    </p>
                  )}
                  {!bank?.beneficiaryName &&
                    !bank?.bankName &&
                    !bank?.accountNumber &&
                    bank?.blob && (
                      <p className="whitespace-pre-line font-mono text-[10px] leading-relaxed">
                        {bank.blob}
                      </p>
                    )}
                </div>
                {showQr && (
                  <img
                    src={upiQrSrc!}
                    alt="UPI QR"
                    className="mt-3 h-24 w-24 rounded border border-[#E5E5E5] bg-white object-contain p-1"
                  />
                )}
              </>
            )}
            {isCredit && (
              <p className="text-[11px] leading-relaxed text-[#525252]">
                Credit adjustment against parent invoice
                {parentInvoiceNumber ? ` ${parentInvoiceNumber}` : ''}. No payment QR is issued
                for credit notes.
              </p>
            )}
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between text-[#525252]">
              <span>Subtotal</span>
              <span className="tabular-nums text-[#111111]">{formatRupees(subtotalPaise)}</span>
            </div>
            {discountPaise > 0 && (
              <div className="flex justify-between text-[#525252]">
                <span>Discount</span>
                <span className="tabular-nums text-[#111111]">
                  −{formatRupees(discountPaise)}
                </span>
              </div>
            )}
            {showGst && (
              <div className="flex justify-between text-[#525252]">
                <span>GST ({taxRatePercent}%)</span>
                <span className="tabular-nums text-[#111111]">{formatRupees(taxPaise)}</span>
              </div>
            )}
            {otherChargesPaise > 0 && (
              <div className="flex justify-between text-[#525252]">
                <span>Other Charges</span>
                <span className="tabular-nums text-[#111111]">
                  {formatRupees(otherChargesPaise)}
                </span>
              </div>
            )}
            {creditAdjustmentPaise > 0 && (
              <div className="flex justify-between text-[#525252]">
                <span>Credit Adjustment</span>
                <span className="tabular-nums text-[#111111]">
                  −{formatRupees(creditAdjustmentPaise)}
                </span>
              </div>
            )}
            <div className="mt-1 flex h-[44px] items-center justify-between rounded-[5px] bg-[#222222] px-3.5 text-white">
              <span className="text-[13px] font-bold tracking-wide">{totalLabel}</span>
              <span className="text-[17px] font-bold tabular-nums">
                {formatRupees(totalPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {footerNotes.length > 0 && (
          <div className="mt-7">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111]">
              Terms &amp; Notes
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-[#525252]">
              {footerNotes.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Footer */}
        <div className="relative mt-8 border-t border-[#E5E5E5] pt-4">
          <div className="flex items-end justify-between gap-4 text-[8px] text-[#737373]">
            <p>This is a computer-generated invoice issued by {companyName}.</p>
            <p className="shrink-0">Page 1 of 1</p>
          </div>
          <svg
            className="pointer-events-none absolute -bottom-2 left-0 right-0 h-10 w-full opacity-30"
            viewBox="0 0 800 40"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 28 C 80 8, 160 36, 240 22 S 400 4, 480 20 S 640 38, 800 14 L 800 40 L 0 40 Z"
              fill="#EEEEEE"
            />
            <path
              d="M0 32 C 100 18, 200 34, 300 24 S 500 10, 600 26 S 720 34, 800 20"
              fill="none"
              stroke="#EEEEEE"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
