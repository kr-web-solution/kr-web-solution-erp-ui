'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { settingsApi, usersApi, clientsApi } from '@/lib/api/client';
import { CompanySettings, EmailTemplate, User, Client } from '@/lib/types';
import { roleLabel } from '@/lib/roles';
import {
  Building2,
  Mail,
  Users,
  FileCode,
  Save,
  CheckCircle2,
  AlertCircle,
  Send,
  Plus,
  Shield,
  Eye,
  EyeOff,
  Zap,
  Key,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Tabs } from '@/components/ui/Tabs';
import { toast } from 'sonner';

const SUB_NAV = [
  { id: 'profile', label: 'Company', icon: Building2 },
  { id: 'smtp', label: 'Email', icon: Mail },
  { id: 'users', label: 'People', icon: Users },
  { id: 'templates', label: 'Templates', icon: FileCode },
  { id: 'automation', label: 'Billing', icon: Zap },
];

export default function SettingsCompanyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // General Settings State
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: true,
    smtp_from_name: '',
    smtp_from_email: '',
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'worker',
    client_id: '',
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const fetchSettingsData = async () => {
    setIsLoading(true);
    try {
      const [st, uList, tList, cList] = await Promise.all([
        settingsApi.get(),
        usersApi.list(),
        settingsApi.listTemplates(),
        clientsApi.list(),
      ]);

      setSettings(st);
      setSmtpForm({
        smtp_host: st.smtp_host || '',
        smtp_port: st.smtp_port || 587,
        smtp_username: st.smtp_username || '',
        smtp_password: '',
        smtp_use_tls: st.smtp_use_tls ?? true,
        smtp_from_name: st.smtp_from_name || '',
        smtp_from_email: st.smtp_from_email || '',
      });
      setUsersList(uList);
      setTemplates(tList);
      if (tList.length > 0) {
        setSelectedTemplate(tList[0]);
        setTemplateSubject(tList[0].subject);
        setTemplateBody(tList[0].body);
      }
      setClientsList(cList);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load system settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleCompanySave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      const updated = await settingsApi.update(settings);
      setSettings(updated);
      setHasUnsavedChanges(false);
      toast.success('Company settings saved successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSmtpSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        smtp_host: smtpForm.smtp_host.trim(),
        smtp_port: Number(smtpForm.smtp_port),
        smtp_username: smtpForm.smtp_username.trim(),
        smtp_use_tls: smtpForm.smtp_use_tls,
        smtp_from_name: smtpForm.smtp_from_name.trim(),
        smtp_from_email: smtpForm.smtp_from_email.trim(),
      };
      if (smtpForm.smtp_password.trim()) {
        payload.smtp_password = smtpForm.smtp_password.trim();
      }

      const updated = await settingsApi.updateSmtp(payload);
      setSettings(updated);
      setSmtpForm((prev) => ({ ...prev, smtp_password: '' }));
      toast.success('SMTP configuration updated and verified');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update SMTP parameters.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      toast.error('Please enter a recipient email address for testing.');
      return;
    }

    setIsTestingEmail(true);
    try {
      const res = await settingsApi.testEmail(testEmailAddress.trim());
      toast.success(res.message || 'Test email dispatched successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'SMTP test failed. Please check host and credentials.');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError(null);
    setIsSubmittingUser(true);
    try {
      await usersApi.create({
        full_name: newUserForm.full_name.trim(),
        email: newUserForm.email.trim(),
        password: newUserForm.password,
        role: newUserForm.role,
        client_id: newUserForm.role === 'client' ? newUserForm.client_id || null : null,
      });

      toast.success(`User "${newUserForm.full_name}" registered`);
      setIsUserModalOpen(false);
      setNewUserForm({
        full_name: '',
        email: '',
        password: '',
        role: 'worker',
        client_id: '',
      });
      fetchSettingsData();
    } catch (err: any) {
      setUserModalError(err?.message || 'Failed to create user account.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleToggleUserActive = async (targetUser: User) => {
    try {
      await usersApi.update(targetUser.id, { is_active: !targetUser.is_active });
      toast.success(`User ${!targetUser.is_active ? 'activated' : 'deactivated'}`);
      fetchSettingsData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle user status');
    }
  };

  const handleSelectTemplate = (t: EmailTemplate) => {
    setSelectedTemplate(t);
    setTemplateSubject(t.subject);
    setTemplateBody(t.body);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setIsSavingTemplate(true);
    try {
      const managedBody = selectedTemplate.body?.startsWith('HTML_MANAGED:')
        ? selectedTemplate.body
        : `HTML_MANAGED:${selectedTemplate.id}`;
      const updated = await settingsApi.updateTemplate(selectedTemplate.id, {
        subject: templateSubject,
        body: managedBody,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTemplate(updated);
      setTemplateBody(updated.body);
      toast.success('Email subject saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save email template.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const userColumns: Column<User>[] = [
    {
      key: 'full_name',
      header: 'User',
      sortable: true,
      render: (row: User) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.full_name} size="md" />
          <div>
            <div className="font-bold text-[#0F172A]">{row.full_name}</div>
            <div className="text-xs text-[#64748B] mt-0.5">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Workspace Role',
      sortable: true,
      render: (row: User) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F6F7F9] text-[#0F172A] border border-[#E6E8EE] uppercase">
          {roleLabel(row.role)}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Active Access',
      render: (row: User) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.is_active}
            onChange={() => handleToggleUserActive(row)}
            disabled={row.id === user?.id}
          />
          <span className={`text-xs font-semibold ${row.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
            {row.is_active ? 'Active' : 'Disabled'}
          </span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (row: User) => (
        <span className="text-xs text-[#64748B]">
          {new Date(row.created_at).toLocaleDateString('en-IN')}
        </span>
      ),
    },
  ];

  if (isLoading || !settings) {
    return (
      <div className="w-full min-w-0 space-y-6 pb-12">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-28 bg-white border border-[#E6E8EE] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-5 pb-24">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
          Settings
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Company details, email, people, and how bills are sent.
        </p>
      </div>

      <Tabs
        tabs={SUB_NAV.map((item) => ({
          id: item.id,
          label: item.label,
          icon: <item.icon className="w-4 h-4" />,
        }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="space-y-6">
          {/* TAB 1: COMPANY & INVOICES */}
          {activeTab === 'profile' && (
            <SectionCard
              title="Company"
              subtitle="Shown on GST invoices and receipts"
              icon={<Building2 className="w-4 h-4" />}
            >
              <form onSubmit={handleCompanySave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <FormField label="Trading / Display Name" required>
                    <Input
                      value={settings.company_name}
                      onChange={(e) => {
                        setSettings({ ...settings, company_name: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </FormField>

                  <FormField label="GSTIN Number">
                    <Input
                      placeholder="33AAAAA0000A1Z5"
                      value={settings.company_gstin || ''}
                      onChange={(e) => {
                        setSettings({ ...settings, company_gstin: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Company invoice code"
                    hint="Used as KRWS-DEV-2026-001 (code + service + year + sequence)"
                  >
                    <Input
                      value={settings.invoice_prefix || 'KRWS'}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          invoice_prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </FormField>

                  <FormField
                    label="Default tax rate (%)"
                    hint="Used only when GST is enabled below"
                  >
                    <Input
                      type="number"
                      value={settings.default_tax_rate}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          default_tax_rate: parseFloat(e.target.value) || 0,
                        });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </FormField>
                </div>

                <div className="rounded-[12px] border border-[#E6E8EE] bg-[#F8FAFC] p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Tax &amp; payroll</p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Leave off until you register. Defaults are zero — no GST, PF, ESI, or PT.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">Enable GST</p>
                      <p className="text-xs text-[#64748B]">When off, invoices use 0% tax</p>
                    </div>
                    <Switch
                      checked={!!settings.gst_enabled}
                      onChange={(checked) => {
                        setSettings({ ...settings, gst_enabled: checked });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E6E8EE] bg-white px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">PF</p>
                        <Input
                          type="number"
                          className="mt-1"
                          placeholder="% employee"
                          value={settings.pf_employee_percent ?? 0}
                          disabled={!settings.pf_enabled}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              pf_employee_percent: parseFloat(e.target.value) || 0,
                            });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                      <Switch
                        checked={!!settings.pf_enabled}
                        onChange={(checked) => {
                          setSettings({ ...settings, pf_enabled: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E6E8EE] bg-white px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">ESI</p>
                        <Input
                          type="number"
                          className="mt-1"
                          placeholder="% employee"
                          value={settings.esi_employee_percent ?? 0}
                          disabled={!settings.esi_enabled}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              esi_employee_percent: parseFloat(e.target.value) || 0,
                            });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                      <Switch
                        checked={!!settings.esi_enabled}
                        onChange={(checked) => {
                          setSettings({ ...settings, esi_enabled: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E6E8EE] bg-white px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-[#0F172A]">PT (₹ / month)</p>
                        <Input
                          type="number"
                          className="mt-1"
                          placeholder="Rupees"
                          value={((settings.pt_paise ?? 0) / 100) || 0}
                          disabled={!settings.pt_enabled}
                          onChange={(e) => {
                            const rupees = parseFloat(e.target.value) || 0;
                            setSettings({
                              ...settings,
                              pt_paise: Math.round(rupees * 100),
                            });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                      <Switch
                        checked={!!settings.pt_enabled}
                        onChange={(checked) => {
                          setSettings({ ...settings, pt_enabled: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[10px] border border-[#E6E8EE]">
                  <div className="border-b border-[#E6E8EE] bg-[#F6F7F9] px-3.5 py-2.5">
                    <p className="text-xs font-bold text-[#0F172A]">Invoice prefix scheme (default)</p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">
                      Each service has its own yearly sequence. Format: CODE-SERVICE-YEAR-001
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E6E8EE] text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                          <th className="px-3.5 py-2">Service</th>
                          <th className="px-3.5 py-2">Prefix</th>
                          <th className="px-3.5 py-2">Example</th>
                          <th className="px-3.5 py-2 text-right">Next #</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E8EE]">
                        {(settings.invoice_prefix_scheme || [
                          { service: 'Development', code: 'DEV', prefix: 'KRWS-DEV', example: 'KRWS-DEV-2026-001' },
                          { service: 'Maintenance', code: 'MNT', prefix: 'KRWS-MNT', example: 'KRWS-MNT-2026-001' },
                          { service: 'Hosting', code: 'HST', prefix: 'KRWS-HST', example: 'KRWS-HST-2026-001' },
                          { service: 'Services', code: 'SVC', prefix: 'KRWS-SVC', example: 'KRWS-SVC-2026-001' },
                          { service: 'Licensing', code: 'LIC', prefix: 'KRWS-LIC', example: 'KRWS-LIC-2026-001' },
                        ]).map((row) => {
                          const year = new Date().getFullYear();
                          const seqKey = `${row.code}-${year}`;
                          const next = settings.invoice_sequences?.[seqKey] ?? 1;
                          const company = (settings.invoice_prefix || 'KRWS').toUpperCase();
                          return (
                            <tr key={row.code}>
                              <td className="px-3.5 py-2.5 font-semibold text-[#0F172A]">{row.service}</td>
                              <td className="px-3.5 py-2.5 font-mono text-[#64748B]">
                                {company}-{row.code}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-[#0F172A]">
                                {company}-{row.code}-{year}-{String(next).padStart(3, '0')}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono text-[#64748B]">{next}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <FormField label="Headquarters Billing Address">
                  <Textarea
                    rows={2}
                    value={settings.company_address || ''}
                    onChange={(e) => {
                      setSettings({ ...settings, company_address: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                  />
                </FormField>

                <div className="space-y-4 border-t border-[#E6E8EE] pt-4">
                  <h3 className="text-xs font-bold tracking-wider text-[#0F172A] uppercase">
                    Bank Account, UPI &amp; Wire Payment Instructions
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Enter each detail separately. These are combined automatically on invoices and payment emails.
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Beneficiary / Account Name">
                      <Input
                        placeholder="KR Web Solution"
                        value={settings.bank_beneficiary_name || ''}
                        onChange={(e) => {
                          setSettings({ ...settings, bank_beneficiary_name: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </FormField>
                    <FormField label="Bank Name">
                      <Input
                        placeholder="HDFC Bank"
                        value={settings.bank_name || ''}
                        onChange={(e) => {
                          setSettings({ ...settings, bank_name: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </FormField>
                    <FormField label="Account Number">
                      <Input
                        placeholder="50200012345678"
                        value={settings.bank_account_number || ''}
                        onChange={(e) => {
                          setSettings({ ...settings, bank_account_number: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </FormField>
                    <FormField label="IFSC Code">
                      <Input
                        placeholder="HDFC0001234"
                        value={settings.bank_ifsc || ''}
                        onChange={(e) => {
                          setSettings({ ...settings, bank_ifsc: e.target.value.toUpperCase() });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </FormField>
                    <FormField label="UPI ID" className="sm:col-span-2">
                      <Input
                        placeholder="krwebsolution@hdfcbank"
                        value={settings.bank_upi_id || ''}
                        onChange={(e) => {
                          setSettings({ ...settings, bank_upi_id: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </FormField>
                    <FormField
                      label="Default UPI QR image"
                      hint="Shown on client invoice pages (PNG/JPG)"
                      className="sm:col-span-2"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="text-xs"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const updated = await settingsApi.uploadUpiQr(file);
                              setSettings(updated);
                              toast.success('UPI QR uploaded');
                            } catch (err: any) {
                              toast.error(err?.message || 'Upload failed');
                            }
                          }}
                        />
                        {settings.bank_upi_qr_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              settings.bank_upi_qr_url.startsWith('http')
                                ? settings.bank_upi_qr_url
                                : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}${settings.bank_upi_qr_url}`
                            }
                            alt="UPI QR"
                            className="h-20 w-20 rounded-lg border border-[#E6E8EE] object-contain bg-white"
                          />
                        )}
                      </div>
                    </FormField>
                  </div>

                  {(settings.bank_beneficiary_name ||
                    settings.bank_name ||
                    settings.bank_account_number ||
                    settings.bank_ifsc ||
                    settings.bank_upi_id ||
                    settings.bank_upi_details) && (
                    <div className="rounded-[10px] border border-[#E6E8EE] bg-[#F6F7F9] px-3.5 py-3">
                      <p className="mb-1 text-[10px] font-bold tracking-wider text-[#64748B] uppercase">
                        Preview on invoices
                      </p>
                      <p className="text-xs leading-5 text-[#0F172A]">
                        {[
                          settings.bank_beneficiary_name &&
                            `Beneficiary: ${settings.bank_beneficiary_name}`,
                          settings.bank_name && `Bank: ${settings.bank_name}`,
                          settings.bank_account_number &&
                            `A/C: ${settings.bank_account_number}`,
                          settings.bank_ifsc && `IFSC: ${settings.bank_ifsc}`,
                          settings.bank_upi_id && `UPI: ${settings.bank_upi_id}`,
                        ]
                          .filter(Boolean)
                          .join(' | ') || settings.bank_upi_details}
                      </p>
                    </div>
                  )}

                  <FormField label="Default Payment Terms">
                    <Input
                      value={settings.payment_terms || ''}
                      onChange={(e) => {
                        setSettings({ ...settings, payment_terms: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </FormField>
                </div>
              </form>
            </SectionCard>
          )}

          {/* TAB 2: SMTP & EMAIL DISPATCH */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <SectionCard
                title="Email server"
                subtitle="Sends invoices, reminders, and late-fee notices"
                icon={<Mail className="w-4 h-4" />}
              >
                <form onSubmit={handleSmtpSave} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <FormField label="SMTP Host" required>
                      <Input
                        required
                        placeholder="smtp.krwebsolution.com"
                        value={smtpForm.smtp_host}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Port" required>
                      <Input
                        type="number"
                        required
                        value={smtpForm.smtp_port}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: parseInt(e.target.value) || 587 })}
                      />
                    </FormField>

                    <FormField label="Username" required>
                      <Input
                        required
                        value={smtpForm.smtp_username}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_username: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Password" hint="Leave empty to retain saved credentials">
                      <div className="relative">
                        <Input
                          type={showSmtpPassword ? 'text' : 'password'}
                          placeholder="••••••••••••"
                          value={smtpForm.smtp_password}
                          onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                        >
                          {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormField>

                    <FormField label="From Sender Name">
                      <Input
                        value={smtpForm.smtp_from_name}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_from_name: e.target.value })}
                      />
                    </FormField>

                    <FormField label="From Sender Email">
                      <Input
                        type="email"
                        value={smtpForm.smtp_from_email}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_from_email: e.target.value })}
                      />
                    </FormField>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F6F7F9] border border-[#E6E8EE] rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">Use SSL / TLS Encryption</div>
                      <div className="text-[11px] text-[#64748B]">Recommended for port 465 (SSL) or 587 (STARTTLS)</div>
                    </div>
                    <Switch
                      checked={smtpForm.smtp_use_tls}
                      onChange={(val) => setSmtpForm({ ...smtpForm, smtp_use_tls: val })}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                      Save SMTP Settings
                    </Button>
                  </div>
                </form>
              </SectionCard>

              {/* Send Test Email Card */}
              <SectionCard
                title="Send a test"
                subtitle="Confirms the saved email server can deliver mail"
                icon={<Send className="w-4 h-4" />}
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleTestEmail}
                      isLoading={isTestingEmail}
                      className="shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>Send Test</span>
                    </Button>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    A verification test message will be sent through the saved SMTP parameters above.
                  </p>
                </div>
              </SectionCard>
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <SectionCard
                title="People"
                subtitle="Founders, workers, and client logins"
                icon={<Users className="w-4 h-4" />}
                headerSlot={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setUserModalError(null);
                      setIsUserModalOpen(true);
                    }}
                    className="h-8 text-xs shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Invite User</span>
                  </Button>
                }
              >
                <DataTable
                  columns={userColumns}
                  data={usersList}
                  rowKey="id"
                />
              </SectionCard>
            </div>
          )}

          {/* TAB 4: EMAIL TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <SectionCard
                title="Email templates"
                subtitle="Branded HTML layouts for invoices, reminders, receipts, and system mail"
                icon={<FileCode className="w-4 h-4" />}
              >
                <div className="space-y-4">
                  <div className="rounded-[10px] border border-[#E6E8EE] bg-[#FFF1F0] px-3.5 py-3 text-xs text-[#0F172A]">
                    Emails now send as clear branded <strong>HTML</strong> (with a plain-text fallback).
                    Layout, amount callouts, bank details, and PDF notes are managed by the system.
                    You can still edit the <strong>subject line</strong> below.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-1.5">
                      Select Template
                    </label>
                    <Select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => {
                        const t = templates.find((item) => item.id === e.target.value);
                        if (t) handleSelectTemplate(t);
                      }}
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <FormField label="Email Subject" hint="Supports {invoice_number}, {company_name}, {client_name}">
                    <Input
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                    />
                  </FormField>

                  <div className="overflow-hidden rounded-[10px] border border-[#E6E8EE]">
                    <div className="border-b border-[#E6E8EE] bg-[#F6F7F9] px-3.5 py-2.5">
                      <p className="text-xs font-bold text-[#0F172A]">HTML body (system managed)</p>
                      <p className="mt-0.5 text-[11px] text-[#64748B]">
                        Includes company header, amount banner, invoice facts, bank/UPI box, and footer.
                      </p>
                    </div>
                    <div className="space-y-2 px-3.5 py-3 text-xs text-[#64748B]">
                      {[
                        ['invoice_sent', 'Invoice send — amount, due date, bank details, PDF note'],
                        ['payment_reminder', 'Friendly reminder before / on due date'],
                        ['invoice_overdue', 'Overdue notice with strong pay-now emphasis'],
                        ['payment_received', 'Paid receipt confirmation'],
                        ['password_reset', 'Reset button + secure link'],
                        ['lead_welcome', 'Lead acknowledgement within 24 hours'],
                      ].map(([id, desc]) => (
                        <div
                          key={id}
                          className={`flex items-start justify-between gap-3 rounded-lg px-2.5 py-2 ${
                            selectedTemplate?.id === id ? 'bg-[#FFF1F0] text-[#0F172A]' : 'bg-white'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-[#0F172A]">{id}</p>
                            <p className="text-[11px] text-[#64748B]">{desc}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-[#E6E8EE] bg-white px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#15803D] uppercase">
                            HTML
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveTemplate}
                      isLoading={isSavingTemplate}
                    >
                      Save Subject
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* TAB 5: BILLING AUTOMATION */}
          {activeTab === 'automation' && (
            <SectionCard
              title="Billing schedule"
              subtitle="When maintenance bills are created and emailed"
              icon={<Zap className="w-4 h-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  ['09:00 IST', 'Create the month’s bill on the 1st, then email it on each project’s send day.'],
                  ['18:00 IST', 'Send payment reminders using each plan’s “remind every N days” setting.'],
                  ['Hourly', 'Follow up on overdue invoices after a founder sets the reminder hours.'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-xl border border-[#E6E8EE] bg-[#F8F9FB] p-3">
                    <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#E32B2B]" />
                      {title}
                    </p>
                    <p className="text-xs text-[#64748B] leading-relaxed mt-1.5">{body}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
      </div>

      {/* STICKY BOTTOM SAVE BAR */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-4 z-30 bg-white border border-[#E6E8EE] rounded-xl px-4 py-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E32B2B] animate-pulse" />
            <span>You have unsaved changes in company profile.</span>
          </span>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => fetchSettingsData()}>
              Revert
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleCompanySave()}
              isLoading={isSaving}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {isUserModalOpen && (
        <Modal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          title="Add a person"
          subtitle="A founder, worker, or client login."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateUser}
                isLoading={isSubmittingUser}
              >
                Register User
              </Button>
            </div>
          }
        >
          {userModalError && (
            <div className="mb-4 p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C]">
              {userModalError}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <FormField label="Full Name" required>
              <Input
                required
                placeholder="e.g. Priyan Sharma"
                value={newUserForm.full_name}
                onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
              />
            </FormField>

            <FormField label="Email Address" required>
              <Input
                type="email"
                required
                placeholder="user@krwebsolution.com"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />
            </FormField>

            <FormField label="Initial Password" required>
              <Input
                type="password"
                required
                placeholder="••••••••••••"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </FormField>

            <FormField label="Workspace Role" required>
              <Select
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
              >
                <option value="admin">Admin (Full workspace access)</option>
                <option value="founder_ceo">Founder CEO (Full workspace access)</option>
                <option value="worker">Worker (Engineering Contributor)</option>
                <option value="client">Client (External Customer Portal)</option>
              </Select>
            </FormField>

            {newUserForm.role === 'client' && (
              <FormField label="Link to Client Company" required>
                <Select
                  value={newUserForm.client_id}
                  onChange={(e) => setNewUserForm({ ...newUserForm, client_id: e.target.value })}
                >
                  <option value="">Select client entity...</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
