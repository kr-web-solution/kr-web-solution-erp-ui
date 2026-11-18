'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, FolderKanban, IndianRupee, ListChecks, Rocket, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { StageChecklist } from '@/components/pipeline/StageChecklist';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { StageAdvanceBar } from './StageAdvanceBar';
import { StageSection, StageShell } from './StageShell';
import { EnsureProjectPayload, StageScreenProps } from './types';
import { isPrivileged } from '@/lib/roles';

export function StageOnboarding({
  engagement,
  role,
  busy,
  onToggleChecklist,
  onAdvance,
  onEnsureProject,
}: StageScreenProps) {
  const isFounder = isPrivileged(role);
  const hasProject = !!engagement.project_id;
  const items = (engagement.checklist_items || []).filter((i) => i.stage_number === 5);
  const allDone = items.length > 0 && items.every((i) => i.is_done);

  // Final confirmed terms — independent of pipeline quoted/advance estimates
  const pipelineHintTotal = (engagement.quoted_paise || engagement.estimated_budget_paise || 0) / 100;
  const pipelineHintAdvance = (engagement.advance_paise || 0) / 100;
  const pipelineHintAmc = (engagement.recurring?.amount_paise || 0) / 100;

  const [projectName, setProjectName] = useState(engagement.project_name || engagement.title);
  const [devDays, setDevDays] = useState('15');
  const [totalRupees, setTotalRupees] = useState(pipelineHintTotal > 0 ? String(pipelineHintTotal) : '');
  const [advanceRupees, setAdvanceRupees] = useState(
    pipelineHintAdvance > 0 ? String(pipelineHintAdvance) : ''
  );
  const [amcRupees, setAmcRupees] = useState(pipelineHintAmc > 0 ? String(pipelineHintAmc) : '');
  const [localBusy, setLocalBusy] = useState(false);
  const working = busy || localBusy;

  const applyPipelinePrefill = () => {
    if (pipelineHintTotal > 0) setTotalRupees(String(pipelineHintTotal));
    if (pipelineHintAdvance > 0) setAdvanceRupees(String(pipelineHintAdvance));
    if (pipelineHintAmc > 0) setAmcRupees(String(pipelineHintAmc));
    toast.message('Filled from the pipeline figures — confirm them, then convert');
  };

  const buildPayload = (): EnsureProjectPayload => {
    const budget = Math.round(parseFloat(totalRupees || '0') * 100);
    const advance = Math.round(parseFloat(advanceRupees || '0') * 100);
    const amc = Math.round(parseFloat(amcRupees || '0') * 100);
    const days = parseInt(devDays, 10);
    return {
      project_name: projectName.trim() || engagement.title,
      budget_paise: Number.isFinite(budget) ? budget : 0,
      advance_paise: Number.isFinite(advance) ? Math.max(0, advance) : 0,
      development_days: Number.isFinite(days) && days > 0 ? days : undefined,
      maintenance_amount_paise: Number.isFinite(amc) && amc > 0 ? amc : 0,
      maintenance_send_day: 1,
      maintenance_due_after_days: 5,
    };
  };

  const handleEnsure = async () => {
    if (!onEnsureProject) return;

    const payload = buildPayload();
    if (!payload.project_name?.trim()) {
      toast.error('Enter the project name');
      return;
    }
    if (!payload.development_days) {
      toast.error('Enter development days');
      return;
    }
    if ((payload.budget_paise || 0) <= 0) {
      toast.error('Enter confirmed total development amount');
      return;
    }
    if ((payload.advance_paise || 0) > (payload.budget_paise || 0)) {
      toast.error('Advance cannot exceed total development');
      return;
    }
    setLocalBusy(true);
    try {
      // Always send confirmed terms — including when project already exists (fix incomplete convert)
      await onEnsureProject(payload);
    } finally {
      setLocalBusy(false);
    }
  };

  const balanceRupees = Math.max(
    0,
    (parseFloat(totalRupees || '0') || 0) - (parseFloat(advanceRupees || '0') || 0)
  );
  const advanceNow = parseFloat(advanceRupees || '0') || 0;
  const amcNow = parseFloat(amcRupees || '0') || 0;
  const place = [engagement.city, engagement.state, engagement.pincode].filter(Boolean).join(', ');

  return (
    <StageShell
      eyebrow="Stage 05"
      title="Convert to Project"
      description="Final commercial decision — separate from pipeline estimates. These confirmed amounts are stored on the Project and visible to the client."
      accent="blue"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#E6E8EE] bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-[#1D4ED8]" aria-hidden />
            <h3 className="text-sm font-bold text-[#0F172A]">Project</h3>
          </div>
          {isFounder ? (
            <FormField label="Project name" required>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </FormField>
          ) : (
            <p className="text-sm font-semibold text-[#0F172A]">{projectName}</p>
          )}
          <p className="text-xs text-[#64748B]">
            {engagement.engagement_kind === 'amc_only' ? 'AMC only' : 'Full project'}
            {engagement.notes ? ` · ${engagement.notes}` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-[#E6E8EE] bg-white p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1D4ED8]" aria-hidden />
              <h3 className="text-sm font-bold text-[#0F172A]">Client</h3>
            </div>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {engagement.client_id ? 'Linked' : 'Will be created on convert'}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">{engagement.company_name}</p>
          <p className="text-xs text-[#64748B] flex flex-wrap gap-x-3 gap-y-1">
            {engagement.contact_name && (
              <span className="inline-flex items-center gap-1">
                <UserRound className="w-3.5 h-3.5" />
                {engagement.contact_name}
                {engagement.designation ? ` · ${engagement.designation}` : ''}
              </span>
            )}
            {(engagement.email || engagement.contact_email) && (
              <span>{engagement.email || engagement.contact_email}</span>
            )}
            {(engagement.phone || engagement.contact_phone) && (
              <span>{engagement.phone || engagement.contact_phone}</span>
            )}
          </p>
          {(place || engagement.gstin) && (
            <p className="text-xs text-[#64748B]">
              {[place, engagement.gstin ? `GSTIN ${engagement.gstin}` : ''].filter(Boolean).join(' · ')}
            </p>
          )}
          {engagement.client_id && (
            <Link href={`/clients/${engagement.client_id}`} className="text-xs font-semibold text-[#1D4ED8]">
              Open client
            </Link>
          )}
        </div>
      </div>

      {isFounder && (
        <StageSection
          icon={<IndianRupee className="w-4 h-4" />}
          title="Final commercial terms"
          subtitle="These amounts are written onto the project and used for the advance invoice"
        >
          {(pipelineHintTotal > 0 || pipelineHintAdvance > 0 || pipelineHintAmc > 0) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span>
                From earlier stages: total ₹{pipelineHintTotal.toLocaleString('en-IN')}
                {pipelineHintAdvance > 0 ? ` · advance ₹${pipelineHintAdvance.toLocaleString('en-IN')}` : ''}
                {pipelineHintAmc > 0 ? ` · AMC ₹${pipelineHintAmc.toLocaleString('en-IN')}/mo` : ''}
              </span>
              <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={applyPipelinePrefill}>
                Use these figures
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <FormField label="Development days" required>
              <Input type="number" min={1} value={devDays} onChange={(e) => setDevDays(e.target.value)} />
            </FormField>
            <FormField label="Total development (₹)" required>
              <Input type="number" min={0} step="100" value={totalRupees} onChange={(e) => setTotalRupees(e.target.value)} />
            </FormField>
            <FormField label="Advance (₹)">
              <Input type="number" min={0} step="100" value={advanceRupees} onChange={(e) => setAdvanceRupees(e.target.value)} />
            </FormField>
            <FormField label="Monthly maintenance (₹)">
              <Input type="number" min={0} step="100" value={amcRupees} onChange={(e) => setAmcRupees(e.target.value)} placeholder="0 if none" />
            </FormField>
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              ['Balance', `₹${balanceRupees.toLocaleString('en-IN')}`],
              ['Advance invoice', advanceNow > 0 ? `₹${advanceNow.toLocaleString('en-IN')} · due in 5 days` : 'None'],
              ['Maintenance', amcNow > 0 ? `₹${amcNow.toLocaleString('en-IN')}/mo` : 'None'],
              ['Goes to', 'Project · Invoices'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#F6F7F9] border border-[#E6E8EE] px-3 py-2">
                <p className="text-[11px] text-[#64748B]">{label}</p>
                <p className="text-sm font-semibold text-[#0F172A] tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </StageSection>
      )}

      <div className="rounded-2xl border border-[#1D4ED8]/20 bg-gradient-to-br from-[#E8F0FE] via-white to-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1D4ED8] text-white flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-heading font-bold text-[#0F172A]">
                {hasProject ? 'Project linked' : 'Create delivery project'}
              </p>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-md">
                {hasProject
                  ? 'Updates the project. It stays not started until you set the start date on the project.'
                  : 'Creates the client if needed, the project, and the advance invoice. The project does not start until you set its start date.'}
              </p>
              {hasProject && engagement.project_name && (
                <p className="text-sm font-semibold text-[#1D4ED8] mt-2">{engagement.project_name}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isFounder && onEnsureProject && (
              <Button
                size="sm"
                variant={hasProject ? 'secondary' : 'primary'}
                isLoading={working}
                onClick={handleEnsure}
              >
                <Rocket className="w-3.5 h-3.5 mr-1" aria-hidden />
                {hasProject ? 'Apply confirmed terms' : 'Convert to project'}
              </Button>
            )}
            {hasProject && (
              <Link href={`/projects/${engagement.project_id}`}>
                <Button size="sm" variant="secondary">
                  <FolderKanban className="w-3.5 h-3.5 mr-1" aria-hidden /> Open project
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StageSection
          icon={<ListChecks className="w-4 h-4" />}
          title="Onboarding checklist"
          subtitle="Create project → assign team → sign-off → milestones"
        >
          <StageChecklist
            items={engagement.checklist_items || []}
            stage={5}
            disabled={!isFounder || working}
            onToggle={onToggleChecklist}
          />
        </StageSection>

        <StageSection
          icon={<IndianRupee className="w-4 h-4" />}
          title="What lands on the project"
          subtitle="Open the project for invoices, team, and go-live"
        >
          <div className="rounded-2xl border border-[#E6E8EE] bg-[#FBFBFC] p-4 space-y-2 text-sm text-[#475569]">
            <p>Project name, client, total, advance, balance, days, and monthly maintenance.</p>
            <p>
              {advanceNow > 0
                ? `Advance invoice of ₹${advanceNow.toLocaleString('en-IN')} is created under Project → Invoices.`
                : 'No advance invoice until the advance is greater than zero.'}
            </p>
            {hasProject ? (
              <Link href={`/projects/${engagement.project_id}`}>
                <Button size="sm" variant="secondary">
                  Open Project
                </Button>
              </Link>
            ) : (
              <p className="text-[11px] font-medium text-[#B91C1C]">
                Enter confirmed terms, then Convert to project.
              </p>
            )}
          </div>
        </StageSection>
      </div>

      {isFounder && onAdvance && (
        <StageAdvanceBar
          title="Hand off to delivery"
          hint={
            !hasProject
              ? 'Convert to project first — then complete onboarding.'
              : allDone
              ? 'Completes onboarding and enters Project delivery (06 Design & Dev).'
              : 'Project exists — finish checklist, then complete onboarding.'
          }
          ctaLabel="Complete onboarding"
          disabled={!hasProject}
          busy={working}
          onAdvance={onAdvance}
        />
      )}
    </StageShell>
  );
}
