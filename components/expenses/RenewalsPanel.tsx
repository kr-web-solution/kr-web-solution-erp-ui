'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Check } from 'lucide-react';
import { companyExpensesApi } from '@/lib/api/client';
import { formatINR, formatDate } from '@/lib/utils/format';
import type { CompanyExpense } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { CurrencyInput, rupeesToPaise } from '@/components/ui/CurrencyInput';
import { categoryLabel, dueStatusLabel, todayISO } from './constants';

function dueBadgeClass(status?: string | null) {
  if (status === 'overdue') return 'bg-red-50 text-red-700';
  if (status === 'due_soon') return 'bg-amber-50 text-amber-800';
  return 'bg-[#F1F5F9] text-[#64748B]';
}

function suggestNextRenewal(row: CompanyExpense): string {
  // Prefer advancing from current next date; else +1 month from today
  const base = row.next_renewal_on ? new Date(row.next_renewal_on) : new Date();
  const months = row.renewal_interval_months || 1;
  base.setMonth(base.getMonth() + months);
  return base.toISOString().slice(0, 10);
}

export function RenewalsPanel({
  renewals,
  onChanged,
  actionHref,
}: {
  renewals: CompanyExpense[];
  onChanged?: () => void;
  actionHref?: string;
}) {
  const [selected, setSelected] = useState<CompanyExpense | null>(null);
  const [nextRenewalOn, setNextRenewalOn] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [amountRupees, setAmountRupees] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const openRenew = (row: CompanyExpense) => {
    setSelected(row);
    setNextRenewalOn(suggestNextRenewal(row));
    setPaymentDate(todayISO());
    setAmountRupees(String(row.amount_paise / 100));
    setReceipt(null);
  };

  const closeRenew = () => {
    if (saving) return;
    setSelected(null);
    setReceipt(null);
  };

  const submitRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!nextRenewalOn) {
      toast.error('Next renewal date is required');
      return;
    }
    if (!receipt) {
      toast.error('Upload the payment receipt for this renewal');
      return;
    }
    const amount = rupeesToPaise(amountRupees);
    if (amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await companyExpensesApi.renew(selected.id, {
        next_renewal_on: nextRenewalOn,
        receipt,
        amount_paise: amount,
        payment_date: paymentDate || undefined,
      });
      toast.success('Renewal recorded');
      setSelected(null);
      setReceipt(null);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Could not complete renewal');
    } finally {
      setSaving(false);
    }
  };

  const sorted = useMemo(
    () =>
      [...renewals].sort((a, b) =>
        (a.next_renewal_on || '').localeCompare(b.next_renewal_on || '')
      ),
    [renewals]
  );

  if (!sorted.length) return null;

  return (
    <>
      <SectionCard
        title="Renewals due"
        subtitle="Complete a renewal with the next due date and this payment’s receipt."
        icon={<CalendarClock className="h-4 w-4" />}
        action={actionHref ? { label: 'Open recurring', href: actionHref } : undefined}
      >
        <ul className="divide-y divide-[#E2E8F0]">
          {sorted.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#0F172A]">{r.title}</p>
                  {r.due_status ? (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${dueBadgeClass(r.due_status)}`}
                    >
                      {dueStatusLabel(r.due_status)}
                    </span>
                  ) : null}
                </div>
                <p className="text-[#64748B]">
                  {categoryLabel(r.section, r.category)}
                  {r.vendor ? ` · ${r.vendor}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <p className="font-medium text-[#0F172A]">{formatINR(r.amount_paise)}</p>
                  <p className="text-[#64748B]">
                    {r.next_renewal_on ? formatDate(r.next_renewal_on) : '—'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => openRenew(r)}
                  icon={<Check className="h-3.5 w-3.5" />}
                >
                  Complete renewal
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <Modal
        isOpen={!!selected}
        onClose={closeRenew}
        title={selected ? `Renew ${selected.title}` : 'Complete renewal'}
      >
        <form onSubmit={submitRenew} className="space-y-4">
          <p className="text-sm text-[#64748B]">
            Record this payment’s receipt and set the next renewal date.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Payment date" required>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Amount paid (₹)" required>
              <CurrencyInput value={amountRupees} onChange={setAmountRupees} required />
            </FormField>
          </div>
          <FormField label="Next renewal date" required>
            <Input
              type="date"
              value={nextRenewalOn}
              onChange={(e) => setNextRenewalOn(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Payment receipt" required>
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              onChange={(e) => setReceipt(e.target.files?.[0] || null)}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" disabled={saving} onClick={closeRenew}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Complete renewal'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
