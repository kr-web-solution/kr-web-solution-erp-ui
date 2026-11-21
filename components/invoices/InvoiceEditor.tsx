'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clientsApi, projectsApi, invoicesApi, settingsApi } from '@/lib/api/client';
import { Client, CompanySettings, Invoice, Project } from '@/lib/types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Send,
  Save,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { PaperInvoice, InvoiceLineItem } from '@/components/ui/PaperInvoice';
import { InvoicePaperStage } from '@/components/ui/InvoicePaperStage';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { isInvoiceDocumentLocked } from '@/lib/invoices/labels';
import { amountInWordsInr } from '@/lib/money/amountInWords';
import { splitGstPaise } from '@/lib/money/gstSplit';
import type { InvoicePaperOrientation, InvoicePaperSize } from '@/lib/api/client';
import { toast } from 'sonner';

/** Live preview of the GST / non-GST number series (final seq assigned on save). */
function previewNumberForGst(
  number: string | null | undefined,
  gstOn: boolean,
  fallback = 'DRAFT-PREVIEW'
): string {
  const raw = (number || '').trim();
  if (!raw) return fallback;
  const parts = raw.toUpperCase().split('-');
  // KRWS-MNT-2026-G-1003
  if (parts.length === 5 && parts[3] === 'G' && /^\d+$/.test(parts[4])) {
    if (gstOn) return `${parts[0]}-${parts[1]}-${parts[2]}-${parts[4]}`;
    return raw;
  }
  // KRWS-MNT-2026-1003
  if (parts.length === 4 && /^\d+$/.test(parts[3])) {
    if (!gstOn) return `${parts[0]}-${parts[1]}-${parts[2]}-G-${parts[3]}`;
    return raw;
  }
  return raw;
}

function EditorPanel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2px] border border-[#E8EAEE] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EEF0F4] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold tracking-wide text-[#0F172A] uppercase">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-[#64748B]">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

interface FormLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_rate_rupees: number;
}

interface Props {
  mode: 'create' | 'edit';
  invoiceId?: string;
  initialClientId?: string;
  initialProjectId?: string;
}

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export function InvoiceEditor({
  mode,
  invoiceId,
  initialClientId = '',
  initialProjectId = '',
}: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null);

  const PAYMENT_DAYS = 15;
  const localIso = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const plusDays = (iso: string, days: number) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    dt.setDate(dt.getDate() + days);
    return localIso(dt);
  };
  const today = localIso();
  const dueDateDefault = plusDays(today, PAYMENT_DAYS);

  const [clientId, setClientId] = useState(initialClientId);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [invoiceType, setInvoiceType] = useState('custom_dev');
  const [amcMonths, setAmcMonths] = useState(1);
  const [coverageStart, setCoverageStart] = useState(today);
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(dueDateDefault);
  const [taxRatePercent, setTaxRatePercent] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [notes, setNotes] = useState('');
  const [upiOverride, setUpiOverride] = useState('');
  const [items, setItems] = useState<FormLineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unit_rate_rupees: 0,
    },
  ]);

  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paperSize, setPaperSize] = useState<InvoicePaperSize>('a4');
  const [paperOrientation, setPaperOrientation] =
    useState<InvoicePaperOrientation>('portrait');

  useEffect(() => {
    async function load() {
      try {
        const [cList, pList, st] = await Promise.all([
          clientsApi.list(),
          projectsApi.list(),
          settingsApi.get().catch(() => null),
        ]);
        setClients(cList);
        setProjects(pList);
        if (st) setCompanySettings(st);
        const settingsGst = !!st?.gst_enabled;
        const defaultRate = settingsGst ? Number(st?.default_tax_rate ?? 0) : 0;

        if (isEdit && invoiceId) {
          const inv = await invoicesApi.get(invoiceId);
          const lockedStatus = ['paid', 'cancelled', 'void'].includes(inv.status);
          if (lockedStatus) {
            toast.error(
              inv.status === 'paid'
                ? 'Paid invoices cannot be edited'
                : 'Cancelled invoices cannot be edited'
            );
            router.replace(`/invoices/${invoiceId}`);
            return;
          }
          setExistingInvoice(inv);
          setClientId(inv.client_id);
          setProjectId(inv.project_id || '');
          setInvoiceType(inv.invoice_type === 'maintenance' ? 'amc' : inv.invoice_type || 'custom_dev');
          if (inv.period_months) setAmcMonths(inv.period_months);
          if (inv.covers_from) setCoverageStart(inv.covers_from);
          setIssueDate(inv.issue_date);
          setDueDate(inv.due_date);
          // Per-invoice GST: null/undefined follows Settings; explicit true/false wins.
          const invGst =
            inv.gst_enabled === null || inv.gst_enabled === undefined
              ? settingsGst
              : !!inv.gst_enabled;
          setGstEnabled(invGst);
          setTaxRatePercent(invGst ? Number(inv.tax_rate_percent ?? defaultRate) : 0);
          setNotes(inv.notes || '');
          setUpiOverride(inv.upi_id_override || '');
          setItems(
            (inv.items || []).map((it, idx) => ({
              id: it.id || String(idx + 1),
              description: it.description,
              quantity: it.quantity || 1,
              unit_rate_rupees: (it.unit_rate_paise || 0) / 100,
            }))
          );
        } else {
          // New invoice: follow Settings GST button by default.
          setGstEnabled(settingsGst);
          setTaxRatePercent(defaultRate);
          if (!initialClientId && cList.length > 0) {
            setClientId(cList[0].id);
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load invoice form.');
      } finally {
        setIsLoadingMeta(false);
      }
    }
    load();
  }, [isEdit, invoiceId]);

  useEffect(() => {
    if (clientId) {
      setFilteredProjects(
        projects.filter(
          (p) =>
            p.client_id === clientId ||
            (p.client_ids || []).includes(clientId) ||
            (p.clients || []).some((c) => c.id === clientId)
        )
      );
    } else {
      setFilteredProjects([]);
    }
  }, [clientId, projects]);

  useEffect(() => {
    if (!projectId || isEdit) return;
    let cancelled = false;
    projectsApi
      .money(projectId)
      .then((m) => {
        if (cancelled) return;
        if (m.maintenance?.next_billing_date) setCoverageStart(m.maintenance.next_billing_date);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId, isEdit]);

  const selectedProject = projects.find((p) => p.id === projectId) || null;
  const isMaintenance = invoiceType === 'amc' || invoiceType === 'maintenance';
  const monthlyRatePaise = selectedProject?.maintenance_amount_paise || 0;
  const safeMonths = Math.max(1, Math.min(36, Math.floor(Number(amcMonths) || 1)));
  const addMonthsMinusDay = (iso: string, months: number) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    dt.setMonth(dt.getMonth() + months);
    dt.setDate(dt.getDate() - 1);
    return localIso(dt);
  };
  const prettyDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  const amcStart = coverageStart || today;
  const amcEnd = addMonthsMinusDay(issueDate || amcStart, safeMonths);
  const amcDescription = `Maintenance ${prettyDate(issueDate || amcStart)} – ${prettyDate(amcEnd)} (${safeMonths} month${safeMonths === 1 ? '' : 's'})`;
  const lineEdited = useRef(false);
  const dateEdited = useRef(false);
  const notesEdited = useRef(false);

  useEffect(() => {
    if (!isMaintenance || isEdit) return;
    const start = dateEdited.current ? issueDate || amcStart : amcStart;
    const end = addMonthsMinusDay(start, safeMonths);
    const desc = `Maintenance ${prettyDate(start)} – ${prettyDate(end)} (${safeMonths} month${safeMonths === 1 ? '' : 's'})`;
    if (!lineEdited.current) {
      setItems([
        {
          id: 'amc',
          description: desc,
          quantity: safeMonths,
          unit_rate_rupees: monthlyRatePaise / 100,
        },
      ]);
    }
    if (!dateEdited.current) {
      setIssueDate(start);
      setDueDate(plusDays(start, PAYMENT_DAYS));
    }
    if (!notesEdited.current) {
      setNotes(
        `Maintenance for ${safeMonths} month${safeMonths === 1 ? '' : 's'} (${prettyDate(start)} to ${prettyDate(end)}).`
      );
    }
  }, [isMaintenance, safeMonths, monthlyRatePaise, amcStart, issueDate, isEdit]);

  const contentLocked = !!(existingInvoice && isInvoiceDocumentLocked(existingInvoice));
  // Create: always free. Edit: only when API says unpaid tip-of-series.
  const gstSwitchLocked =
    contentLocked ||
    (isEdit && existingInvoice != null && existingInvoice.can_change_gst === false);

  const storedNumber = existingInvoice?.invoice_number || '';
  const previewInvoiceNumber = useMemo(() => {
    if (contentLocked) return storedNumber || 'DRAFT-PREVIEW';
    const storedGst =
      !!storedNumber &&
      !/-G-\d+$/i.test(storedNumber) &&
      /-\d+$/.test(storedNumber);
    // Toggle flipped → use server peek (fills revoked gaps e.g. 1002 before 1003)
    if (
      isEdit &&
      existingInvoice?.gst_toggle_preview_number &&
      gstEnabled !== storedGst
    ) {
      return existingInvoice.gst_toggle_preview_number;
    }
    return previewNumberForGst(storedNumber || null, gstEnabled, 'DRAFT-PREVIEW');
  }, [
    contentLocked,
    storedNumber,
    gstEnabled,
    isEdit,
    existingInvoice?.gst_toggle_preview_number,
  ]);
  const numberWillChangeOnSave =
    isEdit &&
    !contentLocked &&
    !!storedNumber &&
    previewInvoiceNumber.toUpperCase() !== storedNumber.toUpperCase();

  const subtotalPaise = useMemo(() => {
    return items.reduce((sum, it) => {
      const ratePaise = Math.round((it.unit_rate_rupees || 0) * 100);
      return sum + it.quantity * ratePaise;
    }, 0);
  }, [items]);

  const taxPaise = useMemo(
    () => Math.round(subtotalPaise * (taxRatePercent / 100)),
    [subtotalPaise, taxRatePercent]
  );
  const totalPaise = subtotalPaise + taxPaise;

  // Remaining = project budget - (other project invoices) ; when editing, exclude this invoice's current subtotal
  const remainingPaise = useMemo(() => {
    if (!selectedProject || selectedProject.budget_paise == null) return null;
    const budget = selectedProject.budget_paise || 0;
    const invoiced = selectedProject.invoiced_paise || 0;
    const exclude = isEdit ? existingInvoice?.subtotal_paise || 0 : 0;
    return Math.max(budget - (invoiced - exclude), 0);
  }, [selectedProject, isEdit, existingInvoice]);

  const remainingAfterThis = remainingPaise == null ? null : remainingPaise - subtotalPaise;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: '', quantity: 1, unit_rate_rupees: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormLineItem, val: any) => {
    if (isMaintenance) lineEdited.current = true;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  };

  const projectBelongsToClient = (pid: string, cid: string) => {
    const p = projects.find((x) => x.id === pid);
    if (!p) return false;
    return (
      p.client_id === cid ||
      (p.client_ids || []).includes(cid) ||
      (p.clients || []).some((c) => c.id === cid)
    );
  };

  const handleSubmit = async (andSendEmail: boolean) => {
    if (!clientId) {
      setError('Please select a client account.');
      return;
    }
    if (!projectId) {
      setError('Please link this invoice to a project.');
      return;
    }
    if (!projectBelongsToClient(projectId, clientId)) {
      setError('Selected project is not linked to this client.');
      return;
    }

    let payload: Record<string, unknown>;

    if (contentLocked) {
      payload = {
        due_date: dueDate,
        notes: notes.trim() || undefined,
        upi_id_override: upiOverride.trim() || null,
      };
    } else {
      if (isMaintenance && !monthlyRatePaise && items.every((it) => !(it.unit_rate_rupees > 0))) {
        setError('Set the monthly maintenance amount on this project, or type a unit rate.');
        return;
      }
      const validItems = items.filter((it) => it.description.trim() && it.unit_rate_rupees > 0);
      if (!validItems.length) {
        setError('Please add at least one line item with a description and unit rate.');
        return;
      }
      const coverStart = issueDate || amcStart;
      const coverEnd = addMonthsMinusDay(coverStart, safeMonths);
      payload = {
        invoice_type: isMaintenance ? 'amc' : invoiceType === 'project' ? 'custom_dev' : invoiceType,
        issue_date: issueDate,
        due_date: dueDate,
        gst_enabled: gstEnabled,
        tax_rate_percent: gstEnabled ? taxRatePercent : 0,
        notes: notes.trim() || undefined,
        upi_id_override: upiOverride.trim() || null,
        items: validItems.map((it) => ({
          description: it.description.trim(),
          quantity: it.quantity,
          unit_rate_paise: Math.round(it.unit_rate_rupees * 100),
          ...(gstEnabled ? {} : { hsn_sac: null }),
        })),
      };
      if (!isEdit) {
        payload.project_id = projectId;
      }
      if (isMaintenance) {
        payload.period_months = safeMonths;
        payload.covers_from = coverStart;
        payload.covers_to = coverEnd;
        payload.monthly_rate_paise =
          Math.round((validItems[0].unit_rate_rupees || 0) * 100) || monthlyRatePaise;
      }
    }

    setError(null);
    setIsSubmitting(true);
    try {

      let saved: Invoice;
      if (isEdit && invoiceId) {
        saved = await invoicesApi.update(invoiceId, payload as any);
        const seriesSwitched = saved.id !== invoiceId;
        if (seriesSwitched) {
          toast.success(
            `GST series switched — new invoice ${saved.invoice_number} (previous draft removed)`
          );
        } else {
          toast.success(`Invoice ${saved.invoice_number} updated`);
        }
      } else {
        saved = await invoicesApi.create({
          ...payload,
          client_id: clientId,
        } as any);
        if (andSendEmail) {
          try {
            await invoicesApi.sendEmail(saved.id);
            toast.success(`Invoice ${saved.invoice_number} created and emailed`);
          } catch {
            toast.warning(`Invoice ${saved.invoice_number} saved, but email failed`);
          }
        } else {
          toast.success(`Invoice ${saved.invoice_number} saved as draft`);
        }
      }

      if (isEdit && andSendEmail) {
        try {
          await invoicesApi.sendEmail(saved.id);
          toast.success('Invoice emailed to client');
        } catch {
          toast.warning('Saved, but email failed');
        }
      }

      router.replace(`/invoices/${saved.id}`);
    } catch (err: any) {
      const msg =
        err?.message || (isEdit ? 'Failed to update invoice.' : 'Failed to create invoice.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);
  const liveGstSplit = useMemo(
    () =>
      splitGstPaise(taxPaise, {
        gstEnabled,
        supplierStateCode:
          companySettings?.company_state_code || companySettings?.company_gstin,
        customerStateCode: selectedClient?.state_code || selectedClient?.gstin,
      }),
    [
      taxPaise,
      gstEnabled,
      companySettings?.company_state_code,
      companySettings?.company_gstin,
      selectedClient?.state_code,
      selectedClient?.gstin,
    ]
  );
  const previewCgst = contentLocked
    ? existingInvoice?.cgst_paise || 0
    : liveGstSplit.cgst;
  const previewSgst = contentLocked
    ? existingInvoice?.sgst_paise || 0
    : liveGstSplit.sgst;
  const previewIgst = contentLocked
    ? existingInvoice?.igst_paise || 0
    : liveGstSplit.igst;
  const previewAmountWords =
    contentLocked && existingInvoice?.amount_in_words
      ? existingInvoice.amount_in_words
      : amountInWordsInr(totalPaise);
  const previewBank = contentLocked
    ? {
        beneficiaryName: existingInvoice?.payment_bank_beneficiary_name,
        bankName: existingInvoice?.payment_bank_name,
        accountNumber: existingInvoice?.payment_bank_account_number,
        ifsc: existingInvoice?.payment_bank_ifsc,
        upiId: existingInvoice?.payment_upi_id || upiOverride || undefined,
        paypalId: existingInvoice?.payment_paypal_id || undefined,
        blob: existingInvoice?.payment_bank_upi_details,
      }
    : {
        beneficiaryName: companySettings?.bank_beneficiary_name,
        bankName: companySettings?.bank_name,
        accountNumber: companySettings?.bank_account_number,
        ifsc: companySettings?.bank_ifsc,
        upiId: upiOverride || companySettings?.bank_upi_id,
        paypalId: companySettings?.bank_paypal_id,
        blob: companySettings?.bank_upi_details,
      };
  const previewWire = contentLocked
    ? existingInvoice?.payment_wire_lines ||
      (existingInvoice?.payment_bank_wire_instructions || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : companySettings?.bank_wire_instructions
      ? companySettings.bank_wire_instructions
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : undefined;
  const previewQr = contentLocked
    ? existingInvoice?.payment_upi_qr_url || undefined
    : companySettings?.bank_upi_qr_url || undefined;
  const previewItems: InvoiceLineItem[] = items.map((it) => ({
    id: it.id,
    description: it.description || 'Deliverable item...',
    quantity: it.quantity,
    rate_rupees: it.unit_rate_rupees,
    amount_paise: Math.round((it.unit_rate_rupees || 0) * it.quantity * 100),
    hsn_sac: companySettings?.default_sac_code || undefined,
  }));

  if (isLoadingMeta) {
    return <PageSkeleton variant="form" />;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3 pb-2">
        <Link href={isEdit && invoiceId ? `/invoices/${invoiceId}` : '/invoices'}>
          <Button variant="ghost" size="sm" className="h-9 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
            {isEdit
              ? contentLocked
                ? `Adjust ${storedNumber || 'Invoice'}`
                : `Edit ${previewInvoiceNumber || storedNumber || 'Invoice'}`
              : 'Create invoice'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isEdit
              ? contentLocked
                ? 'Paid invoice is locked. You can only change notes, due date, and UPI override.'
                : numberWillChangeOnSave
                  ? `GST toggle will renumber on save → ${previewInvoiceNumber}`
                  : 'Update details beside the live document preview.'
              : 'Fill the form — the document preview updates as you type.'}
          </p>
        </div>
      </div>

      {contentLocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-[16px] flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Issued invoice content is frozen. Amounts, tax, and type cannot change. Issue a
            credit note for corrections.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#FDECEC] border border-rose-200 rounded-[16px] flex items-center gap-2.5 text-xs text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedProject && selectedProject.budget_paise != null && !isMaintenance && (
        <div className="rounded-2xl border border-[#E6E8EE] bg-[#F6F7F9] px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-[#64748B] flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" aria-hidden /> Project total
            </p>
            <p className="font-bold tabular-nums text-[#0F172A] mt-0.5">
              {formatRupees(selectedProject.budget_paise || 0)}
            </p>
          </div>
          <div>
            <p className="text-[#64748B]">Already invoiced</p>
            <p className="font-bold tabular-nums text-[#0F172A] mt-0.5">
              {formatRupees(
                Math.max(
                  0,
                  (selectedProject.invoiced_paise || 0) -
                    (isEdit ? existingInvoice?.subtotal_paise || 0 : 0)
                )
              )}
            </p>
          </div>
          <div>
            <p className="text-[#64748B]">Remaining before this invoice</p>
            <p className="font-bold tabular-nums text-[#0F172A] mt-0.5">
              {formatRupees(remainingPaise || 0)}
            </p>
          </div>
          <div>
            <p className="text-[#64748B]">Remaining after this invoice</p>
            <p
              className={`font-bold tabular-nums mt-0.5 ${
                (remainingAfterThis || 0) < 0 ? 'text-[#B91C1C]' : 'text-[#0F172A]'
              }`}
            >
              {formatRupees(remainingAfterThis || 0)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start">
        <div className="xl:col-span-5 space-y-4 order-2 xl:order-1">
          <EditorPanel
            title="Invoice header"
            subtitle="Client, type, dates, and GST series"
          >
            <div className="space-y-4">
              <FormField label="Client Account" required>
                <Select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setProjectId('');
                  }}
                  disabled={isEdit}
                >
                  <option value="" disabled>
                    Select client account...
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.primary_contact_name ? `(${c.primary_contact_name})` : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Project" required>
                <Select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={isEdit}
                >
                  <option value="">Select project...</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.remaining_paise != null
                        ? ` · remaining ₹${((p.remaining_paise || 0) / 100).toLocaleString('en-IN')}`
                        : ''}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Invoice Type">
                <Select
                  value={invoiceType === 'project' ? 'custom_dev' : invoiceType}
                  disabled={contentLocked}
                  onChange={(e) => {
                    const next = e.target.value;
                    setInvoiceType(next);
                    if (next === 'amc') {
                      lineEdited.current = false;
                      dateEdited.current = false;
                      notesEdited.current = false;
                    } else if (items[0]?.id === 'amc') {
                      setItems([{ id: '1', description: '', quantity: 1, unit_rate_rupees: 0 }]);
                      setNotes('');
                    }
                  }}
                >
                  <option value="custom_dev">Development (KRWS-DEV)</option>
                  <option value="amc">Maintenance (KRWS-MNT)</option>
                  <option value="hosting">Hosting (KRWS-HST)</option>
                  <option value="services">Services (KRWS-SVC)</option>
                  <option value="licensing">Licensing (KRWS-LIC)</option>
                  <option value="advance">Advance (KRWS-ADV)</option>
                  <option value="balance">Balance (KRWS-BAL)</option>
                  <option value="mixed">Mixed (KRWS-MIX)</option>
                  <option value="late_fee">Late Fee (KRWS-LTF)</option>
                  <option value="credit_note" disabled>
                    Credit Note (issue from invoice detail)
                  </option>
                  <option value="debit_note" disabled>
                    Debit Note (issue from invoice detail)
                  </option>
                </Select>
              </FormField>

              {isMaintenance && (
                <FormField
                  label="Months"
                  required
                  hint={
                    monthlyRatePaise
                      ? `${formatRupees(monthlyRatePaise)} per month on this project · ${prettyDate(issueDate || amcStart)} to ${prettyDate(amcEnd)}. Automatic emails stay off for these months. GST, description, and the rate below are filled in — change any of them if you need to.`
                      : 'Set the monthly maintenance amount on the project, or type the rate on the line below.'
                  }
                >
                  <Input
                    type="number"
                    min={1}
                    max={36}
                    required
                    disabled={contentLocked}
                    value={amcMonths}
                    onChange={(e) => {
                      lineEdited.current = false;
                      notesEdited.current = false;
                      setAmcMonths(parseInt(e.target.value, 10) || 1);
                    }}
                  />
                </FormField>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Issue Date" required>
                  <Input
                    type="date"
                    required
                    disabled={contentLocked}
                    value={issueDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      dateEdited.current = true;
                      setIssueDate(next);
                      if (next) {
                        setDueDate(plusDays(next, PAYMENT_DAYS));
                      }
                    }}
                  />
                </FormField>
                <FormField label="Due Date" required hint={`15 days after the issue date is ${plusDays(issueDate || today, PAYMENT_DAYS)}`}>
                  <Input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                    }}
                  />
                </FormField>
              </div>

              <div className="flex flex-col gap-3 rounded-[12px] border border-[#E6E8EE] bg-[#F8FAFC] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Enable GST on this invoice</p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {gstSwitchLocked && isEdit
                      ? 'GST series locked (later number exists). Cancel this invoice (keeps number frozen), then create a new one with/without GST.'
                      : numberWillChangeOnSave
                        ? `Preview number → ${previewInvoiceNumber}. Save to assign and store the new series number.`
                        : `Default follows Settings${
                            companySettings
                              ? ` (currently ${companySettings.gst_enabled ? 'ON' : 'OFF'})`
                              : ''
                          }. Toggle GST to switch series; save stores the new number.`}
                  </p>
                </div>
                <div
                  role={gstSwitchLocked ? 'button' : undefined}
                  tabIndex={gstSwitchLocked ? 0 : undefined}
                  onClick={() => {
                    if (!gstSwitchLocked) return;
                    toast.error(
                      "You can’t change GST on this invoice because a later invoice already exists in this number series. Cancel this invoice (number + details stay frozen), then create a new invoice with the same details on the GST or non-GST series you need."
                    );
                  }}
                  onKeyDown={(e) => {
                    if (!gstSwitchLocked) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toast.error(
                        "You can’t change GST on this invoice because a later invoice already exists in this number series. Cancel this invoice (number + details stay frozen), then create a new invoice with the same details on the GST or non-GST series you need."
                      );
                    }
                  }}
                >
                  <Switch
                    checked={gstEnabled}
                    disabled={gstSwitchLocked}
                    onChange={(checked) => {
                      setGstEnabled(checked);
                      if (!checked) {
                        setTaxRatePercent(0);
                      } else if (taxRatePercent <= 0) {
                        setTaxRatePercent(Number(companySettings?.default_tax_rate ?? 18) || 18);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="GST tax rate (%)"
                  hint={
                    contentLocked
                      ? 'Locked after payment'
                      : gstEnabled
                        ? 'Applied on this invoice only'
                        : 'GST is off for this invoice — tax stays 0%'
                  }
                >
                  <Select
                    value={String(gstEnabled ? taxRatePercent : 0)}
                    disabled={!gstEnabled || contentLocked}
                    onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                  >
                    <option value="0">0% (Nil / Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Standard services GST)</option>
                  </Select>
                </FormField>
                <FormField
                  label="UPI ID override"
                  hint="Optional — overrides company UPI on this invoice only"
                >
                  <Input
                    value={upiOverride}
                    onChange={(e) => setUpiOverride(e.target.value)}
                    placeholder={companySettings?.bank_upi_id || 'name@upi'}
                  />
                </FormField>
              </div>
            </div>
          </EditorPanel>

          <EditorPanel
            title="Line items"
            subtitle={
              contentLocked
                ? 'Line items are frozen after payment'
                : 'Deliverables and unit rates'
            }
            action={
              !contentLocked ? (
                <Button variant="secondary" size="sm" onClick={handleAddItem} className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add line</span>
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = item.quantity * (item.unit_rate_rupees || 0);
                return (
                  <div
                    key={item.id}
                    className="space-y-3 border border-[#EEF0F4] bg-[#FAFBFC] px-3.5 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">Item #{index + 1}</span>
                      {!contentLocked && items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-[#94A3B8] hover:text-[#B91C1C] transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <FormField label="Description" required>
                      <Input
                        placeholder="e.g. Frontend development & component integration"
                        value={item.description}
                        disabled={contentLocked}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      />
                    </FormField>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                      <FormField label="Qty / Hours">
                        <Input
                          type="number"
                          min="1"
                          disabled={contentLocked}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </FormField>
                      <FormField label="Unit Rate (₹)">
                        <CurrencyInput
                          value={item.unit_rate_rupees}
                          disabled={contentLocked}
                          onChange={(val: string) =>
                            handleItemChange(item.id, 'unit_rate_rupees', parseFloat(val) || 0)
                          }
                          placeholder="0"
                        />
                      </FormField>
                      <div className="col-span-2 sm:col-span-1 p-2 bg-white border border-[#E6E8EE] rounded-[10px] text-right">
                        <div className="text-[10px] text-[#64748B]">Line Total</div>
                        <div className="text-xs font-mono font-bold text-[#0F172A] mt-0.5">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </EditorPanel>

          <EditorPanel title="Notes" subtitle="Shown on the invoice footer">
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => {
                notesEdited.current = true;
                setNotes(e.target.value);
              }}
              placeholder="Bank details, wire instructions, or terms..."
            />
          </EditorPanel>
        </div>

        <div className="xl:col-span-7 order-1 xl:order-2 xl:sticky xl:top-16 min-h-[22rem]">
          <InvoicePaperStage
            paperSize={paperSize}
            onPaperSizeChange={setPaperSize}
            orientation={paperOrientation}
            onOrientationChange={setPaperOrientation}
            className="min-h-[22rem] sm:min-h-[28rem]"
            footerCompany={
              (contentLocked
                ? existingInvoice?.company_name
                : companySettings?.company_name) || 'KR Web Solution'
            }
            footerMeta={[
              (
                (contentLocked
                  ? existingInvoice?.company_website
                  : companySettings?.company_website) || ''
              ).replace(/^https?:\/\//, '') || null,
              (contentLocked
                ? existingInvoice?.company_email
                : companySettings?.smtp_from_email) || null,
            ]
              .filter(Boolean)
              .join(' · ') || null}
            watermarkSrc={
              (contentLocked
                ? existingInvoice?.company_logo_url
                : companySettings?.company_logo_url) || '/brand/krws-mark.png'
            }
          >
          <PaperInvoice
            paperSize={paperSize}
            invoiceNumber={previewInvoiceNumber}
            issueDate={issueDate}
            dueDate={dueDate}
            clientName={
              contentLocked
                ? existingInvoice?.client_name || selectedClient?.name || 'Selected Client'
                : selectedClient?.name || 'Selected Client'
            }
            clientEmail={
              contentLocked
                ? existingInvoice?.client_email || undefined
                : selectedClient?.email || undefined
            }
            clientPhone={
              contentLocked
                ? existingInvoice?.client_phone || undefined
                : selectedClient?.phone || undefined
            }
            clientAddress={
              contentLocked
                ? existingInvoice?.client_address || undefined
                : selectedClient?.address || undefined
            }
            clientCity={
              contentLocked
                ? existingInvoice?.client_city || undefined
                : selectedClient?.city || undefined
            }
            clientState={
              contentLocked
                ? existingInvoice?.client_state || undefined
                : selectedClient?.state || undefined
            }
            clientPincode={
              contentLocked
                ? existingInvoice?.client_pincode || undefined
                : selectedClient?.pincode || undefined
            }
            clientGstin={
              contentLocked
                ? existingInvoice?.client_gstin || undefined
                : selectedClient?.gstin || undefined
            }
            clientPan={
              contentLocked
                ? existingInvoice?.client_pan || undefined
                : selectedClient?.pan || undefined
            }
            clientStateCode={
              contentLocked
                ? existingInvoice?.client_state_code || undefined
                : selectedClient?.state_code || undefined
            }
            companyName={
              contentLocked
                ? existingInvoice?.company_name || undefined
                : companySettings?.company_name || undefined
            }
            companyAddress={
              contentLocked
                ? existingInvoice?.company_address || undefined
                : companySettings?.company_address || undefined
            }
            companyGstin={
              contentLocked
                ? existingInvoice?.company_gstin || undefined
                : gstEnabled
                  ? companySettings?.company_gstin || undefined
                  : undefined
            }
            companyPan={
              contentLocked
                ? existingInvoice?.company_pan || undefined
                : companySettings?.company_pan || undefined
            }
            companyEmail={
              contentLocked
                ? existingInvoice?.company_email || undefined
                : companySettings?.smtp_from_email || undefined
            }
            companyPhone={
              contentLocked
                ? existingInvoice?.company_phone || undefined
                : companySettings?.company_phone || undefined
            }
            companyWebsite={
              contentLocked
                ? existingInvoice?.company_website || undefined
                : companySettings?.company_website || undefined
            }
            companyTagline={
              contentLocked
                ? existingInvoice?.company_tagline || undefined
                : companySettings?.company_tagline || undefined
            }
            gstUnregistered={
              contentLocked
                ? !!existingInvoice?.gst_unregistered
                : !!companySettings?.gst_unregistered
            }
            logoSrc={
              contentLocked
                ? existingInvoice?.company_logo_url || '/brand/krws-mark.png'
                : companySettings?.company_logo_url || '/brand/krws-mark.png'
            }
            projectName={
              contentLocked
                ? existingInvoice?.project_name || selectedProject?.name || undefined
                : selectedProject?.name || undefined
            }
            projectRef={
              contentLocked
                ? existingInvoice?.project_ref || undefined
                : projectId
                  ? projectId.replace('prj_', 'PRJ-').toUpperCase()
                  : undefined
            }
            coversFrom={isMaintenance ? coverageStart : undefined}
            coversTo={isMaintenance ? amcEnd : undefined}
            invoiceType={existingInvoice?.invoice_type || invoiceType}
            gstEnabled={contentLocked ? existingInvoice?.gst_enabled : gstEnabled}
            placeOfSupply={
              contentLocked
                ? existingInvoice?.place_of_supply || undefined
                : selectedClient?.state || undefined
            }
            items={previewItems}
            subtotalPaise={
              contentLocked ? existingInvoice?.subtotal_paise || subtotalPaise : subtotalPaise
            }
            taxPaise={contentLocked ? existingInvoice?.tax_paise || taxPaise : taxPaise}
            taxRatePercent={
              contentLocked
                ? existingInvoice?.tax_rate_percent ?? taxRatePercent
                : taxRatePercent
            }
            cgstPaise={previewCgst}
            sgstPaise={previewSgst}
            igstPaise={previewIgst}
            discountPaise={existingInvoice?.discount_paise || 0}
            totalPaise={contentLocked ? existingInvoice?.total_paise || totalPaise : totalPaise}
            amountInWords={previewAmountWords}
            status={existingInvoice?.status || 'draft'}
            isPaid={existingInvoice?.status === 'paid'}
            notes={notes}
            terms={companySettings?.payment_terms || undefined}
            resolvedTerms={
              contentLocked ? existingInvoice?.resolved_terms || undefined : undefined
            }
            wireInstructions={previewWire}
            bankDetails={previewBank}
            upiQrSrc={previewQr}
          />
          </InvoicePaperStage>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E6E8EE] px-6 py-3.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748B] hidden sm:inline">Grand Total:</span>
          <span className="text-lg font-mono font-extrabold text-[#0F172A] tabular-nums">
            ₹
            {(
              (contentLocked ? existingInvoice?.total_paise || totalPaise : totalPaise) / 100
            ).toLocaleString('en-IN')}
          </span>
          {remainingPaise != null && (
            <span className="text-xs text-[#64748B] hidden md:inline">
              · Project remaining {formatRupees(remainingPaise)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Link href={isEdit && invoiceId ? `/invoices/${invoiceId}` : '/invoices'}>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
          {!isEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSubmit(false)}
              isLoading={isSubmitting}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>Save as Draft</span>
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit(isEdit ? false : true)}
            isLoading={isSubmitting}
          >
            {isEdit ? (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Save changes</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Create &amp; Send Email</span>
              </>
            )}
          </Button>
          {isEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSubmit(true)}
              isLoading={isSubmitting}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span>Save &amp; Send</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
