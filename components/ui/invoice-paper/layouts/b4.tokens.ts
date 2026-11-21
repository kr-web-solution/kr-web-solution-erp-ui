import type { InvoiceLayoutTokens } from '../types';
import { A4_TOKENS } from './a4.tokens';

/** B4 — edit this file for B4-only changes. */
export const B4_TOKENS: InvoiceLayoutTokens = {
  ...A4_TOKENS,
  id: 'b4',
  label: 'B4',
  padY: 'calc(32px * var(--inv-scale, 1))',
  padX: 'calc(36px * var(--inv-scale, 1))',
  watermarkSize: '48%',
  watermarkMaxPx: 400,
  watermarkOpacity: 0.032,
};
