"use client";

import React from "react";
import { AuthenticatedImage } from "@/components/ui/AuthenticatedImage";
import type { InvoiceLayoutTokens, PaperInvoiceProps } from "./types";
import { InvoiceSheetChrome } from "./InvoiceSheetChrome";
import {
  STATUS_BADGE,
  defaultTerms,
  docTitle,
  formatDate,
  formatRupees,
  invoiceTypeLabel,
  normalizeBank,
  parseTermsList,
  splitDescription,
} from "./helpers";

export function InvoiceDocument({
  invoiceNumber,
  issueDate,
  dueDate,
  clientName,
  clientAddress,
  clientCity,
  clientState,
  clientPincode,
  clientCountry,
  clientGstin,
  clientPan,
  clientStateCode,
  clientEmail,
  clientPhone,
  gstEnabled,
  companyName = "KR Web Solution",
  companyAddress = "Salem, Tamil Nadu, India",
  companyGstin,
  companyPan,
  companyEmail = "billing@krwebsolution.com",
  companyPhone,
  companyWebsite = "www.krwebsolution.com",
  companyTagline = "Web Development | Cloud | Software Solutions",
  gstUnregistered = false,
  items = [],
  subtotalPaise,
  taxPaise,
  taxRatePercent = 0,
  cgstPaise = 0,
  sgstPaise = 0,
  igstPaise = 0,
  discountPaise = 0,
  roundOffPaise = 0,
  amountPaidPaise = 0,
  balanceDuePaise,
  otherChargesPaise = 0,
  creditAdjustmentPaise = 0,
  totalPaise,
  amountInWords,
  placeOfSupply,
  poNumber,
  isPaid = false,
  status,
  invoiceType,
  ledger,
  projectName,
  projectRef,
  periodLabel,
  coversFrom,
  coversTo,
  notes,
  terms,
  resolvedTerms,
  bankDetails,
  wireInstructions,
  payments,
  upiQrSrc,
  parentInvoiceNumber,
  paidAt,
  logoSrc = "/brand/krws-mark.png",
  paperSize = "a4",
  className = "",
  hideSheetFooter = false,
  hideSheetChrome = false,
  layout,
}: PaperInvoiceProps & { layout: InvoiceLayoutTokens }) {
  const useExternalChrome = hideSheetChrome || hideSheetFooter;
  const paidAmt =
    amountPaidPaise > 0
      ? amountPaidPaise
      : isPaid || status === "paid"
        ? totalPaise
        : 0;
  const balance =
    balanceDuePaise != null
      ? balanceDuePaise
      : Math.max(0, totalPaise - paidAmt);
  let effectiveStatus = (status || (isPaid ? "paid" : "sent")).toLowerCase();
  if (
    effectiveStatus === "sent" &&
    paidAmt > 0 &&
    paidAmt < totalPaise
  ) {
    effectiveStatus = "partially_paid";
  }
  const badge = STATUS_BADGE[effectiveStatus];
  const hasTaxAmounts =
    taxPaise > 0 ||
    taxRatePercent > 0 ||
    cgstPaise > 0 ||
    sgstPaise > 0 ||
    igstPaise > 0;
  const gstOn = gstEnabled === true || (gstEnabled !== false && hasTaxAmounts);
  const showGst = gstOn && hasTaxAmounts;
  const title = docTitle(
    invoiceType,
    taxPaise,
    taxRatePercent,
    gstOn,
    effectiveStatus,
  );
  const isCredit = invoiceType === "credit_note";
  const isDebit = invoiceType === "debit_note";
  const bank = normalizeBank(bankDetails);
  const wireLines = (wireInstructions || []).filter(Boolean);
  const typeLabel = invoiceTypeLabel(invoiceType);
  const computedPeriod =
    periodLabel ||
    (coversFrom || coversTo
      ? `${formatDate(coversFrom)}${coversTo ? ` – ${formatDate(coversTo)}` : ""}`
      : null);

  const placeLine = [clientCity, clientState, clientPincode]
    .filter(Boolean)
    .join(", ");
  const addressBlob = (clientAddress || "").toLowerCase();
  const placeAlreadyInAddress =
    !!placeLine &&
    [clientCity, clientState, clientPincode]
      .filter(Boolean)
      .every((part) => addressBlob.includes(String(part).toLowerCase()));
  const showPlaceLine = !!placeLine && !placeAlreadyInAddress;
  const notesList = parseTermsList(notes);
  const termsList = parseTermsList(terms);
  const footerNotes =
    resolvedTerms && resolvedTerms.length > 0
      ? resolvedTerms
      : notesList.length > 0
        ? notesList
        : termsList.length > 0
          ? termsList
          : defaultTerms(effectiveStatus, invoiceType);

  const totalLabel = isCredit
    ? "CREDIT TOTAL"
    : isDebit
      ? "DEBIT TOTAL"
      : effectiveStatus === "paid"
        ? "TOTAL"
        : effectiveStatus === "cancelled" || effectiveStatus === "void"
          ? "TOTAL (NOT PAYABLE)"
          : "TOTAL DUE";

  const showBank =
    !isCredit &&
    effectiveStatus !== "paid" &&
    balance > 0 &&
    (!!bank || wireLines.length > 0);
  const showQr = showBank && !!upiQrSrc;
  const companyGstinDisplay = gstOn
    ? companyGstin || (gstUnregistered ? "N/A" : null)
    : null;
  const companyPanDisplay = gstOn ? companyPan : null;
  const clientGstinDisplay = gstOn ? clientGstin : null;
  const clientPanDisplay = gstOn ? clientPan : null;
  const padY = layout.padY;
  const padX = layout.padX;
  /** HSN/SAC only when GST is on — not needed for non-GST invoices. */
  const showHsn =
    gstOn &&
    layout.showHsnColumn &&
    items.some((it) => !!(it.hsn_sac || "").trim());
  const showUnit =
    layout.showUnitColumn && items.some((it) => !!(it.unit || "").trim());
  const cellPad = layout.tableCellPad;
  const stackHeader = layout.headerStack;
  const partiesCols1 = layout.partiesCols === 1;
  const totalsStack = layout.totalsStack;

  const footerMetaBits = [
    companyWebsite ? companyWebsite.replace(/^https?:\/\//, "") : null,
    companyEmail || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={`relative flex w-full flex-col text-[#0F172A] select-none print:shadow-none ${
        useExternalChrome ? "bg-transparent" : "bg-white"
      } ${className}`}
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "calc(11px * var(--inv-scale, 1))",
      }}
      data-paper-size={paperSize}
      data-inv-layout={layout.id}
    >
      {/* Standalone preview only — multi-page stage draws chrome per page */}
      {!useExternalChrome && (
        <InvoiceSheetChrome
          layout={layout}
          logoSrc={logoSrc}
          footerCompany={companyName}
          footerMeta={footerMetaBits || null}
          pageIndex={0}
          pageCount={1}
        />
      )}

      <div
        className="relative z-[1] flex w-full flex-col"
        style={{
          padding: `${padY} ${padX}`,
          boxSizing: "border-box",
          paddingBottom: useExternalChrome
            ? "calc(12px * var(--inv-scale, 1))"
            : `calc(${layout.footerBandPx}px + 16px)`,
        }}
      >
        <div className="flex w-full flex-col">
          {/* Header */}
          <div
            data-inv-section="header"
            className={
              stackHeader
                ? "flex flex-col gap-3"
                : "flex items-start justify-between gap-[calc(20px*var(--inv-scale,1))]"
            }
          >
            <div className={`min-w-0 ${stackHeader ? "max-w-full" : "max-w-[56%]"}`}>
              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                <img
                  src={logoSrc}
                  alt="KR Web Solution"
                  className="h-[calc(48px*var(--inv-scale,1))] w-auto max-w-[calc(72px*var(--inv-scale,1))] shrink-0 object-contain object-left"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/brand/kr-logo.png";
                  }}
                />
                <div className="min-w-0 pt-0.5">
                  <p
                    className="font-bold leading-tight tracking-tight text-[#172554]"
                    style={{ fontSize: "calc(17px * var(--inv-scale, 1))" }}
                  >
                    {companyName}
                  </p>
                  {companyTagline && (
                    <p
                      className="mt-0.5 font-medium text-[#64748B]"
                      style={{ fontSize: "calc(10px * var(--inv-scale, 1))" }}
                    >
                      {companyTagline}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="mt-3 space-y-0.5 leading-relaxed text-[#334155]"
                style={{ fontSize: "calc(10.5px * var(--inv-scale, 1))" }}
              >
                {companyAddress && (
                  <p className="whitespace-pre-line">{companyAddress}</p>
                )}
                {companyEmail && <p>{companyEmail}</p>}
                {companyWebsite && (
                  <p>{companyWebsite.replace(/^https?:\/\//, "")}</p>
                )}
                {companyPhone && <p>{companyPhone}</p>}
                {companyGstinDisplay && (
                  <p className="font-mono text-[0.95em] text-[#64748B]">
                    GSTIN:{" "}
                    <span className="font-semibold text-[#172554]">
                      {companyGstinDisplay}
                    </span>
                  </p>
                )}
                {companyPanDisplay && (
                  <p className="font-mono text-[0.95em] text-[#64748B]">
                    PAN:{" "}
                    <span className="font-semibold text-[#172554]">
                      {companyPanDisplay}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div
              className={`shrink-0 ${stackHeader ? "text-left" : "text-right"}`}
            >
              <h2
                className="font-bold leading-none tracking-[0.04em] text-[#172554]"
                style={{ fontSize: layout.titleFontSize }}
              >
                {title}
              </h2>
              <div
                className="mt-3 space-y-1 text-[#334155]"
                style={{ fontSize: "calc(10.5px * var(--inv-scale, 1))" }}
              >
                <p>
                  <span className="text-[#64748B]">
                    {isCredit
                      ? "Credit Note #:"
                      : isDebit
                        ? "Debit Note #:"
                        : "Invoice #:"}
                  </span>{" "}
                  <span className="font-semibold text-[#0F172A]">
                    {invoiceNumber}
                  </span>
                </p>
                <p>
                  <span className="text-[#64748B]">Issue Date:</span>{" "}
                  <span className="font-medium text-[#0F172A]">
                    {formatDate(issueDate)}
                  </span>
                </p>
                {!isCredit && (
                  <p>
                    <span className="text-[#64748B]">Due Date:</span>{" "}
                    <span className="font-medium text-[#0F172A]">
                      {formatDate(dueDate)}
                    </span>
                  </p>
                )}
                {poNumber && (
                  <p>
                    <span className="text-[#64748B]">PO Number:</span>{" "}
                    <span className="font-medium text-[#0F172A]">{poNumber}</span>
                  </p>
                )}
                {parentInvoiceNumber && (
                  <p>
                    <span className="text-[#64748B]">Ref Invoice:</span>{" "}
                    <span className="font-medium text-[#0F172A]">
                      {parentInvoiceNumber}
                    </span>
                  </p>
                )}
                {effectiveStatus === "paid" && paidAt && (
                  <p>
                    <span className="text-[#64748B]">Paid On:</span>{" "}
                    <span className="font-medium text-[#0F172A]">
                      {formatDate(paidAt)}
                    </span>
                  </p>
                )}
              </div>
              {badge && (
                <div
                  className="mt-3 inline-flex items-center rounded-[4px] px-3 py-1.5 font-bold tracking-[0.12em]"
                  style={{
                    backgroundColor: badge.bg,
                    color: badge.fg,
                    fontSize: "calc(10px * var(--inv-scale, 1))",
                  }}
                >
                  {badge.label}
                </div>
              )}
            </div>
          </div>

          <div
            className="h-px bg-[#172554]"
            style={{
              margin: `${layout.sectionGapAfterHeader} 0`,
            }}
          />

          {/* Bill to + Project — stacks on tiny sheets */}
          <div
            data-inv-section="parties"
            className={`overflow-hidden rounded-[4px] border border-[#E2E8F0]/80 ${
              partiesCols1 ? "grid grid-cols-1" : "grid grid-cols-2"
            }`}
            style={{ fontSize: "calc(10.5px * var(--inv-scale, 1))" }}
          >
            <div
              className={`min-w-0 ${partiesCols1 ? "border-b border-[#E2E8F0]/80" : "border-r border-[#E2E8F0]/80"}`}
              style={{
                padding: layout.partiesPad,
                backgroundColor: "rgba(248, 250, 252, 0.35)",
              }}
            >
              <p
                className="font-bold uppercase tracking-[0.16em] text-[#172554]"
                style={{ fontSize: "calc(9.5px * var(--inv-scale, 1))" }}
              >
                Bill To
              </p>
              <div
                className="mt-2 h-px w-full bg-[#CBD5E1]"
                aria-hidden
              />
              <p
                className="mt-2.5 font-bold leading-snug text-[#0F172A]"
                style={{ fontSize: "calc(13px * var(--inv-scale, 1))" }}
              >
                {clientName || "Client Name"}
              </p>
              {(clientEmail || clientPhone) && (
                <p className="mt-1.5 leading-relaxed text-[#475569]">
                  {[clientEmail, clientPhone].filter(Boolean).join(" · ")}
                </p>
              )}
              {(clientAddress || showPlaceLine || clientCountry) && (
                <div className="mt-1.5 space-y-0.5 leading-relaxed text-[#334155]">
                  {clientAddress && (
                    <p className="whitespace-pre-line">{clientAddress}</p>
                  )}
                  {showPlaceLine && <p>{placeLine}</p>}
                  {clientCountry && <p>{clientCountry}</p>}
                </div>
              )}
              {(clientGstinDisplay ||
                clientPanDisplay ||
                clientStateCode ||
                placeOfSupply) && (
                <dl
                  className="mt-3 grid gap-y-1 border-t border-[#E2E8F0] pt-2.5"
                  style={{ gridTemplateColumns: "auto 1fr", columnGap: "10px" }}
                >
                  {clientGstinDisplay && (
                    <>
                      <dt className="text-[#64748B]">GSTIN</dt>
                      <dd className="font-mono font-semibold text-[#0F172A]">
                        {clientGstinDisplay}
                      </dd>
                    </>
                  )}
                  {clientPanDisplay && (
                    <>
                      <dt className="text-[#64748B]">PAN</dt>
                      <dd className="font-mono font-semibold text-[#0F172A]">
                        {clientPanDisplay}
                      </dd>
                    </>
                  )}
                  {clientStateCode && (
                    <>
                      <dt className="text-[#64748B]">State code</dt>
                      <dd className="font-semibold text-[#0F172A]">
                        {clientStateCode}
                      </dd>
                    </>
                  )}
                  {placeOfSupply && (
                    <>
                      <dt className="text-[#64748B]">Place of supply</dt>
                      <dd className="font-semibold text-[#0F172A]">
                        {placeOfSupply}
                      </dd>
                    </>
                  )}
                </dl>
              )}
            </div>

            <div
              className="min-w-0"
              style={{
                padding: layout.partiesPad,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <p
                className="font-bold uppercase tracking-[0.16em] text-[#172554]"
                style={{ fontSize: "calc(9.5px * var(--inv-scale, 1))" }}
              >
                Project Details
              </p>
              <div
                className="mt-2 h-px w-full bg-[#CBD5E1]"
                aria-hidden
              />
              {(projectName ||
                typeLabel ||
                projectRef ||
                computedPeriod ||
                (ledger && ledger !== "development")) ? (
                <dl
                  className="mt-2.5 grid gap-y-1.5"
                  style={{ gridTemplateColumns: "auto 1fr", columnGap: "12px" }}
                >
                  {projectName && (
                    <>
                      <dt className="text-[#64748B]">Project</dt>
                      <dd className="font-semibold leading-snug text-[#0F172A]">
                        {projectName}
                      </dd>
                    </>
                  )}
                  {typeLabel && (
                    <>
                      <dt className="text-[#64748B]">Type</dt>
                      <dd className="font-medium text-[#0F172A]">{typeLabel}</dd>
                    </>
                  )}
                  {projectRef && (
                    <>
                      <dt className="text-[#64748B]">Reference</dt>
                      <dd className="font-mono font-medium text-[#0F172A]">
                        {projectRef}
                      </dd>
                    </>
                  )}
                  {computedPeriod && (
                    <>
                      <dt className="text-[#64748B]">Period</dt>
                      <dd className="font-medium text-[#0F172A]">
                        {computedPeriod}
                      </dd>
                    </>
                  )}
                  {ledger && ledger !== "development" && (
                    <>
                      <dt className="text-[#64748B]">Category</dt>
                      <dd className="font-medium capitalize text-[#0F172A]">
                        {ledger}
                      </dd>
                    </>
                  )}
                </dl>
              ) : (
                <p className="mt-2.5 text-[#94A3B8]">No project linked</p>
              )}
            </div>
          </div>

          {/* Line items — translucent so page watermark shows through */}
          <div
            data-inv-section="items"
            className={`${layout.itemsMarginTop} overflow-hidden rounded-[4px] border border-[#E2E8F0]/70`}
            style={{ backgroundColor: "transparent" }}
          >
            <table
              className="w-full border-collapse bg-transparent"
              style={{
                tableLayout: "fixed",
                fontSize: layout.tableFontSize,
              }}
            >
              <colgroup>
                <col style={{ width: layout.tableTinyLabels ? "8%" : "6%" }} />
                <col />
                {showHsn ? <col style={{ width: "12%" }} /> : null}
                <col style={{ width: layout.tableTinyLabels ? "10%" : "8%" }} />
                {showUnit ? <col style={{ width: "8%" }} /> : null}
                <col style={{ width: layout.tableTinyLabels ? "18%" : "14%" }} />
                <col style={{ width: layout.tableTinyLabels ? "20%" : "16%" }} />
              </colgroup>
              <thead>
                <tr
                  className="text-[#172554]"
                  style={{ backgroundColor: "rgba(23, 37, 84, 0.08)" }}
                >
                  <th
                    className={`border-b-2 border-[#172554] text-left font-bold ${layout.tableTinyLabels ? "px-1.5 py-1.5" : "px-3 py-2.5"}`}
                  >
                    #
                  </th>
                  <th className={`border-b-2 border-[#172554] text-left font-bold ${cellPad}`}>
                    {layout.tableTinyLabels ? "Description" : "Item & Description"}
                  </th>
                  {showHsn && (
                    <th className="border-b-2 border-[#172554] px-2 py-2.5 text-center font-bold">
                      HSN/SAC
                    </th>
                  )}
                  <th className={`border-b-2 border-[#172554] text-center font-bold ${cellPad}`}>
                    Qty
                  </th>
                  {showUnit && (
                    <th className="border-b-2 border-[#172554] px-2 py-2.5 text-center font-bold">
                      Unit
                    </th>
                  )}
                  <th className={`border-b-2 border-[#172554] text-right font-bold ${cellPad}`}>
                    {layout.tableTinyLabels ? "Rate" : "Rate (INR)"}
                  </th>
                  <th
                    className={`border-b-2 border-[#172554] text-right font-bold ${layout.tableTinyLabels ? "px-1.5 py-1.5" : "px-3 py-2.5"}`}
                  >
                    {layout.tableTinyLabels ? "Amount" : "Amount (INR)"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const rate =
                    item.rate_rupees ?? (item.unit_price_paise ?? 0) / 100;
                  const amount =
                    item.amount_paise ?? Math.round(item.quantity * rate * 100);
                  const split = item.detail
                    ? { title: item.description, detail: item.detail }
                    : splitDescription(item.description);
                  const unitLabel =
                    (item.unit || "").trim() ||
                    (item.quantity ? "Nos" : "");
                  return (
                    <tr key={item.id || idx} style={{ backgroundColor: "transparent" }}>
                      <td
                        className={`border-t border-[#E2E8F0]/70 align-top font-normal text-[#64748B] ${
                          layout.tableTinyLabels ? "px-1.5 py-1.5" : "px-3 py-2.5"
                        }`}
                      >
                        {idx + 1}
                      </td>
                      <td className={`border-t border-[#E2E8F0]/70 align-top ${cellPad}`}>
                        <p className="break-words font-bold leading-snug text-[#0F172A]">
                          {split.title}
                        </p>
                        {split.detail && layout.showItemDetail && (
                          <p className="mt-0.5 text-[10px] font-normal leading-relaxed text-[#64748B]">
                            {split.detail}
                          </p>
                        )}
                        {item.line_kind && layout.showLineKind && (
                          <p className="mt-0.5 text-[10px] font-normal uppercase tracking-wide text-[#64748B]">
                            {invoiceTypeLabel(item.line_kind) || item.line_kind}
                          </p>
                        )}
                        {item.period_label && layout.showItemDetail && (
                          <p className="mt-0.5 text-[10px] font-normal text-[#64748B]">
                            {item.period_label}
                          </p>
                        )}
                      </td>
                      {showHsn && (
                        <td
                          className="border-t border-[#E2E8F0]/70 px-2 py-2.5 text-center align-top font-mono font-semibold tabular-nums text-[#0F172A]"
                          style={{ fontSize: layout.tableFontSize }}
                        >
                          {(item.hsn_sac || "").trim() || "—"}
                        </td>
                      )}
                      <td
                        className={`border-t border-[#E2E8F0]/70 text-center align-top font-normal tabular-nums text-[#0F172A] ${cellPad}`}
                      >
                        {item.quantity}
                      </td>
                      {showUnit && (
                        <td className="border-t border-[#E2E8F0]/70 px-2 py-2.5 text-center align-top font-normal text-[#0F172A]">
                          {unitLabel || "—"}
                        </td>
                      )}
                      <td
                        className={`border-t border-[#E2E8F0]/70 text-right align-top font-normal tabular-nums text-[#0F172A] ${cellPad}`}
                      >
                        {formatRupees(Math.round(rate * 100))}
                      </td>
                      <td
                        className={`border-t border-[#E2E8F0]/70 text-right align-top font-bold tabular-nums text-[#0F172A] ${
                          layout.tableTinyLabels ? "px-1.5 py-1.5" : "px-3 py-2.5"
                        }`}
                      >
                        {formatRupees(amount)}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5 + (showHsn ? 1 : 0) + (showUnit ? 1 : 0)}
                      className="border-t border-[#E2E8F0]/70 px-3 py-8 text-center text-[#64748B]"
                    >
                      No line items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bank + totals */}
          <div
            data-inv-section="totals"
            className={`${layout.totalsMarginTop} grid gap-3 ${
              totalsStack ? "grid-cols-1" : "grid-cols-1 gap-6 sm:grid-cols-2"
            }`}
          >
            <div>
              {showBank && (
                <>
                  <p
                    className="mb-1.5 font-bold uppercase tracking-[0.14em] text-[#172554]"
                    style={{ fontSize: "calc(11px * var(--inv-scale, 1))" }}
                  >
                    Payment Details
                  </p>
                  {(() => {
                    const cells: Array<{ label: string; value: string }> = [];
                    if (bank?.beneficiaryName)
                      cells.push({
                        label: "Beneficiary",
                        value: bank.beneficiaryName,
                      });
                    if (bank?.bankName)
                      cells.push({ label: "Bank", value: bank.bankName });
                    if (bank?.accountNumber)
                      cells.push({
                        label: "Account No.",
                        value: bank.accountNumber,
                      });
                    if (bank?.ifsc)
                      cells.push({ label: "IFSC", value: bank.ifsc });
                    if (bank?.upiId)
                      cells.push({ label: "UPI ID", value: bank.upiId });
                    if (bank?.paypalId)
                      cells.push({ label: "PayPal", value: bank.paypalId });

                    if (
                      cells.length === 0 &&
                      bank?.blob &&
                      !bank.beneficiaryName &&
                      !bank.bankName &&
                      !bank.accountNumber
                    ) {
                      return (
                        <p
                          className="whitespace-pre-line font-mono leading-relaxed text-[#334155]"
                          style={{
                            fontSize: "calc(10px * var(--inv-scale, 1))",
                          }}
                        >
                          {bank.blob}
                        </p>
                      );
                    }

                    /* Compact 2-column grid — transparent so watermark shows through */
                    return (
                      <div
                        className="grid grid-cols-2 overflow-hidden rounded-[6px] border border-[#E2E8F0]/80 bg-transparent"
                        style={{
                          fontSize: "calc(10.5px * var(--inv-scale, 1))",
                        }}
                      >
                        {cells.map((cell, i) => {
                          const isRight = i % 2 === 1;
                          const prevRow = i >= 2;
                          return (
                            <div
                              key={cell.label}
                              className={[
                                "min-w-0 bg-transparent",
                                isRight ? "border-l border-[#E2E8F0]/80" : "",
                                prevRow ? "border-t border-[#E2E8F0]/80" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              style={{
                                padding:
                                  "calc(6px * var(--inv-scale, 1)) calc(9px * var(--inv-scale, 1))",
                              }}
                            >
                              <p
                                className="font-medium uppercase tracking-wide text-[#94A3B8]"
                                style={{
                                  fontSize:
                                    "calc(8px * var(--inv-scale, 1))",
                                  marginBottom:
                                    "calc(2px * var(--inv-scale, 1))",
                                }}
                              >
                                {cell.label}
                              </p>
                              <p className="break-all font-semibold leading-snug text-[#0F172A]">
                                {cell.value}
                              </p>
                            </div>
                          );
                        })}
                        {cells.length % 2 === 1 ? (
                          <div
                            className={[
                              "border-l border-[#E2E8F0]/80 bg-transparent",
                              cells.length > 1
                                ? "border-t border-[#E2E8F0]/80"
                                : "",
                            ].join(" ")}
                          />
                        ) : null}
                      </div>
                    );
                  })()}
                  {wireLines.length > 0 && (
                    <p
                      className="mt-1.5 leading-snug text-[#64748B]"
                      style={{
                        fontSize: "calc(9px * var(--inv-scale, 1))",
                      }}
                    >
                      {wireLines.join(" · ")}
                    </p>
                  )}
                  {showQr && (
                    <AuthenticatedImage
                      src={upiQrSrc!}
                      alt="UPI QR"
                      className="mt-2 h-20 w-20 rounded border border-[#E2E8F0] bg-white object-contain p-1"
                    />
                  )}
                </>
              )}
              {isCredit && (
                <p
                  className="leading-relaxed text-[#334155]"
                  style={{ fontSize: "calc(11px * var(--inv-scale, 1))" }}
                >
                  Credit adjustment against parent invoice
                  {parentInvoiceNumber ? ` ${parentInvoiceNumber}` : ""}. No
                  payment is due on this credit note.
                </p>
              )}
              {!isCredit && (effectiveStatus === "paid" || balance <= 0) && (
                <div
                  className="space-y-1 text-[#334155]"
                  style={{ fontSize: "calc(11px * var(--inv-scale, 1))" }}
                >
                  <p
                    className="mb-2 font-bold uppercase tracking-[0.14em] text-[#172554]"
                    style={{ fontSize: "calc(11px * var(--inv-scale, 1))" }}
                  >
                    Payment Confirmation
                  </p>
                  {paidAt && (
                    <p>
                      <span className="text-[#64748B]">Payment Date:</span>{" "}
                      <span className="font-medium text-[#0F172A]">
                        {formatDate(paidAt)}
                      </span>
                    </p>
                  )}
                  <p>
                    <span className="text-[#64748B]">Amount Received:</span>{" "}
                    <span className="font-medium text-[#0F172A]">
                      {formatRupees(paidAmt)}
                    </span>
                  </p>
                  {(payments || []).map((p, i) => {
                    const bits = [
                      p.paid_at ? formatDate(p.paid_at) : null,
                      p.method
                        ? p.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        : null,
                      formatRupees(p.amount_paise || 0),
                      p.reference ? `UTR/Ref: ${p.reference}` : null,
                    ].filter(Boolean);
                    return (
                      <p
                        key={i}
                        className="text-[#64748B]"
                        style={{
                          fontSize: "calc(10px * var(--inv-scale, 1))",
                        }}
                      >
                        {bits.join(" · ")}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="space-y-2"
              style={{ fontSize: "calc(11px * var(--inv-scale, 1))" }}
            >
              <div className="flex justify-between text-[#334155]">
                <span>Subtotal</span>
                <span className="tabular-nums text-[#0F172A]">
                  {formatRupees(subtotalPaise)}
                </span>
              </div>
              {discountPaise > 0 && (
                <div className="flex justify-between text-[#334155]">
                  <span>Discount</span>
                  <span className="tabular-nums text-[#0F172A]">
                    −{formatRupees(discountPaise)}
                  </span>
                </div>
              )}
              {showGst && (cgstPaise > 0 || sgstPaise > 0 || igstPaise > 0) ? (
                <>
                  {cgstPaise > 0 && (
                    <div className="flex justify-between text-[#334155]">
                      <span>CGST ({(taxRatePercent / 2).toString().replace(/\.0$/, "")}%)</span>
                      <span className="tabular-nums text-[#0F172A]">
                        {formatRupees(cgstPaise)}
                      </span>
                    </div>
                  )}
                  {sgstPaise > 0 && (
                    <div className="flex justify-between text-[#334155]">
                      <span>SGST ({(taxRatePercent / 2).toString().replace(/\.0$/, "")}%)</span>
                      <span className="tabular-nums text-[#0F172A]">
                        {formatRupees(sgstPaise)}
                      </span>
                    </div>
                  )}
                  {igstPaise > 0 && (
                    <div className="flex justify-between text-[#334155]">
                      <span>IGST ({taxRatePercent}%)</span>
                      <span className="tabular-nums text-[#0F172A]">
                        {formatRupees(igstPaise)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                showGst && (
                  <div className="flex justify-between text-[#334155]">
                    <span>GST ({taxRatePercent}%)</span>
                    <span className="tabular-nums text-[#0F172A]">
                      {formatRupees(taxPaise)}
                    </span>
                  </div>
                )
              )}
              {roundOffPaise !== 0 && (
                <div className="flex justify-between text-[#334155]">
                  <span>Round Off</span>
                  <span className="tabular-nums text-[#0F172A]">
                    {formatRupees(roundOffPaise)}
                  </span>
                </div>
              )}
              {otherChargesPaise > 0 && (
                <div className="flex justify-between text-[#334155]">
                  <span>Other Charges</span>
                  <span className="tabular-nums text-[#0F172A]">
                    {formatRupees(otherChargesPaise)}
                  </span>
                </div>
              )}
              {creditAdjustmentPaise > 0 && (
                <div className="flex justify-between text-[#334155]">
                  <span>Credit Adjustment</span>
                  <span className="tabular-nums text-[#0F172A]">
                    −{formatRupees(creditAdjustmentPaise)}
                  </span>
                </div>
              )}
              <div
                className={`mt-1 flex items-center justify-between rounded-[5px] bg-[#172554] text-white ${layout.totalBarHeight} ${layout.totalBarPadX}`}
              >
                <span className={`font-bold tracking-wide ${layout.totalLabelSize}`}>
                  {totalLabel}
                </span>
                <span className={`font-bold tabular-nums ${layout.totalAmountSize}`}>
                  {formatRupees(totalPaise)}
                </span>
              </div>
              {!isCredit && (paidAmt > 0 || effectiveStatus === "paid") && (
                <>
                  <div className="flex justify-between text-[#334155]">
                    <span>Amount Paid</span>
                    <span className="tabular-nums text-[#0F172A]">
                      {formatRupees(paidAmt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#334155]">
                    <span>Balance Due</span>
                    <span className="tabular-nums font-semibold text-[#0F172A]">
                      {formatRupees(balance)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div data-inv-section="words-terms">
            {amountInWords && (
              <p
                className={`leading-relaxed text-[#334155] ${layout.wordsMarginTop}`}
              >
                <span className="font-semibold text-[#172554]">
                  Amount in words:
                </span>{" "}
                {amountInWords}
              </p>
            )}

            {footerNotes.length > 0 && (
              <div className={layout.termsMarginTop}>
                <p
                  className="mb-2 font-bold uppercase tracking-[0.14em] text-[#172554]"
                  style={{ fontSize: "calc(11px * var(--inv-scale, 1))" }}
                >
                  Terms &amp; Conditions
                </p>
                <ol
                  className="list-decimal space-y-1 pl-4 leading-relaxed text-[#334155]"
                  style={{ fontSize: "calc(11px * var(--inv-scale, 1))" }}
                >
                  {footerNotes.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
