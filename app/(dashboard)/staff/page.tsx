'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Megaphone,
  CalendarDays,
  Check,
  X,
  Plus,
  Receipt,
  UsersRound,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { staffApi } from '@/lib/api/client';
import { isPrivileged } from '@/lib/roles';
import { routes } from '@/lib/routes';
import { formatINR, formatDate } from '@/lib/utils/format';
import {
  HOURS_PER_MONTH,
  WORK_HOURS_PER_DAY,
  formatLeaveHoursDays,
  hourlyRupeesFromMonthly,
} from '@/lib/payroll';
import type {
  Announcement,
  CompanyHoliday,
  LeaveRequest,
  PayslipPreview,
  StaffDocument,
  StaffInbox,
  StaffProfile,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const DEPARTMENTS = [
  'Developer',
  'HR',
  'Support',
  'Design',
  'Management',
  'Other',
];

function monthKeyNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function StaffAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const privileged = isPrivileged(user?.role);

  const [directory, setDirectory] = useState<StaffProfile[]>([]);
  const [inbox, setInbox] = useState<StaffInbox | null>(null);
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaffProfile | null>(null);
  const [docs, setDocs] = useState<StaffDocument[]>([]);
  const [teamLeave, setTeamLeave] = useState<LeaveRequest[]>([]);

  const [profileForm, setProfileForm] = useState({
    department: '',
    job_title: '',
    reports_to_user_id: '',
    joined_on: '',
    phone: '',
    address: '',
    bank_account: '',
    bank_ifsc: '',
    monthly_gross_rupees: '',
    hourly_rate_rupees: '',
    casual_leave_days: '12',
    sick_leave_days: '6',
  });

  const [holidayOpen, setHolidayOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ holiday_date: '', name: '' });
  const [annOpen, setAnnOpen] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', body: '' });
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    user_id: '',
    month_key: monthKeyNow(),
    deductions_rupees: '0',
    note: '',
  });
  const [payPreview, setPayPreview] = useState<PayslipPreview | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docKind, setDocKind] = useState('offer');

  const load = useCallback(async () => {
    try {
      const [people, hol, anns] = await Promise.all([
        staffApi.list(),
        staffApi.listHolidays(),
        staffApi.listAnnouncements(10),
      ]);
      setDirectory(people);
      setHolidays(hol);
      setAnnouncements(anns);

      const start = new Date();
      start.setDate(1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      try {
        const cal = await staffApi.leaveCalendar(
          start.toISOString().slice(0, 10),
          end.toISOString().slice(0, 10)
        );
        setTeamLeave(cal);
      } catch {
        setTeamLeave([]);
      }

      try {
        const box = await staffApi.inbox();
        setInbox(box);
      } catch {
        if (user?.role === 'worker' && !privileged) {
          router.replace(routes.staffMe);
          return;
        }
        setInbox(null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load staff');
      if (user?.role === 'worker') router.replace(routes.staffMe);
    } finally {
      setLoading(false);
    }
  }, [privileged, router, user?.role]);

  useEffect(() => {
    if (user?.role === 'client') {
      router.replace(routes.dashboard);
      return;
    }
    load();
  }, [load, router, user?.role]);

  const byDepartment = useMemo(() => {
    const map = new Map<string, StaffProfile[]>();
    for (const p of directory) {
      const key = p.department || 'Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [directory]);

  const openProfile = async (person: StaffProfile) => {
    setSelected(person);
    setProfileForm({
      department: person.department || '',
      job_title: person.job_title || '',
      reports_to_user_id: person.reports_to_user_id || '',
      joined_on: person.joined_on || '',
      phone: person.phone || '',
      address: person.address || '',
      bank_account: person.bank_account || '',
      bank_ifsc: person.bank_ifsc || '',
      monthly_gross_rupees:
        person.monthly_gross_paise != null
          ? String(person.monthly_gross_paise / 100)
          : '',
      hourly_rate_rupees:
        person.hourly_rate_paise != null
          ? String(person.hourly_rate_paise / 100)
          : '',
      casual_leave_days: String(person.casual_leave_days ?? 12),
      sick_leave_days: String(person.sick_leave_days ?? 6),
    });
    if (privileged) {
      try {
        setDocs(await staffApi.listDocuments(person.id));
      } catch {
        setDocs([]);
      }
    } else {
      setDocs([]);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !privileged) return;
    try {
      const gross = profileForm.monthly_gross_rupees
        ? Math.round(Number(profileForm.monthly_gross_rupees) * 100)
        : null;
      const updated = await staffApi.updateProfile(selected.id, {
        department: profileForm.department || null,
        job_title: profileForm.job_title || null,
        reports_to_user_id: profileForm.reports_to_user_id || null,
        joined_on: profileForm.joined_on || null,
        phone: profileForm.phone || null,
        address: profileForm.address || null,
        bank_account: profileForm.bank_account || null,
        bank_ifsc: profileForm.bank_ifsc || null,
        monthly_gross_paise: gross,
        casual_leave_days: Number(profileForm.casual_leave_days) || 0,
        sick_leave_days: Number(profileForm.sick_leave_days) || 0,
      } as any);
      toast.success('Profile saved');
      setSelected(updated);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Save failed');
    }
  };

  const uploadDoc = async () => {
    if (!selected || !docFile || !privileged) return;
    try {
      await staffApi.uploadDocument(
        selected.id,
        docFile,
        docTitle || docFile.name,
        docKind
      );
      toast.success('Document uploaded');
      setDocFile(null);
      setDocTitle('');
      setDocs(await staffApi.listDocuments(selected.id));
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    }
  };

  const decide = async (
    kind: 'leave' | 'correction' | 'expense' | 'bank',
    id: string,
    decision: 'approved' | 'rejected' | 'paid'
  ) => {
    try {
      if (kind === 'leave') await staffApi.decideLeave(id, decision as 'approved' | 'rejected');
      if (kind === 'correction')
        await staffApi.decideCorrection(id, decision as 'approved' | 'rejected');
      if (kind === 'expense') await staffApi.decideExpense(id, decision);
      if (kind === 'bank') {
        if (decision === 'approved') await staffApi.approveBank(id);
        else await staffApi.rejectBank(id);
      }
      toast.success('Updated');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    }
  };

  const createHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.createHoliday(holidayForm);
      toast.success('Holiday added');
      setHolidayOpen(false);
      setHolidayForm({ holiday_date: '', name: '' });
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed');
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.createAnnouncement(annForm);
      toast.success('Announcement posted');
      setAnnOpen(false);
      setAnnForm({ title: '', body: '' });
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed');
    }
  };

  useEffect(() => {
    if (!payOpen || !payForm.user_id || !/^\d{4}-\d{2}$/.test(payForm.month_key)) {
      setPayPreview(null);
      return;
    }
    let cancelled = false;
    staffApi
      .previewPayslip(payForm.user_id, payForm.month_key)
      .then((p) => {
        if (!cancelled) setPayPreview(p);
      })
      .catch(() => {
        if (!cancelled) setPayPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payOpen, payForm.user_id, payForm.month_key]);

  const publishPayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.publishPayslip({
        user_id: payForm.user_id,
        month_key: payForm.month_key,
        deductions_paise: Math.round(Number(payForm.deductions_rupees || 0) * 100),
        note: payForm.note || undefined,
      });
      toast.success('Payslip published');
      setPayOpen(false);
      setPayPreview(null);
    } catch (err: any) {
      toast.error(err?.message || 'Publish failed');
    }
  };

  const derivedHourlyRupees = hourlyRupeesFromMonthly(profileForm.monthly_gross_rupees);
  const payExtraPaise = Math.round(Number(payForm.deductions_rupees || 0) * 100);
  const payUnpaidPaise = payPreview?.unpaid_deduction_paise || 0;
  const payTotalDeductionPaise = payUnpaidPaise + payExtraPaise;
  const payGrossPaise = payPreview?.monthly_gross_paise || 0;
  const payNetPaise = Math.max(0, payGrossPaise - payTotalDeductionPaise);

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#64748B]">Loading staff…</div>;
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A] flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-[#E32B2B]" /> Staff
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Directory, approvals, holidays, notices, and payslips
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === 'worker' && (
            <Button variant="secondary" size="sm" onClick={() => router.push(routes.staffMe)}>
              My work
            </Button>
          )}
          {privileged && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setHolidayOpen(true)}>
                <CalendarDays className="w-4 h-4" /> Holiday
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAnnOpen(true)}>
                <Megaphone className="w-4 h-4" /> Notice
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPayForm({
                    user_id: directory[0]?.id || '',
                    month_key: monthKeyNow(),
                    deductions_rupees: '0',
                    note: '',
                  });
                  setPayOpen(true);
                }}
              >
                <Receipt className="w-4 h-4" /> Publish payslip
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Inbox */}
      {inbox && (
        <SectionCard title="Approvals inbox">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <InboxBlock
              title="Leave"
              empty="No pending leave"
              items={inbox.pending_leave.map((l) => ({
                id: l.id,
                label: `${l.user_name} · ${l.leave_type}${l.half_day ? ' (half)' : ''}`,
                meta: `${formatDate(l.start_date)} → ${formatDate(l.end_date)}`,
              }))}
              onApprove={(id) => decide('leave', id, 'approved')}
              onReject={(id) => decide('leave', id, 'rejected')}
            />
            <InboxBlock
              title="Attendance corrections"
              empty="No pending corrections"
              items={inbox.pending_corrections.map((c) => ({
                id: c.id,
                label: `${c.user_name} · ${c.correction_reason}`,
                meta: formatDate(c.work_date),
              }))}
              onApprove={(id) => decide('correction', id, 'approved')}
              onReject={(id) => decide('correction', id, 'rejected')}
            />
            <InboxBlock
              title="Expenses"
              empty="No pending expenses"
              items={inbox.pending_expenses.map((e) => ({
                id: e.id,
                label: `${e.user_name} · ${e.category}`,
                meta: `${formatINR(e.amount_paise)} · ${formatDate(e.expense_date)}`,
              }))}
              onApprove={(id) => decide('expense', id, 'approved')}
              onReject={(id) => decide('expense', id, 'rejected')}
              extraAction={
                privileged
                  ? { label: 'Mark paid', onClick: (id: string) => decide('expense', id, 'paid') }
                  : undefined
              }
            />
            {privileged && (
              <InboxBlock
                title="Bank changes"
                empty="No pending bank changes"
                items={inbox.pending_bank_changes.map((p) => ({
                  id: p.id,
                  label: p.full_name,
                  meta: `A/c ${p.pending_bank_account || '—'} · ${p.pending_bank_ifsc || '—'}`,
                }))}
                onApprove={(id) => decide('bank', id, 'approved')}
                onReject={(id) => decide('bank', id, 'rejected')}
              />
            )}
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <SectionCard title="Directory" className="xl:col-span-8">
          {byDepartment.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No staff yet. Create logins in Settings → People.</p>
          ) : (
            <div className="space-y-5">
              {byDepartment.map(([dept, people]) => (
                <div key={dept}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mb-2">
                    {dept}
                  </h3>
                  <ul className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-lg overflow-hidden">
                    {people.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => openProfile(p)}
                          className="w-full text-left px-3 py-2.5 hover:bg-[#F8FAFC] flex justify-between gap-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">{p.full_name}</p>
                            <p className="text-xs text-[#64748B]">
                              {p.job_title || p.role}
                              {p.reports_to_name ? ` · reports to ${p.reports_to_name}` : ''}
                            </p>
                          </div>
                          {p.leave_balance && (
                            <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                              CL{' '}
                              {formatLeaveHoursDays(
                                p.leave_balance.casual_remaining_hours ??
                                  p.leave_balance.casual_remaining * WORK_HOURS_PER_DAY,
                                p.leave_balance.casual_remaining
                              )}{' '}
                              · SL{' '}
                              {formatLeaveHoursDays(
                                p.leave_balance.sick_remaining_hours ??
                                  p.leave_balance.sick_remaining * WORK_HOURS_PER_DAY,
                                p.leave_balance.sick_remaining
                              )}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-4 xl:col-span-4">
          <SectionCard title="Team leave (this month)">
            {teamLeave.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No approved leave this month.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {teamLeave.map((l) => (
                  <li key={l.id} className="flex justify-between gap-2">
                    <span>{l.user_name}</span>
                    <span className="text-[#64748B] text-xs">
                      {formatDate(l.start_date)}
                      {l.half_day ? ' (½)' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Holidays">
            {holidays.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No holidays listed.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {holidays.map((h) => (
                  <li key={h.id} className="flex justify-between gap-2 items-center">
                    <span>
                      {formatDate(h.holiday_date)} · {h.name}
                    </span>
                    {privileged && (
                      <button
                        type="button"
                        className="text-xs text-rose-600"
                        onClick={async () => {
                          try {
                            await staffApi.deleteHoliday(h.id);
                            await load();
                          } catch (err: any) {
                            toast.error(err?.message || 'Delete failed');
                          }
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Notices">
            {announcements.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No announcements.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id}>
                    <p className="text-sm font-medium text-[#0F172A]">{a.title}</p>
                    <p className="text-xs text-[#64748B] line-clamp-2">{a.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name || 'Profile'}
        subtitle={selected?.email}
        width="max-w-[520px]"
        footer={
          privileged ? (
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  void saveProfile({ preventDefault() {} } as React.FormEvent);
                }}
              >
                Save profile
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <form onSubmit={saveProfile} className="space-y-4">
            <FormField label="Department">
              <Select
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                disabled={!privileged}
                options={[
                  { value: '', label: '—' },
                  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
                ]}
              />
            </FormField>
            <FormField label="Job title">
              <Input
                value={profileForm.job_title}
                onChange={(e) => setProfileForm({ ...profileForm, job_title: e.target.value })}
                disabled={!privileged}
              />
            </FormField>
            <FormField label="Manager">
              <Select
                value={profileForm.reports_to_user_id}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, reports_to_user_id: e.target.value })
                }
                disabled={!privileged}
                options={[
                  { value: '', label: '—' },
                  ...directory
                    .filter((p) => p.id !== selected.id)
                    .map((p) => ({ value: p.id, label: p.full_name })),
                ]}
              />
            </FormField>
            <FormField label="Joined on">
              <Input
                type="date"
                value={profileForm.joined_on}
                onChange={(e) => setProfileForm({ ...profileForm, joined_on: e.target.value })}
                disabled={!privileged}
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                disabled={!privileged}
              />
            </FormField>
            <FormField label="Address">
              <Textarea
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                disabled={!privileged}
                rows={2}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Bank account">
                <Input
                  value={profileForm.bank_account}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bank_account: e.target.value })
                  }
                  disabled={!privileged}
                />
              </FormField>
              <FormField label="IFSC">
                <Input
                  value={profileForm.bank_ifsc}
                  onChange={(e) => setProfileForm({ ...profileForm, bank_ifsc: e.target.value })}
                  disabled={!privileged}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Monthly salary (₹)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profileForm.monthly_gross_rupees}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, monthly_gross_rupees: e.target.value })
                  }
                  disabled={!privileged}
                />
              </FormField>
              <FormField label={`Per hour (₹) · ${HOURS_PER_MONTH}h/mo`}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={derivedHourlyRupees || ''}
                  readOnly
                  disabled
                  title={`Auto: monthly ÷ ${HOURS_PER_MONTH} (8h × 26 days)`}
                />
              </FormField>
            </div>
            <p className="text-xs text-[#94A3B8] -mt-1">
              Hourly = monthly ÷ {HOURS_PER_MONTH}. Leave: 1 day = {WORK_HOURS_PER_DAY}h, half day ={' '}
              {WORK_HOURS_PER_DAY / 2}h.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Casual leave / year (days)">
                <Input
                  type="number"
                  min="0"
                  value={profileForm.casual_leave_days}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, casual_leave_days: e.target.value })
                  }
                  disabled={!privileged}
                />
              </FormField>
              <FormField label="Sick leave / year (days)">
                <Input
                  type="number"
                  min="0"
                  value={profileForm.sick_leave_days}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, sick_leave_days: e.target.value })
                  }
                  disabled={!privileged}
                />
              </FormField>
            </div>

            {privileged && (
              <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                <p className="text-sm font-medium text-[#0F172A]">Documents</p>
                <ul className="space-y-1">
                  {docs.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        className="text-sm text-[#E32B2B]"
                        onClick={() =>
                          staffApi.openDocument(d.id).catch(() => toast.error('Open failed'))
                        }
                      >
                        {d.title}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    placeholder="Title"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                  <Select
                    value={docKind}
                    onChange={(e) => setDocKind(e.target.value)}
                    options={[
                      { value: 'offer', label: 'Offer letter' },
                      { value: 'id', label: 'ID proof' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                  <Input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={uploadDoc}>
                    <Upload className="w-4 h-4" /> Upload
                  </Button>
                </div>
              </div>
            )}
          </form>
        )}
      </Drawer>

      <Modal isOpen={holidayOpen} onClose={() => setHolidayOpen(false)} title="Add holiday">
        <form onSubmit={createHoliday} className="space-y-4">
          <FormField label="Date">
            <Input
              type="date"
              value={holidayForm.holiday_date}
              onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Name">
            <Input
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setHolidayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={annOpen} onClose={() => setAnnOpen(false)} title="Post announcement">
        <form onSubmit={createAnnouncement} className="space-y-4">
          <FormField label="Title">
            <Input
              value={annForm.title}
              onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Body">
            <Textarea
              value={annForm.body}
              onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
              rows={4}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAnnOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Post</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={payOpen}
        onClose={() => {
          setPayOpen(false);
          setPayPreview(null);
        }}
        title="Publish payslip"
      >
        <form onSubmit={publishPayslip} className="space-y-4">
          <FormField label="Employee">
            <Select
              value={payForm.user_id}
              onChange={(e) => setPayForm({ ...payForm, user_id: e.target.value })}
              options={directory.map((p) => ({
                value: p.id,
                label: `${p.full_name}${
                  p.monthly_gross_paise != null ? ` (${formatINR(p.monthly_gross_paise)})` : ''
                }`,
              }))}
              required
            />
          </FormField>
          <FormField label="Month (YYYY-MM)">
            <Input
              value={payForm.month_key}
              onChange={(e) => setPayForm({ ...payForm, month_key: e.target.value })}
              pattern="\d{4}-\d{2}"
              required
            />
          </FormField>
          {payPreview && (
            <div className="rounded-[10px] border border-[#E6E8EE] bg-[#F8FAFC] px-3 py-2.5 text-sm space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Monthly salary</span>
                <span className="font-medium">{formatINR(payPreview.monthly_gross_paise)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Hourly rate</span>
                <span className="font-medium">{formatINR(payPreview.hourly_rate_paise)}/hr</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#64748B]">Unpaid leave</span>
                <span className="font-medium">
                  {Number.isInteger(payPreview.unpaid_hours)
                    ? payPreview.unpaid_hours
                    : payPreview.unpaid_hours.toFixed(1)}
                  h → {formatINR(payPreview.unpaid_deduction_paise)}
                </span>
              </div>
              <div className="flex justify-between gap-2 border-t border-[#E2E8F0] pt-1.5">
                <span className="text-[#64748B]">Est. net</span>
                <span className="font-semibold text-[#0F172A]">{formatINR(payNetPaise)}</span>
              </div>
            </div>
          )}
          <FormField label="Extra deductions (₹)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={payForm.deductions_rupees}
              onChange={(e) => setPayForm({ ...payForm, deductions_rupees: e.target.value })}
            />
          </FormField>
          <FormField label="Note">
            <Textarea
              value={payForm.note}
              onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
              rows={2}
            />
          </FormField>
          <p className="text-xs text-[#94A3B8]">
            Gross = monthly salary. Unpaid leave hours × hourly rate are deducted automatically.
            Extra deductions are added on top. No PF / ESI / tax.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPayOpen(false);
                setPayPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Publish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InboxBlock({
  title,
  empty,
  items,
  onApprove,
  onReject,
  extraAction,
}: {
  title: string;
  empty: string;
  items: { id: string; label: string; meta: string }[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  extraAction?: { label: string; onClick: (id: string) => void };
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8] mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <div>
                <p className="text-[#0F172A]">{item.label}</p>
                <p className="text-xs text-[#64748B]">{item.meta}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded-md bg-emerald-50 text-emerald-700"
                  onClick={() => onApprove(item.id)}
                  aria-label="Approve"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-md bg-rose-50 text-rose-700"
                  onClick={() => onReject(item.id)}
                  aria-label="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
                {extraAction && (
                  <Button size="sm" variant="secondary" onClick={() => extraAction.onClick(item.id)}>
                    {extraAction.label}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
