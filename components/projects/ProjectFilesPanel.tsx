'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, FileText, Pencil, Trash2, Upload, X } from 'lucide-react';
import { projectsApi } from '@/lib/api/client';
import { ProjectDocument, UserRole } from '@/lib/types';
import { isPrivileged } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

const KIND_LABEL: Record<string, string> = {
  quotation: 'Quotation',
  agreement: 'Agreement',
  other: 'Other',
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesPanel({
  projectId,
  role,
}: {
  projectId: string;
  role?: UserRole;
}) {
  const isFounder = isPrivileged(role);
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [docKind, setDocKind] = useState('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editKind, setEditKind] = useState('other');

  const refresh = useCallback(async () => {
    const rows = await projectsApi.listDocuments(projectId);
    setDocs(rows);
  }, [projectId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh()
      .catch((err: any) => toast.error(err?.message || 'Could not load documents'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !isFounder) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await projectsApi.uploadDocument(
          projectId,
          file,
          uploadTitle.trim() || file.name,
          docKind,
          uploadDescription.trim() || undefined
        );
      }
      toast.success(files.length > 1 ? 'Documents uploaded' : 'Document uploaded');
      setUploadTitle('');
      setUploadDescription('');
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const startEdit = (doc: ProjectDocument) => {
    setEditingId(doc.id);
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setEditKind(doc.doc_kind || 'other');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditKind('other');
  };

  const saveEdit = async (docId: string) => {
    const title = editTitle.trim();
    if (!title) {
      toast.error('Title is required');
      return;
    }
    setBusy(true);
    try {
      await projectsApi.updateDocument(projectId, docId, {
        title,
        description: editDescription.trim() || null,
        doc_kind: editKind,
      });
      toast.success('Document updated');
      cancelEdit();
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc: ProjectDocument) => {
    if (!confirm(`Delete “${doc.title}”?`)) return;
    setBusy(true);
    try {
      await projectsApi.deleteDocument(projectId, doc.id);
      toast.success('Document deleted');
      if (editingId === doc.id) cancelEdit();
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#E6E8EE] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E6E8EE] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#64748B]" />
          <h2 className="text-sm font-semibold text-[#0F172A]">Project files</h2>
        </div>
      </div>

      {isFounder && (
        <div className="px-4 py-3 border-b border-[#E6E8EE] space-y-3 bg-[#F8FAFC]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Title">
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Defaults to filename"
                className="w-full rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10"
              />
            </FormField>
            <FormField label="Document type">
              <Select value={docKind} onChange={(e) => setDocKind(e.target.value)}>
                <option value="quotation">Quotation</option>
                <option value="agreement">Agreement</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Description">
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes about this file"
              className="w-full rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10"
            />
          </FormField>
          <div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf"
              multiple
              onChange={(e) => upload(e.target.files)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              isLoading={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> Upload file
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-4">
          <PanelSkeleton />
        </div>
      ) : docs.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No files yet"
            subtitle={
              isFounder
                ? 'Upload quotation, agreement, or other project files here.'
                : 'Quotation, agreement, and other project files will appear here.'
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-[#E6E8EE]">
          {docs.map((doc) => {
            const isEditing = editingId === doc.id;
            return (
              <li key={doc.id} className="px-4 py-3 space-y-2">
                {isEditing ? (
                  <div className="space-y-3">
                    <FormField label="Title">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10"
                      />
                    </FormField>
                    <FormField label="Description">
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-[#E6E8EE] bg-white px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F172A]/10"
                      />
                    </FormField>
                    <FormField label="Document type">
                      <Select value={editKind} onChange={(e) => setEditKind(e.target.value)}>
                        <option value="quotation">Quotation</option>
                        <option value="agreement">Agreement</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormField>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        isLoading={busy}
                        onClick={() => saveEdit(doc.id)}
                      >
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{doc.title}</p>
                      {doc.description && (
                        <p className="text-xs text-[#475569] mt-0.5 whitespace-pre-wrap">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {KIND_LABEL[doc.doc_kind] || 'Other'} · {doc.original_filename} ·{' '}
                        {formatBytes(doc.size_bytes || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          projectsApi.openDocument(projectId, doc.id).catch((err: any) => {
                            toast.error(err?.message || 'Could not open the file');
                          })
                        }
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      {isFounder && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => startEdit(doc)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            isLoading={busy}
                            onClick={() => remove(doc)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
