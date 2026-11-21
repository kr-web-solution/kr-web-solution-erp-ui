'use client';

import React, { useState } from 'react';
import { EngagementDetail } from '@/lib/types';
import { formatPaise } from '@/lib/workflow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';

interface Props {
  engagement: EngagementDetail;
  mode: 'founder' | 'worker' | 'client';
  onEnable?: (payload: {
    amount_paise: number;
    send_day: number;
    due_after_days: number;
    reminder_every_days: number;
  }) => Promise<void>;
  onPause?: (complete?: boolean) => Promise<void>;
  onResume?: () => Promise<void>;
}

export function MaintenancePanel({ engagement, mode, onEnable, onPause, onResume }: Props) {
  const [amount, setAmount] = useState('25000');
  const [sendDay, setSendDay] = useState('1');
  const [busy, setBusy] = useState(false);

  const active = engagement.amc_active || engagement.status === 'maintenance';

  if (mode === 'worker') {
    return (
      <div className="rounded-xl border border-[#E6E8EE] p-4 text-sm text-[#64748B]">
        AMC status:{' '}
        <strong className="text-[#0F172A]">{active ? 'Active' : 'Not active'}</strong>
        {engagement.warranty_ends_on && (
          <p className="mt-2 text-xs">Warranty ends: {engagement.warranty_ends_on}</p>
        )}
      </div>
    );
  }

  if (mode === 'client') {
    return (
      <div className="rounded-xl border border-[#E6E8EE] bg-[#F8F9FB] p-4 space-y-2">
        <p className="text-sm font-semibold text-[#0F172A]">
          {active ? 'Maintenance plan active' : 'No active maintenance plan'}
        </p>
        {engagement.warranty_ends_on && (
          <p className="text-xs text-[#64748B]">Warranty until {engagement.warranty_ends_on}</p>
        )}
        {engagement.quoted_paise != null && engagement.engagement_kind === 'amc_only' && (
          <p className="text-xs text-[#64748B]">Plan value: {formatPaise(engagement.quoted_paise)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#FEF6D8] bg-[#FFFCED] p-3 text-xs text-[#5B4300]">
        <strong>Handover</strong> (phase 13) can include warranty. <strong>Maintenance</strong> (phase 14) is the ongoing support retainer.
      </div>

      {engagement.recurring ? (
        <div className="space-y-2 text-sm">
          <p>
            Monthly: <strong>{formatPaise(engagement.recurring.amount_paise)}</strong>
          </p>
          <p className="text-[#64748B]">
            Send day {engagement.recurring.send_day} · Next run {engagement.recurring.next_run_date} ·{' '}
            {engagement.recurring.active ? 'Active' : 'Paused'}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {engagement.recurring.active ? (
              <>
                <Button size="sm" variant="secondary" isLoading={busy} onClick={async () => { setBusy(true); try { await onPause?.(false); } finally { setBusy(false); } }}>
                  Pause AMC
                </Button>
                <Button size="sm" variant="secondary" isLoading={busy} onClick={async () => { setBusy(true); try { await onPause?.(true); } finally { setBusy(false); } }}>
                  Pause & complete
                </Button>
              </>
            ) : (
              <Button size="sm" variant="primary" isLoading={busy} onClick={async () => { setBusy(true); try { await onResume?.(); } finally { setBusy(false); } }}>
                Resume AMC
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <FormField label="Monthly amount (₹)">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormField>
          <FormField label="Send day (1–28)">
            <Input value={sendDay} onChange={(e) => setSendDay(e.target.value)} />
          </FormField>
          <Button
            size="sm"
            variant="primary"
            isLoading={busy}
            onClick={async () => {
              if (!onEnable) return;
              setBusy(true);
              try {
                await onEnable({
                  amount_paise: Math.round(Number(amount) * 100),
                  send_day: Number(sendDay) || 1,
                  due_after_days: 15,
                  reminder_every_days: 3,
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            Enable AMC retainer
          </Button>
        </div>
      )}

      {engagement.warranty_ends_on && (
        <p className="text-xs text-[#64748B]">Warranty ends on {engagement.warranty_ends_on}</p>
      )}
    </div>
  );
}
