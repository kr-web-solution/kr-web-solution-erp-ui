'use client';

import React from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';

export type ProjectDocKind = 'quotation' | 'agreement' | 'other';

export interface ProjectDocDraft {
  key: string;
  kind: ProjectDocKind;
  name: string;
  file: File | null;
}

export const DOC_KIND_OPTIONS: { value: ProjectDocKind; label: string }[] = [
  { value: 'quotation', label: 'Quotation' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'other', label: 'Other' },
];

export function defaultProjectDocs(): ProjectDocDraft[] {
  return [
    { key: 'quotation', kind: 'quotation', name: 'Quotation', file: null },
    { key: 'agreement', kind: 'agreement', name: 'Agreement', file: null },
    { key: 'other', kind: 'other', name: '', file: null },
  ];
}

export function ProjectDocFields({
  docs,
  onChange,
}: {
  docs: ProjectDocDraft[];
  onChange: (next: ProjectDocDraft[]) => void;
}) {
  const update = (key: string, patch: Partial<ProjectDocDraft>) => {
    onChange(docs.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  return (
    <div className="rounded-xl border border-[#E6E8EE] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#F6F7F9] text-[#0F172A] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#0F172A]">Project documents</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Quotation, agreement, or any other file. Add as many as you need.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...docs,
              { key: `doc_${Date.now()}`, kind: 'other', name: '', file: null },
            ])
          }
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#E32B2B] hover:text-[#C81F26] cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      <div className="px-4 py-3 bg-[#F8F9FB] border-t border-[#E6E8EE] space-y-2">
        {docs.map((row) => (
          <div key={row.key} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr_auto] gap-2 items-center">
            <Select
              value={row.kind}
              onChange={(e) => {
                const kind = e.target.value as ProjectDocKind;
                const label = DOC_KIND_OPTIONS.find((opt) => opt.value === kind)?.label || '';
                const wasDefault = DOC_KIND_OPTIONS.some((opt) => opt.label === row.name);
                update(row.key, {
                  kind,
                  name: row.name && !wasDefault ? row.name : kind === 'other' ? '' : label,
                });
              }}
            >
              {DOC_KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Input
              value={row.name}
              placeholder="Document name"
              onChange={(e) => update(row.key, { name: e.target.value })}
            />
            <label className="flex items-center h-10 px-3 rounded-[10px] border border-[#E6E8EE] bg-white text-xs text-[#64748B] cursor-pointer truncate">
              <span className="truncate">{row.file ? row.file.name : 'Choose file'}</span>
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                onChange={(e) => update(row.key, { file: e.target.files?.[0] || null })}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange(docs.filter((item) => item.key !== row.key))}
              className="h-10 w-10 rounded-lg text-[#94A3B8] hover:text-[#B91C1C] hover:bg-white cursor-pointer flex items-center justify-center"
              aria-label="Remove document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="text-xs text-[#64748B]">No documents. Add a quotation, agreement, or other file.</p>
        )}
      </div>
    </div>
  );
}
