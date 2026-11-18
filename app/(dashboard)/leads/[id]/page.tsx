'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { leadsApi, notesApi } from '@/lib/api/client';
import { Lead, Note, LeadStatus } from '@/lib/types';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  MessageSquare,
  Send,
  UserCheck,
  Check,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Avatar } from '@/components/ui/Avatar';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

const STAGES: { key: LeadStatus; label: string }[] = [
  { key: 'new', label: 'New Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'proposal', label: 'Proposal Sent' },
  { key: 'won', label: 'Won / Converted' },
];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversion Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [createProject, setCreateProject] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [budgetRupees, setBudgetRupees] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const fetchLeadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadData, notesList] = await Promise.all([
        leadsApi.get(leadId),
        notesApi.list('lead', leadId),
      ]);
      setLead(leadData);
      setNotes(notesList);
      setProjectName(`${leadData.company || leadData.name} Implementation`);
    } catch (err: any) {
      setError(err?.message || 'Failed to load lead details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await leadsApi.update(leadId, { status: newStatus });
      setLead(updated);
      toast.success(`Pipeline stage set to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update lead status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const createdNote = await notesApi.create({
        entity_type: 'lead',
        entity_id: leadId,
        body: newNote.trim(),
      });
      setNotes((prev) => [createdNote, ...prev]);
      setNewNote('');
      toast.success('Internal note recorded');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvertError(null);
    setIsConverting(true);
    try {
      const budgetPaise = budgetRupees ? Math.round(budgetRupees * 100) : undefined;
      const res = await leadsApi.convert(leadId, {
        create_project: createProject,
        project_name: createProject ? projectName : undefined,
        budget_paise: createProject ? budgetPaise : undefined,
      });

      toast.success('Lead converted to client account!');
      setIsConvertModalOpen(false);

      if (res?.project_id) {
        router.push(`/projects/${res.project_id}`);
      } else if (res?.client_id) {
        router.push(`/clients/${res.client_id}`);
      } else {
        fetchLeadData();
      }
    } catch (err: any) {
      setConvertError(err?.message || 'Failed to convert lead.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteLead = async () => {
    try {
      await leadsApi.delete(leadId);
      toast.success('Lead deleted');
      router.push('/leads');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete lead.');
    }
  };

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (error || !lead) {
    return (
      <div className="py-12">
        <EmptyState
          title="Lead Not Found"
          subtitle={error || 'Could not locate prospect in pipeline.'}
          action={{
            label: 'Back to Pipeline',
            onClick: () => router.push('/leads'),
            icon: <ArrowLeft className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === lead.status);

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
            <Link href="/leads" className="hover:text-[#0F172A] transition-colors">
              CRM Leads
            </Link>
            <span>/</span>
            <span className="text-[#0F172A] font-semibold truncate max-w-xs">{lead.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Avatar name={lead.company || lead.name} size="lg" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
                  {lead.name}
                </h1>
                <StatusBadge status={lead.status} type="lead" />
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span className="font-semibold text-[#0F172A]">{lead.company || 'Direct Individual Prospect'}</span>
                <span>· Source: {lead.source || 'Inbound'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {lead.status !== 'won' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setConvertError(null);
                setIsConvertModalOpen(true);
              }}
              className="h-9 shadow-sm"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-[#FADC59]" />
              <span>Convert to Client</span>
            </Button>
          )}

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeletePrompt(true)}
            className="h-9 px-3"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Visual Pipeline Stage Stepper */}
      <div className="bg-white p-5 rounded-2xl border border-[#E6E8EE] shadow-2xs">
        <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">
          Pipeline Qualification Stage
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;

            return (
              <button
                key={stage.key}
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusChange(stage.key)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isCurrent
                    ? 'border-[#E32B2B] bg-[#FFF1F0] text-[#E32B2B] ring-2 ring-[#E32B2B]/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-[#E8F7EE] text-emerald-800'
                    : 'border-[#E6E8EE] bg-[#F6F7F9] text-[#64748B] hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-[#E32B2B] text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold">{stage.label}</div>
                  <div className="text-[10px] opacity-80">
                    {isCurrent ? 'Current Phase' : isCompleted ? 'Completed' : 'Upcoming'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Details + Notes vs Contacts + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Discovery scope & Notes */}
        <div className="lg:col-span-8 space-y-6">
          <SectionCard
            title="Discovery & Requirements"
            subtitle="Initial prospect scope and conversation logs"
            icon={<FileText className="w-4 h-4" />}
          >
            <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">
              {lead.notes || 'No detailed discovery notes logged during initial contact.'}
            </p>
          </SectionCard>

          <SectionCard
            title="Log Conversation / Note"
            subtitle="Add meeting summaries, follow-up items, and proposal terms"
            icon={<MessageSquare className="w-4 h-4" />}
          >
            <form onSubmit={handleAddNote} className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Log follow-up call, client objections, timeline commitments..."
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
            title="Activity Timeline"
            subtitle="Historical timeline of interactions with this prospect"
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
                    title="No interaction notes"
                    subtitle="Record meeting notes or qualification observations above."
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right Column (4 cols): Contact Card & Conversion Card */}
        <div className="lg:col-span-4 space-y-6">
          <SectionCard
            title="Contact Information"
            subtitle="Direct prospect channels"
            icon={<Mail className="w-4 h-4" />}
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[#64748B] text-[11px]">Email Address</div>
                  <div className="font-semibold text-[#0F172A] mt-0.5">{lead.email || '—'}</div>
                </div>
                {lead.email && <CopyButton value={lead.email} label="email" />}
              </div>

              {lead.phone && (
                <div className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[#64748B] text-[11px]">Phone</div>
                    <div className="font-mono font-semibold text-[#0F172A] mt-0.5">{lead.phone}</div>
                  </div>
                  <CopyButton value={lead.phone} label="phone" />
                </div>
              )}

              <div className="p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl">
                <div className="text-[#64748B] text-[11px]">Acquisition Source</div>
                <div className="font-semibold text-[#0F172A] mt-0.5 capitalize">{lead.source || 'Inbound'}</div>
              </div>
            </div>
          </SectionCard>

          {lead.status !== 'won' && (
            <SectionCard
              title="Convert to Client"
              subtitle="Upgrade lead into active corporate account"
              icon={<UserCheck className="w-4 h-4" />}
            >
              <div className="space-y-4">
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Ready to kickoff deliverables? Converting will create a verified client record and can optionally initialize their first project immediately.
                </p>

                <Button
                  variant="primary"
                  onClick={() => {
                    setConvertError(null);
                    setIsConvertModalOpen(true);
                  }}
                  className="w-full text-xs shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 text-[#FADC59]" />
                  <span>Convert to Client Account</span>
                </Button>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Conversion Modal */}
      {isConvertModalOpen && (
        <Modal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          title="Convert Lead to Client Account"
          subtitle={`Promote ${lead.name} (${lead.company || 'Client'}) to active customer directory.`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConvertModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConvertLead}
                isLoading={isConverting}
              >
                Confirm Conversion
              </Button>
            </div>
          }
        >
          {convertError && (
            <div className="mb-4 p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C]">
              {convertError}
            </div>
          )}

          <form onSubmit={handleConvertLead} className="space-y-4">
            <div className="p-3.5 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl text-xs space-y-1">
              <div className="font-semibold text-[#0F172A]">Company Name to register:</div>
              <div className="font-bold text-[#E32B2B] text-sm">{lead.company || lead.name}</div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="createProjectCheckbox"
                checked={createProject}
                onChange={(e) => setCreateProject(e.target.checked)}
                className="w-4 h-4 text-[#E32B2B] rounded border-[#D0D5DD] focus:ring-[#E32B2B]"
              />
              <label htmlFor="createProjectCheckbox" className="text-xs font-bold text-[#0F172A] cursor-pointer">
                Create initial engineering project for this client
              </label>
            </div>

            {createProject && (
              <div className="space-y-4 pt-2 border-t border-[#E6E8EE] animate-in fade-in duration-150">
                <FormField label="Project Name" required>
                  <Input
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. ERP System Phase 1"
                  />
                </FormField>

                <FormField label="Initial Project Budget (₹ INR)">
                  <CurrencyInput
                    value={budgetRupees}
                    onChange={(val: string) => setBudgetRupees(parseFloat(val) || 0)}
                    placeholder="0"
                  />
                </FormField>
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeletePrompt && (
        <ConfirmDialog
          isOpen={showDeletePrompt}
          onClose={() => setShowDeletePrompt(false)}
          onConfirm={handleDeleteLead}
          title="Delete Lead?"
          message={`Are you sure you want to delete lead "${lead.name}"? This action cannot be undone.`}
          confirmLabel="Delete Lead"
          variant="danger"
        />
      )}
    </div>
  );
}
