import type { ComponentType } from 'react';
import type { InvoiceLayoutTokens, PaperInvoiceProps } from './types';
import { A3InvoiceLayout } from './layouts/a3';
import { A3_TOKENS } from './layouts/a3.tokens';
import { A4InvoiceLayout } from './layouts/a4';
import { A4_TOKENS } from './layouts/a4.tokens';
import { A5InvoiceLayout } from './layouts/a5';
import { A5_TOKENS } from './layouts/a5.tokens';
import { A6InvoiceLayout } from './layouts/a6';
import { A6_TOKENS } from './layouts/a6.tokens';
import { B4InvoiceLayout } from './layouts/b4';
import { B4_TOKENS } from './layouts/b4.tokens';
import { B5InvoiceLayout } from './layouts/b5';
import { B5_TOKENS } from './layouts/b5.tokens';
import { ExecutiveInvoiceLayout } from './layouts/executive';
import { EXECUTIVE_TOKENS } from './layouts/executive.tokens';
import { LegalInvoiceLayout } from './layouts/legal';
import { LEGAL_TOKENS } from './layouts/legal.tokens';
import { LetterInvoiceLayout } from './layouts/letter';
import { LETTER_TOKENS } from './layouts/letter.tokens';
import { TabloidInvoiceLayout } from './layouts/tabloid';
import { TABLOID_TOKENS } from './layouts/tabloid.tokens';

export type InvoicePaperLayoutComponent = ComponentType<PaperInvoiceProps>;

const LAYOUT_BY_SIZE: Record<string, InvoicePaperLayoutComponent> = {
  a3: A3InvoiceLayout,
  a4: A4InvoiceLayout,
  a5: A5InvoiceLayout,
  a6: A6InvoiceLayout,
  letter: LetterInvoiceLayout,
  legal: LegalInvoiceLayout,
  tabloid: TabloidInvoiceLayout,
  executive: ExecutiveInvoiceLayout,
  b4: B4InvoiceLayout,
  b5: B5InvoiceLayout,
};

const TOKENS_BY_SIZE: Record<string, InvoiceLayoutTokens> = {
  a3: A3_TOKENS,
  a4: A4_TOKENS,
  a5: A5_TOKENS,
  a6: A6_TOKENS,
  letter: LETTER_TOKENS,
  legal: LEGAL_TOKENS,
  tabloid: TABLOID_TOKENS,
  executive: EXECUTIVE_TOKENS,
  b4: B4_TOKENS,
  b5: B5_TOKENS,
};

export function resolveInvoiceLayout(
  paperSize?: string | null
): InvoicePaperLayoutComponent {
  const key = (paperSize || 'a4').toLowerCase();
  return LAYOUT_BY_SIZE[key] || A4InvoiceLayout;
}

export function resolveInvoiceLayoutTokens(
  paperSize?: string | null
): InvoiceLayoutTokens {
  const key = (paperSize || 'a4').toLowerCase();
  return TOKENS_BY_SIZE[key] || A4_TOKENS;
}
