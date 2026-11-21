import type { InvoiceLayoutTokens } from '../types';
import { A4_TOKENS } from './a4.tokens';

/** Legal — taller US sheet; edit this file for Legal-only changes. */
export const LEGAL_TOKENS: InvoiceLayoutTokens = {
  ...A4_TOKENS,
  id: 'legal',
  label: 'Legal',
  padY: 'calc(30px * var(--inv-scale, 1))',
};
