'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  CalendarClock,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wrench,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { companyExpensesApi } from '@/lib/api/client';
import { isPrivileged } from '@/lib/roles';
import { routes } from '@/lib/routes';
import { formatINR } from '@/lib/utils/format';
import type { CompanyExpenseList } from '@/lib/types';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  EXPENSE_SECTIONS,
  sectionLabel,
  type ExpenseSectionSlug,
} from '@/components/expenses/constants';
import { RenewalsPanel } from '@/components/expenses/RenewalsPanel';

const SECTION_ICONS: Record<ExpenseSectionSlug, React.ReactNode> = {
  recurring: <RefreshCw className="h-4 w-4" />,
  daily: <ShoppingBag className="h-4 w-4" />,
  upgrades: <Wrench className="h-4 w-4" />,
  other: <Wallet className="h-4 w-4" />,
};

export default function CompanyExpensesOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const privileged = isPrivileged(user?.role);

  const [data, setData] = useState<CompanyExpenseList | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await companyExpensesApi.list();
      setData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load expenses');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.role) return;
    if (!privileged) {
      router.replace(routes.dashboard);
      return;
    }
    load();
  }, [user?.role, privileged, load, router]);

  const totalsBySection = useMemo(() => {
    const map: Record<string, number> = {
      recurring: 0,
      daily: 0,
      upgrade: 0,
      other: 0,
    };
    for (const t of data?.section_totals || []) {
      map[t.section] = t.total_paise;
    }
    return map;
  }, [data]);

  if (!privileged) return null;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">Company expenses</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Studio spend by section — open a section to add or edit. Staff claims stay under Staff.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total spend"
          value={formatINR(data?.month_total_paise || 0)}
          icon={<Wallet className="h-5 w-5" />}
          variant="blue"
          isLoading={loading}
        />
        <KpiCard
          label="Largest spend"
          value={data?.largest ? formatINR(data.largest.amount_paise) : '—'}
          caption={
            data?.largest
              ? `${data.largest.title} · ${sectionLabel(data.largest.section)}`
              : 'No expenses yet'
          }
          icon={<TrendingUp className="h-5 w-5" />}
          variant="crimson"
          isLoading={loading}
        />
        <KpiCard
          label="Upcoming renewals"
          value={String(data?.upcoming_renewals?.length || 0)}
          caption="Overdue + next 60 days"
          icon={<CalendarClock className="h-5 w-5" />}
          variant="yellow"
          isLoading={loading}
          href={routes.expenseSection('recurring')}
        />
      </div>

      <RenewalsPanel
        renewals={data?.upcoming_renewals || []}
        onChanged={load}
        actionHref={routes.expenseSection('recurring')}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {EXPENSE_SECTIONS.map((sec) => (
          <Link
            key={sec.id}
            href={routes.expenseSection(sec.slug)}
            className="group block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-[#E32B2B]/40 hover:bg-[#FFF8F8]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-[#E32B2B]">
                  {SECTION_ICONS[sec.slug]}
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#0F172A]">{sec.label}</h2>
                  <p className="mt-0.5 text-xs text-[#64748B]">{sec.hint}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#E32B2B]" />
            </div>
            <p className="mt-4 text-lg font-semibold text-[#0F172A]">
              {loading ? '…' : formatINR(totalsBySection[sec.id] || 0)}
              <span className="ml-1.5 text-xs font-normal text-[#94A3B8]">total</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
