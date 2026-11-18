'use client';

import React from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  icon?: React.ReactNode;
  status?: 'completed' | 'current' | 'future' | 'failed';
  badge?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={`relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6E8EE] ${className}`}>
      {items.map((item) => {
        const statusColors = {
          completed: 'bg-[#16A34A] border-white text-white',
          current: 'bg-[#E32B2B] ring-4 ring-[#FFF1F0] text-white',
          future: 'bg-[#EEF1F5] text-[#94A3B8]',
          failed: 'bg-[#B91C1C] ring-4 ring-[#FDECEC] text-white',
        }[item.status || 'completed'];

        return (
          <div key={item.id} className="relative group">
            {/* Timeline bullet */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs ${statusColors}`}
            >
              {item.icon || <div className="w-1.5 h-1.5 rounded-full bg-current" />}
            </div>

            {/* Content */}
            <div className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-semibold ${
                    item.status === 'future' ? 'text-[#94A3B8]' : 'text-[#0F172A]'
                  }`}
                >
                  {item.title}
                </span>
                <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
                  {item.timestamp}
                </span>
              </div>
              {item.description && (
                <p className="mt-0.5 text-[#64748B] leading-relaxed">
                  {item.description}
                </p>
              )}
              {item.badge && <div className="mt-1">{item.badge}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
