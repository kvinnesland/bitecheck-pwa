import { cn } from '@/lib/utils';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  headline: string;
  body?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ headline, body, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-16 px-8 text-center', className)}>
      {icon && (
        <div className="text-text-subtle opacity-40 mb-2">{icon}</div>
      )}
      <AppText variant="titleL" color="primary" as="p">
        {headline}
      </AppText>
      {body && (
        <AppText variant="bodyM" color="secondary" as="p" className="max-w-[260px]">
          {body}
        </AppText>
      )}
      {action && (
        <AppButton variant="secondary" onClick={action.onClick} className="mt-2">
          {action.label}
        </AppButton>
      )}
    </div>
  );
}
