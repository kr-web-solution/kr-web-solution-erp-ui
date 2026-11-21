"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronUpIcon } from "@/components/icons/go-to-up";
import {
  getInvoicePaperDimsMm,
  type InvoicePaperOrientation,
  type InvoicePaperSize,
  INVOICE_PAPER_SIZES,
} from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { InvoiceSheetChrome } from "@/components/ui/invoice-paper/InvoiceSheetChrome";
import { resolveInvoiceLayoutTokens } from "@/components/ui/invoice-paper/registry";

/** CSS px width for A4 portrait preview at ~96dpi (210mm). */
const A4_REF_MM = 210;
const A4_REF_PX = 794;

export function paperDesignSize(
  paperSize: InvoicePaperSize | string,
  orientation: InvoicePaperOrientation | string = "portrait",
) {
  const { paper, wMm, hMm, dims, landscape } = getInvoicePaperDimsMm(
    paperSize,
    orientation,
  );
  const widthPx = (wMm / A4_REF_MM) * A4_REF_PX;
  const heightPx = (hMm / wMm) * widthPx;
  const key = String(paperSize || "a4").toLowerCase();
  // Keep small sheets readable; A3 landscape gets a higher type scale (wide sheet).
  const maxScale = key === "a3" && landscape ? 1.7 : 1.35;
  const contentScale = Math.max(0.78, Math.min(maxScale, wMm / A4_REF_MM));
  return { paper, widthPx, heightPx, contentScale, wMm, hMm, dims, landscape };
}

export type InvoicePaperDensity = "comfortable" | "compact" | "tiny";

export function invoicePaperDensity(
  paperSize?: InvoicePaperSize | string | null,
): InvoicePaperDensity {
  const key = (paperSize || "a4").toLowerCase();
  if (key === "a6") return "tiny";
  if (key === "a5" || key === "b5" || key === "executive") return "compact";
  return "comfortable";
}

function computeSectionBreaks(
  sections: Array<{ top: number; bottom: number }>,
  contentHeight: number,
  firstPageBodyH: number,
  laterPageBodyH: number,
): number[] {
  if (contentHeight <= firstPageBodyH + 1) return [0];

  const breaks = [0];
  let pageStart = 0;
  let pageIndex = 0;

  const bodyHForPage = () =>
    pageIndex === 0 ? firstPageBodyH : laterPageBodyH;

  const pushBreak = (at: number) => {
    const snapped = Math.max(pageStart + 1, Math.min(at, contentHeight));
    if (snapped - pageStart < 8) return;
    if (breaks[breaks.length - 1] === snapped) return;
    breaks.push(snapped);
    pageStart = snapped;
    pageIndex += 1;
  };

  for (const section of sections) {
    const top = Math.max(0, section.top);
    const bottom = Math.max(top, section.bottom);
    const pageBodyH = bodyHForPage();

    // Start a new page before this section if it won't fit on the current one.
    if (bottom - pageStart > pageBodyH + 0.5 && top > pageStart + 0.5) {
      pushBreak(top);
    }

    // Oversized section (e.g. long table): hard-slice only this block.
    while (bottom - pageStart > bodyHForPage() + 0.5) {
      pushBreak(pageStart + bodyHForPage());
    }
  }

  return breaks;
}

export interface InvoicePaperStageProps {
  paperSize: InvoicePaperSize;
  onPaperSizeChange: (size: InvoicePaperSize) => void;
  orientation?: InvoicePaperOrientation;
  onOrientationChange?: (orientation: InvoicePaperOrientation) => void;
  toolbarRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fillViewport?: boolean;
  footerCompany?: string;
  footerMeta?: string | null;
  watermarkSrc?: string | null;
}

/**
 * Multi-page desk preview with section-aware page breaks.
 * Watermark + footer are shared page chrome on every page (sized per layout tokens).
 * Portrait / landscape available for every paper size.
 */
export function InvoicePaperStage({
  paperSize,
  onPaperSizeChange,
  orientation = "portrait",
  onOrientationChange,
  toolbarRight,
  children,
  className,
  fillViewport = false,
  footerCompany = "KR Web Solution",
  footerMeta = null,
  watermarkSrc = null,
}: InvoicePaperStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [breaks, setBreaks] = useState<number[]>([0]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [orientSpin, setOrientSpin] = useState(0);
  const { paper, widthPx, heightPx, contentScale } = useMemo(
    () => paperDesignSize(paperSize, orientation),
    [paperSize, orientation],
  );
  const density = invoicePaperDensity(paperSize);
  const layout = useMemo(
    () => resolveInvoiceLayoutTokens(paperSize),
    [paperSize],
  );

  const footerBand = Math.max(28, layout.footerBandPx * contentScale);
  /** Continuation header on pages 2+ — taller on A3 so top isn’t flush. */
  const contHeaderBase = paperSize === "a3" ? 72 : 56;
  const contHeaderH = Math.max(52, Math.round(contHeaderBase * contentScale));
  /** Gap between continuation header and body so content doesn’t look overlapped. */
  const contBodyPadTop = Math.max(
    16,
    Math.round((paperSize === "a3" ? 28 : 20) * contentScale),
  );
  const firstPageBodyH = Math.max(140, heightPx - footerBand);
  const laterPageBodyH = Math.max(
    120,
    firstPageBodyH - contHeaderH - contBodyPadTop,
  );

  const childProps = React.isValidElement(children)
    ? (children.props as {
        logoSrc?: string;
        invoiceNumber?: string;
        companyName?: string;
      })
    : null;
  const chromeLogo =
    watermarkSrc || childProps?.logoSrc || "/brand/krws-mark.png";
  const invoiceNumber = childProps?.invoiceNumber || "";
  const headerCompany = childProps?.companyName || footerCompany;

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const total = Math.ceil(
      root.scrollHeight || root.getBoundingClientRect().height,
    );
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-inv-section]"),
    );
    const rootTop = root.getBoundingClientRect().top;
    const sections =
      nodes.length > 0
        ? nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            const top = rect.top - rootTop;
            return { top, bottom: top + rect.height };
          })
        : [{ top: 0, bottom: total }];

    const nextBreaks = computeSectionBreaks(
      sections,
      total,
      firstPageBodyH,
      laterPageBodyH,
    );
    setContentHeight(total);
    setBreaks((prev) =>
      prev.length === nextBreaks.length &&
      prev.every((v, i) => Math.abs(v - nextBreaks[i]) < 1)
        ? prev
        : nextBreaks,
    );
  }, [firstPageBodyH, laterPageBodyH]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () => {
      // Fit to width only — height fit shrinks landscape sheets into a tiny preview.
      // User scrolls vertically for tall / multi-page content.
      const availW = Math.max(0, el.clientWidth - 24);
      if (availW <= 0) return;
      setFitScale(Math.min(1, availW / widthPx));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [widthPx]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 120);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [
    measure,
    children,
    widthPx,
    heightPx,
    contentScale,
    paperSize,
    orientation,
    density,
  ]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const pageCount = breaks.length;
  const displayW = widthPx * fitScale;
  const displayH = heightPx * fitScale;

  const invStyle = {
    ["--inv-scale" as string]: String(contentScale),
  } as React.CSSProperties;

  const content = (
    <div
      className="w-full bg-transparent"
      style={invStyle}
      data-inv-density={density}
      data-inv-layout={layout.id}
    >
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              hideSheetFooter?: boolean;
              hideSheetChrome?: boolean;
              paperSize?: string;
            }>,
            {
              hideSheetFooter: true,
              hideSheetChrome: true,
              paperSize,
            },
          )
        : children}
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E6E8EE] bg-[#F3F4F7] shadow-sm",
        fillViewport && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <div className="shrink-0 border-b border-[#E6E8EE] bg-white px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Mobile: stacked. sm+: orientation left, size truly centered, actions right */}
        <div className="flex flex-col gap-2.5 sm:relative sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center justify-between gap-2 sm:contents">
            <button
              type="button"
              title={
                orientation === "landscape"
                  ? "Switch to Portrait"
                  : "Switch to Landscape"
              }
              aria-label={
                orientation === "landscape"
                  ? "Switch to Portrait"
                  : "Switch to Landscape"
              }
              aria-pressed={orientation === "landscape"}
              disabled={!onOrientationChange}
              onClick={() => {
                setOrientSpin((n) => n + 1);
                onOrientationChange?.(
                  orientation === "portrait" ? "landscape" : "portrait",
                );
              }}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6E8EE] bg-white transition-colors sm:z-10",
                "hover:bg-[#F8FAFC] disabled:opacity-50",
              )}
            >
              <img
                src="/icon/screen-rotate.png"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain will-change-transform"
                style={{
                  transform: `rotate(${orientSpin * 180}deg)`,
                  transition: "transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1)",
                }}
                draggable={false}
              />
            </button>

            {toolbarRight ? (
              <div className="flex shrink-0 flex-nowrap items-center gap-2 sm:z-10 sm:ml-auto">
                {toolbarRight}
              </div>
            ) : (
              <div className="hidden sm:block sm:ml-auto" />
            )}
          </div>

          <label
            className="inline-flex h-9 w-full items-center sm:absolute sm:left-1/2 sm:top-1/2 sm:z-0 sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:justify-center sm:pointer-events-none"
            title="Paper size"
          >
            <select
              value={paperSize}
              onChange={(e) =>
                onPaperSizeChange(e.target.value as InvoicePaperSize)
              }
              className="pointer-events-auto h-9 w-full max-w-full rounded-lg border border-[#E6E8EE] bg-white px-2.5 text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#E32B2B]/20 sm:w-auto sm:min-w-[11.5rem] sm:max-w-[min(100%,16rem)]"
              aria-label="Invoice paper size"
            >
              {INVOICE_PAPER_SIZES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} · {opt.dims}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div
        className="pointer-events-none absolute left-[-10000px] top-0 overflow-hidden"
        aria-hidden
      >
        <div ref={measureRef} style={{ width: widthPx }}>
          {content}
        </div>
      </div>

      {showScrollTop ? (
        <button
          type="button"
          title="Back to top"
          aria-label="Back to top"
          onClick={() =>
            hostRef.current?.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="absolute bottom-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E6E8EE] bg-white text-[#172554] shadow-md transition hover:border-[#172554]/30 hover:bg-[#F8FAFC] sm:bottom-4 sm:right-4"
        >
          <ChevronUpIcon size={18} />
        </button>
      ) : null}

      <div
        ref={hostRef}
        className={cn(
          "flex min-w-0 flex-col items-center gap-4 overflow-x-auto overflow-y-auto p-3 sm:gap-6 sm:p-4 md:gap-8 md:p-6",
          fillViewport && "min-h-0 flex-1",
        )}
        style={fillViewport ? undefined : { maxHeight: "min(70vh, 1100px)" }}
      >
        {breaks.map((sliceStart, pageIndex) => {
          const sliceEnd =
            pageIndex + 1 < breaks.length
              ? breaks[pageIndex + 1]
              : Math.max(contentHeight, sliceStart + 1);
          const sliceH = Math.max(1, sliceEnd - sliceStart);
          const isContinued = pageIndex > 0;
          const pageBodyH = isContinued ? laterPageBodyH : firstPageBodyH;

          return (
            <div
              key={pageIndex}
              className="relative shrink-0 overflow-hidden bg-white shadow-[0_24px_64px_-28px_rgba(15,23,42,0.45)] ring-1 ring-black/5 transition-[width,height] duration-300 ease-out"
              style={{ width: displayW, height: displayH }}
              aria-label={`${paper.label} invoice preview page ${pageIndex + 1} of ${pageCount}`}
            >
              <div
                className="relative origin-top-left overflow-hidden"
                style={{
                  width: widthPx,
                  height: heightPx,
                  transform: `scale(${fitScale})`,
                  ...invStyle,
                }}
              >
                {/* Shared chrome: watermark on every page (size from layout tokens) */}
                <InvoiceSheetChrome
                  layout={{ ...layout, footerBandPx: footerBand }}
                  logoSrc={chromeLogo}
                  footerCompany={footerCompany}
                  footerMeta={footerMeta}
                  pageIndex={pageIndex}
                  pageCount={pageCount}
                  watermarkOnly
                />

                {/* Continuation header on pages 2+ */}
                {isContinued ? (
                  <div
                    className="relative z-[2] flex items-center gap-3 border-b border-[#E2E8F0] bg-white"
                    style={{
                      height: contHeaderH,
                      boxSizing: "border-box",
                      paddingTop: `calc(${paperSize === "a3" ? 18 : 12}px * var(--inv-scale, 1))`,
                      paddingBottom: `calc(${paperSize === "a3" ? 14 : 10}px * var(--inv-scale, 1))`,
                      paddingLeft: layout.padX,
                      paddingRight: layout.padX,
                    }}
                  >
                    <img
                      src={chromeLogo}
                      alt=""
                      className="shrink-0 object-contain"
                      style={{
                        width: Math.round(
                          (paperSize === "a3" ? 34 : 28) * contentScale,
                        ),
                        height: Math.round(
                          (paperSize === "a3" ? 34 : 28) * contentScale,
                        ),
                      }}
                      draggable={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-semibold leading-tight text-[#0F172A]"
                        style={{
                          /* Match page-1 company name scale */
                          fontSize: "calc(17px * var(--inv-scale, 1))",
                        }}
                      >
                        {headerCompany}
                      </p>
                      <p
                        className="truncate leading-tight text-[#64748B]"
                        style={{
                          fontSize: "calc(10.5px * var(--inv-scale, 1))",
                          marginTop: "calc(2px * var(--inv-scale, 1))",
                        }}
                      >
                        {invoiceNumber
                          ? `Invoice ${invoiceNumber} · Continued`
                          : "Continued"}
                      </p>
                    </div>
                    <p
                      className="shrink-0 font-medium tabular-nums text-[#64748B]"
                      style={{
                        fontSize: "calc(10.5px * var(--inv-scale, 1))",
                      }}
                    >
                      Page {pageIndex + 1} of {pageCount}
                    </p>
                  </div>
                ) : null}

                <div
                  className="relative z-[1] overflow-hidden bg-transparent"
                  style={{
                    width: widthPx,
                    height: pageBodyH + (isContinued ? contBodyPadTop : 0),
                    paddingTop: isContinued ? contBodyPadTop : 0,
                    boxSizing: "border-box",
                  }}
                >
                  {/* Clip exactly to this page's section range — no bleed into next page */}
                  <div
                    style={{
                      height: Math.min(sliceH, pageBodyH),
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: widthPx,
                        transform: `translateY(-${sliceStart}px)`,
                      }}
                    >
                      {content}
                    </div>
                  </div>
                </div>

                {/* Shared chrome: footer on every page */}
                <div
                  className="absolute bottom-0 left-0 right-0 z-[2] flex items-end justify-between gap-3 border-t border-[#E2E8F0] bg-white text-[#64748B]"
                  style={{
                    height: footerBand,
                    paddingLeft: layout.footerPadX,
                    paddingRight: layout.footerPadX,
                    paddingBottom: `calc(8px * var(--inv-scale, 1))`,
                    fontSize: layout.footerFontSize,
                  }}
                >
                  <p className="min-w-0 leading-snug">
                    This is a computer-generated invoice issued by{" "}
                    {footerCompany}
                    {footerMeta ? ` · ${footerMeta}` : ""}.
                  </p>
                  <p className="shrink-0 font-medium tabular-nums">
                    Page {pageIndex + 1} of {pageCount}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
