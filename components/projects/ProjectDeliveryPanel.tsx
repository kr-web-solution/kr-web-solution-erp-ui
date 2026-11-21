'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  FileCheck2,
  Package,
  StickyNote,
} from 'lucide-react';
import { projectsApi } from '@/lib/api/client';
import { ProjectDeliveryDetail, UserRole } from '@/lib/types';
import {
  DELIVERY_MIN_STAGE,
  DELIVERY_STAGES,
  HANDOVER_PHASE,
  stageDeliverable,
  stageLabel,
  stageMessage,
} from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import { StageChecklist } from '@/components/pipeline/StageChecklist';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  role?: UserRole;
  onPhaseChange?: (phase: number) => void;
}

/** Display order 1–10 for the 10 SDLC delivery phases (internal numbers stay 5–14). */
function displayIndex(stageNumber: number) {
  return stageNumber - DELIVERY_MIN_STAGE + 1;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function ProjectDeliveryPanel({ projectId, role, onPhaseChange }: Props) {
  const [delivery, setDelivery] = useState<ProjectDeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [viewStage, setViewStage] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteDirty, setNoteDirty] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const mode = role === 'client' ? 'client' : role === 'worker' ? 'worker' : 'founder';
  const canEdit = role !== 'client';
  const isFounder = isPrivileged(role);

  const syncNoteDraft = (data: ProjectDeliveryDetail, stage: number) => {
    const existing = (data.phase_notes || []).find((n) => n.stage_number === stage);
    setNoteDraft(existing?.body || '');
    setNoteDirty(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getDelivery(projectId);
      setDelivery(data);
      const phase = data.delivery_phase || DELIVERY_MIN_STAGE;
      onPhaseChange?.(phase);
      setViewStage((prev) => {
        const next = prev ?? phase;
        syncNoteDraft(data, next);
        return next;
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const run = async (fn: () => Promise<ProjectDeliveryDetail>, ok: string) => {
    setBusy(true);
    try {
      const data = await fn();
      setDelivery(data);
      const phase = data.delivery_phase || DELIVERY_MIN_STAGE;
      onPhaseChange?.(phase);
      setViewStage(phase);
      syncNoteDraft(data, phase);
      toast.success(ok);
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const selectStage = (stage: number) => {
    if (!delivery) return;
    setViewStage(stage);
    syncNoteDraft(delivery, stage);
  };

  const saveNote = async () => {
    if (!delivery || viewStage == null) return;
    setSavingNote(true);
    try {
      const trimmed = noteDraft.trim();
      const data = await projectsApi.updatePhaseNote(
        projectId,
        viewStage,
        trimmed.length ? trimmed : null
      );
      setDelivery(data);
      syncNoteDraft(data, viewStage);
      toast.success(trimmed.length ? 'Phase note saved' : 'Phase note cleared');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const phase = delivery?.delivery_phase || DELIVERY_MIN_STAGE;
  const activeView = viewStage ?? phase;
  const totalPhases = DELIVERY_STAGES.length;
  const currentDisplay = displayIndex(phase);

  const overallPct = useMemo(() => {
    if (!delivery) return 0;
    const idx = DELIVERY_STAGES.findIndex((s) => s.number === phase);
    if (idx < 0) return 0;
    const base = (idx / Math.max(totalPhases - 1, 1)) * 100;
    const checklistBoost = (delivery.checklist_progress_percent || 0) * (1 / totalPhases);
    return Math.min(100, Math.round(base + checklistBoost));
  }, [delivery, phase, totalPhases]);

  if (loading || !delivery) {
    return <PanelSkeleton className="py-2" />;
  }

  const viewedDef = DELIVERY_STAGES.find((s) => s.number === activeView);
  const noteForView = (delivery.phase_notes || []).find((n) => n.stage_number === activeView);
  const hasSavedNote = Boolean(noteForView?.body?.trim());
  const deliverable = stageDeliverable(activeView);

  return (
    <div className="space-y-5">
      {/* Hero — white surface + brand accents */}
      <div className="relative overflow-hidden rounded-[16px] border border-border bg-surface px-5 py-5 sm:px-6">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-brand-red-tint blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-brand-yellow-tint blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-red-500">
              Delivery roadmap
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-[-0.02em] font-heading text-text">
              {stageLabel(phase, mode)}
            </h2>
            <p className="mt-1.5 text-sm text-muted max-w-xl leading-relaxed">
              {stageMessage(phase)}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-yellow-tint border border-brand-yellow-400/40 px-3 py-1 text-[11px] font-semibold text-brand-text-on-yellow">
              <Package className="w-3.5 h-3.5" />
              Deliverable · {stageDeliverable(phase) || '—'}
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Overall progress
            </p>
            <p className="text-3xl font-bold tabular-nums tracking-tight mt-0.5 text-text">
              {overallPct}%
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Phase {currentDisplay} of {totalPhases}
            </p>
          </div>
        </div>
        <div className="relative mt-5 h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-red-500 to-brand-yellow-400 transition-[width] duration-500 ease-out"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Timeline */}
        <aside className="xl:col-span-4">
          <div className="rounded-[16px] border border-border bg-surface p-3 sm:p-4">
            <p className="ops-eyebrow px-2 pb-3">10 delivery phases</p>
            <ol className="relative flex flex-col">
              {DELIVERY_STAGES.map((s, i) => {
                const step = displayIndex(s.number);
                const done = s.number < phase;
                const current = s.number === phase;
                const viewing = s.number === activeView;
                const noted = (delivery.phase_notes || []).some(
                  (n) => n.stage_number === s.number && n.body?.trim()
                );
                const last = i === DELIVERY_STAGES.length - 1;

                return (
                  <li key={s.number}>
                    <button
                      type="button"
                      onClick={() => selectStage(s.number)}
                      className={[
                        'group w-full flex items-stretch gap-3 rounded-[12px] px-2 py-1.5 text-left transition-colors duration-150 cursor-pointer',
                        viewing
                          ? 'bg-brand-red-tint ring-1 ring-brand-red-500/30'
                          : current
                          ? 'bg-brand-yellow-tint/60'
                          : 'hover:bg-bg',
                      ].join(' ')}
                    >
                      {/* Fixed-width marker column — line is always centered on the circle */}
                      <span className="relative flex w-7 shrink-0 flex-col items-center">
                        <span
                          className={[
                            'relative z-[1] mt-1.5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border',
                            current
                              ? 'bg-brand-red-500 border-brand-red-500 text-white shadow-sm shadow-brand-red-500/25'
                              : done
                              ? 'bg-success border-success text-white'
                              : 'bg-surface border-border text-subtle',
                          ].join(' ')}
                        >
                          {done && !current ? (
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          ) : (
                            pad2(step)
                          )}
                        </span>
                        {!last && (
                          <span
                            className={`mt-1 w-0.5 flex-1 min-h-[12px] rounded-full ${
                              done ? 'bg-success/40' : 'bg-border'
                            }`}
                            aria-hidden
                          />
                        )}
                      </span>

                      <span className="min-w-0 flex-1 py-1.5 pr-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[13px] font-semibold leading-snug ${
                              viewing || current ? 'text-text' : 'text-muted'
                            }`}
                          >
                            {stageLabel(s.number, mode)}
                          </span>
                          {noted && (
                            <span
                              className="mt-1 w-1.5 h-1.5 rounded-full bg-info shrink-0"
                              title="Has note"
                              aria-label="Has note"
                            />
                          )}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-subtle truncate">
                          {s.deliverable}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* Detail */}
        <section className="xl:col-span-8 space-y-4">
          <div className="rounded-[16px] border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-bg/80 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="ops-eyebrow">
                    Phase {displayIndex(activeView)} of {totalPhases}
                    {activeView === phase ? ' · Current' : ' · Preview'}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-text tracking-[-0.01em] font-heading">
                    {stageLabel(activeView, mode)}
                  </h3>
                  <p className="mt-1 text-sm text-muted max-w-2xl leading-relaxed">
                    {viewedDef?.client_message || stageMessage(activeView)}
                  </p>
                </div>
                {deliverable && (
                  <div className="inline-flex items-center gap-2.5 rounded-[12px] border border-border bg-surface px-3 py-2.5 shadow-sm">
                    <span className="w-8 h-8 rounded-lg bg-brand-red-tint text-brand-red-500 flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-subtle font-bold">
                        Deliverable
                      </p>
                      <p className="text-xs font-semibold text-text">{deliverable}</p>
                    </div>
                  </div>
                )}
              </div>

              {activeView !== phase && (
                <button
                  type="button"
                  onClick={() => selectStage(phase)}
                  className="mt-3 text-xs font-semibold text-brand-red-500 hover:text-brand-red-hover cursor-pointer"
                >
                  Back to current phase
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              {role === 'client' ? (
                <p className="text-sm text-muted leading-relaxed">
                  Your project is currently in{' '}
                  <strong className="text-text">{stageLabel(phase, 'client')}</strong>.
                  {deliverable ? (
                    <>
                      {' '}
                      Target deliverable:{' '}
                      <strong className="text-text">{stageDeliverable(phase)}</strong>.
                    </>
                  ) : null}
                </p>
              ) : (
                <>
                  <StageChecklist
                    items={delivery.checklist_items || []}
                    stage={activeView}
                    disabled={!canEdit || busy || activeView !== phase}
                    onToggle={
                      activeView === phase
                        ? (itemId) =>
                            run(
                              () => projectsApi.toggleChecklist(projectId, itemId),
                              'Checklist updated'
                            )
                        : undefined
                    }
                  />

                  {canEdit && (
                    <div className="rounded-[12px] border border-dashed border-border bg-bg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-brand-yellow-tint text-brand-text-on-yellow flex items-center justify-center shrink-0">
                          <StickyNote className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-text">Phase note</p>
                          <p className="text-[11px] text-subtle">
                            Optional — not required to advance
                          </p>
                        </div>
                      </div>
                      <Textarea
                        rows={3}
                        placeholder="Decisions, blockers, client feedback for this phase…"
                        value={noteDraft}
                        onChange={(e) => {
                          setNoteDraft(e.target.value);
                          setNoteDirty(true);
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!noteDirty}
                          isLoading={savingNote}
                          onClick={saveNote}
                        >
                          Save note
                        </Button>
                        {hasSavedNote && !noteDirty && (
                          <span className="text-[11px] text-success font-semibold">Saved</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                isLoading={busy}
                onClick={() => run(() => projectsApi.advanceDelivery(projectId), 'Advanced delivery')}
              >
                Advance phase <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
              {isFounder && phase === HANDOVER_PHASE && (
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={busy}
                  onClick={() =>
                    run(
                      () => projectsApi.advanceDelivery(projectId, true),
                      'Closed without maintenance'
                    )
                  }
                >
                  Close (no maintenance)
                </Button>
              )}
              {isFounder && (
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={busy}
                  onClick={() => run(() => projectsApi.regressDelivery(projectId), 'Regressed')}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Regress
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
