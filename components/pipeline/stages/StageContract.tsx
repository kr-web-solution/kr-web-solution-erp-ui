'use client';

import React from 'react';
import {
  FileSignature,
  IndianRupee,
  Link2,
  ListChecks,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { formatPaise } from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import { EngagementDocumentsPanel } from '@/components/pipeline/EngagementDocumentsPanel';
import { StageChecklist } from '@/components/pipeline/StageChecklist';
import { EngagementMoneyPanel } from '@/components/pipeline/EngagementMoneyPanel';
import { Button } from '@/components/ui/Button';
import { StageAdvanceBar } from './StageAdvanceBar';
import { StageSection, StageShell } from './StageShell';
import { StageScreenProps } from './types';

export function StageContract({
  engagement,
  role,
  busy,
  onRefresh,
  onUpdate,
  onToggleChecklist,
  onAdvance,
  onLinkClient,
}: StageScreenProps) {
  const isFounder = isPrivileged(role);
  const items = (engagement.checklist_items || []).filter((i) => i.stage_number === 4);
  const allDone = items.length > 0 && items.every((i) => i.is_done);
  const hasClient = !!engagement.client_id;
  const canAdvance = isFounder && engagement.status === 'active' && hasClient;

  return (
    <StageShell
      eyebrow="Stage 04"
      title="Contract & Advance Payment"
      description="Link the client and capture quoted / advance estimates. Invoicing and AMC are confirmed when converting to a Project."
      accent="green"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StageSection
          icon={<UserRound className="w-4 h-4" />}
          title="Client account"
          subtitle="Required before onboarding / project creation"
        >
          <div className="rounded-xl border border-border bg-bg p-4 space-y-3">
            {hasClient ? (
              <>
                <p className="text-sm font-bold text-text">
                  {engagement.client_name || 'Linked client'}
                </p>
                <Link
                  href={`/clients/${engagement.client_id}`}
                  className="text-xs font-semibold text-brand-red-500 hover:underline"
                >
                  Open client profile
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  No client linked yet. Create one from this company contact to continue.
                </p>
                {isFounder && onLinkClient && (
                  <Button size="sm" variant="primary" isLoading={busy} onClick={onLinkClient}>
                    <Link2 className="w-3.5 h-3.5 mr-1" aria-hidden /> Create & link client
                  </Button>
                )}
              </>
            )}
          </div>
        </StageSection>

        <StageSection
          icon={<IndianRupee className="w-4 h-4" />}
          title="Sales estimate"
          subtitle="Confirmed on Project conversion"
        >
          <div className="rounded-xl border border-border bg-bg p-4 space-y-3">
            {isFounder ? (
              <EngagementMoneyPanel
                engagement={engagement}
                editable
                fields={['advance', 'quoted']}
                onSave={async (data) => onUpdate(data, 'Estimate saved')}
              />
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted">Quoted</p>
                <p className="text-xl font-heading font-bold text-text">
                  {formatPaise(engagement.quoted_paise)}
                </p>
                <p className="text-xs text-muted mt-2">Advance expected</p>
                <p className="text-lg font-bold text-text">
                  {formatPaise(engagement.advance_paise)}
                </p>
              </div>
            )}
            <p className="text-[11px] text-muted border-t border-border pt-2">
              On Convert to Project, this advance is auto-created as a project invoice (due in 5 days).
              Balance invoice and Go Live stay on the Project page.
            </p>
          </div>
        </StageSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StageSection
          icon={<ListChecks className="w-4 h-4" />}
          title="Contract checklist"
          subtitle="Sign → confirm advance agreed"
        >
          <StageChecklist
            items={engagement.checklist_items || []}
            stage={4}
            disabled={!isFounder || busy}
            onToggle={onToggleChecklist}
          />
        </StageSection>

        <StageSection
          icon={<FileSignature className="w-4 h-4" />}
          title="Agreement / payment docs"
          subtitle="Signed contract, advance receipt, or PO"
        >
          <div className="rounded-xl border border-dashed border-border bg-bg p-3.5">
            <EngagementDocumentsPanel
              engagementId={engagement.id}
              documents={engagement.documents || []}
              role={role}
              onChanged={onRefresh}
              lockedKind="other"
              filterKinds={['other']}
              uploadLabel="Upload contract / receipt"
              emptyLabel="Optional: attach signed agreement or payment proof."
              showKindSelect={false}
            />
          </div>
        </StageSection>
      </div>

      {isFounder && onAdvance && (
        <StageAdvanceBar
          title="Advance confirmed?"
          hint={
            !hasClient
              ? 'Link a client before onboarding.'
              : allDone
              ? 'Move to project onboarding.'
              : 'Complete checklist when ready, then advance.'
          }
          ctaLabel="Advance to Onboarding"
          disabled={!canAdvance}
          busy={busy}
          onAdvance={onAdvance}
        />
      )}
    </StageShell>
  );
}
