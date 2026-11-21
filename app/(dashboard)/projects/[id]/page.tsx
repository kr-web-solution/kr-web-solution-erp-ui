'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { projectsApi, invoicesApi, engagementsApi, clientsApi, usersApi } from '@/lib/api/client';
import {
  Project,
  Invoice,
  ProjectStatus,
  EngagementListItem,
  EngagementDetail,
  Client,
  User,
} from '@/lib/types';
import { stageLabel } from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import {
  ArrowLeft,
  Trash2,
  FileText,
  Zap,
  Pause,
  Play,
  Plus,
  Download,
  Send,
  Pencil,
  X,
  IndianRupee,
  CalendarDays,
  Users,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ProjectDeliveryPanel } from '@/components/projects/ProjectDeliveryPanel';
import { ProjectFilesPanel } from '@/components/projects/ProjectFilesPanel';
import { ProjectFeaturesPanel } from '@/components/projects/ProjectFeaturesPanel';
import { toast } from 'sonner';

function parseIsoDate(iso?: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatIsoDate(iso?: string | null) {
  const dt = parseIsoDate(iso);
  if (!dt) return 'Not set';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function addDaysIso(iso: string, days: number) {
  const dt = parseIsoDate(iso);
  if (!dt) return null;
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function DevelopmentTimeline({
  startDate,
  developmentDays,
  storedEnd,
  canEdit,
  onStartChange,
}: {
  startDate?: string | null;
  developmentDays?: number | null;
  storedEnd?: string | null;
  canEdit: boolean;
  onStartChange: (value: string) => Promise<void>;
}) {
  const days = developmentDays && developmentDays > 0 ? developmentDays : 0;
  const deadline = startDate && days ? addDaysIso(startDate, days) : storedEnd || null;
  const start = parseIsoDate(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsed = start ? Math.floor((today.getTime() - start.getTime()) / 86400000) : 0;
  const doneDays = days ? Math.min(days, Math.max(0, elapsed)) : 0;
  const pct = days ? Math.round((doneDays / days) * 100) : 0;
  const label =
    !startDate
      ? 'Not started — pick a start date'
      : !days
        ? 'Set development days'
        : elapsed < 0
          ? `Starts in ${Math.abs(elapsed)} day${Math.abs(elapsed) === 1 ? '' : 's'}`
          : elapsed >= days
            ? 'Development window complete'
            : `Day ${elapsed + 1} of ${days}`;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <label className="rounded-[10px] bg-bg border border-border px-3 py-2 block cursor-pointer">
          <span className="text-muted">Start</span>
          {canEdit ? (
            <input
              type="date"
              className="mt-1 block w-full bg-transparent text-sm font-semibold text-text focus:outline-none cursor-pointer"
              value={startDate ? startDate.slice(0, 10) : ''}
              onChange={(e) => onStartChange(e.target.value)}
            />
          ) : (
            <p className="font-semibold text-text mt-0.5">{formatIsoDate(startDate)}</p>
          )}
        </label>
        <div className="rounded-[10px] bg-bg border border-border px-3 py-2">
          <p className="text-muted">Deadline</p>
          <p className="font-semibold text-text mt-0.5">{formatIsoDate(deadline)}</p>
          {days > 0 && <p className="text-[11px] text-muted mt-0.5">{days} development days</p>}
        </div>
      </div>
      {startDate && days > 0 && (
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted mb-1">
            <span>{label}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full bg-brand-red-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [money, setMoney] = useState<Awaited<ReturnType<typeof projectsApi.money>> | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [linkedEngagement, setLinkedEngagement] = useState<
    EngagementListItem | EngagementDetail | null
  >(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [invoiceActionBusy, setInvoiceActionBusy] = useState<string | null>(null);
  const [devInvoiceOpen, setDevInvoiceOpen] = useState(false);
  const [amcInvoiceOpen, setAmcInvoiceOpen] = useState(false);
  const [devAmount, setDevAmount] = useState('');
  const [devDate, setDevDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amcMonths, setAmcMonths] = useState('1');
  const [amcDate, setAmcDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amcRate, setAmcRate] = useState('');
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pause Maintenance Confirmation Dialog State
  const [showPausePrompt, setShowPausePrompt] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [showGoLivePrompt, setShowGoLivePrompt] = useState(false);
  const [goLiveDate, setGoLiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pendingStatusChange, setPendingStatusChange] = useState<ProjectStatus | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [addClientId, setAddClientId] = useState('');
  const [clientActionBusy, setClientActionBusy] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editWorkers, setEditWorkers] = useState<User[]>([]);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    client_ids: [] as string[],
    worker_ids: [] as string[],
    development_days: '',
    budget_rupees: '',
    maintenance_rupees: '',
  });

  const projectClients = project?.clients?.length
    ? project.clients
    : project
      ? [{ id: project.client_id, name: project.client_name || 'Client', is_primary: true }]
      : [];

  const fetchProjectData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const proj = await projectsApi.get(projectId);
      setProject(proj);
      if (user?.role !== 'worker') {
        projectsApi.money(projectId).then(setMoney).catch(() => setMoney(null));
      }

      try {
        if (proj.engagement_id) {
          const detail = await engagementsApi.get(proj.engagement_id);
          setLinkedEngagement(detail);
        } else {
          const engs = await engagementsApi.list({ project_id: projectId, include_lost: true });
          setLinkedEngagement(engs[0] || null);
        }
      } catch {
        setLinkedEngagement(null);
      }

      // Fetch linked invoices if not worker
      if (user?.role !== 'worker') {
        const allInvoices = await invoicesApi.list();
        setInvoices(allInvoices.filter((inv) => inv.project_id === projectId));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const openAddClient = async () => {
    setShowAddClient(true);
    setAddClientId('');
    try {
      const list = await clientsApi.list();
      setAllClients(list);
    } catch {
      toast.error('Failed to load clients');
    }
  };

  const openEditProject = async () => {
    if (!project) return;
    const linkedIds = project.client_ids?.length
      ? project.client_ids
      : projectClients.map((c) => c.id);
    const pipelineHint =
      (linkedEngagement?.quoted_paise || linkedEngagement?.estimated_budget_paise || 0) / 100;
    const usePipeline = !(project.budget_paise || 0) && pipelineHint > 0;
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      client_ids: linkedIds,
      worker_ids: (project.workers || []).map((w) => w.id),
      development_days: project.development_days ? String(project.development_days) : '15',
      budget_rupees: String(
        usePipeline ? pipelineHint : (project.budget_paise || 0) / 100 || ''
      ),
      maintenance_rupees: String((project.maintenance_amount_paise || 0) / 100 || ''),
    });
    setEditError(null);
    setIsEditOpen(true);
    try {
      const [cList, uList] = await Promise.all([clientsApi.list(), usersApi.list()]);
      setAllClients(cList);
      const assigned = new Set((project.workers || []).map((w) => w.id));
      const workers = uList.filter(
        (u) => (u.role === 'worker' && u.is_active) || assigned.has(u.id)
      );
      for (const w of project.workers || []) {
        if (!workers.some((x) => x.id === w.id)) workers.push(w);
      }
      setEditWorkers(workers);
    } catch {
      toast.error('Failed to load clients or team members');
    }
  };

  const handleSaveProjectDetails = async () => {
    if (!editForm.name.trim()) {
      setEditError('Project name is required.');
      return;
    }
    if (!editForm.client_ids.length) {
      setEditError('Select at least one client.');
      return;
    }
    const daysRaw = editForm.development_days.trim();
    let development_days: number | undefined;
    if (daysRaw) {
      const parsed = parseInt(daysRaw, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        setEditError('Duration must be at least 1 day.');
        return;
      }
      development_days = parsed;
    }
    const budget = Math.round(parseFloat(editForm.budget_rupees || '0') * 100);
    const amc = Math.round(parseFloat(editForm.maintenance_rupees || '0') * 100);
    if (editForm.budget_rupees.trim() && (!Number.isFinite(budget) || budget < 0)) {
      setEditError('Enter a valid total development amount.');
      return;
    }
    if (editForm.maintenance_rupees.trim() && (!Number.isFinite(amc) || amc < 0)) {
      setEditError('Enter a valid monthly maintenance amount.');
      return;
    }
    setEditError(null);
    setIsSavingEdit(true);
    try {
      const updated = await projectsApi.update(projectId, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        client_ids: editForm.client_ids,
        worker_ids: editForm.worker_ids,
        ...(development_days != null ? { development_days } : {}),
        ...(editForm.budget_rupees.trim() ? { budget_paise: budget } : {}),
        maintenance_amount_paise: Number.isFinite(amc) && amc > 0 ? amc : 0,
      });
      setProject(updated);
      setIsEditOpen(false);
      toast.success('Project details updated');
      await fetchProjectData();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update project.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddClient = async () => {
    if (!addClientId) {
      toast.error('Select a client to add');
      return;
    }
    setClientActionBusy(true);
    try {
      const updated = await projectsApi.addClient(projectId, addClientId);
      setProject(updated);
      setShowAddClient(false);
      setAddClientId('');
      toast.success('Client added to project');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add client');
    } finally {
      setClientActionBusy(false);
    }
  };

  const handleRemoveClient = async (clientId: string, clientName: string) => {
    if (projectClients.length <= 1) {
      toast.error('A project must keep at least one client');
      return;
    }
    setClientActionBusy(true);
    try {
      const updated = await projectsApi.removeClient(projectId, clientId);
      setProject(updated);
      toast.success(`Removed ${clientName} from project`);
    } catch (err: any) {
      toast.error(err?.message || 'Cannot remove client');
    } finally {
      setClientActionBusy(false);
    }
  };

  const handleStatusSelect = (newStatus: ProjectStatus) => {
    if (!isPrivileged(user?.role) && user?.role === 'worker') {
      if (newStatus !== 'running' && newStatus !== 'on_hold') {
        toast.error('Workers can only set Running or On Hold');
        return;
      }
    } else if (!isPrivileged(user?.role)) {
      toast.error('You cannot change project status');
      return;
    }

    if (
      project &&
      (project.status === 'stopped' || project.status === 'completed') &&
      newStatus === 'running'
    ) {
      const reason = window.prompt('Reopen reason (required):');
      if (!reason?.trim()) {
        toast.error('A reopen reason is required');
        return;
      }
      applyStatusChange(newStatus, false, { reopen_reason: reason.trim() });
      return;
    }

    if (newStatus === 'stopped' && project?.maintenance_status === 'active') {
      setPendingStatusChange(newStatus);
      setShowPausePrompt(true);
    } else {
      applyStatusChange(newStatus, false);
    }
  };

  const applyStatusChange = async (
    newStatus: ProjectStatus,
    alsoPauseMaintenance: boolean = false,
    extra?: { reopen_reason?: string; status_reason?: string }
  ) => {
    setIsUpdatingStatus(true);
    try {
      if (alsoPauseMaintenance && project?.maintenance_status === 'active') {
        await projectsApi.toggleMaintenance(projectId);
      }
      const updated = await projectsApi.update(projectId, {
        status: newStatus,
        ...(extra?.reopen_reason ? { reopen_reason: extra.reopen_reason } : {}),
        ...(extra?.status_reason ? { status_reason: extra.status_reason } : {}),
      });
      setProject(updated);
      toast.success(`Project status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update project status.');
    } finally {
      setIsUpdatingStatus(false);
      setShowPausePrompt(false);
      setPendingStatusChange(null);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!project) return;
    setIsTogglingMaintenance(true);
    try {
      const updated = await projectsApi.toggleMaintenance(projectId);
      setProject(updated);
      toast.success(
        updated.maintenance_status === 'active'
          ? 'Monthly maintenance activated'
          : 'Monthly maintenance paused'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle maintenance status.');
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  const handleGoLive = async () => {
    setIsGoingLive(true);
    try {
      const res = await projectsApi.goLive(projectId, goLiveDate || undefined);
      if (res.project) setProject(res.project);
      if (res.created && res.emailed) {
        toast.success(
          `Go Live — prorata emailed (${res.billable_days}/${res.days_in_month} days)`
        );
      } else if (res.created) {
        toast.success(
          `Go Live — prorata created (${res.billable_days}/${res.days_in_month} days); email may need retry`
        );
      } else {
        toast.message(res.reason || 'Go Live recorded');
      }
      setShowGoLivePrompt(false);
      await fetchProjectData();
    } catch (err: any) {
      toast.error(err?.message || 'Go Live failed');
    } finally {
      setIsGoingLive(false);
    }
  };

  const handleCreateAdvanceInvoice = async () => {
    setInvoiceActionBusy('advance');
    try {
      const res = await projectsApi.createAdvanceInvoice(projectId);
      if (res.project) setProject(res.project);
      toast.success(`Advance invoice ${res.invoice_number} ready`);
      await fetchProjectData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create advance invoice');
    } finally {
      setInvoiceActionBusy(null);
    }
  };

  const handleCreateBalanceInvoice = async () => {
    setInvoiceActionBusy('balance');
    try {
      const res = await projectsApi.createBalanceInvoice(projectId);
      if (res.project) setProject(res.project);
      toast.success(`Balance invoice ${res.invoice_number} ready`);
      await fetchProjectData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create balance invoice');
    } finally {
      setInvoiceActionBusy(null);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setSendingInvoiceId(invoiceId);
    try {
      await invoicesApi.sendEmail(invoiceId);
      toast.success('Invoice emailed to client');
      await fetchProjectData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send invoice');
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    setDeletingInvoiceId(invoiceId);
    try {
      await invoicesApi.delete(invoiceId);
      toast.success('Invoice deleted');
      await fetchProjectData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete invoice');
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await projectsApi.delete(projectId);
      toast.success('Project deleted successfully');
      router.push('/projects');
    } catch (err: any) {
      setShowDeletePrompt(false);
      const data = err?.data;
      const invCount = data?.invoice_count;
      const planCount = data?.plan_count;
      if (err?.status === 409 && (invCount != null || planCount != null)) {
        const bits: string[] = [];
        if (invCount) bits.push(`${invCount} invoice(s)`);
        if (planCount) bits.push(`${planCount} maintenance plan(s)`);
        toast.error(data?.detail || err?.message || 'Cannot delete project', {
          description: bits.length
            ? `Remove ${bits.join(' and ')} first, then try again.`
            : undefined,
          action: {
            label: 'View invoices',
            onClick: () => setActiveTab('invoices'),
          },
          duration: 10000,
        });
      } else {
        toast.error(err?.message || 'Failed to delete project.');
      }
    }
  };

  const addMonthsMinusDay = (iso: string, months: number) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const dt = new Date(y, m - 1 + months, d);
    dt.setDate(dt.getDate() - 1);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  const createDevelopmentInvoice = async () => {
    if (!project) return;
    const rupees = parseFloat(devAmount);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      toast.error('Enter the development amount');
      return;
    }
    if (!devDate) {
      toast.error('Choose the invoice date');
      return;
    }
    setInvoiceActionBusy('dev');
    try {
      const dueDate = new Date(devDate);
      dueDate.setDate(dueDate.getDate() + 15);
      const dueIso = dueDate.toISOString().slice(0, 10);
      const created = await invoicesApi.create({
        invoice_type: 'custom_dev',
        client_id: project.client_id,
        project_id: project.id,
        issue_date: devDate,
        due_date: dueIso,
        notes: `Development invoice · ${project.name}`,
        items: [
          {
            description: `Development — ${project.name} · ${devDate}`,
            quantity: 1,
            unit_rate_paise: Math.round(rupees * 100),
          },
        ],
      });
      setDevInvoiceOpen(false);
      toast.success(`Development invoice ${created.invoice_number} created`);
      await fetchProjectData();
    } catch (err: any) {
      toast.error(err?.message || 'Could not create the development invoice');
    } finally {
      setInvoiceActionBusy(null);
    }
  };

  const createMaintenanceInvoice = async () => {
    if (!project) return;
    const months = parseInt(amcMonths, 10);
    const rate = parseFloat(amcRate);
    if (!Number.isFinite(months) || months <= 0) {
      toast.error('Enter how many months this payment covers');
      return;
    }
    if (!amcDate) {
      toast.error('Choose the start date');
      return;
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error('Enter the monthly maintenance amount');
      return;
    }
    const coversTo = addMonthsMinusDay(amcDate, months);
    const amountPaise = Math.round(rate * months * 100);
    const dueDate = new Date(amcDate);
    dueDate.setDate(dueDate.getDate() + 15);
    setInvoiceActionBusy('amc');
    try {
      const created = await invoicesApi.create({
        invoice_type: 'amc',
        client_id: project.client_id,
        project_id: project.id,
        issue_date: amcDate,
        due_date: dueDate.toISOString().slice(0, 10),
        period_months: months,
        covers_from: amcDate,
        covers_to: coversTo,
        monthly_rate_paise: Math.round(rate * 100),
        notes: `AMC ${amcDate} to ${coversTo} (${months} month${months === 1 ? '' : 's'})`,
        items: [
          {
            description: `AMC ${amcDate} – ${coversTo} (${months} month${months === 1 ? '' : 's'})`,
            quantity: 1,
            unit_rate_paise: amountPaise,
          },
        ],
      });
      setAmcInvoiceOpen(false);
      toast.success(`Maintenance invoice ${created.invoice_number} created`);
      await fetchProjectData();
    } catch (err: any) {
      toast.error(err?.message || 'Could not create the maintenance invoice');
    } finally {
      setInvoiceActionBusy(null);
    }
  };

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (error || !project) {
    return (
      <div className="py-12">
        <EmptyState
          title="Project Not Found"
          subtitle={error || 'Could not locate project details in the workspace.'}
          action={{
            label: 'Back to Projects',
            onClick: () => router.push('/projects'),
            icon: <ArrowLeft className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const isFounder = isPrivileged(user?.role);
  const isMaintenanceActive = project.maintenance_status === 'active';
  const deliveryMode =
    user?.role === 'client' ? 'client' : user?.role === 'worker' ? 'worker' : 'founder';
  const deliveryPhaseLabel = stageLabel(
    project.delivery_phase || linkedEngagement?.current_stage || 5,
    deliveryMode
  );

  // Budget calculations (ex-GST project invoices from API when available)
  const totalBudgetPaise = project.budget_paise || 0;
  const totalInvoicedPaise =
    project.invoiced_paise ??
    invoices
      .filter((inv) => inv.invoice_type === 'project')
      .reduce((sum, inv) => sum + (inv.subtotal_paise || 0), 0);
  const remainingPaise =
    project.remaining_paise ?? Math.max(totalBudgetPaise - totalInvoicedPaise, 0);
  const agreedTotal = money?.development?.agreed_total ?? totalBudgetPaise;
  const balanceLeft = money?.development?.remaining_to_invoice ?? remainingPaise;

  return (
    <div className="w-full min-w-0 space-y-5 pb-12">
      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-surface">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-red-tint blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-brand-yellow-tint blur-3xl"
          aria-hidden
        />

        <div className="relative px-5 py-5 sm:px-6 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
            <Link href="/projects" className="hover:text-brand-red-500 transition-colors">
              Projects
            </Link>
            <span className="text-subtle">/</span>
            <span className="text-text truncate max-w-[14rem] sm:max-w-xs">{project.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.02em] font-heading text-text">
                  {project.name}
                </h1>
                <StatusBadge status={project.status} type="project" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isMaintenanceActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-info-tint text-info border border-info/20">
                    <Zap className="w-3 h-3" />
                    Monthly maintenance
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg text-text border border-border">
                  Delivery · {deliveryPhaseLabel}
                </span>
                {linkedEngagement?.amc_active && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-yellow-tint text-brand-text-on-yellow border border-brand-yellow-400/40">
                    AMC
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-subtle" />
                  {projectClients.length > 1 ? 'Clients' : 'Client'}
                </span>
                {projectClients.map((c, i) => (
                  <span key={c.id} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-subtle">·</span>}
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-semibold text-text hover:text-brand-red-500 transition-colors"
                    >
                      {c.name}
                    </Link>
                    {c.is_primary && projectClients.length > 1 && (
                      <span className="text-[10px] text-muted">(primary)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-bg border border-border px-3 py-1.5 rounded-[10px]">
                <span className="text-[11px] font-semibold text-muted">Status</span>
                <select
                  value={project.status}
                  disabled={
                    isUpdatingStatus ||
                    (user?.role !== 'worker' && !isFounder)
                  }
                  onChange={(e) => handleStatusSelect(e.target.value as ProjectStatus)}
                  className="text-xs font-bold text-text bg-transparent focus:outline-none cursor-pointer disabled:opacity-60"
                >
                  {isFounder ? (
                    <>
                      <option value="lead">Not started</option>
                      <option value="running">Running</option>
                      <option value="on_hold">On Hold</option>
                      <option value="stopped">Stopped</option>
                      <option value="completed">Completed</option>
                    </>
                  ) : (
                    <>
                      <option value="running">Running</option>
                      <option value="on_hold">On Hold</option>
                      {(project.status === 'lead' ||
                        project.status === 'stopped' ||
                        project.status === 'completed') && (
                        <option value={project.status} disabled>
                          {project.status.replace('_', ' ')}
                        </option>
                      )}
                    </>
                  )}
                </select>
              </div>

              {isFounder && project.status === 'lead' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9"
                  isLoading={isUpdatingStatus}
                  onClick={async () => {
                    try {
                      setIsUpdatingStatus(true);
                      const updated = await projectsApi.start(projectId);
                      setProject(updated);
                      const deadline = updated.end_date
                        ? new Date(updated.end_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '';
                      toast.success(
                        deadline
                          ? `Started. Deadline is ${deadline} (${updated.development_days} days).`
                          : 'Project started.'
                      );
                    } catch (err: any) {
                      toast.error(err?.message || 'Could not start the project');
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start project
                </Button>
              )}
              {isFounder && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openEditProject}
                    className="h-9"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit details
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeletePrompt(true)}
                    className="h-9 px-3"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TABS */}
      {/* ========================================================= */}
      <Tabs
        className="px-0.5"
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'delivery', label: 'Delivery' },
          { id: 'features', label: 'Features' },
          { id: 'docs', label: 'Docs' },
          ...(user?.role !== 'worker'
            ? [{ id: 'invoices', label: 'Invoices', count: invoices.length }]
            : []),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'delivery' && (
        <ProjectDeliveryPanel
          projectId={projectId}
          role={user?.role}
          onPhaseChange={(phase) =>
            setProject((p) => (p ? { ...p, delivery_phase: phase } : p))
          }
        />
      )}

      {activeTab === 'features' && (
        <ProjectFeaturesPanel
          projectId={projectId}
          role={user?.role}
          projectName={project.name}
          clientName={project.client_name || projectClients[0]?.name}
        />
      )}

      {activeTab === 'docs' && (
        <div className="space-y-4">
          <ProjectFilesPanel projectId={projectId} role={user?.role} />
          <ProjectFeaturesPanel
            projectId={projectId}
            role={user?.role}
            projectName={project.name}
            clientName={project.client_name || projectClients[0]?.name}
            docsMode
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {user?.role !== 'worker' && (
            <div className="rounded-[16px] border border-border bg-surface overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {[
                  {
                    label: 'Total development',
                    value: `₹${(agreedTotal / 100).toLocaleString('en-IN')}`,
                    caption: 'Agreed project amount',
                    icon: <IndianRupee className="w-4 h-4" />,
                    tone: 'bg-brand-red-tint text-brand-red-500',
                  },
                  {
                    label: 'Balance to invoice',
                    value: `₹${(balanceLeft / 100).toLocaleString('en-IN')}`,
                    caption:
                      balanceLeft > 0 ? 'Still to invoice' : 'Fully invoiced',
                    icon: <FileText className="w-4 h-4" />,
                    tone:
                      balanceLeft > 0
                        ? 'bg-danger-tint text-danger'
                        : 'bg-success-tint text-success',
                  },
                  {
                    label: 'Delivery phase',
                    value: deliveryPhaseLabel,
                    caption: project.development_days
                      ? `${project.development_days} development days`
                      : 'Timeline not set',
                    icon: <CalendarDays className="w-4 h-4" />,
                    tone: 'bg-brand-yellow-tint text-brand-text-on-yellow',
                    valueClass: 'text-lg sm:text-xl',
                  },
                  {
                    label: 'Maintenance',
                    value:
                      project.maintenance_status === 'none'
                        ? 'None'
                        : `₹${((project.maintenance_amount_paise || 0) / 100).toLocaleString('en-IN')}`,
                    caption: project.go_live_at
                      ? `Live since ${formatIsoDate(project.go_live_at)}`
                      : isMaintenanceActive
                        ? 'Billing active'
                        : 'Not live yet',
                    icon: <Zap className="w-4 h-4" />,
                    tone: 'bg-info-tint text-info',
                  },
                ].map((m) => (
                  <div key={m.label} className="px-5 py-4 flex gap-3 items-start">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${m.tone}`}
                      aria-hidden
                    >
                      {m.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {m.label}
                      </p>
                      <p
                        className={`mt-1 font-bold text-text tabular-nums tracking-tight leading-snug truncate ${
                          m.valueClass || 'text-xl sm:text-2xl font-mono'
                        }`}
                        title={String(m.value)}
                      >
                        {m.value}
                      </p>
                      <p className="mt-1 text-[11px] text-subtle truncate">{m.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-5 space-y-5">
              <SectionCard
                title="Work & scope"
                subtitle="Description, timeline, and team"
                icon={<Users className="w-4 h-4" />}
                headerSlot={
                  isFounder ? (
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={openEditProject}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  ) : undefined
                }
              >
                <div className="space-y-4">
                  <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
                    {project.description || 'No scope written yet.'}
                  </p>
                  <DevelopmentTimeline
                    startDate={project.start_date}
                    developmentDays={project.development_days}
                    storedEnd={project.end_date}
                    canEdit={isFounder}
                    onStartChange={async (value) => {
                      try {
                        const updated = await projectsApi.update(projectId, {
                          start_date: value || null,
                        });
                        setProject(updated);
                        toast.success(value ? 'Development timeline updated' : 'Start date cleared');
                      } catch (err: any) {
                        toast.error(err?.message || 'Could not update the start date');
                      }
                    }}
                  />
                  <div className="border-t border-border pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                      Team
                    </p>
                    {(project.workers || []).length > 0 ? (
                      <ul className="space-y-2">
                        {(project.workers || []).map((worker) => (
                          <li key={worker.id} className="flex items-center gap-2 text-sm">
                            <Avatar name={worker.full_name} size="sm" />
                            <span className="font-semibold text-text">{worker.full_name}</span>
                            <span className="text-xs text-muted truncate">{worker.email}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted">No one assigned.</p>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Clients"
                subtitle={
                  projectClients.length > 1
                    ? `${projectClients.length} linked accounts`
                    : 'Billing and project parties'
                }
                icon={<Building2 className="w-4 h-4" />}
                headerSlot={
                  isFounder ? (
                    <button
                      type="button"
                      onClick={openAddClient}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red-500 hover:text-brand-red-hover cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  ) : undefined
                }
              >
                <ul className="space-y-2">
                  {projectClients.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-[10px] border border-border bg-bg px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0">
                          <Link
                            href={`/clients/${c.id}`}
                            className="text-sm font-bold text-text hover:text-brand-red-500 truncate block"
                          >
                            {c.name}
                          </Link>
                          {c.is_primary && (
                            <span className="text-[10px] text-muted">Primary billing</span>
                          )}
                        </div>
                      </div>
                      {isFounder && (
                        <button
                          type="button"
                          disabled={clientActionBusy || projectClients.length <= 1}
                          title={
                            projectClients.length <= 1
                              ? 'A project must keep at least one client'
                              : `Remove ${c.name}`
                          }
                          onClick={() => handleRemoveClient(c.id, c.name)}
                          className="p-1 rounded-md text-subtle hover:text-danger hover:bg-danger-tint disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>

            <div className="xl:col-span-7 space-y-5">
              {isFounder && (
                <SectionCard
                  title="Project milestones"
                  subtitle="Separate from status — development, acceptance, close"
                  icon={<Check className="w-4 h-4" />}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-[12px] border border-border bg-bg px-3 py-3">
                      <p className="text-[11px] font-semibold text-muted">Development completed</p>
                      <p className="text-sm font-bold text-text mt-1">
                        {project.development_completed_at
                          ? formatIsoDate(project.development_completed_at)
                          : 'Not set'}
                      </p>
                      {!project.development_completed_at && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2 h-8 text-xs"
                          onClick={async () => {
                            try {
                              const updated = await projectsApi.markDevelopmentCompleted(projectId);
                              setProject(updated);
                              toast.success('Development marked complete');
                            } catch (err: any) {
                              toast.error(err?.message || 'Failed');
                            }
                          }}
                        >
                          Mark complete
                        </Button>
                      )}
                    </div>
                    <div className="rounded-[12px] border border-border bg-bg px-3 py-3">
                      <p className="text-[11px] font-semibold text-muted">Client accepted</p>
                      <p className="text-sm font-bold text-text mt-1">
                        {project.client_accepted_at
                          ? formatIsoDate(project.client_accepted_at)
                          : 'Not set'}
                      </p>
                      {!project.client_accepted_at && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2 h-8 text-xs"
                          onClick={async () => {
                            try {
                              const updated = await projectsApi.markClientAccepted(projectId);
                              setProject(updated);
                              toast.success('Client acceptance recorded');
                            } catch (err: any) {
                              toast.error(err?.message || 'Failed');
                            }
                          }}
                        >
                          Record acceptance
                        </Button>
                      )}
                    </div>
                    <div className="rounded-[12px] border border-border bg-bg px-3 py-3">
                      <p className="text-[11px] font-semibold text-muted">Project closed</p>
                      <p className="text-sm font-bold text-text mt-1">
                        {project.project_closed_at
                          ? formatIsoDate(project.project_closed_at)
                          : 'Not set'}
                      </p>
                      {!project.project_closed_at && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-2 h-8 text-xs"
                          onClick={async () => {
                            const reason = window.prompt('Close reason (optional):') || undefined;
                            try {
                              const updated = await projectsApi.markProjectClosed(projectId, reason);
                              setProject(updated);
                              toast.success('Project closed');
                            } catch (err: any) {
                              toast.error(err?.message || 'Failed');
                            }
                          }}
                        >
                          Close project
                        </Button>
                      )}
                    </div>
                  </div>
                </SectionCard>
              )}

              {user?.role !== 'worker' && (
                <SectionCard
                  title="Confirmed commercial terms"
                  subtitle="Final project amounts"
                  icon={<Zap className="w-4 h-4" />}
                  headerSlot={
                    isFounder ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={openEditProject}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" aria-hidden />
                        Edit
                      </Button>
                    ) : undefined
                  }
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-[12px] bg-bg border border-border px-3 py-3">
                        <p className="text-[11px] font-semibold text-muted">Development days</p>
                        <p className="text-lg font-bold text-text mt-1 tabular-nums">
                          {project.development_days || '—'}
                        </p>
                      </div>
                      <div className="rounded-[12px] bg-bg border border-border px-3 py-3">
                        <p className="text-[11px] font-semibold text-muted">Total development</p>
                        <p className="text-lg font-bold text-text mt-1 tabular-nums">
                          ₹{((project.budget_paise || 0) / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="rounded-[12px] bg-bg border border-border px-3 py-3">
                        <p className="text-[11px] font-semibold text-muted">Monthly maintenance</p>
                        <p className="text-lg font-bold text-text mt-1 tabular-nums">
                          ₹{((project.maintenance_amount_paise || 0) / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted">
                      Invoices are created separately. Enter the amount, type, and description on the
                      invoice.
                    </p>

                    {isFounder && (
                      <div className="border-t border-border pt-3">
                        <Link
                          href={`/invoices/new?project_id=${project.id}&client_id=${project.client_id}`}
                        >
                          <Button size="sm" variant="primary" className="text-xs">
                            <Plus className="w-3.5 h-3.5 mr-1" aria-hidden />
                            Create invoice
                          </Button>
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-text">Go Live & AMC</p>
                          <p className="text-[11px] text-muted mt-0.5">
                            {project.go_live_at
                              ? `Live since ${project.go_live_at}`
                              : 'Emails prorata for remaining days (incl. go-live day)'}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            project.go_live_at
                              ? 'bg-success-tint text-success'
                              : isMaintenanceActive
                              ? 'bg-brand-yellow-tint text-brand-text-on-yellow'
                              : 'bg-neutral text-muted'
                          }`}
                        >
                          {project.go_live_at ? 'Live' : isMaintenanceActive ? 'Ready' : 'No AMC'}
                        </span>
                      </div>

                      {money?.maintenance?.paid_through ? (
                        <p className="text-[11px] text-text">
                          Maintenance paid
                          {money.maintenance.paid_months
                            ? ` for ${money.maintenance.paid_months} month${money.maintenance.paid_months === 1 ? '' : 's'}`
                            : ''}
                          {money.maintenance.paid_from
                            ? ` from ${formatIsoDate(money.maintenance.paid_from)}`
                            : ''}{' '}
                          through {formatIsoDate(money.maintenance.paid_through)}. Automatic emails
                          stay off until {formatIsoDate(money.maintenance.next_billing_date)}.
                        </p>
                      ) : money?.maintenance?.billed_through ? (
                        <p className="text-[11px] text-muted">
                          Maintenance invoiced through{' '}
                          {formatIsoDate(money.maintenance.billed_through)}. Automatic monthly emails
                          stay off until {formatIsoDate(money.maintenance.next_billing_date)}.
                        </p>
                      ) : project.maintenance_status !== 'none' ? (
                        <p className="text-[11px] text-muted">
                          Monthly maintenance is set. Create a maintenance invoice for the months the
                          client pays. Automatic emails start after that period.
                        </p>
                      ) : null}

                      {money?.variance?.development?.map((msg) => (
                        <p
                          key={msg}
                          className="text-[11px] font-semibold text-brand-text-on-yellow bg-brand-yellow-tint border border-brand-yellow-400/40 rounded-lg px-2 py-1"
                        >
                          {msg}
                        </p>
                      ))}

                      {isFounder && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          {!project.go_live_at && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="sm:flex-1 text-xs"
                              onClick={() => setShowGoLivePrompt(true)}
                              disabled={project.maintenance_status === 'none'}
                            >
                              Go Live
                            </Button>
                          )}
                          {project.maintenance_status !== 'none' && (
                            <Button
                              variant={isMaintenanceActive ? 'secondary' : 'primary'}
                              onClick={handleToggleMaintenance}
                              isLoading={isTogglingMaintenance}
                              className="sm:flex-1 text-xs"
                              size="sm"
                            >
                              {isMaintenanceActive ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 mr-1.5" aria-hidden />
                                  Pause monthly billing
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 mr-1.5" aria-hidden />
                                  Activate monthly billing
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </SectionCard>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INVOICES & LEDGER */}
      {/* ========================================================= */}
      {activeTab === 'invoices' && user?.role !== 'worker' && (
        <SectionCard
          title="Invoices & Deliverables"
          subtitle="All invoices issued against this project"
          icon={<FileText className="w-4 h-4" />}
          headerSlot={
            isFounder && (
              <Link href={`/invoices/new?project_id=${project.id}&client_id=${project.client_id}`}>
                <Button variant="primary" size="sm" className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Create Invoice</span>
                </Button>
              </Link>
            )
          }
        >
          <div className="divide-y divide-border -mx-5 -my-5">
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 flex items-center justify-between hover:bg-bg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[10px] bg-brand-yellow-tint border border-border flex items-center justify-center text-brand-text-on-yellow shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-xs font-bold text-text hover:text-brand-red-500 transition-colors"
                      >
                        {inv.invoice_number}
                      </Link>
                      <div className="text-[11px] text-muted mt-0.5">
                        Due: {inv.due_date}
                        {inv.id === project.advance_invoice_id
                          ? ' · Advance'
                          : inv.id === project.balance_invoice_id
                          ? ' · Balance'
                          : inv.invoice_type === 'late_fee'
                          ? ' · Late Fee'
                          : inv.invoice_type === 'maintenance'
                          ? inv.notes?.includes('Pro-rata')
                            ? ' · AMC pro-rata'
                            : ' · Maintenance'
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-text font-mono tabular-nums">
                      ₹{((inv.total_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                    <StatusBadge status={inv.status} type="invoice" />
                    {isFounder && inv.status !== 'paid' && (
                      <Link href={`/invoices/${inv.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          <Pencil className="w-3.5 h-3.5" aria-hidden />
                        </Button>
                      </Link>
                    )}
                    {isFounder && (inv.status === 'draft' || inv.email_status !== 'sent') && (
                      <Button
                        variant="accent"
                        size="sm"
                        className="h-8 text-xs"
                        isLoading={sendingInvoiceId === inv.id}
                        onClick={() => handleSendInvoice(inv.id)}
                        icon={<Send className="w-3.5 h-3.5" aria-hidden />}
                      >
                        Send
                      </Button>
                    )}
                    {isFounder && inv.status !== 'paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-danger"
                        isLoading={deletingInvoiceId === inv.id}
                        onClick={() => handleDeleteInvoice(inv.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                      </Button>
                    )}
                    <a
                      href={invoicesApi.downloadPdfUrl(inv.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        <Download className="w-3.5 h-3.5" aria-hidden />
                      </Button>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12">
                <EmptyState
                  title="No invoices generated"
                  subtitle="Invoices linked to this project will appear here."
                  action={
                    isFounder
                      ? {
                          label: 'Create First Invoice',
                          onClick: () =>
                            router.push(
                              `/invoices/new?project_id=${project.id}&client_id=${project.client_id}`
                            ),
                          icon: <Plus className="w-4 h-4" />,
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG: PAUSE MAINTENANCE ON STOPPED */}
      {/* ========================================================= */}
      {showPausePrompt && (
        <ConfirmDialog
          isOpen={showPausePrompt}
          onClose={() => {
            setShowPausePrompt(false);
            if (pendingStatusChange) {
              applyStatusChange(pendingStatusChange, false);
            }
          }}
          onConfirm={() => {
            if (pendingStatusChange) {
              applyStatusChange(pendingStatusChange, true);
            }
          }}
          title="Pause Monthly Maintenance?"
          message="This project currently has an active recurring monthly maintenance schedule. Would you like to pause the maintenance plan along with stopping the project?"
          confirmLabel="Pause Maintenance"
          cancelLabel="Keep Maintenance Active"
          variant="danger"
        />
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG: DELETE PROJECT */}
      {/* ========================================================= */}
      {showDeletePrompt && (
        <ConfirmDialog
          isOpen={showDeletePrompt}
          onClose={() => setShowDeletePrompt(false)}
          onConfirm={handleDelete}
          title="Delete Project?"
          message={`Are you sure you want to permanently delete "${project.name}"? This action cannot be undone.`}
          confirmLabel="Delete Project"
          variant="danger"
        />
      )}

      <Modal
        isOpen={devInvoiceOpen}
        onClose={() => setDevInvoiceOpen(false)}
        size="sm"
        title="Development invoice"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDevInvoiceOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={invoiceActionBusy === 'dev'} onClick={createDevelopmentInvoice}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Amount (₹)" required hint="Before GST. You choose the amount.">
            <Input type="number" min={1} step="100" value={devAmount} onChange={(e) => setDevAmount(e.target.value)} />
          </FormField>
          <FormField label="Invoice date" required>
            <Input type="date" value={devDate} onChange={(e) => setDevDate(e.target.value)} />
          </FormField>
        </div>
      </Modal>

      <Modal
        isOpen={amcInvoiceOpen}
        onClose={() => setAmcInvoiceOpen(false)}
        size="sm"
        title="Maintenance invoice"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAmcInvoiceOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={invoiceActionBusy === 'amc'} onClick={createMaintenanceInvoice}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Months" required hint="How many months this one payment covers.">
            <Input type="number" min={1} value={amcMonths} onChange={(e) => setAmcMonths(e.target.value)} />
          </FormField>
          <FormField label="Start date" required>
            <Input type="date" value={amcDate} onChange={(e) => setAmcDate(e.target.value)} />
          </FormField>
          <FormField label="Monthly rate (₹)" required hint="Invoice amount is this rate times the months.">
            <Input type="number" min={1} step="100" value={amcRate} onChange={(e) => setAmcRate(e.target.value)} />
          </FormField>
        </div>
      </Modal>

      <Modal
        isOpen={showGoLivePrompt}
        onClose={() => !isGoingLive && setShowGoLivePrompt(false)}
        size="sm"
        title="Go Live"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              disabled={isGoingLive}
              onClick={() => setShowGoLivePrompt(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="md" isLoading={isGoingLive} onClick={handleGoLive}>
              Confirm Go Live
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted mb-3">
          Bills the days left in the go-live month, including that day. Later months are created
          on the 1st and emailed on the send day. Due and reminders follow the maintenance settings.
          Safe to retry — it will not send twice.
        </p>
        <label className="block text-xs font-semibold text-text mb-1.5">Go-live date</label>
        <Input
          type="date"
          value={goLiveDate}
          onChange={(e) => setGoLiveDate(e.target.value)}
          disabled={isGoingLive}
        />
      </Modal>

      <Modal
        isOpen={showAddClient}
        onClose={() => !clientActionBusy && setShowAddClient(false)}
        size="sm"
        title="Add client to project"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={clientActionBusy}
              onClick={() => setShowAddClient(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={clientActionBusy}
              onClick={handleAddClient}
            >
              Add client
            </Button>
          </>
        }
      >
        <FormField label="Client" required hint="Project keeps all linked clients; at least one is required.">
          <Select
            value={addClientId}
            onChange={(e) => setAddClientId(e.target.value)}
          >
            <option value="" disabled>
              Select a client...
            </option>
            {allClients
              .filter((c) => !projectClients.some((pc) => pc.id === c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.primary_contact_name ? ` (${c.primary_contact_name})` : ''}
                </option>
              ))}
          </Select>
        </FormField>
      </Modal>

      {isEditOpen && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => !isSavingEdit && setIsEditOpen(false)}
          title="Edit Project Details"
          subtitle="Update name, scope, clients, team, duration, and commercial terms."
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                disabled={isSavingEdit}
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSavingEdit}
                onClick={handleSaveProjectDetails}
              >
                Save changes
              </Button>
            </div>
          }
        >
          {editError && (
            <div className="mb-4 p-3 bg-danger-tint border border-danger/20 rounded-[10px] text-xs text-danger">
              {editError}
            </div>
          )}
          <div className="space-y-5">
            <FormField label="Project Name" required>
              <Input
                required
                placeholder="e.g. Next.js Enterprise ERP System"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </FormField>

            <FormField label="Clients" required hint="First selected becomes the primary billing client.">
              <MultiSelect
                options={allClients.map((c) => ({
                  value: c.id,
                  label: c.name,
                  subtitle: c.primary_contact_name || undefined,
                }))}
                selectedValues={editForm.client_ids}
                onChange={(vals) => setEditForm({ ...editForm, client_ids: vals })}
                placeholder="Select at least one client..."
                emptyText="Select at least one client..."
              />
            </FormField>

            <FormField label="Description & Scope">
              <Textarea
                rows={3}
                placeholder="Project milestones, tech stack, deliverables, requirements..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </FormField>

            <FormField label="Assign Team Members">
              <MultiSelect
                options={editWorkers.map((w) => ({
                  value: w.id,
                  label: w.full_name,
                  subtitle: w.email,
                }))}
                selectedValues={editForm.worker_ids}
                onChange={(ids) => setEditForm({ ...editForm, worker_ids: ids })}
                placeholder="Select team members..."
              />
            </FormField>

            <div className="rounded-[12px] border border-border bg-bg p-4 space-y-4">
              <div>
                <p className="text-sm font-bold text-text">Commercial terms</p>
                <p className="text-[11px] text-muted mt-0.5">
                  Development cost, timeline, and monthly maintenance
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Development days" hint="Deadline recalculates from start date.">
                  <Input
                    type="number"
                    min={1}
                    placeholder="15"
                    value={editForm.development_days}
                    onChange={(e) =>
                      setEditForm({ ...editForm, development_days: e.target.value })
                    }
                  />
                </FormField>
                <FormField label="Total development (₹)">
                  <Input
                    type="number"
                    min={0}
                    step="100"
                    placeholder="0"
                    value={editForm.budget_rupees}
                    onChange={(e) => setEditForm({ ...editForm, budget_rupees: e.target.value })}
                  />
                </FormField>
                <FormField label="Monthly maintenance (₹)">
                  <Input
                    type="number"
                    min={0}
                    step="100"
                    placeholder="0"
                    value={editForm.maintenance_rupees}
                    onChange={(e) =>
                      setEditForm({ ...editForm, maintenance_rupees: e.target.value })
                    }
                  />
                </FormField>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
