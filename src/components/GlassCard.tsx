import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'dark';
}

export default function GlassCard({ children, className, variant = 'default' }: GlassCardProps) {
  return (
    <div className={cn(
      'rounded-2xl p-6 transition-all duration-300',
      variant === 'default' && 'glass',
      variant === 'strong' && 'glass-strong',
      variant === 'dark' && 'glass-dark',
      className
    )}>
      {children}
    </div>
  );
}
