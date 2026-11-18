'use client';

import React, { useEffect, useState } from 'react';
import { EngagementDetail } from '@/lib/types';
import { formatPaise } from '@/lib/workflow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

type MoneyField = 'estimated' | 'quoted' | 'advance';

interface Props {
  engagement: EngagementDetail;
  editable?: boolean;
  clientSimple?: boolean;
  fields?: MoneyField[];
  onSave?: (data: {
    estimated_budget_paise?: number | null;
    quoted_paise?: number | null;
    advance_paise?: number | null;
  }) => Promise<void>;
}

function rupeesToPaise(v: string) {
  const n = Number(v.replace(/,/g, ''));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

function paiseToRupeesInput(paise?: number | null) {
  if (paise == null) return '';
  return String(paise / 100);
}

export function EngagementMoneyPanel({
  engagement,
  editable,
  clientSimple,
  fields = ['estimated', 'quoted', 'advance'],
  onSave,
}: Props) {
  const [estimated, setEstimated] = useState(paiseToRupeesInput(engagement.estimated_budget_paise));
  const [quoted, setQuoted] = useState(paiseToRupeesInput(engagement.quoted_paise));
  const [advance, setAdvance] = useState(paiseToRupeesInput(engagement.advance_paise));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEstimated(paiseToRupeesInput(engagement.estimated_budget_paise));
    setQuoted(paiseToRupeesInput(engagement.quoted_paise));
    setAdvance(paiseToRupeesInput(engagement.advance_paise));
  }, [engagement.estimated_budget_paise, engagement.quoted_paise, engagement.advance_paise]);

  if (clientSimple) {
    return (
      <div className="rounded-xl border border-[#E6E8EE] bg-[#F8F9FB] p-4">
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
          Agreed project value
        </p>
        <p className="text-xl font-bold text-[#0F172A] mt-1">
          {formatPaise(engagement.quoted_paise)}
        </p>
      </div>
    );
  }

  if (!editable) return null;

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      const data: Record<string, number | null> = {};
      if (fields.includes('estimated')) data.estimated_budget_paise = rupeesToPaise(estimated);
      if (fields.includes('quoted')) data.quoted_paise = rupeesToPaise(quoted);
      if (fields.includes('advance')) data.advance_paise = rupeesToPaise(advance);
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {fields.includes('estimated') && (
        <FormField label="Estimated budget (₹)">
          <Input value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="0" />
        </FormField>
      )}
      {fields.includes('quoted') && (
        <FormField label="Quoted amount (₹)">
          <Input value={quoted} onChange={(e) => setQuoted(e.target.value)} placeholder="0" />
        </FormField>
      )}
      {fields.includes('advance') && (
        <FormField label="Advance expected (₹)">
          <Input value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="0" />
        </FormField>
      )}
      <Button size="sm" variant="secondary" onClick={handleSave} isLoading={saving}>
        Save
      </Button>
    </div>
  );
}
