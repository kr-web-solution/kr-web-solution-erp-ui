'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { B4_TOKENS } from './b4.tokens';

/** B4 design page — change B4 look here / in b4.tokens.ts only. */
export function B4InvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="b4" layout={B4_TOKENS} />;
}
