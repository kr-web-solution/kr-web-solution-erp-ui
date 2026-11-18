'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceEditor } from '@/components/invoices/InvoiceEditor';
import { PageSkeleton } from '@/components/ui/Skeleton';

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
    <Suspense fallback={<PageSkeleton variant="form" />}>
      <NewInvoiceInner />
    </Suspense>
  );
}
