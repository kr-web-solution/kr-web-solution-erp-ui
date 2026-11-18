'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'underline',
}: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-[#E32B2B] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F7F9] border border-[#E6E8EE]'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F6F7F9] text-[#64748B]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-[#E6E8EE] flex items-center gap-4 sm:gap-6 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`group relative flex items-center gap-2 py-3 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:text-[#E32B2B] ${
              isActive ? 'text-[#E32B2B]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold tabular-nums transition-colors ${
                  isActive
                    ? 'bg-[#FFF1F0] text-[#E32B2B]'
                    : 'bg-[#F6F7F9] text-[#64748B] group-hover:bg-[#EEF1F5]'
                }`}
              >
                {tab.count}
              </span>
            )}
            {/* Red Underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E32B2B] rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
