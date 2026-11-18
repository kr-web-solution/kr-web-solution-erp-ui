'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { leadsApi } from '@/lib/api/client';
import { Lead, LeadStatus } from '@/lib/types';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Mail,
  Phone,
  Eye,
  Trash2,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export default function LeadsListPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Lead Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'inbound',
    notes: '',
    status: 'new' as LeadStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirm Dialog State
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await leadsApi.list(
        selectedTab === 'all' ? undefined : selectedTab,
        search.trim() || undefined
      );
      setLeads(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leads pipeline.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedTab]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Contact person name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setModalError('Email address is required.');
      return;
    }

    setModalError(null);
    setIsSubmitting(true);
    try {
      await leadsApi.create(formData);
      toast.success(`Lead "${formData.name}" added to pipeline`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        source: 'inbound',
        notes: '',
        status: 'new',
      });
      fetchLeads();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await leadsApi.delete(leadToDelete.id);
      toast.success('Lead deleted');
      setLeadToDelete(null);
      fetchLeads();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete lead.');
    }
  };

  // Funnel Counts
  const tabCounts = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      proposal: leads.filter((l) => l.status === 'proposal').length,
      won: leads.filter((l) => l.status === 'won').length,
      lost: leads.filter((l) => l.status === 'lost').length,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (!search) return leads;
    const term = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(term) ||
        (l.company && l.company.toLowerCase().includes(term)) ||
        (l.email && l.email.toLowerCase().includes(term))
    );
  }, [leads, search]);

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Prospect & Company',
      sortable: true,
      render: (row: Lead) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.company || row.name} size="md" />
          <div>
            <Link
              href={`/leads/${row.id}`}
              className="font-bold text-[#0F172A] hover:text-[#E32B2B] transition-colors"
            >
              {row.name}
            </Link>
            <div className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>{row.company || 'Direct Client'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Email & Phone',
      render: (row: Lead) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#0F172A]">
            <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>{row.email || '—'}</span>
            {row.email && <CopyButton value={row.email} label="email" />}
          </div>
          {row.phone && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B] mt-0.5">
              <Phone className="w-3 h-3 text-[#94A3B8]" />
              <span>{row.phone}</span>
              <CopyButton value={row.phone} label="phone" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (row: Lead) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F6F7F9] text-[#64748B] border border-[#E6E8EE] uppercase">
          {row.source || 'Inbound'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Pipeline Status',
      sortable: true,
      render: (row: Lead) => <StatusBadge status={row.status} type="lead" />,
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right' as const,
      render: (row: Lead) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status !== 'won' && (
            <Link href={`/leads/${row.id}`}>
              <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs">
                <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Convert</span>
              </Button>
            </Link>
          )}
          <Link href={`/leads/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>View</span>
            </Button>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLeadToDelete(row);
            }}
            className="p-1.5 text-[#94A3B8] hover:text-[#B91C1C] hover:bg-rose-50 rounded-[8px] transition-colors"
            title="Delete lead"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
              CRM Lead Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#12141C] text-white">
              {leads.length} Prospects
            </span>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Inbound inquiries, qualification status, discovery calls, and client conversion funnel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLeads}
            isLoading={isLoading}
            className="h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setModalError(null);
              setIsModalOpen(true);
            }}
            className="h-9 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>

      {/* Funnel Metric Strip (Nexora Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white border border-[#E6E8EE] rounded-2xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">New</div>
          <div className="text-xl font-bold text-[#0F172A] font-mono mt-1">{tabCounts.new}</div>
        </div>
        <div className="p-3.5 bg-white border border-[#E6E8EE] rounded-2xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">Contacted</div>
          <div className="text-xl font-bold text-amber-700 font-mono mt-1">{tabCounts.contacted}</div>
        </div>
        <div className="p-3.5 bg-white border border-[#E6E8EE] rounded-2xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">Proposal</div>
          <div className="text-xl font-bold text-purple-700 font-mono mt-1">{tabCounts.proposal}</div>
        </div>
        <div className="p-3.5 bg-white border border-[#E6E8EE] rounded-2xl shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase">Won</div>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-1">{tabCounts.won}</div>
        </div>
        <div className="p-3.5 bg-white border border-[#E6E8EE] rounded-2xl shadow-2xs">
          <div className="text-[11px] font-semibold text-[#64748B] uppercase">Lost</div>
          <div className="text-xl font-bold text-[#94A3B8] font-mono mt-1">{tabCounts.lost}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E6E8EE] pb-2">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Leads', count: tabCounts.all },
            { id: 'new', label: 'New', count: tabCounts.new },
            { id: 'contacted', label: 'Contacted', count: tabCounts.contacted },
            { id: 'proposal', label: 'Proposal', count: tabCounts.proposal },
            { id: 'won', label: 'Won', count: tabCounts.won },
            { id: 'lost', label: 'Lost', count: tabCounts.lost },
          ]}
          activeTab={selectedTab}
          onChange={setSelectedTab}
        />
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full min-w-0 sm:max-w-xl lg:max-w-2xl">
          <Input
            placeholder="Search by prospect name, company, or email..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-[#64748B]">
          Showing <strong className="text-[#0F172A]">{filteredLeads.length}</strong> of {leads.length} leads
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-[#FDECEC] border border-rose-200 rounded-[16px] flex items-center justify-between text-xs text-[#B91C1C]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={fetchLeads}>
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredLeads}
        rowKey="id"
        isLoading={isLoading}
        emptyMessage="No prospects found in this pipeline stage."
        onRowClick={(row: Lead) => router.push(`/leads/${row.id}`)}
      />

      {/* Add Lead Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Lead"
          subtitle="Record inbound prospect into sales qualification pipeline."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateLead}
                isLoading={isSubmitting}
              >
                Create Lead
              </Button>
            </div>
          }
        >
          {modalError && (
            <div className="mb-4 p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C]">
              {modalError}
            </div>
          )}

          <form onSubmit={handleCreateLead} className="space-y-4">
            <FormField label="Contact Person Name" required>
              <Input
                required
                placeholder="e.g. Ananya Sen"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Company Name">
              <Input
                placeholder="e.g. Apex Dynamics Ltd"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Email Address" required>
                <Input
                  type="email"
                  required
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </FormField>

              <FormField label="Phone Number">
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Acquisition Source">
                <Select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="inbound">Inbound Website</option>
                  <option value="referral">Referral</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="cold_outreach">Outreach</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>

              <FormField label="Pipeline Status">
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </Select>
              </FormField>
            </div>

            <FormField label="Initial Notes / Requirements">
              <Textarea
                rows={2}
                placeholder="Project needs, budget expectations, timeline notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </FormField>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {leadToDelete && (
        <ConfirmDialog
          isOpen={!!leadToDelete}
          onClose={() => setLeadToDelete(null)}
          onConfirm={handleDeleteLead}
          title="Delete Lead?"
          message={`Are you sure you want to delete lead "${leadToDelete.name}"? This action cannot be undone.`}
          confirmLabel="Delete Lead"
          variant="danger"
        />
      )}
    </div>
  );
}
