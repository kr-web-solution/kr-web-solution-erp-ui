import { invoiceTypeLabel as sharedInvoiceTypeLabel } from '@/lib/invoices/labels';
import type { PaperInvoiceBankDetails } from './types';

export function docTitle(
  invoiceType?: string,
  taxPaise?: number,
  taxRate?: number,
  gstEnabled?: boolean,
  status?: string
) {
  if (invoiceType === 'credit_note') return 'CREDIT NOTE';
  if (invoiceType === 'debit_note') return 'DEBIT NOTE';
  if (invoiceType === 'proforma') return 'PROFORMA INVOICE';
  if (invoiceType === 'late_fee') return 'LATE FEE INVOICE';
  if ((status || '').toLowerCase() === 'paid') return 'PAYMENT RECEIPT';
  if ((taxPaise || 0) > 0 || (taxRate || 0) > 0 || gstEnabled === true) return 'TAX INVOICE';
  if (gstEnabled === false) return 'BILL OF SUPPLY';
  return 'INVOICE';
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function invoiceTypeLabel(invoiceType?: string) {
  return sharedInvoiceTypeLabel(invoiceType);
}

export function splitDescription(description: string): {
  title: string;
  detail?: string;
} {
  const parts = description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length <= 1) return { title: description };
  return { title: parts[0], detail: parts.slice(1).join(' ') };
}

export function normalizeBank(
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
    const paypal = blob.match(/PayPal:\s*([^|]+)/i)?.[1]?.trim();
    if (beneficiary) parsed.beneficiaryName = beneficiary;
    if (bank) parsed.bankName = bank;
    if (account) parsed.accountNumber = account;
    if (ifsc) parsed.ifsc = ifsc;
    if (upi) parsed.upiId = upi;
    if (paypal) parsed.paypalId = paypal;
    return parsed;
  }
  const hasAny =
    bankDetails.beneficiaryName ||
    bankDetails.bankName ||
    bankDetails.accountNumber ||
    bankDetails.ifsc ||
    bankDetails.upiId ||
    bankDetails.paypalId ||
    bankDetails.blob;
  return hasAny ? bankDetails : null;
}

export function defaultTerms(status: string, invoiceType?: string): string[] {
  if (invoiceType === 'credit_note') {
    return [
      'This credit note adjusts the referenced parent invoice.',
      'No payment is requested against this credit note.',
      'Retain this document for your accounting records.',
    ];
  }
  if (invoiceType === 'debit_note') {
    return [
      'This debit note raises an additional charge on the referenced parent invoice.',
      'Payment is due as stated on this debit note.',
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

export function parseTermsList(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/\n+|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((line) => line.replace(/^\d+[).\-\s]+/, '').trim())
    .filter(Boolean);
}

export const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: 'DRAFT', bg: '#F5B942', fg: '#172554' },
  proof_pending: { label: 'PROOF PENDING', bg: '#F97316', fg: '#FFFFFF' },
  paid: { label: 'PAID', bg: '#16A34A', fg: '#FFFFFF' },
  partially_paid: { label: 'PARTIALLY PAID', bg: '#F97316', fg: '#FFFFFF' },
  unpaid: { label: 'UNPAID', bg: '#DC2626', fg: '#FFFFFF' },
  overdue: { label: 'OVERDUE', bg: '#DC2626', fg: '#FFFFFF' },
  cancelled: { label: 'CANCELLED', bg: '#64748B', fg: '#FFFFFF' },
  void: { label: 'VOID', bg: '#64748B', fg: '#FFFFFF' },
  sent: { label: 'UNPAID', bg: '#DC2626', fg: '#FFFFFF' },
};
