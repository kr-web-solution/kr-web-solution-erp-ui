'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';

export function Sparkline({
  values,
  positive = true,
  className,
  width = 88,
  height = 36,
}: {
  values: number[];
  positive?: boolean;
  className?: string;
  width?: number;
  height?: number;
}) {
  const path = useMemo(() => {
    const data = values.length >= 2 ? values : [0, 0, 0, 0, 0, 1];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = i * stepX;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values, width, height]);

  const stroke = positive ? '#16A34A' : '#E32B2B';
  const fill = positive ? 'rgba(22,163,74,0.12)' : 'rgba(227,43,43,0.12)';

  const area = useMemo(() => {
    if (!path.startsWith('M')) return '';
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('block h-[28px] w-full max-w-[160px] overflow-visible', className)}
      aria-hidden
    >
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
