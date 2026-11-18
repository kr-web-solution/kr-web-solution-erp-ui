'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceEditor } from '@/components/invoices/InvoiceEditor';

function NewInvoiceInner() {
  const searchParams = useSearchParams();
  return (
    <InvoiceEditor
      mode="create"
      initialClientId={searchParams.get('client_id') || ''}
      initialProjectId={searchParams.get('project_id') || ''}
    />
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <NewInvoiceInner />
    </Suspense>
  );
}
