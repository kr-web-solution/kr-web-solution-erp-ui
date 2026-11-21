'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  dashboardApi,
  lateFeeApi,
  invoicesApi,
  companyExpensesApi,
  type DashboardPeriod,
} from '@/lib/api/client';
import { isPrivileged } from '@/lib/roles';
import { routes } from '@/lib/routes';
import {
  DashboardSummary,
  LateFeeAction,
  LateFeeDecisionRequest,
  CompanyExpense,
} from '@/lib/types';
import {
  FolderKanban,
  TrendingUp,
  ReceiptText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  AlertCircle,
  Calendar,
  Send,
  Ban,
  Download,
  IndianRupee,
  Users2,
  Building2,
  Wallet,
  Plus,
  FilePlus2,
  Settings,
  UsersRound,
  Briefcase,
  Inbox,
  Filter,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

type QuickLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
  hint: string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAction, setSelectedAction] = useState<LateFeeAction | null>(null);
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
    action_type: 'schedule',
    fee_type: 'percent',
    fee_value: 5,
    reason: 'Payment not received by due date',
    send_on: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    repeat_every_days: 2,
    extend_days: 5,
    reminder_every_hours: 24,
  });
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>('month');

  const fetchSummary = async (selectedPeriod: DashboardPeriod = period) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getSummary(selectedPeriod);
      setSummary(data);
      if (isPrivileged(user?.role)) {
        try {
          const exp = await companyExpensesApi.list();
          setExpenses(exp.items || []);
        } catch {
          setExpenses([]);
        }
      } else {
        setExpenses([]);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.message?.toLowerCase().includes('authentication required')) {
        router.replace('/login');
        return;
      }
      setError(err?.message || 'Failed to load executive metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when role or period changes
  }, [user?.role, period]);

  const formatRupees = (paise: number) => {
    const rupees = (paise || 0) / 100;
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const openDecisionModal = (action: LateFeeAction) => {
    setSelectedAction(action);
    setDecisionError(null);
    setDecisionData({
      action_type: 'schedule',
      fee_type: action.fee_type || 'percent',
      fee_value: action.fee_value || 5,
      reason: action.reason || 'Payment not received by due date',
      send_on: action.send_on || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      repeat_every_days: action.repeat_every_days || 2,
      extend_days: 5,
      reminder_every_hours: action.reminder_every_hours || 24,
    });
  };

  const handleQuickWaive = async (action: LateFeeAction) => {
    if (
      !confirm(
        `Are you sure you want to waive late fees for Invoice ${action.invoice_number || action.invoice_id}?`
      )
    ) {
      return;
    }
    try {
      await lateFeeApi.decide(action.id, {
        action: 'waive',
        fee_type: 'fixed',
        fee_value: 0,
        reason: 'Waived by Founder CEO',
      });
      toast.success(`Late fee waived for invoice ${action.invoice_number || ''}`);
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to waive late fee.');
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;

    setIsSubmittingDecision(true);
    setDecisionError(null);
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

      await lateFeeApi.decide(selectedAction.id, payload);
      toast.success(
        decisionData.action_type === 'extend' ? 'Due date extended' : 'Overdue decision recorded'
      );
      setSelectedAction(null);
      fetchSummary();
    } catch (err: any) {
      setDecisionError(err?.message || 'Failed to record decision.');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const role = user?.role || 'founder_ceo';
  const pendingActions = summary?.needs_action_invoices || [];
  const failedEmailCount = summary?.failed_email_invoices_count || 0;

  const moneyChartData = useMemo(() => {
    const points = summary?.revenue_by_month || [];
    const spendByKey: Record<string, number> = {};
    for (const exp of expenses) {
      if (!exp.expense_date) continue;
      const dayKey = exp.expense_date.slice(0, 10); // YYYY-MM-DD
      const monthKey = exp.expense_date.slice(0, 7); // YYYY-MM
      const amt = exp.amount_paise || 0;
      spendByKey[dayKey] = (spendByKey[dayKey] || 0) + amt;
      spendByKey[monthKey] = (spendByKey[monthKey] || 0) + amt;
    }
    return points.map((p) => ({
      month: p.month,
      year_month: p.year_month,
      billed: Math.round((p.billed_paise || 0) / 100),
      collected: Math.round((p.collected_paise || 0) / 100),
      spend: Math.round((spendByKey[p.year_month] || 0) / 100),
    }));
  }, [summary?.revenue_by_month, expenses]);

  const revenueChartData = moneyChartData;

  const hasRevenueData = moneyChartData.some(
    (p) => (p.billed || 0) > 0 || (p.collected || 0) > 0 || (p.spend || 0) > 0
  );

  const moneyPeriod = useMemo(() => {
    const billedFromApi = Math.round((summary?.billed_paise || 0) / 100);
    const collectedFromApi = Math.round((summary?.collected_paise || 0) / 100);
    const billedChart = moneyChartData.reduce((s, p) => s + (p.billed || 0), 0);
    const collectedChart = moneyChartData.reduce((s, p) => s + (p.collected || 0), 0);
    const spend = moneyChartData.reduce((s, p) => s + (p.spend || 0), 0);
    // Prefer API period totals (payment-date based collected)
    const billed = summary?.billed_paise != null ? billedFromApi : billedChart;
    const collected = summary?.collected_paise != null ? collectedFromApi : collectedChart;
    const rate = billed > 0 ? Math.round((collected / billed) * 100) : collected > 0 ? 100 : 0;
    return { billed, collected, spend, rate };
  }, [moneyChartData, summary?.billed_paise, summary?.collected_paise]);

  // Running total of collections — cumulative inflow curve for the Collected card
  const collectedInflowData = useMemo(() => {
    let running = 0;
    return moneyChartData.map((p) => {
      running += p.collected || 0;
      return {
        month: p.month,
        year_month: p.year_month,
        collected: p.collected || 0,
        inflow: running,
      };
    });
  }, [moneyChartData]);

  const chartTooltip = {
    cursor: { fill: 'rgba(15, 23, 42, 0.04)' },
    contentStyle: {
      backgroundColor: '#12141C',
      borderRadius: '10px',
      border: 'none',
      color: '#FFFFFF',
      fontSize: '12px',
    } as React.CSSProperties,
  };

  const formatAxis = (v: number) =>
    v >= 1000 ? `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `₹${v}`;

  const pageTitle =
    role === 'worker'
      ? 'My workspace'
      : role === 'client'
        ? 'Your account'
        : 'Dashboard';

  const pageDescription =
    role === 'worker'
      ? 'Assigned projects and daily work at a glance.'
      : role === 'client'
        ? 'Projects and invoices for your company.'
        : `Welcome back, ${user?.full_name || 'there'} · IST ${todayFormatted}`;

  const founderQuickLinks: QuickLink[] = [
    {
      label: 'New lead',
      href: routes.leadNew,
      icon: <Users2 className="h-4 w-4" />,
      hint: 'Sales intake',
    },
    {
      label: 'New invoice',
      href: routes.invoiceNew,
      icon: <FilePlus2 className="h-4 w-4" />,
      hint: 'Create & send',
    },
    {
      label: 'Projects',
      href: routes.projects,
      icon: <FolderKanban className="h-4 w-4" />,
      hint: 'Delivery board',
    },
    {
      label: 'Clients',
      href: routes.clients,
      icon: <Building2 className="h-4 w-4" />,
      hint: 'Directory',
    },
    {
      label: 'Expenses',
      href: routes.expenses,
      icon: <Wallet className="h-4 w-4" />,
      hint: 'Studio spend',
    },
    {
      label: 'Staff',
      href: routes.staff,
      icon: <UsersRound className="h-4 w-4" />,
      hint: 'People & pay',
    },
  ];

  const billedSpark = revenueChartData.map((p) => p.billed);
  const collectedSpark = revenueChartData.map((p) => p.collected);
  const projectSpark = useMemo(() => {
    const n = summary?.running_projects_count ?? 0;
    return [Math.max(0, n - 2), Math.max(0, n - 1), n, Math.max(0, n - 1), n, n];
  }, [summary?.running_projects_count]);
  const leadSpark = useMemo(() => {
    const n = summary?.open_leads_count ?? 0;
    return [Math.max(0, n - 1), n, Math.max(0, n - 2), n, Math.max(0, n - 1), n];
  }, [summary?.open_leads_count]);

  const periodLabel =
    summary?.period_label ||
    (period === 'week'
      ? 'This week'
      : period === 'month'
        ? 'This month'
        : period === '6m'
          ? 'Last 6 months'
          : period === '1y'
            ? 'Last 1 year'
            : 'All time');

  return (
    <div className="@container/dashboard w-full min-w-0 space-y-5 pb-4">
      <div className="flex flex-col gap-3 @[640px]/dashboard:flex-row @[640px]/dashboard:items-end @[640px]/dashboard:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-text sm:text-[28px]">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">{pageDescription}</p>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 @[640px]/dashboard:w-auto">
          {isPrivileged(role) && (
            <div className="relative min-w-0 flex-1 @[400px]/dashboard:flex-none">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
                className="h-10 w-full appearance-none rounded-xl border border-border bg-surface pl-3.5 pr-9 text-sm font-semibold text-text shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-brand-red-500 @[400px]/dashboard:w-auto"
                aria-label="Period"
              >
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="6m">Last 6 months</option>
                <option value="1y">Last 1 year</option>
                <option value="full">All time</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchSummary(period)}
            isLoading={isLoading}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            className="shrink-0"
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger-tint p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchSummary(period)}>
            Retry
          </Button>
        </div>
      )}

      {isPrivileged(role) && failedEmailCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-brand-yellow-400 bg-brand-yellow-tint p-4 text-sm text-brand-text-on-yellow sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>{failedEmailCount} invoice email(s) failed.</strong> Check SMTP in Settings —
              the scheduler retries failed sends daily.
            </span>
          </div>
          <Link href={routes.settings}>
            <Button variant="secondary" size="sm" className="whitespace-nowrap">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              SMTP settings
            </Button>
          </Link>
        </div>
      )}

      {isPrivileged(role) && pendingActions.length > 0 && (
        <div
          id="needs-action"
          className="overflow-hidden rounded-xl border border-border border-l-4 border-l-brand-red-500 bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-brand-red-tint/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-brand-red-500" />
              <h2 className="font-heading text-sm font-bold text-text">
                Needs action · {pendingActions.length} overdue invoice
                {pendingActions.length === 1 ? '' : 's'}
              </h2>
            </div>
            <span className="rounded-md border border-danger/25 bg-surface px-2 py-0.5 text-[11px] font-semibold text-danger">
              Decide late fee
            </span>
          </div>
          <div className="divide-y divide-border">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-text">
                      {action.invoice_number || action.invoice_id}
                    </span>
                    <span className="text-xs text-subtle">·</span>
                    <span className="truncate text-xs font-semibold text-text">
                      {action.client_name || 'Client'}
                    </span>
                    <StatusBadge status="overdue" type="invoice" />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Proposed fee{' '}
                    <strong className="text-text">
                      ₹{((action.fee_paise || 0) / 100).toLocaleString('en-IN')}
                    </strong>{' '}
                    ({action.fee_type === 'percent' ? `${action.fee_value}%` : `₹${action.fee_value}`})
                    {action.reason ? ` · ${action.reason}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickWaive(action)}
                    className="text-muted"
                  >
                    Waive
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => openDecisionModal(action)}>
                    Decide
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── FOUNDER / ADMIN — SilverLogix layout ─── */}
      {isPrivileged(role) && (
        <div className="space-y-5">
          {/* Container-query grid: 1 → 2 → 4 based on content width (sidebar-safe) */}
          <div className="grid grid-cols-1 gap-3 @[520px]/dashboard:grid-cols-2 @[1100px]/dashboard:grid-cols-4">
            <KpiCard
              label="Running projects"
              value={summary?.running_projects_count ?? 0}
              caption="Active now"
              variant="green"
              icon={<FolderKanban className="h-5 w-5" />}
              href={routes.projects}
              isLoading={isLoading}
              sparkline={projectSpark}
              trend={{ label: 'Active', positive: true }}
            />
            <KpiCard
              label="Open leads"
              value={summary?.open_leads_count ?? 0}
              caption="In pipeline"
              variant="blue"
              icon={<TrendingUp className="h-5 w-5" />}
              href={routes.leads}
              isLoading={isLoading}
              sparkline={leadSpark}
              trend={{
                label: summary?.open_leads_count ? 'In pipeline' : 'None open',
                positive: true,
              }}
            />
            <KpiCard
              label="Overdue"
              value={summary?.overdue_invoices_count ?? 0}
              caption="Past due"
              variant="crimson"
              icon={<AlertTriangle className="h-5 w-5" />}
              href="/invoices?status=overdue"
              isLoading={isLoading}
              sparkline={billedSpark.length ? billedSpark : [1, 2, 1, 3, 2, 4]}
              trend={{
                label:
                  (summary?.overdue_invoices_count || 0) > 0 ? 'Needs follow-up' : 'Clear',
                positive: !(summary?.overdue_invoices_count || 0),
              }}
            />
            <KpiCard
              label="Collected"
              value={`₹${moneyPeriod.collected.toLocaleString('en-IN')}`}
              caption={`Received · ${periodLabel}`}
              variant="brand"
              icon={<IndianRupee className="h-5 w-5" />}
              href={routes.invoices}
              isLoading={isLoading}
              sparkline={collectedSpark.length ? collectedSpark : [2, 3, 2, 4, 5, 6]}
              trend={{
                label:
                  moneyPeriod.collected === 0 && moneyPeriod.billed === 0
                    ? `No money in ${periodLabel}`
                    : `₹${moneyPeriod.billed.toLocaleString('en-IN')} billed · ${moneyPeriod.rate}%`,
                positive: moneyPeriod.collected > 0,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {founderQuickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm font-semibold text-text shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-brand-red-500/40 hover:bg-brand-red-tint hover:text-brand-red-500 sm:px-3.5"
              >
                <span className="shrink-0 text-brand-red-500">{link.icon}</span>
                <span className="truncate">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Recent activity table — SilverLogix style */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-heading text-[15px] font-bold text-text">Recent activity</h2>
                <p className="mt-0.5 text-xs text-muted">
                  Latest projects, leads, and invoices · {periodLabel}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => fetchSummary(period)}>
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Refresh
                </Button>
                <Link href={routes.invoices}>
                  <Button variant="primary" size="sm">
                    View all
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg/70 text-[11px] font-bold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-bold">Ref</th>
                    <th className="px-5 py-3 font-bold">Title</th>
                    <th className="px-5 py-3 font-bold">Detail</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Date</th>
                    <th className="px-5 py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} cols={6} />
                    ))
                  ) : summary?.recent_items?.length ? (
                    summary.recent_items.map((item) => {
                      const itemDate = new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      let href: string = routes.dashboard;
                      if (item.type === 'project') href = routes.project(item.id);
                      else if (item.type === 'lead') href = routes.lead(item.id);
                      else if (item.type === 'invoice') href = routes.invoice(item.id);
                      const typeLabel =
                        item.type === 'project'
                          ? 'Project'
                          : item.type === 'lead'
                            ? 'Lead'
                            : 'Invoice';

                      return (
                        <tr key={`${item.type}-${item.id}`} className="hover:bg-bg/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <Link
                              href={href}
                              className="font-semibold text-brand-red-500 hover:underline"
                            >
                              {typeLabel}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5">
                            <Link href={href} className="font-semibold text-text hover:underline">
                              {item.title}
                            </Link>
                          </td>
                          <td className="max-w-[200px] truncate px-5 py-3.5 text-muted">
                            {item.subtitle || '—'}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge
                              status={item.status}
                              type={
                                item.type === 'project'
                                  ? 'project'
                                  : item.type === 'lead'
                                    ? 'lead'
                                    : 'invoice'
                              }
                            />
                          </td>
                          <td className="px-5 py-3.5 tabular-nums text-muted">{itemDate}</td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              href={href}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-text"
                              aria-label="Open"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12">
                        <EmptyState
                          title="Nothing here yet"
                          subtitle="Create a lead, project, or invoice to get started."
                          className="border-0 bg-transparent p-0 shadow-none"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {isLoading ? (
                <div className="space-y-0 divide-y divide-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <CardSkeleton className="border-0 p-0" />
                    </div>
                  ))}
                </div>
              ) : summary?.recent_items?.length ? (
                summary.recent_items.map((item) => {
                  let href: string = routes.dashboard;
                  if (item.type === 'project') href = routes.project(item.id);
                  else if (item.type === 'lead') href = routes.lead(item.id);
                  else if (item.type === 'invoice') href = routes.invoice(item.id);
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={href}
                      className="flex items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text">{item.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {item.type} ·{' '}
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <StatusBadge
                        status={item.status}
                        type={
                          item.type === 'project'
                            ? 'project'
                            : item.type === 'lead'
                              ? 'lead'
                              : 'invoice'
                        }
                      />
                    </Link>
                  );
                })
              ) : (
                <div className="px-4 py-10">
                  <EmptyState
                    title="Nothing here yet"
                    subtitle="Create a lead, project, or invoice to get started."
                    className="border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border bg-bg/40 px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span>
                Showing {summary?.recent_items?.length || 0} recent item
                {(summary?.recent_items?.length || 0) === 1 ? '' : 's'}
              </span>
              <div className="flex flex-wrap gap-2">
                <Link href={routes.projects} className="font-semibold text-brand-red-500 hover:underline">
                  Projects
                </Link>
                <span>·</span>
                <Link href={routes.leads} className="font-semibold text-brand-red-500 hover:underline">
                  Leads
                </Link>
                <span>·</span>
                <Link href={routes.invoices} className="font-semibold text-brand-red-500 hover:underline">
                  Invoices
                </Link>
              </div>
            </div>
          </div>

          {/* Three money charts — billed (area) · collected (cumulative inflow) · spend (line) */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-col gap-2 @[560px]/dashboard:flex-row @[560px]/dashboard:flex-wrap @[560px]/dashboard:items-end @[560px]/dashboard:justify-between">
              <div className="min-w-0">
                <h2 className="font-heading text-[15px] font-bold text-text">Money overview</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {periodLabel} · billed · collected · company spend
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={routes.invoices}>
                  <Button variant="secondary" size="sm">
                    Invoices
                  </Button>
                </Link>
                <Link href={routes.expenses}>
                  <Button variant="secondary" size="sm">
                    Expenses
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 @[720px]/dashboard:grid-cols-2 @[1100px]/dashboard:grid-cols-3">
              {/* Billed — Area */}
              <div className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Billed
                    </p>
                    <p className="mt-1 break-words font-mono text-[20px] font-bold tabular-nums text-text sm:text-[22px]">
                      ₹{moneyPeriod.billed.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-brand-yellow-tint px-2 py-1 text-[10px] font-bold uppercase text-brand-text-on-yellow">
                    Area
                  </span>
                </div>
                <div className="mt-2 h-[160px] w-full min-w-0 sm:h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={moneyChartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="billedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C9A227" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#C9A227" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#E6E8EE" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#94A3B8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatAxis} width={40} />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Billed']}
                      />
                      <Area
                        type="monotone"
                        dataKey="billed"
                        stroke="#C9A227"
                        strokeWidth={2.5}
                        fill="url(#billedFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Collected — cumulative inflow (step area) */}
              <div className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Collected
                    </p>
                    <p className="mt-1 break-words font-mono text-[20px] font-bold tabular-nums text-text sm:text-[22px]">
                      ₹{moneyPeriod.collected.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-brand-red-tint px-2 py-1 text-[10px] font-bold uppercase text-brand-red-500">
                    Inflow
                  </span>
                </div>
                <div className="mt-2 h-[160px] w-full min-w-0 sm:h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={collectedInflowData}
                      margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="collectedInflowFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E32B2B" stopOpacity={0.4} />
                          <stop offset="55%" stopColor="#E32B2B" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#E32B2B" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#E6E8EE" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#94A3B8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatAxis} width={40} />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value: any, name: any) => [
                          `₹${Number(value).toLocaleString('en-IN')}`,
                          name === 'inflow' ? 'Running total' : 'This period',
                        ]}
                      />
                      <Area
                        type="stepAfter"
                        dataKey="inflow"
                        stroke="#E32B2B"
                        strokeWidth={2.5}
                        fill="url(#collectedInflowFill)"
                        activeDot={{ r: 5, fill: '#E32B2B', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Spend — Line */}
              <div className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-4 @[720px]/dashboard:col-span-2 @[1100px]/dashboard:col-span-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Spend
                    </p>
                    <p className="mt-1 break-words font-mono text-[20px] font-bold tabular-nums text-text sm:text-[22px]">
                      ₹{moneyPeriod.spend.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-info-tint px-2 py-1 text-[10px] font-bold uppercase text-info">
                    Line
                  </span>
                </div>
                <div className="mt-2 h-[160px] w-full min-w-0 sm:h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moneyChartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke="#E6E8EE" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#94A3B8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatAxis} width={40} />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spend']}
                      />
                      <Line
                        type="monotone"
                        dataKey="spend"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: '#2563EB', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Link
                  href={routes.expenses}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-red-500 hover:underline"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Company expenses
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── WORKER ─── */}
      {role === 'worker' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 @[520px]/dashboard:grid-cols-2 @[900px]/dashboard:grid-cols-3">
            <KpiCard
              label="Assigned projects"
              value={summary?.running_projects_count ?? 0}
              caption="Active for you"
              variant="green"
              icon={<FolderKanban className="h-4 w-4" />}
              href={routes.projects}
              isLoading={isLoading}
            />
            <KpiCard
              label="My work"
              value="Open"
              caption="Attendance · leave · payslip"
              variant="blue"
              icon={<Briefcase className="h-4 w-4" />}
              href={routes.staffMe}
              isLoading={isLoading}
            />
            <KpiCard
              label="Updates"
              value={summary?.recent_items?.length ?? 0}
              caption="Recent project activity"
              variant="yellow"
              icon={<Clock className="h-4 w-4" />}
              href={routes.projects}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 @[400px]/dashboard:grid-cols-2 @[640px]/dashboard:grid-cols-3">
            {[
              { label: 'My workday', href: routes.staffMe, icon: <Briefcase className="h-4 w-4" /> },
              { label: 'Projects', href: routes.projects, icon: <FolderKanban className="h-4 w-4" /> },
              { label: 'Profile', href: routes.profile, icon: <Users2 className="h-4 w-4" /> },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-brand-red-500/35 hover:bg-brand-red-tint/40"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-brand-red-500">
                  {link.icon}
                </span>
                <span className="truncate text-sm font-semibold text-text">{link.label}</span>
              </Link>
            ))}
          </div>

          <SectionCard
            title="My projects"
            subtitle="Assigned deliverables"
            icon={<FolderKanban className="h-4 w-4" />}
            action={{ label: 'All projects', href: routes.projects }}
            bodyClassName="!p-0"
          >
            <div className="divide-y divide-border">
              {summary?.recent_items?.length ? (
                summary.recent_items.map((item) => (
                  <Link
                    key={item.id}
                    href={routes.project(item.id)}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-bg"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Updated {new Date(item.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <StatusBadge status={item.status} type="project" />
                  </Link>
                ))
              ) : (
                <div className="px-4 py-12">
                  <EmptyState
                    title="No assigned projects"
                    subtitle="Projects appear here after you are added to a delivery team."
                    className="border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── CLIENT ─── */}
      {role === 'client' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 @[520px]/dashboard:grid-cols-2 @[900px]/dashboard:grid-cols-3">
            <KpiCard
              label="Active projects"
              value={summary?.running_projects_count ?? 0}
              caption="In delivery"
              variant="green"
              icon={<FolderKanban className="h-4 w-4" />}
              href={routes.projects}
              isLoading={isLoading}
            />
            <KpiCard
              label="Outstanding"
              value={formatRupees(summary?.unpaid_invoices_total_paise ?? 0)}
              caption="Amount due"
              variant="yellow"
              icon={<IndianRupee className="h-4 w-4" />}
              href={routes.invoices}
              isLoading={isLoading}
            />
            <KpiCard
              label="Overdue"
              value={summary?.overdue_invoices_count ?? 0}
              caption="Past due date"
              variant={summary?.overdue_invoices_count ? 'crimson' : 'green'}
              icon={<ReceiptText className="h-4 w-4" />}
              href={routes.invoices}
              isLoading={isLoading}
            />
          </div>

          {hasRevenueData && (
            <SectionCard
              title="Your billing"
              subtitle={`${periodLabel} · billed vs paid`}
              icon={<IndianRupee className="h-4 w-4" />}
              className="min-h-[280px]"
              bodyClassName="min-h-[220px]"
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="#E6E8EE" vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12141C',
                      borderRadius: '10px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      `₹${Number(value).toLocaleString('en-IN')}`,
                      name === 'collected' ? 'Paid' : 'Billed',
                    ]}
                  />
                  <Bar dataKey="billed" fill="#C9A227" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="collected" fill="#E32B2B" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          <SectionCard
            title="Your invoices"
            subtitle="Issued to your company · PDF available"
            icon={<ReceiptText className="h-4 w-4" />}
            action={{ label: 'All invoices', href: routes.invoices }}
            bodyClassName="!p-0"
          >
            <div className="divide-y divide-border">
              {summary?.recent_items?.length ? (
                summary.recent_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {item.subtitle} · {new Date(item.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={item.status} type="invoice" />
                      <a
                        href={invoicesApi.downloadPdfUrl(item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" size="sm">
                          <Download className="mr-1 h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-12">
                  <EmptyState
                    title="No invoices yet"
                    subtitle="When invoices are issued, they appear here with PDF download."
                    className="border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {selectedAction && (
        <Modal
          isOpen={!!selectedAction}
          onClose={() => setSelectedAction(null)}
          title={`Late fee · ${selectedAction.invoice_number || selectedAction.invoice_id}`}
          subtitle={`Client: ${selectedAction.client_name || 'Client'}`}
          size="md"
          footer={
            <div className="flex w-full items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedAction(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitDecision}
                isLoading={isSubmittingDecision}
              >
                Confirm
              </Button>
            </div>
          }
        >
          {decisionError && (
            <div className="mb-4 rounded-[10px] border border-rose-200 bg-[#FDECEC] p-3 text-xs text-[#B91C1C]">
              {decisionError}
            </div>
          )}

          <form onSubmit={handleSubmitDecision} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text">
                Action type
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {(
                  [
                    { id: 'send_now', label: 'Add fine', icon: Send },
                    { id: 'extend', label: 'Extra time', icon: Calendar },
                    { id: 'schedule', label: 'Schedule fine', icon: Calendar },
                    { id: 'waive', label: 'Waive', icon: Ban },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = decisionData.action_type === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setDecisionData({ ...decisionData, action_type: opt.id })
                      }
                      className={`flex flex-col items-center gap-1.5 rounded-[10px] border p-3 text-xs font-semibold transition-all ${
                        active
                          ? opt.id === 'waive'
                            ? 'border-ink-900 bg-ink-900 text-white'
                            : 'border-brand-red-500 bg-brand-red-tint text-brand-red-500 ring-2 ring-brand-red-500/20'
                          : 'border-border bg-surface text-muted hover:bg-bg'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {decisionData.action_type === 'extend' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text">
                  Extra days to pay
                </label>
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
                  className="w-full rounded-[8px] border border-border px-3 py-2 text-sm text-text"
                />
              </div>
            )}

            {(decisionData.action_type === 'send_now' ||
              decisionData.action_type === 'schedule') && (
              <>
                <div className="grid grid-cols-1 gap-3 rounded-[10px] border border-border bg-bg p-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-text">
                      Fee calculation
                    </label>
                    <select
                      value={decisionData.fee_type}
                      onChange={(e) =>
                        setDecisionData({
                          ...decisionData,
                          fee_type: e.target.value as 'fixed' | 'percent',
                        })
                      }
                      className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-text"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-text">
                      {decisionData.fee_type === 'percent' ? 'Percentage (%)' : 'Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={decisionData.fee_type === 'percent' ? '0.5' : '10'}
                      value={decisionData.fee_value}
                      onChange={(e) =>
                        setDecisionData({
                          ...decisionData,
                          fee_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                  </div>
                </div>

                {decisionData.action_type === 'schedule' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text">
                      Send fine on *
                    </label>
                    <input
                      type="date"
                      required
                      value={decisionData.send_on}
                      onChange={(e) =>
                        setDecisionData({ ...decisionData, send_on: e.target.value })
                      }
                      className="w-full rounded-[8px] border border-border px-3 py-2 text-sm text-text"
                    />
                  </div>
                )}
              </>
            )}

            {decisionData.action_type !== 'waive' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text">
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
                  className="w-full rounded-[8px] border border-border px-3 py-2 text-sm text-text"
                />
                <p className="mt-1 text-[11px] text-muted">
                  Only while the invoice stays overdue and unpaid. Default 24h.
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text">
                Internal reason
              </label>
              <textarea
                rows={2}
                value={decisionData.reason}
                onChange={(e) => setDecisionData({ ...decisionData, reason: e.target.value })}
                placeholder="Reason for late fee or waiver..."
                className="w-full rounded-[8px] border border-border px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
