'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  invoicesApi,
  lateFeeApi,
  type InvoicePaperOrientation,
  type InvoicePaperSize,
} from '@/lib/api/client';
import { Invoice, LateFeeDecisionRequest } from '@/lib/types';
import { isPrivileged } from '@/lib/roles';
import {
  ArrowLeft,
  Mail,
  Trash2,
  FileText,
  Clock,
  Check,
  Send,
  Pencil,
  AlertTriangle,
  Building2,
  Calendar,
  Sparkles,
  Ban,
  Receipt,
  Copy,
  Upload,
  Eye,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { DownloadIcon } from '@/components/icons/download';
import { PrinterCheckIcon } from '@/components/icons/printer-check';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaperInvoice, InvoiceLineItem } from '@/components/ui/PaperInvoice';
import { InvoicePaperStage } from '@/components/ui/InvoicePaperStage';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { InvoiceDetailSkeleton } from '@/components/ui/Skeleton';
import { AuthenticatedImage } from '@/components/ui/AuthenticatedImage';
import {
  canSoftEditInvoice,
  invoiceTypeLabel,
  isInvoiceDocumentLocked,
} from '@/lib/invoices/labels';
import { toast } from 'sonner';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const invoiceId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [showCreditPrompt, setShowCreditPrompt] = useState(false);
  const [showDebitPrompt, setShowDebitPrompt] = useState(false);
  const [isDebiting, setIsDebiting] = useState(false);
  const [debitAmountRupees, setDebitAmountRupees] = useState('');
  const [debitReason, setDebitReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCrediting, setIsCrediting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Late Fee Decision Modal State
  const [isLateFeeModalOpen, setIsLateFeeModalOpen] = useState(false);
  const [decisionData, setDecisionData] = useState<{
    action_type: 'send_now' | 'schedule' | 'waive' | 'extend';
    fee_type: 'fixed' | 'percent';
    fee_value: number;
    reason: string;
    send_on: string;
    repeat_every_days: number | undefined;
    extend_days: number;
    reminder_every_hours: number;
  }>({
    action_type: 'send_now',
    fee_type: 'percent',
    fee_value: 5,
    reason: 'Payment not received by due date',
    send_on: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    repeat_every_days: 2,
    extend_days: 5,
    reminder_every_hours: 24,
  });
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [paperSize, setPaperSize] = useState<InvoicePaperSize>('a4');
  const [paperOrientation, setPaperOrientation] =
    useState<InvoicePaperOrientation>('portrait');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isViewingPdf, setIsViewingPdf] = useState(false);

  const fetchInvoice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await invoicesApi.get(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load invoice.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const res = await invoicesApi.sendEmail(invoiceId);
      toast.success(res.message || 'Invoice emailed to client contact');
      fetchInvoice();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true);
    try {
      const updated = await invoicesApi.markPaid(invoiceId);
      setInvoice(updated);
      toast.success('Invoice marked as paid! Receipt emailed to client.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update invoice payment.');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleVerifyAndPaid = async () => {
    setIsVerifyingPayment(true);
    try {
      const updated = await invoicesApi.verifyPayment(invoiceId);
      setInvoice(updated);
      toast.success('Payment verified. Paid receipt emailed to client.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to verify payment.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleUploadProof = async (file: File | null) => {
    if (!file) return;
    setIsUploadingProof(true);
    try {
      const updated = await invoicesApi.uploadPaymentProof(invoiceId, file, proofNote);
      setInvoice(updated);
      setProofNote('');
      toast.success('Payment proof uploaded. Waiting for verification.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload payment proof.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleOpenProof = async () => {
    try {
      await invoicesApi.openPaymentProof(invoiceId);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open payment proof.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setIsDownloadingPdf(true);
    try {
      const safeName = `${invoice.invoice_number || 'invoice'}`.replace(
        /[^\w.\-]+/g,
        '-'
      );
      await invoicesApi.downloadPdf(invoice.id, {
        paperSize,
        orientation: paperOrientation,
        filename: `${safeName}.pdf`,
      });
      toast.success(`Downloaded ${safeName}.pdf`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleViewPdf = async () => {
    if (!invoice) return;
    setIsViewingPdf(true);
    try {
      await invoicesApi.viewPdf(invoice.id, paperSize, paperOrientation);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open PDF.');
    } finally {
      setIsViewingPdf(false);
    }
  };

  const handleDelete = async () => {
    if (invoice?.can_delete !== true) {
      toast.error(
        'You can only delete the latest invoice in this number series. Cancel this invoice instead (number + details stay frozen), then create a new invoice with the same details.'
      );
      setShowDeletePrompt(false);
      return;
    }
    try {
      await invoicesApi.delete(invoiceId);
      toast.success('Invoice deleted');
      router.push('/invoices');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete invoice.');
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const updated = await invoicesApi.cancel(invoiceId);
      setInvoice(updated);
      setShowCancelPrompt(false);
      toast.success('Invoice cancelled');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel invoice.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCreditNote = async () => {
    setIsCrediting(true);
    try {
      const cn = await invoicesApi.creditNote(invoiceId);
      setShowCreditPrompt(false);
      toast.success(`Credit note ${cn.invoice_number} created`);
      router.push(`/invoices/${cn.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create credit note.');
    } finally {
      setIsCrediting(false);
    }
  };

  const handleDebitNote = async () => {
    const rupees = parseFloat(debitAmountRupees);
    if (!(rupees > 0)) {
      toast.error('Enter a debit amount greater than zero');
      return;
    }
    setIsDebiting(true);
    try {
      const dn = await invoicesApi.debitNote(invoiceId, {
        amount_paise: Math.round(rupees * 100),
        reason: debitReason.trim() || undefined,
      });
      setShowDebitPrompt(false);
      setDebitAmountRupees('');
      setDebitReason('');
      toast.success(`Debit note ${dn.invoice_number} created`);
      router.push(`/invoices/${dn.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create debit note.');
    } finally {
      setIsDebiting(false);
    }
  };

  const handleLateFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDecision(true);
    try {
      const payload: LateFeeDecisionRequest = {
        action: decisionData.action_type,
        fee_type: decisionData.fee_type,
        fee_value: Number(decisionData.fee_value),
        reason: decisionData.reason,
        send_on: decisionData.action_type === 'schedule' ? decisionData.send_on : undefined,
        repeat_every_days: decisionData.repeat_every_days
          ? Number(decisionData.repeat_every_days)
          : undefined,
        extend_days:
          decisionData.action_type === 'extend' ? Number(decisionData.extend_days) : undefined,
        reminder_every_hours: Number(decisionData.reminder_every_hours) || undefined,
      };

      await lateFeeApi.decideForInvoice(invoiceId, payload);
      toast.success(
        decisionData.action_type === 'extend' ? 'Due date extended' : 'Overdue decision recorded'
      );
      setIsLateFeeModalOpen(false);
      fetchInvoice();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record late fee decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  if (isLoading) {
    return <InvoiceDetailSkeleton />;
  }

  if (error || !invoice) {
    return (
      <div className="py-12">
        <EmptyState
          title="Invoice Not Found"
          subtitle={error || 'Could not locate invoice record in system.'}
          action={{
            label: 'Back to Invoices',
            onClick: () => router.push('/invoices'),
            icon: <ArrowLeft className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const isFounder = isPrivileged(user?.role);
  const isClient = user?.role === 'client';
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';
  const isProofPending = invoice.status === 'proof_pending';
  const isCancelled = invoice.status === 'cancelled' || invoice.status === 'void';
  const isCreditNote = invoice.invoice_type === 'credit_note';
  const isDebitNote = invoice.invoice_type === 'debit_note';
  const isAdjustmentNote = isCreditNote || isDebitNote;
  const documentLocked = isInvoiceDocumentLocked(invoice);
  const canSoftEdit = isFounder && canSoftEditInvoice(invoice);
  const typeChip = invoiceTypeLabel(invoice.invoice_type);
  const hasProof = Boolean(invoice.has_payment_proof);
  const canUploadProof =
    !isCancelled &&
    !isCreditNote &&
    (((isClient || isFounder) &&
      ['sent', 'overdue', 'proof_pending'].includes(invoice.status)) ||
      (isFounder && isPaid));
  const showPayPanel =
    !isPaid && !isCancelled && !isCreditNote && (isClient || isFounder);
  const showProofCard = hasProof || canUploadProof;
  const qrSrc = invoice.payment_upi_qr_url || null;
  const wireLines =
    invoice.payment_wire_lines?.length
      ? invoice.payment_wire_lines
      : (invoice.payment_bank_wire_instructions || '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
  const cgst = invoice.cgst_paise || 0;
  const sgst = invoice.sgst_paise || 0;
  const igst = invoice.igst_paise || 0;
  const hasSplitGst = cgst > 0 || sgst > 0 || igst > 0;

  const previewItems: InvoiceLineItem[] = (invoice.items || []).map((it) => ({
    id: it.id,
    description: it.description,
    quantity: it.quantity,
    unit_price_paise: it.unit_rate_paise,
    amount_paise: it.amount_paise || (it.unit_rate_paise * it.quantity),
    hsn_sac: it.hsn_sac || undefined,
    unit: it.unit || undefined,
    line_kind: it.line_kind || undefined,
  }));

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 xl:h-[calc(100dvh-7rem)] xl:min-h-0 xl:overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2 text-xs text-[#64748B]">
            <Link href="/invoices" className="hover:text-[#0F172A] transition-colors">
              Invoices
            </Link>
            <span>/</span>
            <span className="truncate font-semibold text-[#0F172A]">{invoice.invoice_number}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="font-heading text-xl font-bold tracking-[-0.02em] text-[#0F172A] sm:text-2xl lg:text-[28px]">
              {invoice.invoice_number}
            </h1>
            <StatusBadge status={invoice.status} type="invoice" />
            {typeChip && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  invoice.invoice_type === 'late_fee'
                    ? 'border-rose-200 bg-[#FDECEC] text-[#B91C1C]'
                    : isCreditNote
                      ? 'border-[#E6E8EE] bg-[#F6F7F9] text-[#475569]'
                      : 'border-[#E6E8EE] bg-[#F8FAFC] text-[#334155]'
                }`}
              >
                {typeChip}
              </span>
            )}
            {documentLocked && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Content locked
              </span>
            )}
            {documentLocked && invoice.snapshot_frozen_at && (
              <span
                className="rounded-full border border-[#E6E8EE] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-medium text-[#64748B]"
                title={new Date(invoice.snapshot_frozen_at).toLocaleString('en-IN')}
              >
                Snapshot{' '}
                {new Date(invoice.snapshot_frozen_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#64748B]">
            <span>Client</span>
            <Link
              href={`/clients/${invoice.client_id}`}
              className="font-semibold text-[#0F172A] hover:text-[#E32B2B] hover:underline"
            >
              {invoice.client_name || 'Client Account'}
            </Link>
            {invoice.project_name && (
              <>
                <span className="text-[#CBD5E1]">·</span>
                <span>Project</span>
                <span className="font-medium text-[#0F172A]">{invoice.project_name}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canSoftEdit && (
            <Link href={`/invoices/${invoice.id}/edit`} className="min-w-0">
              <Button variant="secondary" size="sm" className="h-9 max-w-full">
                <Pencil className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {documentLocked ? (
                    <>
                      <span className="sm:hidden">Adjust</span>
                      <span className="hidden sm:inline">Adjust notes / due date</span>
                    </>
                  ) : (
                    'Edit'
                  )}
                </span>
              </Button>
            </Link>
          )}
          {isFounder && invoice.can_delete === true && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeletePrompt(true)}
              className="h-9 shrink-0 px-3"
              title="Delete invoice"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* OVERDUE RISK BANNER */}
      {isOverdue && (
        <div className="shrink-0 p-4 bg-[#FDECEC] border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#B91C1C] shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0" />
            <div>
              <strong className="block text-sm font-bold">This invoice is past due.</strong>
              <span>Due date was {new Date(invoice.due_date).toLocaleDateString('en-IN')}. Reminders sent: {invoice.reminder_count || 0}.</span>
            </div>
          </div>

          {isFounder && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsLateFeeModalOpen(true)}
              className="whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-[#FADC59]" />
              <span>Decide Late Fee</span>
            </Button>
          )}
        </div>
      )}

      {isProofPending && (
        <div className="shrink-0 p-4 bg-[#FEF6D8] border border-[#FADC59]/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5B4300] shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <strong className="block text-sm font-bold">Payment proof submitted</strong>
              <span>
                {isFounder
                  ? 'Review the proof, then click Verified and Paid to email the paid receipt.'
                  : 'Thanks — KR Web Solution will verify your payment and send a paid receipt by email.'}
              </span>
            </div>
          </div>
          {isFounder && hasProof && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleVerifyAndPaid}
              isLoading={isVerifyingPayment}
              className="whitespace-nowrap bg-emerald-700 hover:bg-emerald-800"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              <span>Verified and Paid</span>
            </Button>
          )}
        </div>
      )}

      {/* Preview | sidebar — stack on small/tablet; side-by-side on xl+ */}
      <div className="grid min-h-0 grid-cols-1 gap-4 sm:gap-6 xl:flex-1 xl:grid-cols-12 xl:overflow-hidden">
        <section
          aria-label="Invoice preview"
          className="flex min-h-0 min-w-0 flex-col xl:col-span-8 xl:overflow-hidden"
        >
          <InvoicePaperStage
            paperSize={paperSize}
            onPaperSizeChange={setPaperSize}
            orientation={paperOrientation}
            onOrientationChange={setPaperOrientation}
            fillViewport
            className="min-h-[22rem] sm:min-h-[28rem] xl:min-h-0 xl:h-full"
            footerCompany={invoice.company_name || 'KR Web Solution'}
            footerMeta={[
              (invoice.company_website || '').replace(/^https?:\/\//, '') || null,
              invoice.company_email || null,
            ]
              .filter(Boolean)
              .join(' · ') || null}
            watermarkSrc={invoice.company_logo_url || '/brand/krws-mark.png'}
            toolbarRight={
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="inline-flex h-9 w-9 items-center justify-center p-0"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  title={isDownloadingPdf ? 'Downloading…' : 'Download PDF'}
                  aria-label={isDownloadingPdf ? 'Downloading PDF' : 'Download PDF'}
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DownloadIcon size={16} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="inline-flex h-9 w-9 items-center justify-center border border-[#E6E8EE] p-0"
                  onClick={handleViewPdf}
                  disabled={isViewingPdf}
                  title={isViewingPdf ? 'Opening…' : 'View PDF'}
                  aria-label={isViewingPdf ? 'Opening PDF' : 'View PDF'}
                >
                  {isViewingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PrinterCheckIcon size={16} />
                  )}
                </Button>
              </>
            }
          >
            <PaperInvoice
              paperSize={paperSize}
              invoiceNumber={invoice.invoice_number}
              issueDate={invoice.issue_date}
              dueDate={invoice.due_date}
              clientName={invoice.client_name || 'Client Account'}
              clientEmail={invoice.client_email || undefined}
              clientPhone={invoice.client_phone || undefined}
              clientAddress={invoice.client_address || undefined}
              clientCity={invoice.client_city || undefined}
              clientState={invoice.client_state || undefined}
              clientPincode={invoice.client_pincode || undefined}
              clientGstin={invoice.client_gstin || undefined}
              clientPan={invoice.client_pan || undefined}
              clientStateCode={invoice.client_state_code || undefined}
              companyName={invoice.company_name || undefined}
              companyAddress={invoice.company_address || undefined}
              companyGstin={invoice.company_gstin || undefined}
              companyPan={invoice.company_pan || undefined}
              companyEmail={invoice.company_email || undefined}
              companyPhone={invoice.company_phone || undefined}
              companyWebsite={invoice.company_website || undefined}
              companyTagline={invoice.company_tagline || undefined}
              gstUnregistered={!!invoice.gst_unregistered}
              logoSrc={invoice.company_logo_url || '/brand/krws-mark.png'}
              projectName={invoice.project_name || undefined}
              projectRef={invoice.project_ref || undefined}
              ledger={invoice.ledger || undefined}
              coversFrom={invoice.covers_from || undefined}
              coversTo={invoice.covers_to || undefined}
              invoiceType={invoice.invoice_type}
              gstEnabled={invoice.gst_enabled}
              items={previewItems}
              subtotalPaise={invoice.subtotal_paise || 0}
              taxPaise={invoice.tax_paise || 0}
              taxRatePercent={invoice.tax_rate_percent ?? 0}
              cgstPaise={cgst}
              sgstPaise={sgst}
              igstPaise={igst}
              discountPaise={invoice.discount_paise || 0}
              roundOffPaise={invoice.round_off_paise || 0}
              amountPaidPaise={invoice.amount_paid_paise || 0}
              balanceDuePaise={invoice.balance_due_paise}
              totalPaise={invoice.total_paise || 0}
              amountInWords={invoice.amount_in_words || undefined}
              placeOfSupply={invoice.place_of_supply || undefined}
              poNumber={invoice.po_number || undefined}
              status={invoice.status}
              isPaid={isPaid}
              paidAt={invoice.paid_at || undefined}
              parentInvoiceNumber={invoice.parent_invoice_number || undefined}
              notes={invoice.notes || undefined}
              terms={invoice.payment_terms || undefined}
              resolvedTerms={invoice.resolved_terms || undefined}
              bankDetails={{
                beneficiaryName: invoice.payment_bank_beneficiary_name,
                bankName: invoice.payment_bank_name,
                accountNumber: invoice.payment_bank_account_number,
                ifsc: invoice.payment_bank_ifsc,
                upiId: invoice.payment_upi_id,
                paypalId: invoice.payment_paypal_id,
                blob: invoice.payment_bank_upi_details,
              }}
              wireInstructions={wireLines.length ? wireLines : undefined}
              payments={invoice.payments || undefined}
              upiQrSrc={qrSrc || undefined}
            />
          </InvoicePaperStage>
        </section>

        {/* RIGHT COLUMN: payment, proof, actions, audit */}
        <aside
          aria-label="Invoice actions and payment"
          className="flex min-h-0 min-w-0 flex-col xl:col-span-4 xl:overflow-hidden"
        >
          <div className="space-y-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain xl:pr-0.5">
          {showPayPanel && (
            <SectionCard
              title="Pay via UPI / Bank / PayPal"
              subtitle="No online gateway — use company UPI QR, bank transfer, or PayPal"
              icon={<Building2 className="w-4 h-4" />}
            >
              <div className="space-y-3 text-xs">
                {qrSrc && (
                  <AuthenticatedImage
                    src={qrSrc}
                    alt="UPI QR"
                    className="mx-auto h-40 w-40 rounded-xl border border-[#E6E8EE] bg-white object-contain p-2"
                  />
                )}
                {(
                  [
                    {
                      label: 'UPI ID',
                      value: invoice.payment_upi_id,
                      copyToast: 'UPI ID copied',
                    },
                    {
                      label: 'PayPal',
                      value: invoice.payment_paypal_id,
                      copyToast: 'PayPal ID copied',
                    },
                  ] as const
                )
                  .filter((row) => row.value)
                  .map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#E6E8EE] bg-[#F6F7F9] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          {row.label}
                        </p>
                        <p className="truncate font-mono text-sm font-semibold text-[#0F172A]">
                          {row.value}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 px-2"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(row.value || '');
                            toast.success(row.copyToast);
                          } catch {
                            toast.error('Could not copy');
                          }
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                <div className="overflow-hidden rounded-xl border border-[#E6E8EE] bg-white text-[#0F172A]">
                  {(
                    [
                      {
                        label: 'Beneficiary',
                        value: invoice.payment_bank_beneficiary_name,
                      },
                      { label: 'Bank', value: invoice.payment_bank_name },
                      {
                        label: 'Account No.',
                        value: invoice.payment_bank_account_number,
                      },
                      { label: 'IFSC', value: invoice.payment_bank_ifsc },
                    ] as const
                  )
                    .filter((row) => row.value)
                    .map((row, i) => (
                      <div
                        key={row.label}
                        className={`grid grid-cols-[34%_1fr] text-xs ${
                          i > 0 ? 'border-t border-[#E6E8EE]' : ''
                        }`}
                      >
                        <div className="bg-[#F8FAFC] px-3 py-2 font-medium text-[#64748B]">
                          {row.label}
                        </div>
                        <div className="break-all px-3 py-2 font-semibold">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  {wireLines.length > 0 && (
                    <div className="space-y-0.5 border-t border-[#E6E8EE] px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        Wire / NEFT
                      </p>
                      {wireLines.map((line, i) => (
                        <p key={i} className="text-[11px] text-[#64748B]">
                          • {line}
                        </p>
                      ))}
                    </div>
                  )}
                  {!invoice.payment_upi_id &&
                    !invoice.payment_paypal_id &&
                    !invoice.payment_bank_account_number &&
                    !qrSrc &&
                    wireLines.length === 0 && (
                      <p className="px-3 py-2.5 text-[#64748B]">
                        {invoice.payment_bank_upi_details ||
                          'Payment details will appear once the company configures bank / UPI / PayPal in Settings.'}
                      </p>
                    )}
                </div>
              </div>
            </SectionCard>
          )}

          {showProofCard && (
            <SectionCard
              title="Payment proof"
              subtitle={
                isPaid
                  ? 'UPI / bank transfer screenshot attached to this invoice'
                  : 'Upload proof after payment — founder verifies then marks paid'
              }
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              <div className="space-y-3 text-xs">
                {hasProof && (
                  <div className="rounded-xl border border-[#E6E8EE] bg-white px-3 py-2.5 space-y-2">
                    <p className="text-xs font-medium text-[#0F172A] truncate">
                      {invoice.payment_proof_filename || 'Uploaded file'}
                    </p>
                    {invoice.payment_proof_note && (
                      <p className="text-[11px] text-[#64748B]">{invoice.payment_proof_note}</p>
                    )}
                    {invoice.payment_proof_uploaded_at && (
                      <p className="text-[10px] text-[#94A3B8]">
                        Uploaded{' '}
                        {new Date(invoice.payment_proof_uploaded_at).toLocaleString('en-IN')}
                      </p>
                    )}
                    {invoice.payment_verified_at && (
                      <p className="text-[10px] text-emerald-700 font-semibold">
                        Verified{' '}
                        {new Date(invoice.payment_verified_at).toLocaleString('en-IN')}
                      </p>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={handleOpenProof}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View proof
                    </Button>
                  </div>
                )}

                {canUploadProof && (
                  <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 py-3 space-y-2">
                    <p className="text-[11px] font-semibold text-[#0F172A]">
                      {hasProof ? 'Replace payment proof' : 'Upload payment proof'}
                    </p>
                    <textarea
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="Optional note (UTR / reference)"
                      rows={2}
                      className="w-full rounded-lg border border-[#E6E8EE] bg-white px-2.5 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10"
                    />
                    <label className="block">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
                        className="hidden"
                        disabled={isUploadingProof}
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          e.target.value = '';
                          void handleUploadProof(f);
                        }}
                      />
                      <span className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F6F7F9]">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingProof ? 'Uploading…' : 'Choose file'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Action Card */}
          <SectionCard
            title="Invoice Actions"
            subtitle="Commercial status controls"
            icon={<FileText className="w-4 h-4" />}
          >
            <div className="space-y-3">
              {!isPaid && !isCancelled && isFounder && !isCreditNote && hasProof && (
                <Button
                  variant="primary"
                  onClick={handleVerifyAndPaid}
                  isLoading={isVerifyingPayment}
                  className="w-full text-xs shadow-sm bg-emerald-700 hover:bg-emerald-800"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span>Verified and Paid</span>
                </Button>
              )}

              {!isPaid && !isCancelled && isFounder && !isCreditNote && !hasProof && (
                <Button
                  variant="primary"
                  onClick={handleMarkPaid}
                  isLoading={isMarkingPaid}
                  className="w-full text-xs shadow-sm bg-emerald-700 hover:bg-emerald-800"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>Mark as Paid (no proof)</span>
                </Button>
              )}

              {canSoftEdit && (
                <Link href={`/invoices/${invoice.id}/edit`} className="block">
                  <Button variant="secondary" className="w-full text-xs">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    <span>
                      {documentLocked ? 'Adjust notes / due date' : 'Edit invoice'}
                    </span>
                  </Button>
                </Link>
              )}
              {isPaid && isFounder && (
                <p className="text-[11px] leading-relaxed text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Paid invoice is locked. Company, client, and amounts are frozen.
                  Use a credit note or debit note for corrections.
                </p>
              )}

              {isFounder && !isCancelled && !isAdjustmentNote && ['sent', 'overdue', 'draft', 'proof_pending'].includes(invoice.status) && (
                <>
                  {(invoice.can_delete === false || invoice.can_change_gst === false) && (
                    <p className="text-[11px] leading-relaxed text-[#64748B] bg-[#F8FAFC] border border-[#E6E8EE] rounded-xl px-3 py-2">
                      A later number exists in this series, so delete / GST switch are blocked.
                      Cancel this invoice to freeze it, then create a new one with the same details
                      (GST or non-GST).
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => setShowCancelPrompt(true)}
                  >
                    <Ban className="w-3.5 h-3.5 mr-1.5" />
                    <span>Cancel invoice</span>
                  </Button>
                </>
              )}

              {isFounder && !isCancelled && !isAdjustmentNote && ['sent', 'overdue', 'paid'].includes(invoice.status) && (
                <>
                  <Button
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => setShowCreditPrompt(true)}
                  >
                    <Receipt className="w-3.5 h-3.5 mr-1.5" />
                    <span>Issue credit note</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => setShowDebitPrompt(true)}
                  >
                    <Receipt className="w-3.5 h-3.5 mr-1.5" />
                    <span>Issue debit note</span>
                  </Button>
                </>
              )}

              {isFounder && (
                <Button
                  variant="secondary"
                  onClick={handleSendEmail}
                  isLoading={isSendingEmail}
                  title={
                    isPaid
                      ? 'Send paid receipt email'
                      : isOverdue
                        ? 'Send overdue payment notice'
                        : 'Send invoice email'
                  }
                  className="w-full text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>
                    {isPaid
                      ? invoice.email_status === 'sent'
                        ? 'Resend Paid Receipt'
                        : 'Send Paid Receipt'
                      : isOverdue
                        ? invoice.email_status === 'sent'
                          ? 'Resend Overdue Notice'
                          : 'Send Overdue Notice'
                        : invoice.email_status === 'sent'
                          ? 'Resend Invoice Email'
                          : 'Send Invoice Email'}
                  </span>
                </Button>
              )}

              <p className="pt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                PDF download uses the paper size selected in the preview toolbar and saves as{' '}
                <span className="font-mono text-[#64748B]">{invoice.invoice_number}.pdf</span>.
              </p>
            </div>
          </SectionCard>

          {/* Email Delivery Audit Card */}
          <SectionCard
            title="Email Dispatch Status"
            subtitle="Background delivery verification"
            icon={<Mail className="w-4 h-4" />}
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl">
                <span className="text-[#64748B]">Delivery Status:</span>
                <span className="font-semibold capitalize text-[#0F172A]">
                  {invoice.email_status || 'Pending'}
                </span>
              </div>

              {invoice.email_error && (
                <div className="p-3 bg-[#FDECEC] border border-rose-200 rounded-xl text-[#B91C1C]">
                  <div className="font-bold mb-0.5">Delivery Error:</div>
                  <p className="font-mono text-[11px] leading-tight">{invoice.email_error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl">
                  <div className="text-[#64748B] text-[11px]">Reminders Sent</div>
                  <div className="text-base font-bold text-[#0F172A] font-mono mt-0.5">
                    {invoice.reminder_count || 0}
                  </div>
                </div>

                <div className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl">
                  <div className="text-[#64748B] text-[11px]">Last Emailed</div>
                  <div className="text-xs font-semibold text-[#0F172A] mt-0.5">
                    {invoice.last_emailed_at
                      ? new Date(invoice.last_emailed_at).toLocaleDateString('en-IN')
                      : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Summary Breakdown */}
          <SectionCard
            title="Receivables Breakdown"
            subtitle="Paise arithmetic & taxes"
            icon={<Clock className="w-4 h-4" />}
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#64748B]">Subtotal:</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  ₹{((invoice.subtotal_paise || 0) / 100).toLocaleString('en-IN')}
                </span>
              </div>

              {hasSplitGst ? (
                <>
                  {cgst > 0 && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748B]">
                        CGST ({((invoice.tax_rate_percent || 0) / 2).toFixed(1)}%):
                      </span>
                      <span className="font-mono font-semibold text-[#0F172A]">
                        ₹{(cgst / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {sgst > 0 && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748B]">
                        SGST ({((invoice.tax_rate_percent || 0) / 2).toFixed(1)}%):
                      </span>
                      <span className="font-mono font-semibold text-[#0F172A]">
                        ₹{(sgst / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {igst > 0 && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748B]">
                        IGST ({invoice.tax_rate_percent || 0}%):
                      </span>
                      <span className="font-mono font-semibold text-[#0F172A]">
                        ₹{(igst / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </>
              ) : (invoice.tax_paise || 0) > 0 ? (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#64748B]">
                    GST ({invoice.tax_rate_percent ?? 0}%):
                  </span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    ₹{((invoice.tax_paise || 0) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#64748B]">GST:</span>
                  <span className="font-mono font-semibold text-[#0F172A]">Nil</span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-t border-[#E6E8EE] text-sm font-bold">
                <span className="text-[#0F172A]">Total Invoice:</span>
                <span className="font-mono text-[#0F172A] tabular-nums">
                  ₹{((invoice.total_paise || 0) / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </SectionCard>
          </div>
        </aside>
      </div>

      {/* LATE FEE DECISION MODAL */}
      {isLateFeeModalOpen && (
        <Modal
          isOpen={isLateFeeModalOpen}
          onClose={() => setIsLateFeeModalOpen(false)}
          title={`Late Fee Decision: ${invoice.invoice_number}`}
          subtitle={`Client: ${invoice.client_name || 'Client'}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLateFeeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleLateFeeSubmit}
                isLoading={isSubmittingDecision}
              >
                Confirm Decision
              </Button>
            </div>
          }
        >
          <form onSubmit={handleLateFeeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
                Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'send_now' })}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 ${
                    decisionData.action_type === 'send_now'
                      ? 'border-[#E32B2B] bg-[#FFF1F0] text-[#E32B2B]'
                      : 'border-[#E6E8EE] bg-white text-[#64748B]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Add fine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'extend' })}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 ${
                    decisionData.action_type === 'extend'
                      ? 'border-[#E32B2B] bg-[#FFF1F0] text-[#E32B2B]'
                      : 'border-[#E6E8EE] bg-white text-[#64748B]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Extra time</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'schedule' })}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 ${
                    decisionData.action_type === 'schedule'
                      ? 'border-[#E32B2B] bg-[#FFF1F0] text-[#E32B2B]'
                      : 'border-[#E6E8EE] bg-white text-[#64748B]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule fine</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'waive' })}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 ${
                    decisionData.action_type === 'waive'
                      ? 'border-[#0F172A] bg-[#12141C] text-white'
                      : 'border-[#E6E8EE] bg-white text-[#64748B]'
                  }`}
                >
                  <span>Waive</span>
                </button>
              </div>
            </div>

            {decisionData.action_type === 'extend' && (
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Extra days</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={decisionData.extend_days}
                  onChange={(e) =>
                    setDecisionData({
                      ...decisionData,
                      extend_days: parseInt(e.target.value, 10) || 5,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-[#E6E8EE] rounded-[8px] bg-white"
                />
              </div>
            )}

            {(decisionData.action_type === 'send_now' ||
              decisionData.action_type === 'schedule') && (
              <>
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Fee Type
                    </label>
                    <select
                      value={decisionData.fee_type}
                      onChange={(e) => setDecisionData({ ...decisionData, fee_type: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E6E8EE] rounded-[8px] bg-white text-[#0F172A]"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      {decisionData.fee_type === 'percent' ? 'Percentage' : 'Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={decisionData.fee_type === 'percent' ? '0.5' : '10'}
                      value={decisionData.fee_value}
                      onChange={(e) => setDecisionData({ ...decisionData, fee_value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E6E8EE] rounded-[8px] bg-white text-[#0F172A]"
                    />
                  </div>
                </div>

                {decisionData.action_type === 'schedule' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">
                      Send Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={decisionData.send_on}
                      onChange={(e) => setDecisionData({ ...decisionData, send_on: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-[#E6E8EE] rounded-[8px] text-[#0F172A]"
                    />
                  </div>
                )}
              </>
            )}

            {decisionData.action_type !== 'waive' && (
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">
                  Overdue unpaid: email every (hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={decisionData.reminder_every_hours}
                  onChange={(e) =>
                    setDecisionData({
                      ...decisionData,
                      reminder_every_hours: parseInt(e.target.value, 10) || 24,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-[#E6E8EE] rounded-[8px] text-[#0F172A]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1">
                Reason / Internal Note
              </label>
              <textarea
                rows={2}
                value={decisionData.reason}
                onChange={(e) => setDecisionData({ ...decisionData, reason: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-[#E6E8EE] rounded-[8px] text-[#0F172A]"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeletePrompt && (
        <ConfirmDialog
          isOpen={showDeletePrompt}
          onClose={() => setShowDeletePrompt(false)}
          onConfirm={handleDelete}
          title="Delete Invoice?"
          message={`Are you sure you want to delete "${invoice.invoice_number}"? This will remove all associated line items.`}
          confirmLabel="Delete Invoice"
          variant="danger"
        />
      )}

      {showCancelPrompt && (
        <ConfirmDialog
          isOpen={showCancelPrompt}
          onClose={() => setShowCancelPrompt(false)}
          onConfirm={handleCancel}
          title="Cancel invoice?"
          message={`Cancel "${invoice.invoice_number}"? The number and details will stay frozen (same as paid). You can’t edit or delete it afterward — create a new invoice if you need the same work on another GST series.`}
          confirmLabel={isCancelling ? 'Cancelling…' : 'Cancel invoice'}
          variant="danger"
        />
      )}

      {showCreditPrompt && (
        <ConfirmDialog
          isOpen={showCreditPrompt}
          onClose={() => setShowCreditPrompt(false)}
          onConfirm={handleCreditNote}
          title="Issue credit note?"
          message={`Create a credit note against "${invoice.invoice_number}" for the full billed amount? A new KRWS-CRN document will be created.`}
          confirmLabel={isCrediting ? 'Creating…' : 'Issue credit note'}
          variant="danger"
        />
      )}

      {showDebitPrompt && (
        <Modal
          isOpen={showDebitPrompt}
          onClose={() => setShowDebitPrompt(false)}
          title={`Debit note: ${invoice.invoice_number}`}
        >
          <div className="space-y-4 text-sm">
            <p className="text-xs text-[#64748B]">
              Creates a new KRWS-DBN document for an additional charge linked to this invoice.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#0F172A]">Amount (₹) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={debitAmountRupees}
                onChange={(e) => setDebitAmountRupees(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-[#E6E8EE] px-3 font-mono text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0F172A]">Reason (optional)</label>
              <input
                type="text"
                value={debitReason}
                onChange={(e) => setDebitReason(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-[#E6E8EE] px-3 text-sm"
                placeholder="e.g. Out-of-scope change request"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowDebitPrompt(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDebitNote}
                isLoading={isDebiting}
              >
                Issue debit note
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
