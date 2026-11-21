'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { EXECUTIVE_TOKENS } from './executive.tokens';

/** Executive design page — change Executive look here / in executive.tokens.ts only. */
export function ExecutiveInvoiceLayout(props: PaperInvoiceProps) {
  return (
    <InvoiceDocument {...props} paperSize="executive" layout={EXECUTIVE_TOKENS} />
  );
}
