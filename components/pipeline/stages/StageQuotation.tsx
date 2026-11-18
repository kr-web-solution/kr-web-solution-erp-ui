'use client';

import React from 'react';
import { FileBadge2, IndianRupee, ListChecks } from 'lucide-react';
import { formatPaise } from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import { EngagementDocumentsPanel } from '@/components/pipeline/EngagementDocumentsPanel';
import { StageChecklist } from '@/components/pipeline/StageChecklist';
import { EngagementMoneyPanel } from '@/components/pipeline/EngagementMoneyPanel';
import { StageAdvanceBar } from './StageAdvanceBar';
import { StageSection, StageShell } from './StageShell';
import { StageScreenProps } from './types';

export function StageQuotation({
  engagement,
  role,
  busy,
  onRefresh,
  onUpdate,
  onToggleChecklist,
  onAdvance,
}: StageScreenProps) {
  const isFounder = isPrivileged(role);
  const quotes = (engagement.documents || []).filter((d) => d.doc_kind === 'quote');
  const items = (engagement.checklist_items || []).filter((i) => i.stage_number === 3);
  const allDone = items.length > 0 && items.every((i) => i.is_done);
  const hasQuoteAmount = engagement.quoted_paise != null && engagement.quoted_paise > 0;

  return (
    <StageShell
      eyebrow="Stage 03"
      title="Quotation & Approval"
      description="Upload the quotation PDF, set the quoted value, then track send → negotiate → accept."
      accent="amber"
    >
      <div className="rounded-xl border border-brand-yellow-400/60 bg-brand-yellow-tint/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink-900 text-brand-yellow-400 flex items-center justify-center shrink-0" aria-hidden>
              <FileBadge2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-text">Quotation document</p>
              <p className="text-xs text-muted mt-0.5">
                Primary commercial PDF · {quotes.length} uploaded
              </p>
            </div>
          </div>
          {hasQuoteAmount && (
            <div className="rounded-lg bg-surface border border-border px-3 py-1.5 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Quoted</p>
              <p className="text-base font-heading font-bold text-text tabular-nums">
                {formatPaise(engagement.quoted_paise)}
              </p>
            </div>
          )}
        </div>
        <EngagementDocumentsPanel
          engagementId={engagement.id}
          documents={engagement.documents || []}
          role={role}
          onChanged={onRefresh}
          lockedKind="quote"
          filterKinds={['quote']}
          uploadLabel="Upload quotation PDF / DOC"
          emptyLabel="No quotation yet — upload the PDF you send to the client."
          showKindSelect={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StageSection
          icon={<IndianRupee className="w-4 h-4" />}
          title="Quoted amount"
          subtitle="Must be set before advancing from quotation"
        >
          <div className="rounded-2xl border border-[#E6E8EE] bg-[#FBFBFC] p-4">
            {isFounder ? (
              <EngagementMoneyPanel
                engagement={engagement}
                editable
                fields={['quoted', 'estimated']}
                onSave={async (data) => onUpdate(data, 'Quote values saved')}
              />
            ) : (
              <p className="text-2xl font-heading font-bold text-[#0F172A]">
                {formatPaise(engagement.quoted_paise)}
              </p>
            )}
            {isFounder && !hasQuoteAmount && (
              <p className="mt-2 text-[11px] text-[#B91C1C] font-medium">
                Enter quoted amount to unlock Advance.
              </p>
            )}
          </div>
        </StageSection>

        <StageSection
          icon={<ListChecks className="w-4 h-4" />}
          title="Approval checklist"
          subtitle="Prepare → send → negotiate → accept"
        >
          <StageChecklist
            items={engagement.checklist_items || []}
            stage={3}
            disabled={!isFounder || busy}
            onToggle={onToggleChecklist}
          />
        </StageSection>
      </div>

      {isFounder && onAdvance && (
        <StageAdvanceBar
          title="Quote accepted?"
          hint={
            hasQuoteAmount && allDone
              ? 'Move to contract & advance payment.'
              : 'Set quoted amount and complete checklist when ready.'
          }
          ctaLabel="Advance to Contract"
          disabled={!hasQuoteAmount}
          busy={busy}
          onAdvance={onAdvance}
        />
      )}
    </StageShell>
  );
}
