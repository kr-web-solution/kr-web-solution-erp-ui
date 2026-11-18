'use client';

import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { projectsApi } from '@/lib/api/client';
import { ProjectDeliveryDetail, UserRole } from '@/lib/types';
import { DELIVERY_STAGES, stageLabel } from '@/lib/workflow';
import { isPrivileged } from '@/lib/roles';
import { StageChecklist } from '@/components/pipeline/StageChecklist';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  role?: UserRole;
  onPhaseChange?: (phase: number) => void;
}

export function ProjectDeliveryPanel({ projectId, role, onPhaseChange }: Props) {
  const [delivery, setDelivery] = useState<ProjectDeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const mode = role === 'client' ? 'client' : role === 'worker' ? 'worker' : 'founder';
  const canEdit = role !== 'client';
  const isFounder = isPrivileged(role);

  const load = async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getDelivery(projectId);
      setDelivery(data);
      onPhaseChange?.(data.delivery_phase || 5);
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
      onPhaseChange?.(data.delivery_phase || 5);
      toast.success(ok);
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !delivery) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const phase = delivery.delivery_phase || 5;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Delivery phase"
        subtitle={`${stageLabel(phase, mode)} · ${delivery.checklist_progress_percent}% of current checklist`}
      >
        <ol className="flex flex-wrap gap-2 mb-4">
          {DELIVERY_STAGES.map((s) => {
            const done = s.number < phase;
            const active = s.number === phase;
            return (
              <li
                key={s.number}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                  active
                    ? 'bg-[#FEF6D8] border-[#FADC59] text-[#0F172A]'
                    : done
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-white border-[#E6E8EE] text-[#94A3B8]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    active
                      ? 'bg-[#E32B2B] text-white'
                      : done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#F6F7F9]'
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : String(s.number).padStart(2, '0')}
                </span>
                {stageLabel(s.number, mode)}
              </li>
            );
          })}
        </ol>

        {canEdit && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant="primary"
              isLoading={busy}
              onClick={() => run(() => projectsApi.advanceDelivery(projectId), 'Advanced delivery')}
            >
              Advance phase <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            {isFounder && phase === 10 && (
              <Button
                size="sm"
                variant="secondary"
                isLoading={busy}
                onClick={() =>
                  run(() => projectsApi.advanceDelivery(projectId, true), 'Closed without AMC')
                }
              >
                Close (no AMC)
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

        {role === 'client' ? (
          <p className="text-sm text-[#64748B]">
            Your project is currently in <strong>{stageLabel(phase, 'client')}</strong>.
          </p>
        ) : (
          <StageChecklist
            items={delivery.checklist_items || []}
            stage={phase}
            disabled={!canEdit || busy}
            onToggle={(itemId) =>
              run(() => projectsApi.toggleChecklist(projectId, itemId), 'Checklist updated')
            }
          />
        )}
      </SectionCard>
    </div>
  );
}
