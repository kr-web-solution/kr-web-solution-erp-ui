import type { InvoiceLayoutTokens } from '../types';
import { A4_TOKENS } from './a4.tokens';

/** A3 — spacious variant of A4. Edit this file for A3-only changes. */
export const A3_TOKENS: InvoiceLayoutTokens = {
  ...A4_TOKENS,
  id: 'a3',
  label: 'A3',
  padY: 'calc(36px * var(--inv-scale, 1))',
  padX: 'calc(40px * var(--inv-scale, 1))',
  titleFontSize: 'calc(32px * var(--inv-scale, 1))',
  tableFontSize: 'calc(13px * var(--inv-scale, 1))',
  sectionGapAfterHeader: 'calc(22px * var(--inv-scale, 1))',
  itemsMarginTop: 'mt-8',
  totalsMarginTop: 'mt-8',
  totalBarHeight: 'h-[calc(48px*var(--inv-scale,1))]',
  totalLabelSize: 'text-[length:calc(14px*var(--inv-scale,1))]',
  totalAmountSize: 'text-[length:calc(18px*var(--inv-scale,1))]',
  wordsMarginTop: 'mt-5 text-[length:calc(12px*var(--inv-scale,1))]',
  // Largest sheet → largest watermark; smaller sizes step down from here.
  watermarkSize: '55%',
  watermarkMaxPx: 560,
  watermarkOpacity: 0.03,
  footerBandPx: 48,
  footerPadX: 'calc(32px * var(--inv-scale, 1))',
  footerFontSize: 'calc(10px * var(--inv-scale, 1))',
};
