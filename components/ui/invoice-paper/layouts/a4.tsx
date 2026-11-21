'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { A4_TOKENS } from './a4.tokens';

/** A4 design page — change A4 look here / in a4.tokens.ts only. */
export function A4InvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="a4" layout={A4_TOKENS} />;
}
