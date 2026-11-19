'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clientsApi, projectsApi, invoicesApi, settingsApi } from '@/lib/api/client';
import { Client, Invoice, Project } from '@/lib/types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Building2,
  Send,
  Save,
  Clock,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { PaperInvoice, InvoiceLineItem } from '@/components/ui/PaperInvoice';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

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
  const [notes, setNotes] = useState('Payment due within 15 days of invoice date.');
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
        const gstOn = !!st?.gst_enabled;
        setGstEnabled(gstOn);
        const defaultRate = gstOn ? Number(st?.default_tax_rate ?? 0) : 0;

        if (isEdit && invoiceId) {
          const inv = await invoicesApi.get(invoiceId);
          if (inv.status === 'paid') {
            toast.error('Paid invoices cannot be edited');
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
          setTaxRatePercent(gstOn ? Number(inv.tax_rate_percent ?? defaultRate) : 0);
          setNotes(inv.notes || '');
          setItems(
            (inv.items || []).map((it, idx) => ({
              id: it.id || String(idx + 1),
              description: it.description,
              quantity: it.quantity || 1,
              unit_rate_rupees: (it.unit_rate_paise || 0) / 100,
            }))
          );
        } else {
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
        `Maintenance for ${safeMonths} month${safeMonths === 1 ? '' : 's'} (${prettyDate(start)} to ${prettyDate(end)}). Payment due within ${PAYMENT_DAYS} days of invoice date.`
      );
    }
  }, [isMaintenance, safeMonths, monthlyRatePaise, amcStart, issueDate, isEdit]);

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
    const payload: Record<string, unknown> = {
      invoice_type: isMaintenance ? 'amc' : invoiceType === 'project' ? 'custom_dev' : invoiceType,
      issue_date: issueDate,
      due_date: dueDate,
      tax_rate_percent: taxRatePercent,
      notes: notes.trim() || undefined,
      items: validItems.map((it) => ({
        description: it.description.trim(),
        quantity: it.quantity,
        unit_rate_paise: Math.round(it.unit_rate_rupees * 100),
      })),
    };
    if (!isEdit) {
      payload.project_id = projectId;
    }
    if (isMaintenance) {
      payload.period_months = safeMonths;
      payload.covers_from = coverStart;
      payload.covers_to = coverEnd;
      payload.monthly_rate_paise = Math.round((validItems[0].unit_rate_rupees || 0) * 100) || monthlyRatePaise;
    }

    setError(null);
    setIsSubmitting(true);
    try {

      let saved: Invoice;
      if (isEdit && invoiceId) {
        saved = await invoicesApi.update(invoiceId, payload as any);
        toast.success(`Invoice ${saved.invoice_number} updated`);
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

      router.push(`/invoices/${saved.id}`);
    } catch (err: any) {
      setError(err?.message || (isEdit ? 'Failed to update invoice.' : 'Failed to create invoice.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);
  const previewItems: InvoiceLineItem[] = items.map((it) => ({
    id: it.id,
    description: it.description || 'Deliverable item...',
    quantity: it.quantity,
    rate_rupees: it.unit_rate_rupees,
    amount_paise: Math.round((it.unit_rate_rupees || 0) * it.quantity * 100),
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
            {isEdit ? `Edit ${existingInvoice?.invoice_number || 'Invoice'}` : 'Create GST Invoice'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isEdit
              ? 'Update line items and terms. Remaining project amount is shown below.'
              : 'Build and dispatch customized GST invoices with live document preview.'}
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <SectionCard
            title="Invoice Header Details"
            subtitle="Customer selection and payment term dates"
            icon={<Building2 className="w-4 h-4" />}
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
                  onChange={(e) => {
                    const next = e.target.value;
                    setInvoiceType(next);
                    if (next === 'amc') {
                      lineEdited.current = false;
                      dateEdited.current = false;
                      notesEdited.current = false;
                    } else if (items[0]?.id === 'amc') {
                      setItems([{ id: '1', description: '', quantity: 1, unit_rate_rupees: 0 }]);
                      setNotes('Payment due within 15 days of invoice date.');
                    }
                  }}
                >
                  <option value="custom_dev">Development (KRWS-DEV)</option>
                  <option value="amc">Maintenance (KRWS-MNT)</option>
                  <option value="hosting">Hosting (KRWS-HST)</option>
                  <option value="services">Services (KRWS-SVC)</option>
                  <option value="licensing">Licensing (KRWS-LIC)</option>
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
                    value={issueDate}
                    onChange={(e) => {
                      const next = e.target.value;
                      dateEdited.current = true;
                      setIssueDate(next);
                      if (next && !isMaintenance) {
                        setDueDate(plusDays(next, PAYMENT_DAYS));
                        setNotes(`Payment due within ${PAYMENT_DAYS} days of invoice date.`);
                      } else if (next) {
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
                      const next = e.target.value;
                      setDueDate(next);
                      if (!isMaintenance && issueDate && next) {
                        const [y1, m1, d1] = issueDate.split('-').map(Number);
                        const [y2, m2, d2] = next.split('-').map(Number);
                        const start = new Date(y1, m1 - 1, d1);
                        const end = new Date(y2, m2 - 1, d2);
                        const days = Math.round((end.getTime() - start.getTime()) / 86400000);
                        if (days > 0) setNotes(`Payment due within ${days} days of invoice date.`);
                      }
                    }}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="GST tax rate (%)"
                  hint={
                    gstEnabled
                      ? 'GST is enabled in Settings'
                      : 'GST is off in Settings — tax stays 0%'
                  }
                >
                  <Select
                    value={String(gstEnabled ? taxRatePercent : 0)}
                    disabled={!gstEnabled}
                    onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                  >
                    <option value="0">0% (Nil / Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Standard services GST)</option>
                  </Select>
                </FormField>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Line Items & Rates"
            subtitle="Add deliverables and unit fee schedules"
            icon={<FileText className="w-4 h-4" />}
            headerSlot={
              <Button variant="secondary" size="sm" onClick={handleAddItem} className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>+ Custom</span>
              </Button>
            }
          >
            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = item.quantity * (item.unit_rate_rupees || 0);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#F6F7F9] border border-[#E6E8EE] rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">Item #{index + 1}</span>
                      {items.length > 1 && (
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
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      />
                    </FormField>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                      <FormField label="Qty / Hours">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </FormField>
                      <FormField label="Unit Rate (₹)">
                        <CurrencyInput
                          value={item.unit_rate_rupees}
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
          </SectionCard>

          <SectionCard
            title="Payment Terms & Notes"
            subtitle="Visible on invoice footer"
            icon={<Clock className="w-4 h-4" />}
          >
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => {
                notesEdited.current = true;
                setNotes(e.target.value);
              }}
              placeholder="Bank details, wire instructions, or terms..."
            />
          </SectionCard>
        </div>

        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <PaperInvoice
            invoiceNumber={existingInvoice?.invoice_number || 'DRAFT-PREVIEW'}
            issueDate={issueDate}
            dueDate={dueDate}
            clientName={selectedClient?.name || 'Selected Client'}
            clientAddress={selectedClient?.address || undefined}
            clientGstin={selectedClient?.gstin || undefined}
            items={previewItems}
            subtotalPaise={subtotalPaise}
            taxPaise={taxPaise}
            taxRatePercent={taxRatePercent}
            totalPaise={totalPaise}
            isPaid={false}
            notes={notes}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E6E8EE] px-6 py-3.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748B] hidden sm:inline">Grand Total:</span>
          <span className="text-lg font-mono font-extrabold text-[#0F172A] tabular-nums">
            ₹{(totalPaise / 100).toLocaleString('en-IN')}
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
