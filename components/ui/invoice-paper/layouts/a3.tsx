'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { A3_TOKENS } from './a3.tokens';

/** A3 design page — change A3 look here / in a3.tokens.ts only. */
export function A3InvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="a3" layout={A3_TOKENS} />;
}
