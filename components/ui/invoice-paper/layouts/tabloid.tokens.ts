import type { InvoiceLayoutTokens } from '../types';
import { A3_TOKENS } from './a3.tokens';

/** Tabloid — large sheet; edit this file for Tabloid-only changes. */
export const TABLOID_TOKENS: InvoiceLayoutTokens = {
  ...A3_TOKENS,
  id: 'tabloid',
  label: 'Tabloid',
  watermarkSize: '52%',
  watermarkMaxPx: 520,
  watermarkOpacity: 0.03,
};
