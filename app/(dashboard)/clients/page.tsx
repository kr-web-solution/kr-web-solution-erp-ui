'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { clientsApi, invoicesApi } from '@/lib/api/client';
import { Client, Invoice, emptyClientForm } from '@/lib/types';
import { ClientFormFields } from '@/components/clients/ClientFormFields';
import { isPrivileged } from '@/lib/roles';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  Mail,
  Phone,
  Eye,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { CopyButton } from '@/components/ui/CopyButton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';

export default function ClientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Client Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyClientForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirm Dialog
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cList, iList] = await Promise.all([
        clientsApi.list(),
        user?.role !== 'worker' ? invoicesApi.list() : Promise.resolve([]),
      ]);
      setClients(cList);
      setInvoices(iList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load client directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Company name is required.');
      return;
    }

    setModalError(null);
    setIsSubmitting(true);
    try {
      await clientsApi.create(formData);
      toast.success(`Client "${formData.name}" added to directory`);
      setIsModalOpen(false);
      setFormData(emptyClientForm());
      fetchClients();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to create client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await clientsApi.delete(clientToDelete.id);
      toast.success(`Client "${clientToDelete.name}" deleted`);
      setClientToDelete(null);
      fetchClients();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete client.');
    }
  };

  // Outstanding balance calculation per client
  const clientBalances = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      if (inv.status === 'sent' || inv.status === 'overdue') {
        map[inv.client_id] = (map[inv.client_id] || 0) + (inv.total_paise || 0);
      }
    });
    return map;
  }, [invoices]);

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const term = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.primary_contact_name && c.primary_contact_name.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(term)) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.contact_phone && c.contact_phone.toLowerCase().includes(term)) ||
        (c.gstin && c.gstin.toLowerCase().includes(term))
    );
  }, [clients, search]);

  const isFounder = isPrivileged(user?.role);

  // GlobalBank Dense Table Columns (Image 5 style)
  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Company / Client',
      sortable: true,
      render: (row: Client) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="md" />
          <div>
            <Link
              href={`/clients/${row.id}`}
              className="font-bold text-[#0F172A] hover:text-[#E32B2B] transition-colors"
            >
              {row.name}
            </Link>
            {row.gstin && (
              <div className="text-[10px] font-mono text-[#64748B] mt-0.5">
                GST: {row.gstin}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'primary_contact_name',
      header: 'Primary Contact',
      sortable: true,
      render: (row: Client) => (
        <div>
          <div className="font-semibold text-[#0F172A]">
            {row.primary_contact_name || '—'}
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3 h-3 text-[#94A3B8]" />
            <span>{row.contact_email || row.email || '—'}</span>
            {(row.contact_email || row.email) && (
              <CopyButton value={row.contact_email || row.email || ''} label="email" />
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row: Client) => (
        row.phone ? (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span>{row.phone}</span>
            <CopyButton value={row.phone} label="phone" />
          </div>
        ) : (
          <span className="text-[#94A3B8]">—</span>
        )
      ),
    },
    ...(user?.role !== 'worker'
      ? [
          {
            key: 'outstanding' as keyof Client,
            header: 'Outstanding Balance',
            sortable: true,
            render: (row: Client) => {
              const bal = clientBalances[row.id] || 0;
              return (
                <span
                  className={`font-mono text-xs font-bold tabular-nums ${
                    bal > 0 ? 'text-[#B91C1C]' : 'text-emerald-700'
                  }`}
                >
                  ₹{(bal / 100).toLocaleString('en-IN')}
                </span>
              );
            },
          },
        ]
      : []),
    {
      key: 'id',
      header: 'Actions',
      align: 'right' as const,
      render: (row: Client) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/clients/${row.id}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>Ledger</span>
            </Button>
          </Link>
          {isFounder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setClientToDelete(row);
              }}
              className="p-1.5 text-[#94A3B8] hover:text-[#B91C1C] hover:bg-rose-50 rounded-[8px] transition-colors"
              title="Delete client"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
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
              Client Accounts (360°)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#12141C] text-white">
              {clients.length} Accounts
            </span>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Corporate customer directory, invoicing ledgers, contact points, and billing history.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchClients}
            isLoading={isLoading}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            className="h-9"
          >
            Refresh
          </Button>

          {isFounder && (
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
              <span>Add Client</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full min-w-0 sm:max-w-xl lg:max-w-2xl">
          <Input
            placeholder="Search by company, contact person, or email..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-[#64748B]">
          Showing <strong className="text-[#0F172A]">{filteredClients.length}</strong> of {clients.length} accounts
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-[#FDECEC] border border-rose-200 rounded-[16px] flex items-center justify-between text-xs text-[#B91C1C]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={fetchClients}>
            Retry
          </Button>
        </div>
      )}

      {/* GlobalBank Data Table */}
      <DataTable
        columns={columns}
        data={filteredClients}
        rowKey="id"
        isLoading={isLoading}
        emptyMessage={
          search
            ? 'No clients match your search query.'
            : 'No clients found in directory. Click "Add Client" to create your first customer.'
        }
        onRowClick={(row: Client) => router.push(`/clients/${row.id}`)}
      />

      {/* Add Client Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Client"
          subtitle="Register customer company and billing details in KR Workspace."
          size="lg"
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
                onClick={handleCreateClient}
                isLoading={isSubmitting}
              >
                Create Client
              </Button>
            </div>
          }
        >
          {modalError && (
            <div className="mb-4 p-3 bg-[#FDECEC] border border-rose-200 rounded-[10px] text-xs text-[#B91C1C]">
              {modalError}
            </div>
          )}

          <form onSubmit={handleCreateClient}>
            <ClientFormFields value={formData} onChange={setFormData} />
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {clientToDelete && (
        <ConfirmDialog
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          onConfirm={handleDeleteClient}
          title="Delete Client?"
          message={`Are you sure you want to delete "${clientToDelete.name}"? This action cannot be undone.`}
          confirmLabel="Delete Client"
          variant="danger"
        />
      )}
    </div>
  );
}
