'use client';

import React from 'react';
import Image from 'next/image';

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price_paise?: number;
  rate_rupees?: number;
  amount_paise?: number;
}

export interface PaperInvoiceProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress?: string;
  clientGstin?: string;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  items: InvoiceLineItem[];
  subtotalPaise: number;
  taxPaise: number;
  taxRatePercent?: number;
  totalPaise: number;
  isPaid?: boolean;
  notes?: string;
  bankDetails?: string;
  className?: string;
}

export function PaperInvoice({
  invoiceNumber,
  issueDate,
  dueDate,
  clientName,
  clientAddress,
  clientGstin,
  companyName = 'KR Web Solution',
  companyAddress = 'Salem, Tamil Nadu, India',
  companyGstin = '33AABCK1234F1Z5',
  items = [],
  subtotalPaise,
  taxPaise,
  taxRatePercent = 18,
  totalPaise,
  isPaid = false,
  notes,
  bankDetails,
  className = '',
}: PaperInvoiceProps) {
  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  return (
    <div
      className={`relative w-full max-w-[760px] mx-auto bg-white border border-[#E6E8EE] rounded-xl shadow-lg p-6 sm:p-10 text-[#0F172A] select-none ${className}`}
      style={{ aspectRatio: '1 / 1.414' }}
    >
      {/* Rotated PAID stamp overlay */}
      {isPaid && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-[#16A34A] text-[#16A34A] font-extrabold font-mono text-5xl tracking-widest px-8 py-3 rounded-xl opacity-75 pointer-events-none select-none">
          PAID
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-6 pb-6 border-b border-[#E6E8EE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#12141C] p-1 flex items-center justify-center">
              <img
                src="/brand/krws-mark.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/brand/kr-logo.png';
                }}
              />
            </div>
            <span className="text-base font-bold text-[#0F172A]">{companyName}</span>
          </div>
          <p className="text-[11px] text-[#64748B] max-w-xs">{companyAddress}</p>
          {companyGstin && (
            <p className="text-[11px] font-mono text-[#64748B]">
              GSTIN: <span className="font-semibold text-[#0F172A]">{companyGstin}</span>
            </p>
          )}
        </div>

        <div className="text-right space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight text-[#E32B2B]">
            TAX INVOICE
          </h2>
          <div className="text-xs font-mono font-bold text-[#0F172A]">
            {invoiceNumber}
          </div>
          <div className="text-[11px] text-[#64748B]">
            Issue: <span className="font-mono text-[#0F172A]">{issueDate || '—'}</span>
          </div>
          <div className="text-[11px] text-[#64748B]">
            Due: <span className="font-mono font-semibold text-[#E32B2B]">{dueDate || '—'}</span>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="py-5 border-b border-[#E6E8EE]">
        <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
          Billed To:
        </div>
        <div className="text-sm font-bold text-[#0F172A]">{clientName || 'Client Name'}</div>
        {clientAddress && (
          <p className="text-xs text-[#64748B] mt-0.5 max-w-sm">{clientAddress}</p>
        )}
        {clientGstin && (
          <p className="text-xs font-mono text-[#64748B] mt-0.5">
            GSTIN: <span className="font-semibold text-[#0F172A]">{clientGstin}</span>
          </p>
        )}
      </div>

      {/* Line Items Table */}
      <div className="py-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#E6E8EE] text-[#64748B] font-semibold text-[11px]">
              <th className="text-left pb-2 w-12">#</th>
              <th className="text-left pb-2">Description</th>
              <th className="text-right pb-2 w-16">Qty</th>
              <th className="text-right pb-2 w-28">Rate</th>
              <th className="text-right pb-2 w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E8EE]/40">
            {items.map((item, idx) => {
              const rate = item.rate_rupees ?? ((item.unit_price_paise ?? 0) / 100);
              const amount = item.amount_paise ?? (item.quantity * rate * 100);
              return (
                <tr key={idx} className="py-2.5">
                  <td className="py-2 font-mono text-[#64748B]">{idx + 1}</td>
                  <td className="py-2 font-medium text-[#0F172A]">{item.description}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{item.quantity}</td>
                  <td className="py-2 text-right font-mono tabular-nums">
                    ₹{rate.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 text-right font-mono font-semibold tabular-nums text-[#0F172A]">
                    {formatRupees(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Block with Brand Accent */}
      <div className="pt-4 border-t border-[#E6E8EE] flex flex-col items-end">
        <div className="w-64 space-y-2 text-xs">
          <div className="flex justify-between text-[#64748B]">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums text-[#0F172A]">
              {formatRupees(subtotalPaise)}
            </span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>GST ({taxRatePercent}%)</span>
            <span className="font-mono tabular-nums text-[#0F172A]">
              {formatRupees(taxPaise)}
            </span>
          </div>
          {/* Highlighted Yellow Total Block */}
          <div className="pt-2 border-t border-[#E6E8EE] flex justify-between items-center bg-[#FEF6D8] p-2.5 rounded-lg border border-[#FADC59]/40 text-[#5B4300]">
            <span className="font-bold text-sm">Total Payable</span>
            <span className="font-mono font-extrabold text-base tabular-nums">
              {formatRupees(totalPaise)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Bank & Notes */}
      <div className="mt-8 pt-4 border-t border-[#E6E8EE] text-[11px] text-[#64748B] grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bankDetails && (
          <div>
            <span className="font-bold uppercase tracking-wider block text-[10px] text-[#0F172A] mb-1">
              Bank Details / UPI
            </span>
            <p className="font-mono whitespace-pre-line text-[#64748B] leading-tight">
              {bankDetails}
            </p>
          </div>
        )}
        {notes && (
          <div>
            <span className="font-bold uppercase tracking-wider block text-[10px] text-[#0F172A] mb-1">
              Terms &amp; Notes
            </span>
            <p className="whitespace-pre-line text-[#64748B] leading-tight">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
