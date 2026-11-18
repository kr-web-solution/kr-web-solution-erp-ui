'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Users2,
  Building2,
  Settings,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SearchCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  category: 'Pages' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'nav-dashboard',
    title: 'Executive Dashboard',
    subtitle: 'High-level business metrics, alerts, and operational pulse',
    route: '/dashboard',
    category: 'Pages',
    icon: LayoutDashboard,
  },
  {
    id: 'nav-projects',
    title: 'Project Portfolio & Sprints',
    subtitle: 'Manage client deliverables, budgets, and maintenance contracts',
    route: '/projects',
    category: 'Pages',
    icon: FolderKanban,
  },
  {
    id: 'nav-invoices',
    title: 'GST Tax Invoices & Receivables',
    subtitle: 'Invoicing, recurring maintenance billing, and payment tracking',
    route: '/invoices',
    category: 'Pages',
    icon: Receipt,
  },
  {
    id: 'nav-leads',
    title: 'CRM Lead Pipeline',
    subtitle: 'Manage potential deals, lead stages, and client conversion',
    route: '/leads',
    category: 'Pages',
    icon: Users2,
  },
  {
    id: 'nav-clients',
    title: 'Client Directory (360°)',
    subtitle: 'Client company details, GSTIN, contacts, and active contracts',
    route: '/clients',
    category: 'Pages',
    icon: Building2,
  },
  {
    id: 'nav-settings',
    title: 'Company Settings & SMTP',
    subtitle: 'Organization details, GST settings, and email configurations',
    route: '/settings',
    category: 'Pages',
    icon: Settings,
  },
];

export function SearchCommandModal({ isOpen, onClose }: SearchCommandModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Handled in parent
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = SEARCH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.route.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (route: string) => {
    router.push(route);
    onClose();
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].route);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#E7E9EF] w-full max-w-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* INPUT HEADER */}
        <div className="p-3.5 border-b border-[#E7E9EF] flex items-center gap-3 bg-[#F8F9FB]">
          <Search className="w-4 h-4 text-[#FD322E] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search modules, projects, invoices, clients, or type a route..."
            className="w-full bg-transparent text-sm text-[#191919] placeholder:text-[#667085] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block text-[11px] bg-white border border-[#D0D5DD] rounded px-1.5 py-0.5 text-[#667085] font-mono shadow-2xs shrink-0 select-none">
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#667085] hover:text-[#191919] rounded-md hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QUICK ROUTE SHORTCUTS */}
        <div className="px-3 py-2 bg-white border-b border-[#E7E9EF] flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-[#667085] font-semibold shrink-0">Jump to:</span>
          <button
            type="button"
            onClick={() => handleSelect('/dashboard')}
            className="px-2 py-1 rounded bg-[#F8F9FB] hover:bg-[#FD322E]/10 hover:text-[#FD322E] text-[#191919] font-medium transition-colors"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => handleSelect('/projects')}
            className="px-2 py-1 rounded bg-[#F8F9FB] hover:bg-[#FD322E]/10 hover:text-[#FD322E] text-[#191919] font-medium transition-colors"
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => handleSelect('/invoices')}
            className="px-2 py-1 rounded bg-[#F8F9FB] hover:bg-[#FD322E]/10 hover:text-[#FD322E] text-[#191919] font-medium transition-colors"
          >
            Invoices
          </button>
          <button
            type="button"
            onClick={() => handleSelect('/leads')}
            className="px-2 py-1 rounded bg-[#F8F9FB] hover:bg-[#FD322E]/10 hover:text-[#FD322E] text-[#191919] font-medium transition-colors"
          >
            Leads
          </button>
          <button
            type="button"
            onClick={() => handleSelect('/clients')}
            className="px-2 py-1 rounded bg-[#F8F9FB] hover:bg-[#FD322E]/10 hover:text-[#FD322E] text-[#191919] font-medium transition-colors"
          >
            Clients
          </button>
        </div>

        {/* SEARCH RESULTS */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#E7E9EF]/50">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.route)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#FD322E]/10 text-[#191919]'
                        : 'hover:bg-[#F8F9FB] text-[#667085]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-[#FD322E] text-white'
                            : 'bg-[#F8F9FB] text-[#620C13] border border-[#E7E9EF]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#191919] flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="font-mono text-[10px] text-[#98A2B3] font-normal">
                            {item.route}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#667085] truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-[#FD322E]' : 'text-transparent'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#667085]">
              <p>No matching screens or actions found for &ldquo;{query}&rdquo;.</p>
              <p className="mt-1 text-[11px]">Try searching &ldquo;project&rdquo;, &ldquo;invoice&rdquo;, or &ldquo;leads&rdquo;.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-2 bg-[#F8F9FB] border-t border-[#E7E9EF] flex items-center justify-between text-[11px] text-[#667085]">
          <div className="flex items-center gap-3">
            <span>
              Use <kbd className="font-mono bg-white px-1 border rounded text-[10px]">↑</kbd>{' '}
              <kbd className="font-mono bg-white px-1 border rounded text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-mono bg-white px-1 border rounded text-[10px]">↵</kbd> to select
            </span>
          </div>
          <span className="font-semibold text-[#620C13]">KR Workspace OS</span>
        </div>
      </div>
    </div>
  );
}

