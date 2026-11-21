'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { TABLOID_TOKENS } from './tabloid.tokens';

/** Tabloid design page — change Tabloid look here / in tabloid.tokens.ts only. */
export function TabloidInvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="tabloid" layout={TABLOID_TOKENS} />;
}
