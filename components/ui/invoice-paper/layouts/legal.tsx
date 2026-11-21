'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { LEGAL_TOKENS } from './legal.tokens';

/** Legal design page — change Legal look here / in legal.tokens.ts only. */
export function LegalInvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="legal" layout={LEGAL_TOKENS} />;
}
