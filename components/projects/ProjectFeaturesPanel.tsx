'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, FileText, Link as LinkIcon } from 'lucide-react';
import { projectsApi } from '@/lib/api/client';
import { ProjectFeature, UserRole } from '@/lib/types';
import { FEATURE_STATUSES, formatPaise } from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  role?: UserRole;
  /** When true, focus on docs across features */
  docsMode?: boolean;
}

export function ProjectFeaturesPanel({ projectId, role, docsMode }: Props) {
  const [features, setFeatures] = useState<ProjectFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quoted, setQuoted] = useState('');
  const [docFeatureId, setDocFeatureId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docBody, setDocBody] = useState('');
  const [docType, setDocType] = useState('note');

  const isFounder = isPrivileged(role);
  const isWorker = role === 'worker';
  const canCreate = isFounder;
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

  const createFeature = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const paise = quoted.trim() ? Math.round(Number(quoted) * 100) : undefined;
      await projectsApi.createFeature(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        quoted_paise: Number.isFinite(paise) ? paise : undefined,
      });
      setTitle('');
      setDescription('');
      setQuoted('');
      toast.success('Feature added');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create feature');
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (featureId: string, status: string) => {
    setBusy(true);
    try {
      await projectsApi.updateFeature(projectId, featureId, { status });
      toast.success('Status updated');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  };

  const removeFeature = async (featureId: string) => {
    if (!confirm('Delete this feature?')) return;
    setBusy(true);
    try {
      await projectsApi.deleteFeature(projectId, featureId);
      toast.success('Feature deleted');
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

  if (loading) return <PanelSkeleton className="py-2" />;

  if (docsMode) {
    const allDocs = features.flatMap((f) =>
      (f.docs || []).map((d) => ({ ...d, featureTitle: f.title, featureId: f.id }))
    );
    return (
      <div className="space-y-6">
        <SectionCard title="Feature docs" subtitle="Notes, links, and specs (URL or text)">
          {canCreate && features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pb-4 border-b border-[#E6E8EE]">
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
            <EmptyState title="No docs yet" subtitle="Add notes or links against additional features." />
          ) : (
            <ul className="divide-y divide-[#E6E8EE] -mx-1">
              {allDocs.map((d) => (
                <li key={d.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {d.doc_type === 'link' ? (
                        <LinkIcon className="w-3.5 h-3.5 text-[#64748B]" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#64748B]" />
                      )}
                      <p className="text-sm font-semibold text-[#0F172A]">{d.title}</p>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">{d.featureTitle}</p>
                    <p className="text-xs text-[#0F172A] mt-1 break-all whitespace-pre-wrap">{d.body_or_url}</p>
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
      <SectionCard title="Additional features" subtitle="Change requests and CR scope beyond the original quote">
        {canCreate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pb-4 border-b border-[#E6E8EE]">
            <FormField label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Multi-warehouse stock" />
            </FormField>
            <FormField label="Quoted (₹)">
              <Input value={quoted} onChange={(e) => setQuoted(e.target.value)} placeholder="Optional" />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Description">
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormField>
            </div>
            <div>
              <Button size="sm" variant="primary" isLoading={busy} onClick={createFeature}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add feature
              </Button>
            </div>
          </div>
        )}

        {features.length === 0 ? (
          <EmptyState
            title="No additional features"
            subtitle={
              role === 'client'
                ? 'Approved change requests will appear here.'
                : 'Capture CR scope here once the project is in delivery.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {features.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-[#E6E8EE] bg-white p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{f.title}</p>
                  {f.description && <p className="text-xs text-[#64748B] mt-1">{f.description}</p>}
                  <p className="text-[11px] text-[#64748B] mt-1 font-mono">{formatPaise(f.quoted_paise)}</p>
                  {(f.docs || []).length > 0 && (
                    <p className="text-[11px] text-[#64748B] mt-1">{f.docs.length} doc(s)</p>
                  )}
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
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[#F6F7F9] capitalize">
                      {f.status.replace('_', ' ')}
                    </span>
                  )}
                  {isFounder && (
                    <Button size="sm" variant="secondary" isLoading={busy} onClick={() => removeFeature(f.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
