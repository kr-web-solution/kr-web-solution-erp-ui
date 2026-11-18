'use client';

import React, { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { clientsApi, projectsApi, invoicesApi, notesApi } from '@/lib/api/client';
import { Client, Project, Invoice, Note } from '@/lib/types';
import { isPrivileged } from '@/lib/roles';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  Plus,
  MessageSquare,
  AlertCircle,
  Trash2,
  Calendar,
  IndianRupee,
  Download,
  FolderKanban,
  Send,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { Avatar } from '@/components/ui/Avatar';
import { CopyButton } from '@/components/ui/CopyButton';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cData, pList, iList, nList] = await Promise.all([
        clientsApi.get(clientId),
        projectsApi.list(),
        user?.role !== 'worker' ? invoicesApi.list() : Promise.resolve([]),
        notesApi.list('client', clientId),
      ]);

      setClient(cData);
      setProjects(pList.filter((p) => p.client_id === clientId));
      setInvoices(iList.filter((inv) => inv.client_id === clientId));
      setNotes(nList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load client details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const createdNote = await notesApi.create({
        entity_type: 'client',
        entity_id: clientId,
        body: newNote.trim(),
      });
      setNotes((prev) => [createdNote, ...prev]);
      setNewNote('');
      toast.success('Internal note added');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleDeleteClient = async () => {
    try {
      await clientsApi.delete(clientId);
      toast.success('Client deleted successfully');
      router.push('/clients');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete client.');
    }
  };

  // Financial calculations
  const totalBilledPaise = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.total_paise || 0), 0);
  }, [invoices]);

  const totalCollectedPaise = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_paise || 0), 0);
  }, [invoices]);

  const outstandingBalancePaise = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total_paise || 0), 0);
  }, [invoices]);

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (error || !client) {
    return (
      <div className="py-12">
        <EmptyState
          title="Client Not Found"
          subtitle={error || 'Could not locate client record in directory.'}
          action={{
            label: 'Back to Clients',
            onClick: () => router.push('/clients'),
            icon: <ArrowLeft className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const isFounder = isPrivileged(user?.role);

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <Link href="/clients" className="hover:text-[#0F172A] transition-colors">
              Clients
            </Link>
            <span>/</span>
            <span className="text-[#0F172A] font-semibold truncate max-w-xs">{client.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Avatar name={client.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
                  {client.name}
                </h1>
                {client.gstin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#F6F7F9] text-[#64748B] border border-[#E6E8EE]">
                    GST: {client.gstin}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {client.primary_contact_name && (
                  <span>
                    {client.primary_contact_name}
                    {client.designation ? ` · ${client.designation}` : ''}
                  </span>
                )}
                {(client.email || client.contact_email) && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>{client.email || client.contact_email}</span>
                    <CopyButton value={client.email || client.contact_email || ''} label="email" />
                  </span>
                )}
                {(client.phone || client.contact_phone) && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>{client.phone || client.contact_phone}</span>
                    <CopyButton value={client.phone || client.contact_phone || ''} label="phone" />
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isFounder && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeletePrompt(true)}
              className="h-9 px-3"
              title="Delete client"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 4 Nexora KPI Stat Tiles */}
      {user?.role !== 'worker' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard
            label="Total Billed"
            value={`₹${(totalBilledPaise / 100).toLocaleString('en-IN')}`}
            variant="blue"
            icon={<FileText className="w-5 h-5" />}
            caption="Cumulative invoicing volume"
          />

          <KpiCard
            label="Total Collected"
            value={`₹${(totalCollectedPaise / 100).toLocaleString('en-IN')}`}
            variant="green"
            icon={<IndianRupee className="w-5 h-5" />}
            caption="Verified paid receipts"
          />

          <KpiCard
            label="Outstanding Balance"
            value={`₹${(outstandingBalancePaise / 100).toLocaleString('en-IN')}`}
            variant={outstandingBalancePaise > 0 ? 'crimson' : 'green'}
            icon={<AlertCircle className="w-5 h-5" />}
            caption={outstandingBalancePaise > 0 ? 'Receivables pending payment' : 'No overdue balance'}
          />

          <KpiCard
            label="Active Projects"
            value={projects.filter((p) => p.status === 'running').length}
            variant="yellow"
            icon={<FolderKanban className="w-5 h-5" />}
            caption={`${projects.length} total engagements`}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E6E8EE] pb-2">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Company Overview' },
            { id: 'projects', label: 'Engagements & Sprints', count: projects.length },
            ...(user?.role !== 'worker'
              ? [{ id: 'invoices', label: 'Invoices & Ledger', count: invoices.length }]
              : []),
            { id: 'notes', label: 'Notes & Activity', count: notes.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SectionCard
              title="Billing & Headquarters Information"
              subtitle="Registered office address and corporate data"
              icon={<Building2 className="w-4 h-4" />}
            >
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-[#F6F7F9] border border-[#E6E8EE] rounded-2xl space-y-1">
                  <div className="text-[#64748B]">Registered Address</div>
                  <div className="text-sm font-semibold text-[#0F172A] leading-relaxed">
                    {client.address || 'No physical billing address recorded.'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F6F7F9] border border-[#E6E8EE] rounded-2xl space-y-1">
                    <div className="text-[#64748B]">Contact person</div>
                    <div className="text-sm font-bold text-[#0F172A]">
                      {client.primary_contact_name || '—'}
                      {client.designation ? ` · ${client.designation}` : ''}
                    </div>
                    <div className="text-[#475569]">{client.contact_email || 'No contact email'}</div>
                    <div className="text-[#475569]">{client.contact_phone || 'No contact number'}</div>
                  </div>
                  <div className="p-4 bg-[#F6F7F9] border border-[#E6E8EE] rounded-2xl space-y-1">
                    <div className="text-[#64748B]">Company</div>
                    <div className="text-sm font-bold text-[#0F172A]">{client.email || 'No company email'}</div>
                    <div className="text-[#475569]">{client.phone || 'No company phone'}</div>
                    <div className="text-[#475569]">
                      {[client.city, client.state, client.pincode].filter(Boolean).join(', ') || 'No city recorded'}
                    </div>
                    {client.website && <div className="text-[#475569]">{client.website}</div>}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <SectionCard
              title="Recent Activity Feed"
              subtitle="Latest notes on this account"
              icon={<MessageSquare className="w-4 h-4" />}
            >
              <div className="space-y-3">
                {notes.slice(0, 3).map((note) => (
                  <div key={note.id} className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-[10px] text-xs">
                    <p className="text-[#0F172A] leading-relaxed">{note.body}</p>
                    <span className="text-[10px] text-[#94A3B8] block mt-1">
                      {new Date(note.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="py-6 text-center text-xs text-[#94A3B8]">
                    No notes recorded yet.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS */}
      {activeTab === 'projects' && (
        <SectionCard
          title="Client Projects"
          subtitle="All deliverables associated with this customer"
          icon={<FolderKanban className="w-4 h-4" />}
          headerSlot={
            isFounder && (
              <Link href={`/projects?action=new`}>
                <Button variant="primary" size="sm" className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>New Project</span>
                </Button>
              </Link>
            )
          }
        >
          <div className="divide-y divide-[#E6E8EE] -mx-5 -my-5">
            {projects.length > 0 ? (
              projects.map((proj) => (
                <div key={proj.id} className="p-4 flex items-center justify-between hover:bg-[#F6F7F9] transition-colors">
                  <div>
                    <Link
                      href={`/projects/${proj.id}`}
                      className="text-sm font-bold text-[#0F172A] hover:text-[#E32B2B] transition-colors"
                    >
                      {proj.name}
                    </Link>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Deadline: {proj.end_date || 'Ongoing'}
                    </p>
                  </div>
                  <StatusBadge status={proj.status} type="project" />
                </div>
              ))
            ) : (
              <div className="py-12">
                <EmptyState
                  title="No projects for this client"
                  subtitle="Create an engineering project to start tracking sprints and milestones."
                />
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* TAB 3: INVOICES */}
      {activeTab === 'invoices' && user?.role !== 'worker' && (
        <SectionCard
          title="Invoices & Ledger"
          subtitle="Billing ledger for this corporate account"
          icon={<FileText className="w-4 h-4" />}
          headerSlot={
            isFounder && (
              <Link href={`/invoices/new?client_id=${client.id}`}>
                <Button variant="primary" size="sm" className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Issue Invoice</span>
                </Button>
              </Link>
            )
          }
        >
          <div className="divide-y divide-[#E6E8EE] -mx-5 -my-5">
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-[#F6F7F9] transition-colors">
                  <div>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-xs font-bold text-[#0F172A] hover:text-[#E32B2B] transition-colors"
                    >
                      {inv.invoice_number}
                    </Link>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Due: {inv.due_date} {inv.invoice_type === 'late_fee' ? '· Late Fee' : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-[#0F172A] tabular-nums">
                      ₹{((inv.total_paise || 0) / 100).toLocaleString('en-IN')}
                    </span>
                    <StatusBadge status={inv.status} type="invoice" />
                    <a
                      href={invoicesApi.downloadPdfUrl(inv.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12">
                <EmptyState
                  title="No invoices on record"
                  subtitle="Invoices issued to this client will be recorded here."
                />
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* TAB 4: NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <SectionCard
            title="Add Account Note"
            subtitle="Internal updates and meeting logs"
            icon={<MessageSquare className="w-4 h-4" />}
          >
            <form onSubmit={handleAddNote} className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Log internal conversation, billing agreement, or client requirements..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isAddingNote}
                  disabled={!newNote.trim()}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Note</span>
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Activity History"
            subtitle="Chronological feed of internal notes"
            icon={<Calendar className="w-4 h-4" />}
          >
            <div className="divide-y divide-[#E6E8EE] -mx-5 -my-5">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div key={note.id} className="p-4 flex items-start gap-3">
                    <Avatar name={note.author_name || 'Team'} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0F172A]">{note.author_name || 'Team Member'}</span>
                        <span className="text-[#94A3B8]">
                          {new Date(note.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#344054] mt-1 leading-relaxed whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12">
                  <EmptyState
                    title="No notes recorded"
                    subtitle="Post the first internal note using the composer above."
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeletePrompt && (
        <ConfirmDialog
          isOpen={showDeletePrompt}
          onClose={() => setShowDeletePrompt(false)}
          onConfirm={handleDeleteClient}
          title="Delete Client?"
          message={`Are you sure you want to delete "${client.name}"? This will delete all related records.`}
          confirmLabel="Delete Client"
          variant="danger"
        />
      )}
    </div>
  );
}
