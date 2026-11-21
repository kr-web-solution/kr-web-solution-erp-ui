'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Link as LinkIcon,
  Paperclip,
  Upload,
  X,
  Building2,
  FolderKanban,
} from 'lucide-react';
import { projectsApi } from '@/lib/api/client';
import { ProjectFeature, UserRole } from '@/lib/types';
import {
  FEATURE_PRIORITIES,
  FEATURE_REQUEST_TYPES,
  FEATURE_STATUSES,
  formatPaise,
} from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  role?: UserRole;
  projectName?: string;
  clientName?: string;
  /** When true, focus on docs across features */
  docsMode?: boolean;
}

const emptyForm = () => ({
  title: '',
  request_type: 'new_feature',
  description: '',
  expected_functionality: '',
  priority: 'medium',
  expected_date: '',
  acceptance_criteria: '',
  quoted: '',
});

export function ProjectFeaturesPanel({
  projectId,
  role,
  projectName,
  clientName,
  docsMode,
}: Props) {
  const [features, setFeatures] = useState<ProjectFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docFeatureId, setDocFeatureId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docBody, setDocBody] = useState('');
  const [docType, setDocType] = useState('note');

  const isFounder = isPrivileged(role);
  const isWorker = role === 'worker';
  const isClient = role === 'client';
  const canCreate = isFounder || isClient;
  const canEditStatus = isFounder || isWorker;

  const load = async () => {
    setLoading(true);
    try {
      const list = await projectsApi.listFeatures(projectId);
      setFeatures(list);
      if (!docFeatureId && list[0]) setDocFeatureId(list[0].id);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load features');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openCreate = () => {
    setForm(emptyForm());
    setFiles([]);
    setFormError(null);
    setModalOpen(true);
  };

  const createFeature = async () => {
    if (!form.title.trim()) {
      setFormError('Feature title is required.');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (!form.expected_functionality.trim()) {
      setFormError('Expected functionality is required.');
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      const paise = form.quoted.trim() ? Math.round(Number(form.quoted) * 100) : undefined;
      const created = await projectsApi.createFeature(projectId, {
        title: form.title.trim(),
        description: form.description.trim(),
        request_type: form.request_type,
        expected_functionality: form.expected_functionality.trim(),
        priority: form.priority,
        expected_date: form.expected_date || null,
        acceptance_criteria: form.acceptance_criteria.trim() || undefined,
        quoted_paise: Number.isFinite(paise) ? paise : undefined,
      });

      for (const file of files) {
        try {
          await projectsApi.uploadFeatureAttachment(projectId, created.id, file);
        } catch (err: any) {
          toast.error(err?.message || `Failed to upload ${file.name}`);
        }
      }

      setModalOpen(false);
      setForm(emptyForm());
      setFiles([]);
      toast.success('Change request created');
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create change request');
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (featureId: string, status: string) => {
    let status_reason: string | undefined;
    if (status === 'rejected' || status === 'cancelled') {
      const reason = window.prompt(
        status === 'rejected' ? 'Rejection reason (required):' : 'Cancellation reason (required):'
      );
      if (!reason?.trim()) {
        toast.error('A reason is required');
        return;
      }
      status_reason = reason.trim();
    }
    setBusy(true);
    try {
      await projectsApi.updateFeature(projectId, featureId, { status, status_reason });
      toast.success('Status updated');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  };

  const removeFeature = async (featureId: string) => {
    if (!confirm('Archive this change request?')) return;
    setBusy(true);
    try {
      await projectsApi.deleteFeature(projectId, featureId);
      toast.success('Change request deleted');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const addDoc = async () => {
    if (!docFeatureId || !docTitle.trim() || !docBody.trim()) return;
    setBusy(true);
    try {
      await projectsApi.addFeatureDoc(projectId, docFeatureId, {
        title: docTitle.trim(),
        body_or_url: docBody.trim(),
        doc_type: docType,
      });
      setDocTitle('');
      setDocBody('');
      toast.success('Doc added');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add doc');
    } finally {
      setBusy(false);
    }
  };

  const requestTypeLabel = (value?: string | null) =>
    FEATURE_REQUEST_TYPES.find((t) => t.value === value)?.label || value || 'New Feature';

  const priorityLabel = (value?: string | null) =>
    FEATURE_PRIORITIES.find((p) => p.value === value)?.label || value || 'Medium';

  if (loading) return <PanelSkeleton className="py-2" />;

  if (docsMode) {
    const allDocs = features.flatMap((f) =>
      (f.docs || []).map((d) => ({ ...d, featureTitle: f.title, featureId: f.id }))
    );
    return (
      <div className="space-y-6">
        <SectionCard title="Feature docs" subtitle="Notes, links, specs, and CR attachments">
          {canCreate && features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
              <FormField label="Feature">
                <Select value={docFeatureId} onChange={(e) => setDocFeatureId(e.target.value)}>
                  {features.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Type">
                <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="note">Note</option>
                  <option value="link">Link</option>
                  <option value="spec">Spec</option>
                </Select>
              </FormField>
              <FormField label="Title">
                <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
              </FormField>
              <FormField label="Body / URL">
                <Input value={docBody} onChange={(e) => setDocBody(e.target.value)} />
              </FormField>
              <div className="sm:col-span-2">
                <Button size="sm" variant="primary" isLoading={busy} onClick={addDoc}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add doc
                </Button>
              </div>
            </div>
          )}
          {allDocs.length === 0 ? (
            <EmptyState title="No docs yet" subtitle="Add notes, links, or attachments against change requests." />
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {allDocs.map((d) => (
                <li key={d.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {d.doc_type === 'attachment' ? (
                        <Paperclip className="w-3.5 h-3.5 text-muted" />
                      ) : d.doc_type === 'link' ? (
                        <LinkIcon className="w-3.5 h-3.5 text-muted" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-muted" />
                      )}
                      <p className="text-sm font-semibold text-text">{d.title}</p>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">{d.featureTitle}</p>
                    <p className="text-xs text-text mt-1 break-all whitespace-pre-wrap">
                      {d.doc_type === 'attachment'
                        ? d.original_filename || d.body_or_url
                        : d.body_or_url}
                    </p>
                  </div>
                  {isFounder && (
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={busy}
                      onClick={async () => {
                        await projectsApi.deleteFeatureDoc(projectId, d.featureId, d.id);
                        toast.success('Doc removed');
                        await load();
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Additional features"
        subtitle="Change requests and CR scope beyond the original quote"
        headerSlot={
          canCreate ? (
            <Button size="sm" variant="primary" className="h-8 text-xs" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Change Request
            </Button>
          ) : undefined
        }
      >
        {features.length === 0 ? (
          <EmptyState
            title="No additional features"
            subtitle={
              role === 'client'
                ? 'Approved change requests will appear here.'
                : 'Capture CR scope here once the project is in delivery.'
            }
            action={
              canCreate
                ? {
                    label: 'New Change Request',
                    onClick: openCreate,
                    icon: <Plus className="w-4 h-4" />,
                  }
                : undefined
            }
          />
        ) : (
          <ul className="space-y-3">
            {features.map((f) => {
              const attachments = (f.docs || []).filter((d) => d.doc_type === 'attachment');
              return (
                <li
                  key={f.id}
                  className="rounded-[12px] border border-border bg-surface p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {f.cr_number && (
                          <span className="text-[10px] font-mono font-bold text-brand-red-500 bg-brand-red-tint px-2 py-0.5 rounded-full border border-brand-red-500/20">
                            {f.cr_number}
                          </span>
                        )}
                        <p className="text-sm font-bold text-text">{f.title}</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-bg border border-border text-muted">
                          {requestTypeLabel(f.request_type)}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-yellow-tint text-brand-text-on-yellow border border-brand-yellow-400/40">
                          {priorityLabel(f.priority)}
                        </span>
                      </div>
                      {f.description && (
                        <p className="text-xs text-muted mt-1.5 leading-relaxed">{f.description}</p>
                      )}
                      {f.expected_functionality && (
                        <p className="text-xs text-text mt-2">
                          <span className="font-semibold text-muted">Expected: </span>
                          {f.expected_functionality}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-subtle">
                        {f.expected_date && (
                          <span>
                            Expected{' '}
                            {new Date(f.expected_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                        {f.quoted_paise != null && (
                          <span className="font-mono text-muted">{formatPaise(f.quoted_paise)}</span>
                        )}
                        {attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {attachments.length} file{attachments.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canEditStatus ? (
                        <Select
                          className="h-9 text-xs"
                          value={f.status}
                          disabled={busy}
                          onChange={(e) => updateStatus(f.id, e.target.value)}
                        >
                          {FEATURE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-bg capitalize">
                          {f.status.replace('_', ' ')}
                        </span>
                      )}
                      {isFounder && (
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={busy}
                          onClick={() => removeFeature(f.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => !busy && setModalOpen(false)}
          title="New Change Request"
          subtitle="Project and client details are automatically inherited from the current project."
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={busy}
                onClick={createFeature}
              >
                Create Change Request
              </Button>
            </div>
          }
        >
          {(projectName || clientName) && (
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projectName && (
                <div className="rounded-[12px] border border-border bg-bg px-3 py-2.5 flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-brand-red-tint text-brand-red-500 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                      Project
                    </p>
                    <p className="text-sm font-semibold text-text truncate">{projectName}</p>
                  </div>
                </div>
              )}
              {clientName && (
                <div className="rounded-[12px] border border-border bg-bg px-3 py-2.5 flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-info-tint text-info flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                      Client
                    </p>
                    <p className="text-sm font-semibold text-text truncate">{clientName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 bg-danger-tint border border-danger/20 rounded-[10px] text-xs text-danger">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <FormField label="Feature title" required>
              <Input
                required
                placeholder="e.g. Multi-warehouse stock management"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Request type" required>
                <Select
                  value={form.request_type}
                  onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                >
                  {FEATURE_REQUEST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Priority" required>
                <Select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {FEATURE_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="Description" required>
              <Textarea
                rows={3}
                placeholder="Explain what the client needs..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>

            <FormField label="Expected functionality" required>
              <Textarea
                rows={3}
                placeholder="How should this feature work?"
                value={form.expected_functionality}
                onChange={(e) => setForm({ ...form, expected_functionality: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Expected date">
                <Input
                  type="date"
                  value={form.expected_date}
                  onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                />
              </FormField>
              <FormField label="Quoted (₹)" hint="Optional add-on quote">
                <Input
                  value={form.quoted}
                  onChange={(e) => setForm({ ...form, quoted: e.target.value })}
                  placeholder="0"
                />
              </FormField>
            </div>

            <FormField label="Acceptance criteria" hint="How will the client verify that the feature is complete?">
              <Textarea
                rows={3}
                placeholder="How will the client verify that the feature is complete?"
                value={form.acceptance_criteria}
                onChange={(e) => setForm({ ...form, acceptance_criteria: e.target.value })}
              />
            </FormField>

            <FormField label="Attachments" hint="Optional — screenshots, documents (max 10 MB each)">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const next = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...next]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-[12px] border border-dashed border-border bg-bg px-4 py-6 text-center hover:bg-brand-yellow-tint/40 hover:border-brand-yellow-400 transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5 mx-auto text-muted" />
                <p className="mt-2 text-sm font-semibold text-text">Upload screenshots, documents</p>
                <p className="mt-0.5 text-[11px] text-subtle">PDF, DOC, PNG, JPG, WEBP</p>
              </button>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {files.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate font-semibold text-text">{file.name}</span>
                        <span className="text-subtle shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded-md text-subtle hover:text-danger hover:bg-danger-tint cursor-pointer"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}
