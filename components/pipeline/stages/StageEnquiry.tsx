'use client';

import React from 'react';
import { FileText, Megaphone, NotebookPen } from 'lucide-react';
import { ENQUIRY_SOURCES } from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import { EngagementDocumentsPanel } from '@/components/pipeline/EngagementDocumentsPanel';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { StageAdvanceBar } from './StageAdvanceBar';
import { StageSection, StageShell } from './StageShell';
import { StageScreenProps } from './types';

export function StageEnquiry({
  engagement,
  role,
  busy,
  onRefresh,
  onUpdate,
  onAdvance,
}: StageScreenProps) {
  const isFounder = isPrivileged(role);
  const canAdvance = isFounder && !!engagement.enquiry_source && engagement.status === 'active';

  return (
    <StageShell
      eyebrow="Stage 01"
      title="Client Enquiry"
      description="Capture how this lead arrived, store the first enquiry document, and record first notes before discovery."
      accent="red"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StageSection
          icon={<Megaphone className="w-4 h-4" />}
          title="Where did this come from?"
          subtitle="Required before you can advance"
        >
          <FormField label="Enquiry source">
            <Select
              value={engagement.enquiry_source || ''}
              disabled={!isFounder || busy}
              onChange={(e) => onUpdate({ enquiry_source: e.target.value }, 'Source saved')}
            >
              <option value="">Select source…</option>
              {ENQUIRY_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </FormField>
          {!engagement.enquiry_source && (
            <p className="mt-2 text-[11px] text-[#B91C1C] font-medium">
              Set a source to unlock Advance.
            </p>
          )}
        </StageSection>

        <StageSection
          icon={<NotebookPen className="w-4 h-4" />}
          title="First notes"
          subtitle="Context for discovery call"
        >
          <Textarea
            rows={4}
            defaultValue={engagement.notes || ''}
            disabled={!isFounder || busy}
            placeholder="What does the client want? Timeline? Pain points?"
            onBlur={(e) => {
              if (e.target.value !== (engagement.notes || '')) {
                onUpdate({ notes: e.target.value }, 'Notes saved');
              }
            }}
          />
        </StageSection>
      </div>

      <StageSection
        icon={<Megaphone className="w-4 h-4" />}
        title="Company and contact"
        subtitle="These details become the client record when you link or create the client"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Company name">
            <Input
              defaultValue={engagement.company_name}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== engagement.company_name) {
                  onUpdate({ company_name: e.target.value.trim() }, 'Company saved');
                }
              }}
            />
          </FormField>
          <FormField label="Company email">
            <Input
              type="email"
              defaultValue={engagement.email || ''}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value !== (engagement.email || '')) {
                  onUpdate({ email: e.target.value }, 'Company email saved');
                }
              }}
            />
          </FormField>
          <FormField label="Company phone">
            <Input
              defaultValue={engagement.phone || ''}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value !== (engagement.phone || '')) {
                  onUpdate({ phone: e.target.value }, 'Company phone saved');
                }
              }}
            />
          </FormField>
          <FormField label="GSTIN">
            <Input
              defaultValue={engagement.gstin || ''}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value !== (engagement.gstin || '')) {
                  onUpdate({ gstin: e.target.value }, 'GSTIN saved');
                }
              }}
            />
          </FormField>
          <FormField label="Contact name">
            <Input
              defaultValue={engagement.contact_name || ''}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value !== (engagement.contact_name || '')) {
                  onUpdate({ contact_name: e.target.value }, 'Contact saved');
                }
              }}
            />
          </FormField>
          <FormField label="Designation">
            <Input
              defaultValue={engagement.designation || ''}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value !== (engagement.designation || '')) {
                  onUpdate({ designation: e.target.value }, 'Designation saved');
                }
              }}
            />
          </FormField>
          <FormField label="Contact email">
            <Input
              type="email"
              defaultValue={engagement.contact_email || ''}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value !== (engagement.contact_email || '')) {
                  onUpdate({ contact_email: e.target.value }, 'Contact email saved');
                }
              }}
            />
          </FormField>
          <FormField label="Contact number">
            <Input
              defaultValue={engagement.contact_phone || ''}
              disabled={!isFounder || busy}
              onBlur={(e) => {
                if (e.target.value !== (engagement.contact_phone || '')) {
                  onUpdate({ contact_phone: e.target.value }, 'Contact number saved');
                }
              }}
            />
          </FormField>
        </div>
      </StageSection>

      <StageSection
        icon={<FileText className="w-4 h-4" />}
        title="Initial enquiry document"
        subtitle="WhatsApp brief, email PDF, RFP, or form export"
      >
        <div className="rounded-xl border border-dashed border-border bg-bg p-3.5">
          <EngagementDocumentsPanel
            engagementId={engagement.id}
            documents={engagement.documents || []}
            role={role}
            onChanged={onRefresh}
            lockedKind="enquiry"
            filterKinds={['enquiry']}
            uploadLabel="Upload enquiry PDF / DOC"
            emptyLabel="No enquiry document yet — optional but recommended."
            showKindSelect={false}
          />
        </div>
      </StageSection>

      {isFounder && onAdvance && (
        <StageAdvanceBar
          title="Ready for discovery?"
          hint="Move to stage 02 after source is set."
          ctaLabel="Advance to Discovery"
          disabled={!canAdvance}
          busy={busy}
          onAdvance={onAdvance}
        />
      )}
    </StageShell>
  );
}
