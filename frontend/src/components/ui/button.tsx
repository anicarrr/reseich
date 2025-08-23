'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9407a] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#e9407a] to-[#ff8a00] text-white hover:from-[#d63384] hover:to-[#e67e22] transform hover:scale-105 shadow-lg hover:shadow-xl',
        destructive:
          'bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:from-[#dc2626] hover:to-[#b91c1c] transform hover:scale-105',
        outline: 'border border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:text-white',
        secondary: 'bg-white/10 text-white backdrop-blur-sm hover:bg-white/20',
        ghost: 'text-white hover:bg-white/10 hover:text-white',
        link: 'text-[#e9407a] underline-offset-4 hover:underline hover:text-[#ff8a00]'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
