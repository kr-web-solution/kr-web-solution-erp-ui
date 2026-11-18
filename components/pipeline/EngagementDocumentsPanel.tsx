'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eye, FileText, Paperclip, Trash2, Upload } from 'lucide-react';
import { engagementsApi } from '@/lib/api/client';
import { EngagementDocument, UserRole } from '@/lib/types';
import { isPrivileged } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const KIND_LABELS: Record<string, string> = {
  enquiry: 'Initial enquiry',
  brief: 'Brief / requirements',
  quote: 'Quotation',
  other: 'Other',
};

interface Props {
  engagementId: string;
  documents: EngagementDocument[];
  role?: UserRole;
  onChanged: () => Promise<void> | void;
  /** Default / locked upload kind */
  defaultKind?: string;
  /** If set, kind selector is hidden and uploads always use this kind */
  lockedKind?: string;
  /** Only list documents whose kind is in this list (all if omitted) */
  filterKinds?: string[];
  uploadLabel?: string;
  emptyLabel?: string;
  showKindSelect?: boolean;
}

export function EngagementDocumentsPanel({
  engagementId,
  documents,
  role,
  onChanged,
  defaultKind = 'enquiry',
  lockedKind,
  filterKinds,
  uploadLabel = 'Upload PDF / DOC',
  emptyLabel = 'No documents attached yet.',
  showKindSelect = true,
}: Props) {
  const isFounder = isPrivileged(role);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [docKind, setDocKind] = useState(lockedKind || defaultKind);

  useEffect(() => {
    setDocKind(lockedKind || defaultKind);
  }, [lockedKind, defaultKind]);

  const visible = filterKinds?.length
    ? documents.filter((d) => filterKinds.includes(d.doc_kind))
    : documents;

  const effectiveKind = lockedKind || docKind;

  const upload = async (files: FileList | null) => {
    if (!files?.length || !isFounder) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await engagementsApi.uploadDocument(engagementId, file, {
          title: file.name,
          doc_kind: effectiveKind,
        });
      }
      toast.success(
        effectiveKind === 'quote'
          ? files.length > 1
            ? 'Quotations uploaded'
            : 'Quotation uploaded'
          : files.length > 1
          ? 'Documents uploaded'
          : 'Document uploaded'
      );
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const view = async (doc: EngagementDocument) => {
    try {
      await engagementsApi.openDocument(engagementId, doc.id, false);
    } catch (err: any) {
      toast.error(err?.message || 'Could not open document');
    }
  };

  const remove = async (doc: EngagementDocument) => {
    if (!confirm(`Delete “${doc.title}”?`)) return;
    setBusy(true);
    try {
      await engagementsApi.deleteDocument(engagementId, doc.id);
      toast.success('Document deleted');
      await onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {isFounder && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pb-3 border-b border-[#E6E8EE]">
          {showKindSelect && !lockedKind && (
            <div className="flex-1">
              <FormField label="Document type">
                <Select value={docKind} onChange={(e) => setDocKind(e.target.value)}>
                  <option value="enquiry">Initial enquiry</option>
                  <option value="brief">Brief / requirements</option>
                  <option value="quote">Quotation</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
            </div>
          )}
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
              variant={lockedKind === 'quote' ? 'primary' : 'secondary'}
              isLoading={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> {uploadLabel}
            </Button>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-[#64748B] py-2 flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#E6E8EE] bg-white px-3 py-2.5"
            >
              <div className="flex items-start gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#64748B] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{doc.title}</p>
                  <p className="text-[11px] text-[#64748B]">
                    {KIND_LABELS[doc.doc_kind] || doc.doc_kind} · {doc.original_filename} ·{' '}
                    {formatBytes(doc.size_bytes)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" size="sm" variant="secondary" onClick={() => view(doc)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
                {isFounder && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    isLoading={busy}
                    onClick={() => remove(doc)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
