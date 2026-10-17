import React from 'react';
import { cn } from '../../utils/cn';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 focus:ring-teal-600 shadow-xs active:scale-[0.99]',
    teal: 'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 focus:ring-teal-600 shadow-xs active:scale-[0.99]',
    olive: 'bg-[#454F2A] text-white hover:bg-[#384022] active:bg-[#2c331b] focus:ring-[#454F2A] shadow-xs active:scale-[0.99]',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-400 shadow-2xs',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
    subtle: 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 focus:ring-teal-500',
    charcoal: 'bg-navy-900 text-white hover:bg-navy-950 focus:ring-navy-800 shadow-xs active:scale-[0.99]',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}

