'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  IndianRupee,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { companyExpensesApi } from '@/lib/api/client';
import { isPrivileged } from '@/lib/roles';
import { routes } from '@/lib/routes';
import { formatINR, formatDate } from '@/lib/utils/format';
import type { CompanyExpense, CompanyExpenseList, CompanyExpenseSection } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { CurrencyInput, rupeesToPaise } from '@/components/ui/CurrencyInput';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_SECTIONS,
  categoryLabel,
  sectionById,
  todayISO,
} from './constants';
import { RenewalsPanel } from './RenewalsPanel';

type FormState = {
  expense_date: string;
  section: CompanyExpenseSection;
  category: string;
  title: string;
  vendor: string;
  amount_rupees: string;
  note: string;
  next_renewal_on: string;
  renewal_interval_months: number;
  receipt: File | null;
};

function emptyForm(section: CompanyExpenseSection): FormState {
  const cats = EXPENSE_CATEGORIES[section];
  return {
    expense_date: todayISO(),
    section,
    category: cats[0]?.value || 'other',
    title: '',
    vendor: '',
    amount_rupees: '',
    note: '',
    next_renewal_on: '',
    renewal_interval_months: 1,
    receipt: null,
  };
}

export function ExpenseSectionPage({ section }: { section: CompanyExpenseSection }) {
  const meta = sectionById(section)!;
  const { user } = useAuth();
  const router = useRouter();
  const privileged = isPrivileged(user?.role);

  const [data, setData] = useState<CompanyExpenseList | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyExpense | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(section));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await companyExpensesApi.list({ section });
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load expenses');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    if (!user?.role) return;
    if (!privileged) {
      router.replace(routes.dashboard);
      return;
    }
    load();
  }, [user?.role, privileged, load, router]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(section));
    setModalOpen(true);
  };

  const openEdit = (row: CompanyExpense) => {
    setEditing(row);
    setForm({
      expense_date: row.expense_date,
      section: row.section as CompanyExpenseSection,
      category: row.category,
      title: row.title,
      vendor: row.vendor || '',
      amount_rupees: String(row.amount_paise / 100),
      note: row.note || '',
      next_renewal_on: row.next_renewal_on || '',
      renewal_interval_months: row.renewal_interval_months || 1,
      receipt: null,
    });
    setModalOpen(true);
  };

  const onSectionChange = (next: CompanyExpenseSection) => {
    const cats = EXPENSE_CATEGORIES[next];
    setForm((prev) => ({
      ...prev,
      section: next,
      category: cats[0]?.value || 'other',
      next_renewal_on: next === 'recurring' ? prev.next_renewal_on : '',
      renewal_interval_months:
        next === 'recurring' ? prev.renewal_interval_months || 1 : 1,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = rupeesToPaise(form.amount_rupees);
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await companyExpensesApi.update(editing.id, {
          expense_date: form.expense_date,
          section: form.section,
          category: form.category,
          title: form.title.trim(),
          amount_paise: amount,
          vendor: form.vendor.trim(),
          note: form.note.trim(),
          next_renewal_on:
            form.section === 'recurring' ? form.next_renewal_on || undefined : undefined,
          renewal_interval_months:
            form.section === 'recurring' ? form.renewal_interval_months : undefined,
          clear_renewal: form.section !== 'recurring',
          receipt: form.receipt,
        });
        toast.success('Expense updated');
        if (form.section !== section) {
          router.push(routes.expenseSection(sectionById(form.section)!.slug));
          return;
        }
      } else {
        await companyExpensesApi.create({
          expense_date: form.expense_date,
          section: form.section,
          category: form.category,
          title: form.title.trim(),
          amount_paise: amount,
          vendor: form.vendor.trim() || undefined,
          note: form.note.trim() || undefined,
          next_renewal_on:
            form.section === 'recurring' && form.next_renewal_on
              ? form.next_renewal_on
              : undefined,
          renewal_interval_months:
            form.section === 'recurring' ? form.renewal_interval_months : undefined,
          receipt: form.receipt,
        });
        toast.success('Expense recorded');
        if (form.section !== section) {
          router.push(routes.expenseSection(sectionById(form.section)!.slug));
          return;
        }
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm(section));
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: CompanyExpense) => {
    if (!confirm(`Delete “${row.title}”? This cannot be undone.`)) return;
    try {
      await companyExpensesApi.delete(row.id);
      toast.success('Expense deleted');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  const sectionTotal =
    data?.section_totals?.find((t) => t.section === section)?.total_paise || 0;
  const items = data?.items || [];
  const renewals = section === 'recurring' ? data?.upcoming_renewals || [] : [];

  if (!privileged) return null;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={routes.expenses}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All expenses
          </Link>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{meta.label}</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            {meta.hint} · {formatINR(sectionTotal)} total
          </p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
          Add expense
        </Button>
      </div>

      {section === 'recurring' && (
        <RenewalsPanel renewals={renewals} onChanged={load} />
      )}

      <SectionCard title={`${meta.label} expenses`} subtitle="All entries">
        {loading ? (
          <TableSkeleton cols={5} rows={5} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<IndianRupee className="h-5 w-5" />}
            title={`No ${meta.label.toLowerCase()} expenses`}
            subtitle="Record spend for this section."
            className="border-0 bg-transparent p-6 shadow-none"
            action={{ label: 'Add expense', onClick: openCreate }}
          />
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {items.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#0F172A]">{row.title}</p>
                  <p className="text-xs text-[#64748B]">
                    {formatDate(row.expense_date)} · {categoryLabel(row.section, row.category)}
                    {row.vendor ? ` · ${row.vendor}` : ''}
                    {row.next_renewal_on ? ` · renews ${formatDate(row.next_renewal_on)}` : ''}
                  </p>
                  {row.note ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[#94A3B8]">{row.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold text-[#0F172A]">{formatINR(row.amount_paise)}</span>
                  <div className="flex items-center gap-1">
                    {row.receipt_object_key ? (
                      <button
                        type="button"
                        className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                        title="Open receipt"
                        onClick={() =>
                          companyExpensesApi
                            .openReceipt(row.id)
                            .catch((err) =>
                              toast.error(err?.message || 'Could not open receipt')
                            )
                        }
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                      title="Edit"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 text-[#64748B] hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                      onClick={() => handleDelete(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit expense' : `Add ${meta.label.toLowerCase()} expense`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date" required>
              <Input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Section" required>
              <Select
                value={form.section}
                onChange={(e) => onSectionChange(e.target.value as CompanyExpenseSection)}
              >
                {EXPENSE_SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category" required>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES[form.section].map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Amount (₹)" required>
              <CurrencyInput
                value={form.amount_rupees}
                onChange={(v) => setForm({ ...form, amount_rupees: v })}
                required
              />
            </FormField>
          </div>

          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. AWS monthly, office chairs"
              required
            />
          </FormField>

          <FormField label="Vendor">
            <Input
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder="Optional"
            />
          </FormField>

          {form.section === 'recurring' && (
            <FormField label="Next renewal">
              <Input
                type="date"
                value={form.next_renewal_on}
                onChange={(e) => setForm({ ...form, next_renewal_on: e.target.value })}
              />
            </FormField>
          )}

          <FormField label="Note">
            <Textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="Optional"
            />
          </FormField>

          <FormField label="Receipt">
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0] || null })}
            />
            {editing?.receipt_original_filename && !form.receipt ? (
              <p className="mt-1 text-xs text-[#64748B]">
                Current: {editing.receipt_original_filename}
              </p>
            ) : null}
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Record expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
