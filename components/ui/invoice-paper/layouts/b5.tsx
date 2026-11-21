'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { B5_TOKENS } from './b5.tokens';

/** B5 design page — change B5 look here / in b5.tokens.ts only. */
export function B5InvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="b5" layout={B5_TOKENS} />;
}
