import React from 'react';
import { cn } from '../../utils/cn';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variantStyles = {
    neutral: 'bg-stone-100 text-slate-700 border-stone-200',
    primary: 'bg-teal-50 text-teal-800 border-teal-200/80 font-semibold',
    teal: 'bg-teal-50 text-teal-800 border-teal-200 font-semibold',
    olive: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
    amber: 'bg-amber-50 text-amber-900 border-amber-200 font-semibold',
    mustard: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
    navy: 'bg-navy-50 text-navy-900 border-navy-200 font-semibold',
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

