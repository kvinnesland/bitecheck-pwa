import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AppCardProps {
  children: ReactNode;
  className?: string;
  /** 'surface' (default) | 'elevated' — controls background depth */
  surface?: 'surface' | 'elevated';
  /** Add a very subtle border (use only when tonal separation isn't enough) */
  bordered?: boolean;
  /** Internal padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const PADDING_CLASSES = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
} as const;

export function AppCard({
  children,
  className,
  surface = 'surface',
  bordered = false,
  padding = 'md',
  onClick,
}: AppCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-md)] overflow-hidden w-full text-left',
        surface === 'surface'  && 'bg-surface',
        surface === 'elevated' && 'bg-elevated',
        bordered && 'border border-divider',
        PADDING_CLASSES[padding],
        onClick && 'cursor-pointer transition-opacity duration-150 active:opacity-70',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
