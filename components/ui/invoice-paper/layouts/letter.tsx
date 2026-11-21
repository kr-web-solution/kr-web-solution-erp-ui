'use client';

import React from 'react';
import { InvoiceDocument } from '../InvoiceDocument';
import type { PaperInvoiceProps } from '../types';
import { LETTER_TOKENS } from './letter.tokens';

/** Letter design page — change Letter look here / in letter.tokens.ts only. */
export function LetterInvoiceLayout(props: PaperInvoiceProps) {
  return <InvoiceDocument {...props} paperSize="letter" layout={LETTER_TOKENS} />;
}
