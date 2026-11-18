'use client';

import React from 'react';
import { ClipboardList, FileSearch, IndianRupee } from 'lucide-react';
import { EngagementDocumentsPanel } from '@/components/pipeline/EngagementDocumentsPanel';
import { StageChecklist } from '@/components/pipeline/StageChecklist';
import { EngagementMoneyPanel } from '@/components/pipeline/EngagementMoneyPanel';
import { StageAdvanceBar } from './StageAdvanceBar';
import { StageSection, StageShell } from './StageShell';
import { StageScreenProps } from './types';
import { isPrivileged } from '@/lib/roles';

export function StageDiscovery({
  engagement,
  role,
  busy,
  onRefresh,
  onUpdate,
  onToggleChecklist,
  onAdvance,
}: StageScreenProps) {
  const isFounder = isPrivileged(role);
  const items = (engagement.checklist_items || []).filter((i) => i.stage_number === 2);
  const allDone = items.length > 0 && items.every((i) => i.is_done);

  return (
    <StageShell
      eyebrow="Stage 02"
      title="Discovery & Requirements"
      description="Confirm needs, budget band, and scope. Attach the discovery brief before quotation."
      accent="amber"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <StageSection
            icon={<ClipboardList className="w-4 h-4" />}
            title="Discovery checklist"
            subtitle="Tick each item as you confirm it with the client"
          >
            <StageChecklist
              items={engagement.checklist_items || []}
              stage={2}
              disabled={!isFounder || busy}
              onToggle={onToggleChecklist}
            />
          </StageSection>

          <StageSection
            icon={<FileSearch className="w-4 h-4" />}
            title="Requirements brief"
            subtitle="Meeting notes, scope draft, or discovery PDF"
          >
            <div className="rounded-2xl border border-dashed border-[#D7DBE3] bg-[#FBFBFC] p-4">
              <EngagementDocumentsPanel
                engagementId={engagement.id}
                documents={engagement.documents || []}
                role={role}
                onChanged={onRefresh}
                lockedKind="brief"
                filterKinds={['brief']}
                uploadLabel="Upload brief PDF / DOC"
                emptyLabel="Attach discovery notes or requirements document."
                showKindSelect={false}
              />
            </div>
          </StageSection>
        </div>

        <div className="lg:col-span-2">
          <StageSection
            icon={<IndianRupee className="w-4 h-4" />}
            title="Budget estimate"
            subtitle="Internal estimate before formal quote"
          >
            <div className="rounded-2xl border border-[#E6E8EE] bg-[#FBFBFC] p-4">
              {isFounder ? (
                <EngagementMoneyPanel
                  engagement={engagement}
                  editable
                  fields={['estimated']}
                  onSave={async (data) => onUpdate(data, 'Estimate saved')}
                />
              ) : (
                <p className="text-sm text-[#64748B]">Estimate is visible to founders only.</p>
              )}
            </div>
          </StageSection>
        </div>
      </div>

      {isFounder && onAdvance && (
        <StageAdvanceBar
          title="Ready to quote?"
          hint={
            allDone
              ? 'Checklist complete — move to quotation.'
              : 'Finish checklist items first if possible.'
          }
          ctaLabel="Advance to Quotation"
          busy={busy}
          onAdvance={onAdvance}
        />
      )}
    </StageShell>
  );
}
