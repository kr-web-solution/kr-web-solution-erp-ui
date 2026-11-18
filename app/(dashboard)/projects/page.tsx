'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { projectsApi, clientsApi, usersApi } from '@/lib/api/client';
import { Project, Client, User, MaintenanceConfig, emptyClientForm } from '@/lib/types';
import { ClientFormFields } from '@/components/clients/ClientFormFields';
import { ProjectDocDraft, ProjectDocFields, defaultProjectDocs } from '@/components/projects/ProjectDocFields';
import { isPrivileged } from '@/lib/roles';
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  AlertCircle,
  Users,
  Clock,
  CheckCircle2,
  Zap,
  Download,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Building2,
  Trash2,
  Eye,
  Play,
  IndianRupee,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AvatarStack } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Stepper } from '@/components/ui/Stepper';
import { Switch } from '@/components/ui/Switch';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    description: '',
    budget_rupees: 0,
    development_days: '',
    worker_ids: [] as string[],
  });

  // Maintenance billing toggle state
  const [hasMaintenance, setHasMaintenance] = useState(false);
  const [projectDocs, setProjectDocs] = useState<ProjectDocDraft[]>(defaultProjectDocs);
  const [maintenanceData, setMaintenanceData] = useState({
    amount_rupees: 0,
    send_day: 1,
    due_after_days: 5,
    reminder_every_days: 2,
    ends_type: 'until_stopped' as 'until_stopped' | 'custom_date',
    ends_on: '',
  });

  // Stacked Add Client Modal State
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState(emptyClientForm);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientModalError, setClientModalError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list();
      setProjects(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Preload clients for filters
    clientsApi.list().then(setClients).catch(() => {});
  }, []);

  const openNewProjectModal = async () => {
    setIsModalOpen(true);
    setModalError(null);
    setHasMaintenance(false);
    setProjectDocs(defaultProjectDocs());
    setFormData({
      name: '',
      client_id: '',
      description: '',
      budget_rupees: 0,
      development_days: '',
      worker_ids: [],
    });
    setMaintenanceData({
      amount_rupees: 0,
      send_day: 1,
      due_after_days: 5,
      reminder_every_days: 2,
      ends_type: 'until_stopped',
      ends_on: '',
    });
    try {
      const [cList, uList] = await Promise.all([clientsApi.list(), usersApi.list()]);
      setClients(cList);
      setWorkers(uList.filter((u) => u.role === 'worker' && u.is_active));
      if (cList.length > 0) {
        setFormData((prev) => ({ ...prev, client_id: cList[0].id }));
      }
    } catch (err: any) {
      setModalError('Failed to load clients or workers.');
    }
  };

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name.trim()) {
      setClientModalError('Company name is required.');
      return;
    }
    setClientModalError(null);
    setIsCreatingClient(true);
    try {
      const newClient = await clientsApi.create(newClientData);

      // Update clients list and auto-select
      setClients((prev) => [newClient, ...prev]);
      setFormData((prev) => ({ ...prev, client_id: newClient.id }));
      setIsNewClientModalOpen(false);
      setNewClientData(emptyClientForm());
      toast.success(`Client "${newClient.name}" created and selected`);
    } catch (err: any) {
      setClientModalError(err?.message || 'Failed to create client.');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Project name is required.');
      return;
    }
    if (!formData.client_id) {
      setModalError('Please select a client.');
      return;
    }

    setModalError(null);
    setIsSubmitting(true);
    try {
      const budgetPaise = formData.budget_rupees ? Math.round(formData.budget_rupees * 100) : 0;

      let maintenancePayload: MaintenanceConfig | undefined = undefined;
      if (hasMaintenance && maintenanceData.amount_rupees > 0) {
        const amtPaise = Math.round(maintenanceData.amount_rupees * 100);
        maintenancePayload = {
          amount_paise: amtPaise,
          send_day: Math.min(28, Math.max(1, Number(maintenanceData.send_day) || 1)),
          due_after_days: Number(maintenanceData.due_after_days) || 5,
          reminder_every_days: Number(maintenanceData.reminder_every_days) || 2,
          ends_on: maintenanceData.ends_type === 'custom_date' && maintenanceData.ends_on ? maintenanceData.ends_on : undefined,
          notes: `Monthly maintenance for ${formData.name}`,
        };
      }

      const duration = Number(formData.development_days);
      const created = await projectsApi.create({
        name: formData.name,
        client_id: formData.client_id,
        description: formData.description || undefined,
        budget_paise: budgetPaise,
        development_days: Number.isFinite(duration) && duration > 0 ? duration : undefined,
        worker_ids: formData.worker_ids,
        maintenance: maintenancePayload,
      });

      const uploads = projectDocs.filter((row) => row.file);
      const failed: string[] = [];
      for (const row of uploads) {
        const label =
          row.name.trim() ||
          (row.kind === 'quotation' ? 'Quotation' : row.kind === 'agreement' ? 'Agreement' : 'Other');
        try {
          await projectsApi.uploadDocument(created.id, row.file as File, label, row.kind);
        } catch {
          failed.push(label);
        }
      }
      if (failed.length) {
        toast.success(`Project "${created.name}" added. Could not upload: ${failed.join(', ')}.`);
      } else {
        toast.success(`Project "${created.name}" added. Start it when work begins.`);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchesSearch = (p: Project) => {
    if (clientFilter !== 'all' && p.client_id !== clientFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.client_name && p.client_name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  };

  const searchedProjects = useMemo(
    () => projects.filter(matchesSearch),
    [projects, search, clientFilter]
  );

  const filteredProjects = useMemo(() => {
    if (selectedTab === 'all') return searchedProjects;
    return searchedProjects.filter((p) => p.status === selectedTab);
  }, [searchedProjects, selectedTab]);

  const tabCounts = useMemo(() => {
    return {
      all: searchedProjects.length,
      lead: searchedProjects.filter((p) => p.status === 'lead').length,
      running: searchedProjects.filter((p) => p.status === 'running').length,
      on_hold: searchedProjects.filter((p) => p.status === 'on_hold').length,
      stopped: searchedProjects.filter((p) => p.status === 'stopped').length,
      completed: searchedProjects.filter((p) => p.status === 'completed').length,
    };
  }, [searchedProjects]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredProjects.length) return;
    const headers = ['ID', 'Name', 'Client', 'Status', 'Start Date', 'End Date', 'Budget (INR)', 'Maintenance'];
    const rows = filteredProjects.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.client_name || '').replace(/"/g, '""')}"`,
      p.status,
      p.start_date || '',
      p.end_date || '',
      ((p.budget_paise || 0) / 100).toFixed(2),
      p.maintenance_status || 'none',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Projects exported to CSV');
  };

  // Maintenance preview calculations
  const maintenanceBase = maintenanceData.amount_rupees || 0;
  const maintenanceGst = maintenanceBase * 0.18;
  const maintenanceTotal = maintenanceBase + maintenanceGst;

  // Table columns definition
  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Project & Client',
      sortable: true,
      render: (row: Project) => (
        <div>
          <Link
            href={`/projects/${row.id}`}
            className="font-bold text-[#0F172A] hover:text-[#E32B2B] transition-colors"
          >
            {row.name}
          </Link>
          <div className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>{row.client_name || 'Client'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: Project) => <StatusBadge status={row.status} type="project" />,
    },
    {
      key: 'maintenance_status',
      header: 'Maintenance',
      render: (row: Project) => {
        if (!row.maintenance_status || row.maintenance_status === 'none') {
          return <span className="text-xs text-[#94A3B8]">—</span>;
        }
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              row.maintenance_status === 'active'
                ? 'bg-[#E8F0FE] text-[#2563EB] border-blue-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {row.maintenance_status === 'active' ? 'Active' : 'Paused'}
          </span>
        );
      },
    },
    {
      key: 'workers',
      header: 'Team Assigned',
      render: (row: Project) => {
        const workerNames = (row.workers || []).map((w: User) => w.full_name);
        return <AvatarStack names={workerNames} max={3} size="sm" />;
      },
    },
    {
      key: 'end_date',
      header: 'Deadline',
      sortable: true,
      render: (row: Project) => {
        if (!row.end_date) return <span className="text-xs text-[#94A3B8]">No deadline</span>;
        const d = new Date(row.end_date);
        const isPast = d < new Date() && row.status !== 'completed';
        return (
          <span className={`text-xs font-mono font-medium ${isPast ? 'text-[#B91C1C]' : 'text-[#0F172A]'}`}>
            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      },
    },
    ...(isPrivileged(user?.role)
      ? [
          {
            key: 'budget_paise' as keyof Project,
            header: 'Total',
            sortable: true,
            render: (row: Project) => (
              <span className="text-xs font-mono font-semibold text-[#0F172A] tabular-nums">
                ₹{((row.budget_paise || 0) / 100).toLocaleString('en-IN')}
              </span>
            ),
          },
          {
            key: 'remaining_paise' as keyof Project,
            header: 'Remaining',
            sortable: true,
            render: (row: Project) => (
              <div className="text-xs font-mono tabular-nums">
                <div className="font-semibold text-[#0F172A]">
                  ₹{((row.remaining_paise ?? Math.max((row.budget_paise || 0) - (row.invoiced_paise || 0), 0)) / 100).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#64748B]">
                  invoiced ₹{((row.invoiced_paise || 0) / 100).toLocaleString('en-IN')}
                </div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'id',
      header: 'Actions',
      align: 'right' as const,
      render: (row: Project) => (
        <div className="flex items-center justify-end gap-1">
          {isPrivileged(user?.role) && row.status === 'lead' && (
            <Button
              variant="primary"
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const updated = await projectsApi.start(row.id);
                  const deadline = updated.end_date
                    ? new Date(updated.end_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';
                  toast.success(
                    deadline
                      ? `Started. Deadline is ${deadline}.`
                      : 'Project started.'
                  );
                  fetchProjects();
                } catch (err: any) {
                  toast.error(err?.message || 'Could not start the project');
                }
              }}
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Start
            </Button>
          )}
          <Link href={`/projects/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>Details</span>
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* ========================================================= */}
      {/* PAGE HEADER & ACTIONS */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
              Projects &amp; Sprints
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#12141C] text-white">
              {projects.length} Total
            </span>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Engineering deliverables, sprint milestones, team assignments, and monthly maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={!filteredProjects.length}
            className="h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          {isPrivileged(user?.role) && (
            <Button
              variant="primary"
              size="sm"
              onClick={openNewProjectModal}
              className="h-9 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Project</span>
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* STATUS TABS (ORDERS LIST PATTERN) */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E8EE] pb-2">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Projects', count: tabCounts.all },
            { id: 'lead', label: 'Not started', count: tabCounts.lead },
            { id: 'running', label: 'Running', count: tabCounts.running },
            { id: 'on_hold', label: 'On Hold', count: tabCounts.on_hold },
            { id: 'stopped', label: 'Stopped', count: tabCounts.stopped },
            { id: 'completed', label: 'Completed', count: tabCounts.completed },
          ]}
          activeTab={selectedTab}
          onChange={setSelectedTab}
        />

        {/* View mode toggle: Cards vs Table */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-[#F6F7F9] p-1 rounded-[10px] border border-[#E6E8EE]">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-[8px] transition-colors ${
              viewMode === 'cards'
                ? 'bg-white shadow-2xs text-[#0F172A] font-semibold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="Card grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-[8px] transition-colors ${
              viewMode === 'table'
                ? 'bg-white shadow-2xs text-[#0F172A] font-semibold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
            title="Table list view"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FILTER & SEARCH TOOLBAR */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search projects by title, client, or scope..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-w-0 flex-1"
          />

          <Select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full text-xs sm:w-48 sm:shrink-0"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="text-xs text-[#64748B] flex items-center gap-1">
          <span>Showing</span>
          <strong className="text-[#0F172A] font-semibold">{filteredProjects.length}</strong>
          <span>of {projects.length} engagements</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ERROR BANNER */}
      {/* ========================================================= */}
      {error && (
        <div className="p-4 bg-[#FDECEC] border border-rose-200 rounded-[16px] flex items-center justify-between text-xs text-[#B91C1C]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={fetchProjects}>
            Retry
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTENT: CARDS VIEW */}
      {/* ========================================================= */}
      {isLoading ? (
        <PageSkeleton variant="list" cols={6} showKpis />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          subtitle={search ? 'No projects match your filter query. Clear search to see all.' : 'Get started by creating your first engineering project.'}
          action={
            isPrivileged(user?.role)
              ? {
                  label: 'Create Project',
                  onClick: openNewProjectModal,
                  icon: <Plus className="w-4 h-4" />,
                }
              : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProjects.map((project) => {
            const workerNames = (project.workers || []).map((w) => w.full_name);
            const isMaintenanceActive = project.maintenance_status === 'active';

            // Deadline calculation
            let deadlineText = 'No deadline';
            let isOverdue = false;
            if (project.end_date) {
              const deadline = new Date(project.end_date);
              const now = new Date();
              const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              if (project.status === 'completed') {
                deadlineText = 'Completed';
              } else if (diffDays < 0) {
                isOverdue = true;
                deadlineText = `${Math.abs(diffDays)}d overdue`;
              } else if (diffDays === 0) {
                deadlineText = 'Due today';
              } else {
                deadlineText = `${diffDays}d left`;
              }
            }

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-[#E6E8EE] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)] hover:shadow-md hover:border-[#D0D5DD] transition-all flex flex-col justify-between p-5 group"
              >
                <div>
                  {/* Top Bar: Client name & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#64748B] truncate uppercase tracking-wider">
                      {project.client_name || 'Client'}
                    </span>
                    <StatusBadge status={project.status} type="project" />
                  </div>

                  {/* Project Title */}
                  <Link
                    href={`/projects/${project.id}`}
                    className="block text-base font-bold text-[#0F172A] group-hover:text-[#E32B2B] transition-colors font-heading"
                  >
                    {project.name}
                  </Link>

                  {/* Optional Maintenance Pill */}
                  {isMaintenanceActive && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E8F0FE] text-[#2563EB] border border-blue-200">
                      <Zap className="w-3 h-3 text-[#2563EB]" />
                      <span>Monthly Maintenance Active</span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-[#64748B] mt-2.5 line-clamp-2 leading-relaxed">
                    {project.description || 'No detailed scope description provided.'}
                  </p>
                </div>

                {/* Card Footer: Team avatars + Deadline Pill */}
                <div className="mt-5 pt-4 border-t border-[#E6E8EE] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AvatarStack names={workerNames} max={3} size="sm" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                        isOverdue
                          ? 'bg-[#FDECEC] text-[#B91C1C] border-rose-200'
                          : 'bg-[#F6F7F9] text-[#64748B] border-[#E6E8EE]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{deadlineText}</span>
                    </span>

                    <Link href={`/projects/${project.id}`}>
                      <div className="w-7 h-7 rounded-lg bg-[#F6F7F9] hover:bg-[#E32B2B] hover:text-white text-[#64748B] flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <DataTable
          columns={columns}
          data={filteredProjects}
          rowKey="id"
          onRowClick={(row: Project) => router.push(`/projects/${row.id}`)}
        />
      )}

      {/* ========================================================= */}
      {/* 720PX NEW PROJECT MODAL (WITH MAINTENANCE & CLIENT ADD) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Project"
          subtitle="Define project scope, deliverables, assigned team, and billing configuration."
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateProject}
                isLoading={isSubmitting}
              >
                Create Project
              </Button>
            </div>
          }
        >
          {modalError && (
            <div className="mb-4 p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C]">
              {modalError}
            </div>
          )}

          <form onSubmit={handleCreateProject} className="space-y-5">
            <FormField label="Project Name" required>
              <Input
                required
                placeholder="e.g. Next.js Enterprise ERP System"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Client<span className="text-[#E32B2B] ml-0.5">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E32B2B] hover:text-[#C81F26] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New client
                </button>
              </div>
              <Select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
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
            </div>

            {/* Description */}
            <FormField label="Description & Scope">
              <Textarea
                rows={3}
                placeholder="Project milestones, tech stack, deliverables, requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Total Budget (₹ INR)">
                <CurrencyInput
                  value={formData.budget_rupees}
                  onChange={(val: string) => setFormData({ ...formData, budget_rupees: parseFloat(val) || 0 })}
                  placeholder="0"
                />
              </FormField>
              <FormField
                label="Duration (days)"
                hint="Deadline is set when the project is started."
              >
                <Input
                  type="number"
                  min={1}
                  placeholder="15"
                  value={formData.development_days}
                  onChange={(e) => setFormData({ ...formData, development_days: e.target.value })}
                />
              </FormField>
            </div>

            <ProjectDocFields docs={projectDocs} onChange={setProjectDocs} />

            {/* Assigned Workers */}
            <FormField label="Assign Team Members (Workers)">
              <MultiSelect
                options={workers.map((w: User) => ({
                  value: w.id,
                  label: w.full_name,
                  subtitle: w.email,
                }))}
                selectedValues={formData.worker_ids}
                onChange={(ids) => setFormData({ ...formData, worker_ids: ids })}
                placeholder="Select engineering contributors..."
              />
            </FormField>

            {/* ===================================================== */}
            {/* MONTHLY MAINTENANCE BILLING ACCORDION / TOGGLE */}
            {/* ===================================================== */}
            <div className="rounded-xl border border-[#E6E8EE] overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] text-[#2563EB] flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#0F172A]">Monthly maintenance</h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Go Live bills the days left. Later months are created on the 1st.
                    </p>
                  </div>
                </div>
                <Switch checked={hasMaintenance} onChange={setHasMaintenance} />
              </div>

              {hasMaintenance && (
                <div className="px-4 py-4 bg-[#F8F9FB] border-t border-[#E6E8EE] space-y-4 animate-in fade-in duration-150">
                  <FormField
                    label="Monthly amount"
                    required
                    hint={
                      maintenanceBase > 0
                        ? `₹${maintenanceGst.toLocaleString('en-IN')} GST · ₹${maintenanceTotal.toLocaleString('en-IN')} total`
                        : 'Before GST'
                    }
                  >
                    <CurrencyInput
                      value={maintenanceData.amount_rupees}
                      onChange={(val: string) =>
                        setMaintenanceData({ ...maintenanceData, amount_rupees: parseFloat(val) || 0 })
                      }
                      placeholder="5,000"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="Send day">
                      <Stepper
                        className="w-full"
                        value={maintenanceData.send_day}
                        onChange={(val) => setMaintenanceData({ ...maintenanceData, send_day: val })}
                        min={1}
                        max={28}
                      />
                    </FormField>
                    <FormField label="Due after">
                      <Stepper
                        className="w-full"
                        value={maintenanceData.due_after_days}
                        onChange={(val) => setMaintenanceData({ ...maintenanceData, due_after_days: val })}
                        min={1}
                        max={30}
                        suffix="days"
                      />
                    </FormField>
                    <FormField label="Remind every">
                      <Stepper
                        className="w-full"
                        value={maintenanceData.reminder_every_days}
                        onChange={(val) => setMaintenanceData({ ...maintenanceData, reminder_every_days: val })}
                        min={1}
                        max={14}
                        suffix="days"
                      />
                    </FormField>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <FormField label="Ends" className="sm:shrink-0">
                      <SegmentedControl
                        size="sm"
                        options={[
                          { value: 'until_stopped', label: 'Until stopped' },
                          { value: 'custom_date', label: 'On a date' },
                        ]}
                        value={maintenanceData.ends_type}
                        onChange={(val) => setMaintenanceData({ ...maintenanceData, ends_type: val as 'until_stopped' | 'custom_date' })}
                      />
                    </FormField>
                    {maintenanceData.ends_type === 'custom_date' && (
                      <FormField label="End date" className="sm:w-44">
                        <Input
                          type="date"
                          value={maintenanceData.ends_on}
                          onChange={(e) => setMaintenanceData({ ...maintenanceData, ends_on: e.target.value })}
                        />
                      </FormField>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================= */}
      {/* 560PX STACKED ADD CLIENT MODAL */}
      {/* ========================================================= */}
      {isNewClientModalOpen && (
        <Modal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          title="Add New Client"
          subtitle="Company details and the person you deal with."
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNewClientModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateNewClient}
                isLoading={isCreatingClient}
              >
                Create Client
              </Button>
            </div>
          }
        >
          {clientModalError && (
            <div className="mb-4 p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C]">
              {clientModalError}
            </div>
          )}

          <form onSubmit={handleCreateNewClient}>
            <ClientFormFields value={newClientData} onChange={setNewClientData} />
          </form>
        </Modal>
      )}
    </div>
  );
}
