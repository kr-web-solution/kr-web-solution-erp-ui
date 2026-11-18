'use client';

import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { projectsApi } from '@/lib/api/client';
import { ProjectDocument } from '@/lib/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { toast } from 'sonner';

const KIND_LABEL: Record<string, string> = {
  quotation: 'Quotation',
  agreement: 'Agreement',
  other: 'Other',
};

export function ProjectFilesPanel({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    projectsApi
      .listDocuments(projectId)
      .then((rows) => {
        if (active) setDocs(rows);
      })
      .catch((err: any) => toast.error(err?.message || 'Could not load documents'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  return (
    <section className="rounded-xl border border-[#E6E8EE] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E6E8EE] flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#64748B]" />
        <h2 className="text-sm font-semibold text-[#0F172A]">Project files</h2>
      </div>
      {loading ? (
        <LoadingAnimation label="Loading files…" className="py-10" />
      ) : docs.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No files yet" subtitle="Quotation, agreement, and other files added with the project show up here." />
        </div>
      ) : (
        <ul className="divide-y divide-[#E6E8EE]">
          {docs.map((doc) => (
            <li key={doc.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">{doc.title}</p>
                <p className="text-[11px] text-[#64748B] truncate">
                  {KIND_LABEL[doc.doc_kind] || 'Other'} · {doc.original_filename}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-[#E32B2B] shrink-0 cursor-pointer"
                onClick={() =>
                  projectsApi.openDocument(projectId, doc.id).catch((err: any) => {
                    toast.error(err?.message || 'Could not open the file');
                  })
                }
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
