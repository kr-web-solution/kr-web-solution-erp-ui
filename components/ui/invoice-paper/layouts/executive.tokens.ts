import type { InvoiceLayoutTokens } from '../types';
import { A5_TOKENS } from './a5.tokens';

/** Executive — compact US sheet; edit this file for Executive-only changes. */
export const EXECUTIVE_TOKENS: InvoiceLayoutTokens = {
  ...A5_TOKENS,
  id: 'executive',
  label: 'Executive',
};
