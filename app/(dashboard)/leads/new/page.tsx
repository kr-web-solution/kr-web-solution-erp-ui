'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { leadsApi } from '@/lib/api/client';
import { LeadStatus } from '@/lib/types';
import {
  ArrowLeft,
  Users,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { SectionCard } from '@/components/ui/SectionCard';
import { toast } from 'sonner';

export default function NewLeadPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contact_name: '',
    email: '',
    phone: '',
    source: 'inbound',
    status: 'new' as LeadStatus,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Contact person / title is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email address is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const created = await leadsApi.create({
        name: formData.name.trim(),
        company: formData.company.trim(),
        contact_name: formData.contact_name.trim() || formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        source: formData.source,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });

      toast.success(`Lead "${created.name}" created successfully`);
      router.push(`/leads/${created.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to record lead enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <Link href="/leads">
          <Button variant="ghost" size="sm" className="h-9 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to Leads</span>
          </Button>
        </Link>
      </div>

      <div className="mb-2">
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-heading">
          Record New Prospect
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Capture prospective client requirements and sales contact details.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FDECEC] border border-rose-200 rounded-[16px] flex items-center gap-2.5 text-xs text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Intake Form */}
      <SectionCard
        title="Prospect Profile"
        subtitle="Commercial contact and qualification data"
        icon={<Users className="w-4 h-4" />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Opportunity / Contact Name" required>
              <Input
                required
                placeholder="e.g. Ramesh Babu / Cloud ERP"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Company Name">
              <Input
                placeholder="e.g. DeltaCare Healthcare Pvt Ltd"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </FormField>

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
                placeholder="+91 98421 99887"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>

            <FormField label="Lead Source">
              <Select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="inbound">Inbound Website Form</option>
                <option value="referral">Referral / Network</option>
                <option value="linkedin">LinkedIn</option>
                <option value="inbound_call">Phone Call</option>
                <option value="direct">Direct Outreach</option>
              </Select>
            </FormField>

            <FormField label="Initial Stage">
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

          <FormField label="Requirements & Discovery Notes">
            <Textarea
              rows={3}
              placeholder="Expected scope, tech stack requirements, initial budget discussed..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E6E8EE]">
            <Link href="/leads">
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              <span>Save Lead Record</span>
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
