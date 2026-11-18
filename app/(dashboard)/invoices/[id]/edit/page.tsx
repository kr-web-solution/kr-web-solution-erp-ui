'use client';

import React, { use } from 'react';
import { InvoiceEditor } from '@/components/invoices/InvoiceEditor';

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <InvoiceEditor mode="edit" invoiceId={id} />;
}
