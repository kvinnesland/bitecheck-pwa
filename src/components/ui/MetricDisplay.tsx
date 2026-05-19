import { cn } from '@/lib/utils';
import { AppText } from './AppText';

interface MetricDisplayProps {
  value: string | number;
  label?: string;
  description?: string;
  /** 'L' (default, numberL) | 'M' (numberM) */
  size?: 'L' | 'M';
  className?: string;
  /** Align content */
  align?: 'left' | 'center';
}

export function MetricDisplay({
  value,
  label,
  description,
  size = 'L',
  className,
  align = 'left',
}: MetricDisplayProps) {
  return (
    <div className={cn('flex flex-col', align === 'center' && 'items-center text-center', className)}>
      {label && (
        <AppText variant="labelM" color="tertiary" className="mb-1">
          {label}
        </AppText>
      )}
      <AppText variant={size === 'L' ? 'numberL' : 'numberM'} color="primary">
        {value}
      </AppText>
      {description && (
        <AppText variant="bodyM" color="secondary" className="mt-1.5">
          {description}
        </AppText>
      )}
    </div>
  );
}
