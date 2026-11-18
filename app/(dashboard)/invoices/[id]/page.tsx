'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { invoicesApi, lateFeeApi, API_BASE_URL } from '@/lib/api/client';
import { Invoice, LateFeeDecisionRequest } from '@/lib/types';
import { isPrivileged } from '@/lib/roles';
import {
  ArrowLeft,
  Download,
  Mail,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileText,
  Clock,
  Printer,
  Check,
  Send,
  Pencil,
  AlertTriangle,
  RotateCw,
  Building2,
  Calendar,
  Sparkles,
  Ban,
  Receipt,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PaperInvoice, InvoiceLineItem } from '@/components/ui/PaperInvoice';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
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
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [showCreditPrompt, setShowCreditPrompt] = useState(false);
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
      toast.success('Invoice marked as paid! Receipt generated.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update invoice payment.');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleDelete = async () => {
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
    return <LoadingAnimation fullPage label="Loading invoice…" />;
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
  const isCancelled = invoice.status === 'cancelled' || invoice.status === 'void';
  const isCreditNote = invoice.invoice_type === 'credit_note';
  const showPayPanel =
    !isPaid && !isCancelled && !isCreditNote && (isClient || isFounder);
  const qrSrc = invoice.payment_upi_qr_url
    ? invoice.payment_upi_qr_url.startsWith('http')
      ? invoice.payment_upi_qr_url
      : `${API_BASE_URL}${invoice.payment_upi_qr_url}`
    : null;

  const previewItems: InvoiceLineItem[] = (invoice.items || []).map((it) => ({
    id: it.id,
    description: it.description,
    quantity: it.quantity,
    unit_price_paise: it.unit_rate_paise,
    amount_paise: it.amount_paise || (it.unit_rate_paise * it.quantity),
  }));

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <Link href="/invoices" className="hover:text-[#0F172A] transition-colors">
              Invoices
            </Link>
            <span>/</span>
            <span className="text-[#0F172A] font-semibold">{invoice.invoice_number}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
              Invoice {invoice.invoice_number}
            </h1>
            <StatusBadge status={invoice.status} type="invoice" />
            {invoice.invoice_type === 'late_fee' && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FDECEC] text-[#B91C1C] border border-rose-200">
                Late Fee Invoice
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
            <span>Client:</span>
            <Link
              href={`/clients/${invoice.client_id}`}
              className="font-semibold text-[#0F172A] hover:text-[#E32B2B] hover:underline"
            >
              {invoice.client_name || 'Client Account'}
            </Link>
            {invoice.project_name && (
              <>
                <span>• Project:</span>
                <span className="text-[#0F172A]">{invoice.project_name}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={invoicesApi.downloadPdfUrl(invoice.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm" className="h-9">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              <span>Download PDF</span>
            </Button>
          </a>

          {isFounder && invoice.status !== 'paid' && (
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="secondary" size="sm" className="h-9">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                <span>Edit</span>
              </Button>
            </Link>
          )}

          {isFounder && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeletePrompt(true)}
              className="h-9 px-3"
              title="Delete invoice"
              disabled={invoice.status === 'paid'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* OVERDUE RISK BANNER */}
      {isOverdue && (
        <div className="p-4 bg-[#FDECEC] border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#B91C1C] shadow-sm">
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

      {/* Two Column Layout: Document (7 cols) + Action Cards (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: PAPER INVOICE WITH ROTATED GREEN PAID STAMP */}
        <div className="lg:col-span-7">
          <PaperInvoice
            invoiceNumber={invoice.invoice_number}
            issueDate={invoice.issue_date}
            dueDate={invoice.due_date}
            clientName={invoice.client_name || 'Client Account'}
            items={previewItems}
            subtotalPaise={invoice.subtotal_paise || 0}
            taxPaise={invoice.tax_paise || 0}
            taxRatePercent={invoice.tax_rate_percent ?? 0}
            totalPaise={invoice.total_paise || 0}
            isPaid={isPaid}
            notes={invoice.notes || undefined}
          />
        </div>

        {/* RIGHT COLUMN: ACTIONS & AUDIT */}
        <div className="lg:col-span-5 space-y-6">
          {showPayPanel && (
            <SectionCard
              title="Pay via UPI / Bank"
              subtitle="No online gateway — use company UPI QR or bank transfer"
              icon={<Building2 className="w-4 h-4" />}
            >
              <div className="space-y-3 text-xs">
                {qrSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrSrc}
                    alt="UPI QR"
                    className="mx-auto h-40 w-40 rounded-xl border border-[#E6E8EE] bg-white object-contain p-2"
                  />
                )}
                {invoice.payment_upi_id && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E6E8EE] bg-[#F6F7F9] px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        UPI ID
                      </p>
                      <p className="font-mono text-sm font-semibold text-[#0F172A]">
                        {invoice.payment_upi_id}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(invoice.payment_upi_id || '');
                          toast.success('UPI ID copied');
                        } catch {
                          toast.error('Could not copy');
                        }
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
                <div className="rounded-xl border border-[#E6E8EE] bg-white px-3 py-2.5 space-y-1 text-[#0F172A]">
                  {invoice.payment_bank_beneficiary_name && (
                    <p>
                      <span className="text-[#64748B]">Beneficiary: </span>
                      {invoice.payment_bank_beneficiary_name}
                    </p>
                  )}
                  {invoice.payment_bank_name && (
                    <p>
                      <span className="text-[#64748B]">Bank: </span>
                      {invoice.payment_bank_name}
                    </p>
                  )}
                  {invoice.payment_bank_account_number && (
                    <p>
                      <span className="text-[#64748B]">A/C: </span>
                      {invoice.payment_bank_account_number}
                    </p>
                  )}
                  {invoice.payment_bank_ifsc && (
                    <p>
                      <span className="text-[#64748B]">IFSC: </span>
                      {invoice.payment_bank_ifsc}
                    </p>
                  )}
                  {!invoice.payment_upi_id &&
                    !invoice.payment_bank_account_number &&
                    !qrSrc && (
                      <p className="text-[#64748B]">
                        {invoice.payment_bank_upi_details ||
                          'Payment details will appear once the company configures bank / UPI in Settings.'}
                      </p>
                    )}
                </div>
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
              {!isPaid && !isCancelled && isFounder && !isCreditNote && (
                <Button
                  variant="primary"
                  onClick={handleMarkPaid}
                  isLoading={isMarkingPaid}
                  className="w-full text-xs shadow-sm bg-emerald-700 hover:bg-emerald-800"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  <span>Mark as Paid (Generate Receipt)</span>
                </Button>
              )}

              {isFounder && !isPaid && !isCancelled && !isCreditNote && (
                <Link href={`/invoices/${invoice.id}/edit`} className="block">
                  <Button variant="secondary" className="w-full text-xs">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    <span>Edit invoice</span>
                  </Button>
                </Link>
              )}

              {isFounder && !isCancelled && !isCreditNote && ['sent', 'overdue', 'draft'].includes(invoice.status) && (
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => setShowCancelPrompt(true)}
                >
                  <Ban className="w-3.5 h-3.5 mr-1.5" />
                  <span>Cancel invoice</span>
                </Button>
              )}

              {isFounder && !isCancelled && !isCreditNote && ['sent', 'overdue', 'paid'].includes(invoice.status) && (
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => setShowCreditPrompt(true)}
                >
                  <Receipt className="w-3.5 h-3.5 mr-1.5" />
                  <span>Issue credit note</span>
                </Button>
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

              <a
                href={invoicesApi.downloadPdfUrl(invoice.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="ghost" className="w-full text-xs border border-[#E6E8EE]">
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  <span>Print / View Official PDF</span>
                </Button>
              </a>
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

              <div className="flex items-center justify-between py-1">
                <span className="text-[#64748B]">GST ({invoice.tax_rate_percent || 18}%):</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  ₹{((invoice.tax_paise || 0) / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-[#E6E8EE] text-sm font-bold">
                <span className="text-[#0F172A]">Total Invoice:</span>
                <span className="font-mono text-[#0F172A] tabular-nums">
                  ₹{((invoice.total_paise || 0) / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
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
          message={`Cancel "${invoice.invoice_number}"? It will stay in the ledger as cancelled and can no longer be edited or collected.`}
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
    </div>
  );
}
