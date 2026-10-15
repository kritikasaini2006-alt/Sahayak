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
    primary: 'bg-[#454F2A] text-[#FAF8F1] hover:bg-[#384022] active:bg-[#2c331b] focus:ring-[#454F2A] shadow-sm active:scale-[0.99]',
    teal: 'bg-[#454F2A] text-[#FAF8F1] hover:bg-[#384022] active:bg-[#2c331b] focus:ring-[#454F2A] shadow-sm active:scale-[0.99]',
    olive: 'bg-[#454F2A] text-[#FAF8F1] hover:bg-[#384022] active:bg-[#2c331b] focus:ring-[#454F2A] shadow-sm active:scale-[0.99]',
    outline: 'border border-[#445363]/30 bg-[#FAF8F1] text-[#445363] hover:bg-[#E5E8E1] hover:border-[#445363]/60 focus:ring-[#445363] shadow-sm',
    ghost: 'text-[#445363] hover:bg-[#E5E8E1] focus:ring-[#445363]',
    subtle: 'bg-[#E5E8E1] text-[#454F2A] hover:bg-[#d8dcd3] border border-[#454F2A]/30 focus:ring-[#454F2A]',
    charcoal: 'bg-[#445363] text-[#FAF8F1] hover:bg-[#34404e] focus:ring-[#445363] shadow-sm active:scale-[0.99]',
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

