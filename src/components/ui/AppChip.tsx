import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AppChipProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AppChip({ children, selected, onClick, className }: AppChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)]',
        'px-3 py-1.5 text-[0.78rem] font-[500] leading-none',
        'transition-colors duration-150',
        selected
          ? 'bg-accent-subtle text-accent'
          : 'bg-surface text-text-muted hover:text-text',
        className,
      )}
    >
      {children}
    </button>
  );
}
