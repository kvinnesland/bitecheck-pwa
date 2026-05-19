import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:   'bg-accent text-bg font-semibold hover:opacity-90 active:opacity-80',
  secondary: 'bg-accent-subtle text-text font-semibold hover:opacity-90 active:opacity-75',
  ghost:     'bg-transparent text-text-muted font-medium hover:text-text active:bg-accent-subtle',
};

export function AppButton({
  variant = 'primary',
  children,
  className,
  fullWidth,
  disabled,
  ...rest
}: AppButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-[var(--radius-md)] px-5 py-[14px] text-[0.9rem]',
        'transition-opacity duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
