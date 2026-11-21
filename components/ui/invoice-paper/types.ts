export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price_paise?: number;
  rate_rupees?: number;
  amount_paise?: number;
  line_kind?: string | null;
  detail?: string | null;
  period_label?: string | null;
  hsn_sac?: string | null;
  unit?: string | null;
}

export type PaperInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'proof_pending'
  | 'cancelled'
  | 'void'
  | string;

export interface PaperInvoiceBankDetails {
  beneficiaryName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifsc?: string | null;
  upiId?: string | null;
  paypalId?: string | null;
  blob?: string | null;
}

export interface PaperInvoiceProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPincode?: string;
  clientCountry?: string;
  clientGstin?: string;
  clientPan?: string;
  clientStateCode?: string;
  clientEmail?: string;
  clientPhone?: string;
  gstEnabled?: boolean;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyPan?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companyTagline?: string;
  gstUnregistered?: boolean;
  items: InvoiceLineItem[];
  subtotalPaise: number;
  taxPaise: number;
  taxRatePercent?: number;
  cgstPaise?: number;
  sgstPaise?: number;
  igstPaise?: number;
  discountPaise?: number;
  roundOffPaise?: number;
  amountPaidPaise?: number;
  balanceDuePaise?: number;
  otherChargesPaise?: number;
  creditAdjustmentPaise?: number;
  totalPaise: number;
  amountInWords?: string | null;
  placeOfSupply?: string | null;
  poNumber?: string | null;
  isPaid?: boolean;
  status?: PaperInvoiceStatus;
  invoiceType?: string;
  ledger?: string | null;
  projectName?: string;
  projectRef?: string | null;
  periodLabel?: string | null;
  coversFrom?: string | null;
  coversTo?: string | null;
  notes?: string;
  terms?: string | null;
  resolvedTerms?: string[];
  bankDetails?: string | PaperInvoiceBankDetails;
  wireInstructions?: string[];
  payments?: Array<{
    amount_paise: number;
    method?: string | null;
    reference?: string | null;
    paid_at?: string | null;
  }>;
  upiQrSrc?: string | null;
  parentInvoiceNumber?: string | null;
  paidAt?: string | null;
  logoSrc?: string;
  paperSize?: string;
  className?: string;
  /** @deprecated prefer hideSheetChrome — stage owns footer */
  hideSheetFooter?: boolean;
  /** When true, watermark + footer are drawn by InvoicePaperStage per page. */
  hideSheetChrome?: boolean;
}

/** Design tokens owned by each paper-size layout file. */
export interface InvoiceLayoutTokens {
  /** Stable id, e.g. "a4" */
  id: string;
  label: string;
  padY: string;
  padX: string;
  /** Stack company + doc title vertically */
  headerStack: boolean;
  titleFontSize: string;
  partiesCols: 1 | 2;
  partiesPad: string;
  showHsnColumn: boolean;
  showUnitColumn: boolean;
  showLineKind: boolean;
  showItemDetail: boolean;
  tableFontSize: string;
  tableCellPad: string;
  tableTinyLabels: boolean;
  itemsMarginTop: string;
  totalsStack: boolean;
  totalsMarginTop: string;
  totalBarHeight: string;
  totalBarPadX: string;
  totalLabelSize: string;
  totalAmountSize: string;
  sectionGapAfterHeader: string;
  wordsMarginTop: string;
  termsMarginTop: string;
  /** Shared page chrome — same on every page; values scale per paper size. */
  watermarkSize: string;
  watermarkMaxPx: number;
  watermarkOpacity: number;
  footerBandPx: number;
  footerPadX: string;
  footerFontSize: string;
}
