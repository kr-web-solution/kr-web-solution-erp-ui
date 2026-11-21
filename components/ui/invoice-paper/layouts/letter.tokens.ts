import type { InvoiceLayoutTokens } from '../types';
import { A4_TOKENS } from './a4.tokens';

/** Letter — US sheet; edit this file for Letter-only changes. */
export const LETTER_TOKENS: InvoiceLayoutTokens = {
  ...A4_TOKENS,
  id: 'letter',
  label: 'Letter',
};
