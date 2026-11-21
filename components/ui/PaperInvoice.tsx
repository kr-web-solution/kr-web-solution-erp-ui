'use client';

/**
 * Thin router: picks the per-size design page from the invoice-paper registry.
 * Edit size-specific design in components/ui/invoice-paper/layouts/*.tsx (+ *.tokens.ts).
 */
import React from 'react';
import { resolveInvoiceLayout } from '@/components/ui/invoice-paper/registry';
import type { PaperInvoiceProps } from '@/components/ui/invoice-paper/types';

export type {
  InvoiceLineItem,
  PaperInvoiceBankDetails,
  PaperInvoiceProps,
  PaperInvoiceStatus,
} from '@/components/ui/invoice-paper/types';

export function PaperInvoice(props: PaperInvoiceProps) {
  const Layout = resolveInvoiceLayout(props.paperSize);
  return <Layout {...props} />;
}
