'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  LogIn,
  LogOut,
  Megaphone,
  Receipt,
  CalendarDays,
  FileText,
  Wallet,
  Plus,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { staffApi } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { formatINR, formatDate } from '@/lib/utils/format';
import { WORK_HOURS_PER_DAY, formatLeaveHoursDays } from '@/lib/payroll';
import type {
  AttendanceDay,
  ExpenseClaim,
  LeaveRequest,
  StaffDocument,
  StaffHome,
  StaffInbox,
  WorkTask,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { isPrivileged } from '@/lib/roles';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function WorkerHomePage() {
  const { user } = useAuth();
  const [home, setHome] = useState<StaffHome | null>(null);
  const [inbox, setInbox] = useState<StaffInbox | null>(null);
  const [docs, setDocs] = useState<StaffDocument[]>([]);
  const [myLeave, setMyLeave] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'casual',
    start_date: todayISO(),
    end_date: todayISO(),
    half_day: false,
    reason: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    expense_date: todayISO(),
    category: 'travel',
    amount_rupees: '',
    note: '',
    receipt: null as File | null,
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [profileForm, setProfileForm] = useState({
    phone: '',
    address: '',
    bank_account: '',
    bank_ifsc: '',
  });
  const [correctionForm, setCorrectionForm] = useState({
    work_date: todayISO(),
    reason: 'missed',
    note: '',
  });

  const load = useCallback(async () => {
    try {
      const [h, documents, leave] = await Promise.all([
        staffApi.home(),
        staffApi.listDocuments(),
        staffApi.listLeave('mine'),
      ]);
      setHome(h);
      setDocs(documents);
      setMyLeave(leave);
      setProfileForm({
        phone: h.profile.phone || '',
        address: h.profile.address || '',
        bank_account: h.profile.bank_account || '',
        bank_ifsc: h.profile.bank_ifsc || '',
      });
      try {
        const box = await staffApi.inbox();
        setInbox(box);
      } catch {
        setInbox(null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load My work');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attendance: AttendanceDay | null | undefined = home?.today_attendance;
  const balance = home?.leave_balance;

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await staffApi.checkIn();
      toast.success('Checked in');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Check-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try {
      await staffApi.checkOut();
      toast.success('Checked out');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Check-out failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task: WorkTask) => {
    const next = task.status === 'done' ? 'todo' : 'done';
    try {
      await staffApi.updateTask(task.id, { status: next });
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not update task');
    }
  };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      await staffApi.createTask({ work_date: todayISO(), title: taskTitle.trim() });
      toast.success('Task added');
      setTaskTitle('');
      setTaskOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not create task');
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.applyLeave({
        ...leaveForm,
        reason: leaveForm.reason || undefined,
      });
      toast.success('Leave request submitted');
      setLeaveOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Leave request failed');
    }
  };

  const submitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const rupees = Number(expenseForm.amount_rupees);
    if (!rupees || rupees <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await staffApi.submitExpense({
        expense_date: expenseForm.expense_date,
        category: expenseForm.category,
        amount_paise: Math.round(rupees * 100),
        note: expenseForm.note || undefined,
        receipt: expenseForm.receipt,
      });
      toast.success('Expense submitted');
      setExpenseOpen(false);
      setExpenseForm({
        expense_date: todayISO(),
        category: 'travel',
        amount_rupees: '',
        note: '',
        receipt: null,
      });
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Expense failed');
    }
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.updateMe({
        phone: profileForm.phone,
        address: profileForm.address,
        bank_account: profileForm.bank_account,
        bank_ifsc: profileForm.bank_ifsc,
      });
      toast.success('Profile updated');
      setProfileOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Profile update failed');
    }
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffApi.requestCorrection(correctionForm);
      toast.success('Correction sent for approval');
      setCorrectionOpen(false);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Correction failed');
    }
  };

  if (loading || !home) {
    return <LoadingAnimation fullPage label="Loading your workday…" />;
  }

  const showTeamLink = !!inbox || isPrivileged(user?.role);

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">My work</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {home.profile.job_title || 'Team member'}
            {home.profile.department ? ` · ${home.profile.department}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showTeamLink && (
            <Link href={routes.staff}>
              <Button variant="secondary" size="sm">
                Team inbox
              </Button>
            </Link>
          )}
          <Button variant="secondary" size="sm" onClick={() => setProfileOpen(true)}>
            <UserRound className="w-4 h-4" /> Profile
          </Button>
        </div>
      </div>

      {home.latest_announcement && (
        <SectionCard
          title="Notice"
          icon={<Megaphone className="w-4 h-4 text-[#E32B2B]" />}
        >
          <p className="text-sm font-medium text-[#0F172A]">{home.latest_announcement.title}</p>
          <p className="text-sm text-[#475569] mt-1 whitespace-pre-wrap">{home.latest_announcement.body}</p>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <SectionCard title="Today" className="xl:col-span-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {!attendance?.check_in_at ? (
              <Button size="sm" onClick={handleCheckIn} disabled={busy}>
                <LogIn className="w-4 h-4" /> Check in
              </Button>
            ) : !attendance.check_out_at ? (
              <Button size="sm" onClick={handleCheckOut} disabled={busy}>
                <LogOut className="w-4 h-4" /> Check out
              </Button>
            ) : (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                Day complete
              </span>
            )}
            {attendance?.check_in_at && (
              <span className="text-xs text-[#64748B] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                In {new Date(attendance.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {attendance.check_out_at
                  ? ` · Out ${new Date(attendance.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => setCorrectionOpen(true)}>
              Request correction
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setTaskOpen(true)}>
              <Plus className="w-4 h-4" /> Task
            </Button>
          </div>

          {home.today_tasks.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No tasks for today yet.</p>
          ) : (
            <ul className="space-y-2">
              {home.today_tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    className="mt-0.5 text-[#64748B] hover:text-emerald-600"
                    aria-label="Toggle done"
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${task.status === 'done' ? 'text-emerald-600' : ''}`}
                    />
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${
                        task.status === 'done' ? 'line-through text-[#94A3B8]' : 'text-[#0F172A]'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.project_name && (
                      <p className="text-xs text-[#64748B]">{task.project_name}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Leave balance" className="xl:col-span-4" icon={<CalendarDays className="w-4 h-4" />}>
          {balance && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Casual</span>
                <span className="font-medium text-right">
                  {formatLeaveHoursDays(
                    balance.casual_remaining_hours ??
                      balance.casual_remaining * WORK_HOURS_PER_DAY,
                    balance.casual_remaining
                  )}{' '}
                  /{' '}
                  {formatLeaveHoursDays(
                    balance.casual_allowance_hours ??
                      balance.casual_allowance * WORK_HOURS_PER_DAY,
                    balance.casual_allowance
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Sick</span>
                <span className="font-medium text-right">
                  {formatLeaveHoursDays(
                    balance.sick_remaining_hours ?? balance.sick_remaining * WORK_HOURS_PER_DAY,
                    balance.sick_remaining
                  )}{' '}
                  /{' '}
                  {formatLeaveHoursDays(
                    balance.sick_allowance_hours ?? balance.sick_allowance * WORK_HOURS_PER_DAY,
                    balance.sick_allowance
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Unpaid used</span>
                <span className="font-medium">
                  {formatLeaveHoursDays(
                    balance.unpaid_used_hours ?? balance.unpaid_used * WORK_HOURS_PER_DAY,
                    balance.unpaid_used
                  )}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">1 day = {WORK_HOURS_PER_DAY}h · half day = 4h</p>
              <Button size="sm" className="w-full mt-2" onClick={() => setLeaveOpen(true)}>
                Apply leave
              </Button>
            </div>
          )}
          {myLeave.filter((l) => l.status === 'pending').length > 0 && (
            <p className="text-xs text-amber-700 mt-3">
              {myLeave.filter((l) => l.status === 'pending').length} pending request(s)
            </p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SectionCard title="My projects" icon={<FolderKanban className="w-4 h-4" />}>
          {home.projects.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No projects assigned.</p>
          ) : (
            <ul className="space-y-2">
              {home.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={routes.project(p.id)}
                    className="text-sm text-[#0F172A] hover:text-[#E32B2B] flex justify-between gap-2"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-[#94A3B8] capitalize">{p.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Expenses" icon={<Wallet className="w-4 h-4" />}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-[#64748B]">Open claims</p>
            <Button size="sm" variant="secondary" onClick={() => setExpenseOpen(true)}>
              <Plus className="w-4 h-4" /> Claim
            </Button>
          </div>
          {home.open_expenses.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No open expenses.</p>
          ) : (
            <ul className="space-y-2">
              {home.open_expenses.map((e: ExpenseClaim) => (
                <li key={e.id} className="flex justify-between text-sm gap-2">
                  <span className="capitalize text-[#0F172A]">
                    {e.category} · {formatDate(e.expense_date)}
                  </span>
                  <span className="text-[#64748B]">
                    {formatINR(e.amount_paise)} · {e.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Documents" icon={<FileText className="w-4 h-4" />}>
          {docs.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">No documents yet.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="text-sm text-[#0F172A] hover:text-[#E32B2B]"
                    onClick={() => staffApi.openDocument(d.id).catch(() => toast.error('Download failed'))}
                  >
                    {d.title} <span className="text-xs text-[#94A3B8]">({d.kind})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Payslips" icon={<Receipt className="w-4 h-4" />}>
          {home.latest_payslip ? (
            <div className="text-sm space-y-2">
              <p className="font-medium text-[#0F172A]">{home.latest_payslip.month_key}</p>
              <p className="text-[#64748B]">
                Net {formatINR(home.latest_payslip.net_paise)}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  staffApi.openPayslipPdf(home.latest_payslip!.id).catch(() => toast.error('PDF failed'))
                }
              >
                Open PDF
              </Button>
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">No payslips published yet.</p>
          )}
        </SectionCard>
      </div>

      {/* Modals */}
      <Modal isOpen={taskOpen} onClose={() => setTaskOpen(false)} title="Add today task">
        <form onSubmit={submitTask} className="space-y-4">
          <FormField label="Title">
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setTaskOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={leaveOpen} onClose={() => setLeaveOpen(false)} title="Apply leave">
        <form onSubmit={submitLeave} className="space-y-4">
          <FormField label="Type">
            <Select
              value={leaveForm.leave_type}
              onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
              options={[
                { value: 'casual', label: 'Casual' },
                { value: 'sick', label: 'Sick' },
                { value: 'unpaid', label: 'Unpaid' },
              ]}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="From">
              <Input
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                required
              />
            </FormField>
            <FormField label="To">
              <Input
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                required
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#475569]">
            <input
              type="checkbox"
              checked={leaveForm.half_day}
              onChange={(e) => setLeaveForm({ ...leaveForm, half_day: e.target.checked })}
            />
            Half day
          </label>
          <FormField label="Reason">
            <Textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setLeaveOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={expenseOpen} onClose={() => setExpenseOpen(false)} title="Expense claim">
        <form onSubmit={submitExpense} className="space-y-4">
          <FormField label="Date">
            <Input
              type="date"
              value={expenseForm.expense_date}
              onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Category">
            <Select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              options={[
                { value: 'travel', label: 'Travel' },
                { value: 'food', label: 'Food' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </FormField>
          <FormField label="Amount (₹)">
            <Input
              type="number"
              min="1"
              step="0.01"
              value={expenseForm.amount_rupees}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount_rupees: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Note">
            <Textarea
              value={expenseForm.note}
              onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
              rows={2}
            />
          </FormField>
          <FormField label="Receipt">
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, receipt: e.target.files?.[0] || null })
              }
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setExpenseOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="My profile">
        <form onSubmit={submitProfile} className="space-y-4">
          <FormField label="Phone">
            <Input
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </FormField>
          <FormField label="Address">
            <Textarea
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              rows={3}
            />
          </FormField>
          <FormField label="Bank account">
            <Input
              value={profileForm.bank_account}
              onChange={(e) => setProfileForm({ ...profileForm, bank_account: e.target.value })}
            />
          </FormField>
          <FormField label="IFSC">
            <Input
              value={profileForm.bank_ifsc}
              onChange={(e) => setProfileForm({ ...profileForm, bank_ifsc: e.target.value })}
            />
          </FormField>
          {(home.profile.pending_bank_account || home.profile.pending_bank_ifsc) && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
              Bank change pending founder/admin approval.
            </p>
          )}
          <p className="text-xs text-[#94A3B8]">
            Phone and address update immediately. Bank changes need approval.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setProfileOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        title="Attendance correction"
      >
        <form onSubmit={submitCorrection} className="space-y-4">
          <FormField label="Date">
            <Input
              type="date"
              value={correctionForm.work_date}
              onChange={(e) => setCorrectionForm({ ...correctionForm, work_date: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Reason">
            <Select
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              options={[
                { value: 'missed', label: 'Missed check-in' },
                { value: 'wfh', label: 'Work from home' },
                { value: 'on_duty', label: 'On duty' },
              ]}
            />
          </FormField>
          <FormField label="Note">
            <Textarea
              value={correctionForm.note}
              onChange={(e) => setCorrectionForm({ ...correctionForm, note: e.target.value })}
              rows={2}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Send</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
