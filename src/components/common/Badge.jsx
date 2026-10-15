import React from 'react';
import { cn } from '../../utils/cn';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantStyles = {
    neutral: 'bg-[#E5E8E1] text-[#445363] border-[#ccd1c6]',
    primary: 'bg-[#FAF8F1] text-[#445363] border-[#445363]/25 font-semibold',
    teal: 'bg-[#454F2A]/10 text-[#454F2A] border-[#454F2A]/30 font-semibold',
    olive: 'bg-[#454F2A]/15 text-[#454F2A] border-[#454F2A]/35 font-semibold',
    emerald: 'bg-[#454F2A]/10 text-[#454F2A] border-[#454F2A]/30',
    amber: 'bg-[#EDD575]/35 text-[#445363] border-[#EDD575]/80 font-semibold',
    mustard: 'bg-[#EDD575]/40 text-[#445363] border-[#EDD575] font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
        variantStyles[variant] || variantStyles.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

