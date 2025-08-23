'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#e9407a] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-[#e9407a] to-[#ff8a00] text-white hover:from-[#d63384] hover:to-[#e67e22] shadow-sm',
        secondary: 'border-transparent bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 border border-white/20',
        destructive:
          'border-transparent bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c]',
        outline: 'text-white border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
