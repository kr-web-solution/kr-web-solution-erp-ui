'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { A6_TOKENS } from './a6.tokens';

/** A6 design page — change A6 look here / in a6.tokens.ts only. */
export function A6InvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="a6" layout={A6_TOKENS} />;
}
