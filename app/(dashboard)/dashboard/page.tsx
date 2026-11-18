'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { dashboardApi, lateFeeApi, invoicesApi } from '@/lib/api/client';
import { isPrivileged } from '@/lib/roles';
import {
  DashboardSummary,
  LateFeeAction,
  LateFeeDecisionRequest,
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Late Fee Decision Modal State
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

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data);
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
    fetchSummary();
  }, []);

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
    if (!confirm(`Are you sure you want to waive late fees for Invoice ${action.invoice_number || action.invoice_id}?`)) {
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
        decisionData.action_type === 'extend'
          ? 'Due date extended'
          : 'Overdue decision recorded'
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

  const revenueChartData = useMemo(() => {
    const points = summary?.revenue_by_month || [];
    return points.map((p) => ({
      month: p.month,
      billed: Math.round((p.billed_paise || 0) / 100),
      collected: Math.round((p.collected_paise || 0) / 100),
    }));
  }, [summary?.revenue_by_month]);

  const hasRevenueData = revenueChartData.some(
    (p) => (p.billed || 0) > 0 || (p.collected || 0) > 0
  );

  return (
    <div className="ops-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[28px] font-bold text-text tracking-[-0.02em] font-heading">
              {role === 'worker'
                ? 'Engineering Workspace'
                : role === 'client'
                ? 'Client Account Portal'
                : 'Executive Overview'}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-yellow-tint text-brand-text-on-yellow border border-brand-yellow-400/40">
              IST · {todayFormatted}
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            Welcome back, <strong className="text-text font-semibold">{user?.full_name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchSummary}
            isLoading={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* GLOBAL ERROR BANNER */}
      {/* ========================================================= */}
      {error && (
        <div className="p-4 bg-[#FDECEC] border border-rose-200 rounded-[16px] flex items-center justify-between text-xs text-[#B91C1C] shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={fetchSummary}>
            Retry
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* FOUNDER: FAILED EMAIL NOTICE */}
      {/* ========================================================= */}
      {isPrivileged(role) && failedEmailCount > 0 && (
        <div className="p-4 bg-[#FEF6D8] border border-[#FADC59] rounded-[16px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5B4300] shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#5B4300] shrink-0" />
            <span>
              <strong>{failedEmailCount} invoice email delivery attempt(s) failed.</strong> The background scheduler retries failed sends daily up to 3 times. Please check company SMTP settings.
            </span>
          </div>
          <Link href="/settings">
            <Button variant="secondary" size="sm" className="whitespace-nowrap bg-white text-[#5B4300] border-[#FADC59]">
              Verify SMTP Settings
            </Button>
          </Link>
        </div>
      )}

      {/* ========================================================= */}
      {/* FOUNDER: NEEDS ACTION CARD (id="needs-action") */}
      {/* ========================================================= */}
      {isPrivileged(role) && pendingActions.length > 0 && (
        <div
          id="needs-action"
          className="bg-surface rounded-xl border border-border border-l-4 border-l-brand-red-500 overflow-hidden"
        >
          <div className="px-4 py-3 bg-brand-red-tint/60 border-b border-border flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brand-red-500 shrink-0" aria-hidden />
              <h2 className="text-sm font-bold text-text font-heading">
                Needs you · Overdue invoices ({pendingActions.length})
              </h2>
            </div>
            <span className="text-[11px] text-danger font-semibold bg-surface px-2 py-0.5 rounded-md border border-danger/25">
              No late-fee notice sent yet
            </span>
          </div>

          <div className="divide-y divide-[#E6E8EE]">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F6F7F9]/60 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0F172A]">
                      Invoice {action.invoice_number || action.invoice_id}
                    </span>
                    <span className="text-xs text-[#94A3B8]">•</span>
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {action.client_name || 'Client'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDECEC] text-[#B91C1C] border border-rose-200">
                      OVERDUE
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1.5">
                    Proposed Late Fee: <strong className="text-[#0F172A]">₹{((action.fee_paise || 0) / 100).toLocaleString('en-IN')}</strong> ({action.fee_type === 'percent' ? `${action.fee_value}%` : `₹${action.fee_value}`}) · Reason: {action.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickWaive(action)}
                    className="text-xs text-[#64748B] hover:text-[#0F172A]"
                  >
                    Waive
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openDecisionModal(action)}
                    className="text-xs"
                  >
                    <span>Decide Action</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE A: FOUNDER CEO DASHBOARD */}
      {/* ========================================================= */}
      {isPrivileged(role) && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Running Projects"
              value={summary?.running_projects_count ?? 0}
              variant="green"
              icon={<FolderKanban className="w-5 h-5" />}
              href="/projects"
              isLoading={isLoading}
            />
            <KpiCard
              label="Open Leads"
              value={summary?.open_leads_count ?? 0}
              variant="blue"
              icon={<TrendingUp className="w-5 h-5" />}
              href="/leads"
              isLoading={isLoading}
            />
            <KpiCard
              label="Unpaid"
              value={formatRupees(summary?.unpaid_invoices_total_paise ?? 0)}
              variant="yellow"
              icon={<ReceiptText className="w-5 h-5" />}
              href="/invoices"
              isLoading={isLoading}
            />
            <KpiCard
              label="Overdue"
              value={summary?.overdue_invoices_count ?? 0}
              variant="crimson"
              icon={<AlertTriangle className="w-5 h-5" />}
              href="/invoices?status=overdue"
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[280px]">
            <div className="lg:col-span-7 flex min-h-[240px]">
              <SectionCard
                className="flex-1 w-full"
                bodyClassName="flex flex-col min-h-0"
                title="Revenue"
                subtitle="Last 6 months · billed vs collected"
                icon={<IndianRupee className="w-4 h-4" />}
                headerSlot={
                  hasRevenueData ? (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A227]" aria-hidden />
                        <span className="text-muted">Billed</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-brand-red-500" aria-hidden />
                        <span className="text-muted">Collected</span>
                      </div>
                    </div>
                  ) : null
                }
              >
                <div className="flex-1 min-h-[200px] w-full">
                  {!hasRevenueData ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 rounded-xl bg-[#F8F9FB] border border-dashed border-[#E6E8EE]">
                      <p className="text-sm font-semibold text-text">No billing yet</p>
                      <p className="text-xs text-muted mt-1">
                        Chart fills when invoices are issued or paid.
                      </p>
                      <Link href="/invoices" className="mt-3">
                        <Button variant="secondary" size="sm">
                          Open invoices
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenueChartData}
                        margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                        barGap={4}
                        barCategoryGap="28%"
                      >
                        <CartesianGrid stroke="#E6E8EE" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="#94A3B8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94A3B8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `₹${v / 1000}k`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
                          contentStyle={{
                            backgroundColor: '#12141C',
                            borderRadius: '10px',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                          formatter={(value: any, name: any) => [
                            `₹${Number(value).toLocaleString('en-IN')}`,
                            name === 'collected' ? 'Collected' : 'Billed',
                          ]}
                        />
                        <Bar
                          dataKey="billed"
                          name="billed"
                          fill="#C9A227"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={18}
                        />
                        <Bar
                          dataKey="collected"
                          name="collected"
                          fill="#E32B2B"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-5 flex min-h-[240px]">
              <SectionCard
                className="flex-1 w-full"
                bodyClassName="flex flex-col min-h-0"
                title="Recent activity"
                subtitle="Latest projects, leads, invoices"
                icon={<Clock className="w-4 h-4" />}
              >
                <div className="divide-y divide-[#E6E8EE] -mx-4 -my-4 flex-1 min-h-[200px]">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))
                  ) : summary?.recent_items?.length ? (
                    summary.recent_items.map((item) => {
                      const itemDate = new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      });
                      let href = '/dashboard';
                      if (item.type === 'project') href = `/projects/${item.id}`;
                      else if (item.type === 'lead') href = `/leads/${item.id}`;
                      else if (item.type === 'invoice') href = `/invoices/${item.id}`;

                      return (
                        <Link
                          key={`${item.type}-${item.id}`}
                          href={href}
                          className="p-4 flex items-center justify-between hover:bg-[#F6F7F9] transition-colors duration-150"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0F172A] truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#64748B] mt-0.5 truncate">
                              {item.subtitle || item.type} · {itemDate}
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
                    <div className="py-14 px-4">
                      <EmptyState
                        title="Nothing here yet"
                        subtitle="Create a lead, project, or invoice to get started."
                      />
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE B: WORKER DASHBOARD */}
      {/* ========================================================= */}
      {role === 'worker' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Assigned Projects"
              value={summary?.running_projects_count ?? 0}
              variant="green"
              icon={<FolderKanban className="w-5 h-5" />}
              href="/projects"
              isLoading={isLoading}
            />
          </div>

          <SectionCard
            title="My projects"
            subtitle="Assigned deliverables"
            icon={<FolderKanban className="w-4 h-4" />}
            action={{ label: 'All projects', href: '/projects' }}
          >
            <div className="divide-y divide-[#E6E8EE] -mx-5 -my-5">
              {summary?.recent_items?.length ? (
                summary.recent_items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/projects/${item.id}`}
                    className="p-4 flex items-center justify-between hover:bg-[#F6F7F9] transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{item.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Updated {new Date(item.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <StatusBadge status={item.status} type="project" />
                  </Link>
                ))
              ) : (
                <div className="py-12">
                  <EmptyState
                    title="No assigned projects"
                    subtitle="Projects appear here after you are added to a delivery team."
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE C: CLIENT DASHBOARD */}
      {/* ========================================================= */}
      {role === 'client' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiCard
              label="Active Projects"
              value={summary?.running_projects_count ?? 0}
              variant="green"
              icon={<FolderKanban className="w-5 h-5" />}
              href="/projects"
              isLoading={isLoading}
            />
            <KpiCard
              label="Outstanding"
              value={formatRupees(summary?.unpaid_invoices_total_paise ?? 0)}
              variant="yellow"
              icon={<IndianRupee className="w-5 h-5" />}
              href="/invoices"
              isLoading={isLoading}
            />
            <KpiCard
              label="Overdue"
              value={summary?.overdue_invoices_count ?? 0}
              variant={summary?.overdue_invoices_count ? 'crimson' : 'green'}
              icon={<ReceiptText className="w-5 h-5" />}
              href="/invoices"
              isLoading={isLoading}
            />
          </div>

          <SectionCard
            title="Your invoices"
            subtitle="Issued to your company · PDF on each row"
            icon={<ReceiptText className="w-4 h-4" />}
            action={{ label: 'All invoices', href: '/invoices' }}
          >
            <div className="divide-y divide-[#E6E8EE] -mx-5 -my-5">
              {summary?.recent_items?.length ? (
                summary.recent_items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-[#F6F7F9] transition-colors duration-150"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{item.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 truncate">
                        {item.subtitle} · {new Date(item.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={item.status} type="invoice" />
                      <a
                        href={invoicesApi.downloadPdfUrl(item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" size="sm" className="h-8 text-xs">
                          <Download className="w-3.5 h-3.5 mr-1" />
                          PDF
                        </Button>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12">
                  <EmptyState
                    title="No invoices yet"
                    subtitle="When invoices are issued, they appear here with PDF download."
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================= */}
      {/* LATE FEE DECISION MODAL (FOUNDER ONLY) */}
      {/* ========================================================= */}
      {selectedAction && (
        <Modal
          isOpen={!!selectedAction}
          onClose={() => setSelectedAction(null)}
          title={`Late Fee Decision: Invoice ${selectedAction.invoice_number || selectedAction.invoice_id}`}
          subtitle={`Client: ${selectedAction.client_name || 'Client'}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAction(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitDecision}
                isLoading={isSubmittingDecision}
              >
                Confirm Decision
              </Button>
            </div>
          }
        >
          {decisionError && (
            <div className="mb-4 p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C]">
              {decisionError}
            </div>
          )}

          <form onSubmit={handleSubmitDecision} className="space-y-4">
            {/* Action Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-2">
                Action Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'send_now' })}
                  className={`p-3 rounded-[10px] border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    decisionData.action_type === 'send_now'
                      ? 'border-[#E32B2B] bg-[#FFF1F0] text-[#E32B2B] ring-2 ring-[#E32B2B]/20'
                      : 'border-[#E6E8EE] bg-white text-[#64748B] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Add fine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'extend' })}
                  className={`p-3 rounded-[10px] border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    decisionData.action_type === 'extend'
                      ? 'border-[#E32B2B] bg-[#FFF1F0] text-[#E32B2B] ring-2 ring-[#E32B2B]/20'
                      : 'border-[#E6E8EE] bg-white text-[#64748B] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Extra time</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'schedule' })}
                  className={`p-3 rounded-[10px] border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    decisionData.action_type === 'schedule'
                      ? 'border-[#E32B2B] bg-[#FFF1F0] text-[#E32B2B] ring-2 ring-[#E32B2B]/20'
                      : 'border-[#E6E8EE] bg-white text-[#64748B] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule fine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecisionData({ ...decisionData, action_type: 'waive' })}
                  className={`p-3 rounded-[10px] border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    decisionData.action_type === 'waive'
                      ? 'border-[#0F172A] bg-[#12141C] text-white'
                      : 'border-[#E6E8EE] bg-white text-[#64748B] hover:bg-[#F6F7F9]'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>Waive</span>
                </button>
              </div>
            </div>

            {decisionData.action_type === 'extend' && (
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
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
                  className="w-full px-3 py-2 text-xs border border-[#E6E8EE] rounded-[8px] text-[#0F172A]"
                />
              </div>
            )}

            {(decisionData.action_type === 'send_now' ||
              decisionData.action_type === 'schedule') && (
              <>
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#F6F7F9] border border-[#E6E8EE] rounded-[10px]">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Fee Calculation
                    </label>
                    <select
                      value={decisionData.fee_type}
                      onChange={(e) =>
                        setDecisionData({ ...decisionData, fee_type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#E6E8EE] rounded-[8px] bg-white text-[#0F172A]"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
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
                      className="w-full px-3 py-2 text-xs border border-[#E6E8EE] rounded-[8px] bg-white text-[#0F172A]"
                    />
                  </div>
                </div>

                {decisionData.action_type === 'schedule' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                      Send fine on *
                    </label>
                    <input
                      type="date"
                      required
                      value={decisionData.send_on}
                      onChange={(e) =>
                        setDecisionData({ ...decisionData, send_on: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#E6E8EE] rounded-[8px] text-[#0F172A]"
                    />
                  </div>
                )}
              </>
            )}

            {decisionData.action_type !== 'waive' && (
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
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
                  className="w-full px-3 py-2 text-xs border border-[#E6E8EE] rounded-[8px] text-[#0F172A]"
                />
                <p className="text-[11px] text-muted mt-1">
                  Only while the invoice stays overdue and unpaid. Default 24h.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Internal Reason
              </label>
              <textarea
                rows={2}
                value={decisionData.reason}
                onChange={(e) => setDecisionData({ ...decisionData, reason: e.target.value })}
                placeholder="Reason for late fee or waiver..."
                className="w-full px-3 py-2 text-xs border border-[#E6E8EE] rounded-[8px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#E32B2B]"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
