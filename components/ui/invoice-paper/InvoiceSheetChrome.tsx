'use client';

import React from 'react';
import type { InvoiceLayoutTokens } from './types';

export interface InvoiceSheetChromeProps {
  layout: InvoiceLayoutTokens;
  logoSrc?: string | null;
  footerCompany?: string;
  /** Optional contact line after company name */
  footerMeta?: string | null;
  pageIndex: number;
  pageCount: number;
  /** When true, only watermark (footer reserved by stage band). */
  watermarkOnly?: boolean;
  className?: string;
}

/**
 * Shared page chrome: watermark + sheet footer.
 * Drawn once per page for every paper size (tokens control sizing).
 */
export function InvoiceSheetChrome({
  layout,
  logoSrc = '/brand/krws-mark.png',
  footerCompany = 'KR Web Solution',
  footerMeta,
  pageIndex,
  pageCount,
  watermarkOnly = false,
  className = '',
}: InvoiceSheetChromeProps) {
  const max = layout.watermarkMaxPx;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      aria-hidden={watermarkOnly ? true : undefined}
      data-inv-chrome={layout.id}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <img
          src={logoSrc || '/brand/krws-mark.png'}
          alt=""
          className="object-contain grayscale"
          style={{
            width: layout.watermarkSize,
            height: layout.watermarkSize,
            maxWidth: max,
            maxHeight: max,
            opacity: layout.watermarkOpacity,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
          }}
        />
      </div>

      {!watermarkOnly && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 border-t border-[#E2E8F0] bg-white text-[#64748B]"
          style={{
            height: layout.footerBandPx,
            paddingLeft: layout.footerPadX,
            paddingRight: layout.footerPadX,
            paddingBottom: `calc(8px * var(--inv-scale, 1))`,
            fontSize: layout.footerFontSize,
          }}
        >
          <p className="min-w-0 leading-snug">
            This is a computer-generated invoice issued by {footerCompany}
            {footerMeta ? ` · ${footerMeta}` : ''}.
          </p>
          <p className="shrink-0 font-medium tabular-nums">
            Page {pageIndex + 1} of {pageCount}
          </p>
        </div>
      )}
    </div>
  );
}
