export function normalizeStateCode(value?: string | null): string | null {
  const raw = (value ?? '').toString().trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 2 && raw.length >= 10) return digits.slice(0, 2).padStart(2, '0');
  if (raw.length <= 4 && /^\d+$/.test(raw)) return raw.padStart(2, '0');
  if (digits.length === 2) return digits.padStart(2, '0');
  return raw.slice(0, 4).toUpperCase() || null;
}

export function splitGstPaise(
  taxPaise: number,
  opts: {
    supplierStateCode?: string | null;
    customerStateCode?: string | null;
    gstEnabled?: boolean;
  } = {}
): { cgst: number; sgst: number; igst: number; supplyType: 'intra' | 'inter' | null } {
  const tax = Math.max(0, Math.trunc(taxPaise || 0));
  const supplier = normalizeStateCode(opts.supplierStateCode);
  const customer = normalizeStateCode(opts.customerStateCode);
  if (!opts.gstEnabled || tax <= 0 || !supplier || !customer) {
    return { cgst: 0, sgst: 0, igst: 0, supplyType: null };
  }
  if (supplier === customer) {
    const half = Math.floor(tax / 2);
    return { cgst: half, sgst: tax - half, igst: 0, supplyType: 'intra' };
  }
  return { cgst: 0, sgst: 0, igst: tax, supplyType: 'inter' };
}
