'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { invoicesApi } from '@/lib/api/client';
import { Invoice, InvoiceStatus, RecurringInvoice } from '@/lib/types';
import { isPrivileged } from '@/lib/roles';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  IndianRupee,
  Eye,
  Check,
  AlertTriangle,
  Zap,
  Building2,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';

export default function InvoicesListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [topTab, setTopTab] = useState<'invoices' | 'recurring'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurringList, setRecurringList] = useState<RecurringInvoice[]>([]);
  const [statusTab, setStatusTab] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invs, recurring] = await Promise.all([
        invoicesApi.list(),
        isPrivileged(user?.role) ? invoicesApi.listRecurring().catch(() => []) : Promise.resolve([]),
      ]);
      setInvoices(invs);
      setRecurringList(recurring);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.role) return;
    fetchInvoices();
  }, [user?.role]);

  const handleMarkPaid = async (id: string, e: React.MouseEvent, hasProof?: boolean) => {
    e.stopPropagation();
    try {
      if (hasProof) {
        await invoicesApi.verifyPayment(id);
        toast.success('Payment verified — paid receipt emailed');
      } else {
        await invoicesApi.markPaid(id);
        toast.success('Invoice marked as paid');
      }
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark invoice as paid');
    }
  };

  const handleToggleRecurring = async (plan: RecurringInvoice) => {
    try {
      await invoicesApi.updateRecurring(plan.id, { active: !plan.active });
      toast.success(`Plan ${!plan.active ? 'activated' : 'paused'}`);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update plan status');
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring maintenance schedule?')) return;
    try {
      await invoicesApi.deleteRecurring(id);
      toast.success('Recurring plan deleted');
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete plan');
    }
  };

  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    try {
      await invoicesApi.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete invoice');
    }
  };

  const searchedInvoices = useMemo(() => {
    if (!search) return invoices;
    const term = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(term) ||
        (inv.client_name && inv.client_name.toLowerCase().includes(term)) ||
        (inv.project_name && inv.project_name.toLowerCase().includes(term))
    );
  }, [invoices, search]);

  const tabCounts = useMemo(() => {
    return {
      all: searchedInvoices.length,
      draft: searchedInvoices.filter((i) => i.status === 'draft').length,
      sent: searchedInvoices.filter((i) => i.status === 'sent').length,
      paid: searchedInvoices.filter((i) => i.status === 'paid').length,
      overdue: searchedInvoices.filter((i) => i.status === 'overdue').length,
    };
  }, [searchedInvoices]);

  // Financial KPI totals
  const totalBilledPaise = useMemo(
    () => invoices.reduce((s, i) => s + (i.total_paise || 0), 0),
    [invoices]
  );
  const totalPaidPaise = useMemo(
    () => invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total_paise || 0), 0),
    [invoices]
  );
  const totalUnpaidPaise = useMemo(
    () => invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.total_paise || 0), 0),
    [invoices]
  );
  const overdueCount = useMemo(
    () => invoices.filter((i) => i.status === 'overdue').length,
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    if (statusTab === 'all') return searchedInvoices;
    return searchedInvoices.filter((inv) => inv.status === statusTab);
  }, [searchedInvoices, statusTab]);

  const isFounder = isPrivileged(user?.role);

  // Invoice Columns
  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice & Period',
      sortable: true,
      render: (row: Invoice) => (
        <div>
          <Link
            href={`/invoices/${row.id}`}
            className="font-bold text-[#0F172A] hover:text-[#E32B2B] transition-colors"
          >
            {row.invoice_number}
          </Link>
          <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1.5">
            {row.period_key ? (
              <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
                {row.period_key}
              </span>
            ) : (
              <span>Standard Billing</span>
            )}
            {row.invoice_type === 'late_fee' && (
              <span className="text-[#B91C1C] font-semibold">· Late Fee</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'client_name',
      header: 'Customer',
      sortable: true,
      render: (row: Invoice) => (
        <div>
          <div className="font-semibold text-[#0F172A]">{row.client_name || 'Client'}</div>
          {row.project_name && (
            <div className="text-[11px] text-[#64748B] truncate max-w-xs">
              {row.project_name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (row: Invoice) => {
        const d = new Date(row.due_date);
        const isPast = d < new Date() && row.status !== 'paid';
        return (
          <div>
            <div className={`font-mono text-xs ${isPast ? 'text-[#B91C1C] font-bold' : 'text-[#0F172A]'}`}>
              {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div className="text-[10px] text-[#94A3B8]">
              Issued {new Date(row.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </div>
          </div>
        );
      },
    },
    {
      key: 'total_paise',
      header: 'Amount',
      sortable: true,
      render: (row: Invoice) => (
        <span className="font-mono text-xs font-bold text-[#0F172A] tabular-nums">
          ₹{((row.total_paise || 0) / 100).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: Invoice) => <StatusBadge status={row.status} type="invoice" />,
    },
    {
      key: 'email_status',
      header: 'Email Delivery',
      render: (row: Invoice) => {
        const status = row.email_status || 'pending';
        if (status === 'sent') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Delivered</span>
            </span>
          );
        }
        if (status === 'failed') {
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B91C1C] bg-[#FDECEC] px-2 py-0.5 rounded-full border border-rose-200">
              <AlertTriangle className="w-3 h-3" />
              <span>Failed</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      },
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right' as const,
      render: (row: Invoice) => (
        <div className="flex items-center justify-end gap-1">
          {row.status !== 'paid' && row.status !== 'cancelled' && row.status !== 'void' && isFounder && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => handleMarkPaid(row.id, e, Boolean(row.has_payment_proof))}
              className="h-8 px-2 text-xs"
              title={row.has_payment_proof ? 'Verified and Paid' : 'Mark as Paid'}
            >
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              <span>{row.has_payment_proof ? 'Verify' : 'Paid'}</span>
            </Button>
          )}

          {row.status !== 'paid' && isFounder && (
            <Link href={`/invoices/${row.id}/edit`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}

          <a
            href={invoicesApi.downloadPdfUrl(row.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" title="Download PDF">
              <Download className="w-3.5 h-3.5" />
            </Button>
          </a>

          <Link href={`/invoices/${row.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Eye className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {row.status !== 'paid' && isFounder && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-[#B91C1C]"
              title="Delete"
              onClick={(e) => handleDeleteInvoice(row.id, e)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Recurring Plan Columns
  const recurringColumns: Column<RecurringInvoice>[] = [
    {
      key: 'project_name',
      header: 'Project & Client',
      sortable: true,
      render: (row: RecurringInvoice) => (
        <div>
          <div className="font-bold text-[#0F172A]">{row.project_name || 'Project'}</div>
          <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
            <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>{row.client_name || 'Client'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount_paise',
      header: 'Monthly Fee',
      sortable: true,
      render: (row: RecurringInvoice) => (
        <span className="font-mono text-xs font-bold text-[#0F172A]">
          ₹{((row.amount_paise || 0) / 100).toLocaleString('en-IN')}/mo
        </span>
      ),
    },
    {
      key: 'send_day',
      header: 'Send Day',
      render: (row: RecurringInvoice) => (
        <span className="text-xs text-[#0F172A]">
          {row.send_day}th of every month
        </span>
      ),
    },
    {
      key: 'due_after_days',
      header: 'Terms',
      render: (row: RecurringInvoice) => (
        <span className="text-xs text-[#64748B]">
          Due in {row.due_after_days}d · Remind every {row.reminder_every_days}d
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row: RecurringInvoice) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.active}
            onChange={() => handleToggleRecurring(row)}
          />
          <span
            className={`text-xs font-semibold ${
              row.active ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {row.active ? 'Active' : 'Paused'}
          </span>
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right' as const,
      render: (row: RecurringInvoice) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleDeleteRecurring(row.id)}
            className="p-1.5 text-[#94A3B8] hover:text-[#B91C1C] hover:bg-rose-50 rounded-[8px] transition-colors"
            title="Delete plan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
              Invoices &amp; Receivables
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#12141C] text-white">
              {invoices.length} Total
            </span>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            GST compliant invoicing, automated monthly maintenance generation, and receivables ledger.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchInvoices}
            isLoading={isLoading}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            className="h-9"
          >
            Refresh
          </Button>

          {isFounder && (
            <Link href="/invoices/new">
              <Button variant="primary" size="sm" className="h-9 shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Issue Invoice</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Nexora Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Total Billed"
          value={`₹${(totalBilledPaise / 100).toLocaleString('en-IN')}`}
          variant="blue"
          icon={<FileText className="w-5 h-5" />}
          caption="Gross invoicing volume"
        />

        <KpiCard
          label="Collected Inflow"
          value={`₹${(totalPaidPaise / 100).toLocaleString('en-IN')}`}
          variant="green"
          icon={<IndianRupee className="w-5 h-5" />}
          caption="Paid & cleared invoices"
        />

        <KpiCard
          label="Unpaid Receivables"
          value={`₹${(totalUnpaidPaise / 100).toLocaleString('en-IN')}`}
          variant="yellow"
          icon={<Clock className="w-5 h-5" />}
          caption="Awaiting client settlement"
        />

        <KpiCard
          label="Overdue Risk"
          value={overdueCount}
          variant={overdueCount > 0 ? 'crimson' : 'green'}
          icon={<AlertTriangle className="w-5 h-5" />}
          caption={overdueCount > 0 ? 'Immediate action required' : 'Zero overdue payments'}
          href="/invoices?status=overdue"
        />
      </div>

      {/* Top Level Mode Tabs: Invoices vs Maintenance Plans */}
      <div className="border-b border-[#E6E8EE] flex items-center justify-between gap-4 pb-2">
        <Tabs
          tabs={[
            { id: 'invoices', label: 'All Invoices', count: invoices.length },
            ...(isFounder
              ? [{ id: 'recurring', label: 'Recurring Maintenance Plans', count: recurringList.length }]
              : []),
          ]}
          activeTab={topTab}
          onChange={(id) => setTopTab(id as any)}
        />
      </div>

      {topTab === 'invoices' ? (
        <div className="space-y-4">
          {/* Sub Status Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Tabs
              tabs={[
                { id: 'all', label: 'All', count: tabCounts.all },
                { id: 'draft', label: 'Draft', count: tabCounts.draft },
                { id: 'sent', label: 'Sent', count: tabCounts.sent },
                { id: 'paid', label: 'Paid', count: tabCounts.paid },
                { id: 'overdue', label: 'Overdue', count: tabCounts.overdue },
              ]}
              activeTab={statusTab}
              onChange={setStatusTab}
            />

            <div className="w-full min-w-0 sm:w-72 lg:w-80">
              <Input
                placeholder="Search invoice #, client..."
                leftIcon={<Search className="w-4 h-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <DataTable
            columns={invoiceColumns}
            data={filteredInvoices}
            rowKey="id"
            isLoading={isLoading}
            emptyMessage="No invoices found matching current filter."
            onRowClick={(row: Invoice) => router.push(`/invoices/${row.id}`)}
          />
        </div>
      ) : (
        /* RECURRING PLANS TAB */
        <div className="space-y-4">
          <DataTable
            columns={recurringColumns}
            data={recurringList}
            rowKey="id"
            isLoading={isLoading}
            emptyMessage="No recurring maintenance schedules configured. Create a project with maintenance billing enabled."
          />
        </div>
      )}
    </div>
  );
}
