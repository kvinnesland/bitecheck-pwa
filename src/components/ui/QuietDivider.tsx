import { cn } from '@/lib/utils';

interface QuietDividerProps {
  className?: string;
  /** 'horizontal' (default) | 'vertical' */
  orientation?: 'horizontal' | 'vertical';
}

export function QuietDivider({ className, orientation = 'horizontal' }: QuietDividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn('self-stretch w-px', className)}
        style={{ background: 'var(--color-divider)' }}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }
  return (
    <div
      className={cn('w-full h-px', className)}
      style={{ background: 'var(--color-divider)' }}
      role="separator"
    />
  );
}
