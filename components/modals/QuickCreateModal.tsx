'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderPlus,
  UserPlus,
  Receipt,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { PlusIcon, XIcon } from '@/components/icons';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreateModal({ isOpen, onClose }: QuickCreateModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleAction = (url: string) => {
    router.push(url);
    onClose();
  };

  const actions = [
    {
      id: 'create-project',
      title: 'New Project Engagement',
      description: 'Create a new project delivery scope, milestone budget, and recurring maintenance billing.',
      icon: FolderPlus,
      href: '/projects',
      badge: 'Delivery',
      badgeColor: 'bg-[#620C13]/10 text-[#620C13]',
    },
    {
      id: 'create-lead',
      title: 'New Sales Lead',
      description: 'Capture inbound enquiry, potential contract value, and schedule follow-ups.',
      icon: UserPlus,
      href: '/leads/new',
      badge: 'Sales',
      badgeColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      id: 'create-invoice',
      title: 'New GST Tax Invoice',
      description: 'Issue a compliant GST tax invoice, milestone bill, or ad-hoc service retainer.',
      icon: Receipt,
      href: '/invoices/new',
      badge: 'Billing',
      badgeColor: 'bg-amber-50 text-amber-800',
    },
    {
      id: 'create-client',
      title: 'New Client Company',
      description: 'Add an organization 360° profile with GSTIN, billing address, and point of contacts.',
      icon: Building2,
      href: '/clients',
      badge: 'CRM',
      badgeColor: 'bg-blue-50 text-blue-700',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#E7E9EF] w-full max-w-lg overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b border-[#E7E9EF] flex items-center justify-between bg-[#F8F9FB]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#620C13] text-[#FCDD59] flex items-center justify-center">
              <PlusIcon size={16} className="text-[#FCDD59]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#191919]">Quick Create Record</h2>
              <p className="text-[11px] text-[#667085]">Select an entity to initiate immediate workspace creation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#667085] hover:text-[#191919] rounded-md hover:bg-slate-200/50"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* ACTIONS LIST */}
        <div className="p-3 space-y-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => handleAction(act.href)}
                className="w-full text-left p-3.5 rounded-xl border border-[#E7E9EF] hover:border-[#FD322E] hover:bg-[#F8F9FB] transition-all group flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E7E9EF] text-[#620C13] group-hover:bg-[#FD322E] group-hover:text-white transition-colors shrink-0 shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#191919] group-hover:text-[#FD322E] transition-colors">
                        {act.title}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${act.badgeColor}`}>
                        {act.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] mt-0.5 line-clamp-2">
                      {act.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#98A2B3] group-hover:text-[#FD322E] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-2.5 bg-[#F8F9FB] border-t border-[#E7E9EF] flex items-center justify-between text-[11px] text-[#667085]">
          <span>Tip: Press <kbd className="font-mono bg-white px-1 border rounded text-[10px]">Alt + N</kbd> anytime to open</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#667085] hover:text-[#191919]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

