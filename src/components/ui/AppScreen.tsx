import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AppScreenProps {
  children: ReactNode;
  className?: string;
  /** Apply standard horizontal padding (px-5 / px-6) */
  padded?: boolean;
  /** Start below the iOS/Android status bar */
  safeTop?: boolean;
}

export function AppScreen({ children, className, padded, safeTop }: AppScreenProps) {
  return (
    <div
      className={cn(
        'h-full overflow-y-auto bg-bg',
        padded && 'px-5',
        className,
      )}
      style={safeTop ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
    >
      {children}
    </div>
  );
}
