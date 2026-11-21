'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { A5_TOKENS } from './a5.tokens';

/** A5 design page — change A5 look here / in a5.tokens.ts only. */
export function A5InvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="a5" layout={A5_TOKENS} />;
}
