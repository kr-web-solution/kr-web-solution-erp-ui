'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import type { ClientFormValues } from '@/lib/types';

interface ClientFormFieldsProps {
  value: ClientFormValues;
  onChange: (next: ClientFormValues) => void;
}

export function ClientFormFields({ value, onChange }: ClientFormFieldsProps) {
  const set = (key: keyof ClientFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-[11px] font-bold tracking-wider uppercase text-[#64748B]">Company</p>
        <FormField label="Company / client name" required>
          <Input required placeholder="Aster Retail Technologies" value={value.name} onChange={set('name')} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Company email" hint="Invoice To address">
            <Input type="email" placeholder="accounts@company.com" value={value.email} onChange={set('email')} />
          </FormField>
          <FormField label="Company phone">
            <Input type="tel" placeholder="+91 422 000 0000" value={value.phone} onChange={set('phone')} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Website">
            <Input placeholder="https://company.com" value={value.website} onChange={set('website')} />
          </FormField>
          <FormField label="GSTIN">
            <Input placeholder="33AAAAA0000A1Z5" value={value.gstin} onChange={set('gstin')} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="PAN" hint="Optional — shown on tax invoices when set">
            <Input placeholder="AAAAA0000A" value={value.pan} onChange={set('pan')} />
          </FormField>
          <FormField label="State code" hint="GST state code, e.g. 33 for Tamil Nadu">
            <Input placeholder="33" value={value.state_code} onChange={set('state_code')} maxLength={2} />
          </FormField>
        </div>
        <FormField label="Address">
          <Textarea rows={2} placeholder="Street, area" value={value.address} onChange={set('address')} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="City">
            <Input placeholder="Erode" value={value.city} onChange={set('city')} />
          </FormField>
          <FormField label="State">
            <Input placeholder="Tamil Nadu" value={value.state} onChange={set('state')} />
          </FormField>
          <FormField label="PIN code">
            <Input placeholder="638001" value={value.pincode} onChange={set('pincode')} />
          </FormField>
        </div>
      </div>

      <div className="space-y-3 pt-1 border-t border-[#E6E8EE]">
        <p className="text-[11px] font-bold tracking-wider uppercase text-[#64748B] pt-3">Contact person</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Contact name">
            <Input placeholder="Priya Natarajan" value={value.primary_contact_name} onChange={set('primary_contact_name')} />
          </FormField>
          <FormField label="Designation">
            <Input placeholder="Director" value={value.designation} onChange={set('designation')} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Contact email" hint="CC’d on invoice emails">
            <Input type="email" placeholder="priya@company.com" value={value.contact_email} onChange={set('contact_email')} />
          </FormField>
          <FormField label="Contact number">
            <Input type="tel" placeholder="+91 98765 43210" value={value.contact_phone} onChange={set('contact_phone')} />
          </FormField>
        </div>
      </div>

      <FormField label="Notes">
        <Textarea rows={2} placeholder="Billing terms, who approves payments…" value={value.notes} onChange={set('notes')} />
      </FormField>
    </div>
  );
}
