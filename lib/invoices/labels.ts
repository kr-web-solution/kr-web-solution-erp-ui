export const INVOICE_TYPE_LABELS: Record<string, string> = {
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
  debit_note: 'Debit Note',
  proforma: 'Proforma',
};

export function invoiceTypeLabel(invoiceType?: string | null): string | null {
  if (!invoiceType) return null;
  return INVOICE_TYPE_LABELS[invoiceType] || invoiceType.replace(/_/g, ' ');
}

/** Frozen only after payment (or cancel/void). Unpaid invoices stay editable. */
export function isInvoiceDocumentLocked(invoice: {
  document_locked?: boolean | null;
  status?: string | null;
}): boolean {
  const status = (invoice.status || '').toLowerCase();
  // Unpaid statuses are never content-locked — founders can edit until paid.
  if (['draft', 'sent', 'overdue', 'proof_pending'].includes(status)) {
    return false;
  }
  if (['paid', 'cancelled', 'void'].includes(status)) {
    return true;
  }
  return invoice.document_locked === true;
}

/** Soft edit allowed on any unpaid invoice. */
export function canSoftEditInvoice(invoice: {
  document_locked?: boolean | null;
  status?: string | null;
  invoice_type?: string | null;
}): boolean {
  const status = (invoice.status || '').toLowerCase();
  if (['paid', 'cancelled', 'void'].includes(status)) return false;
  return true;
}

/** Full content edit (line items, tax, type, parties) — all unpaid invoices. */
export function canFullEditInvoice(invoice: {
  document_locked?: boolean | null;
  status?: string | null;
  invoice_type?: string | null;
}): boolean {
  if (!canSoftEditInvoice(invoice)) return false;
  return !isInvoiceDocumentLocked(invoice);
}
