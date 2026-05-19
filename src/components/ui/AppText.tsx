import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

export type TextVariant =
  | 'displayXL' | 'displayL'
  | 'titleL' | 'titleM'
  | 'bodyL' | 'bodyM'
  | 'labelM'
  | 'numberL' | 'numberM';

export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'inverse';

interface AppTextProps {
  variant: TextVariant;
  color?: TextColor;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<TextVariant, string> = {
  // Serif — emotional/editorial only. Fraunces 400–500.
  displayXL: 'font-display font-[450] text-[2.75rem] leading-[1.08] tracking-[-0.02em]',
  displayL:  'font-display font-[450] text-[2.1rem] leading-[1.1] tracking-[-0.015em]',
  titleL:    'font-display font-[450] text-[1.65rem] leading-[1.15]',

  // Sans — all functional UI
  titleM:  'font-sans font-semibold text-[1.15rem] leading-[1.25]',
  bodyL:   'font-sans font-normal text-[1.05rem] leading-[1.5]',
  bodyM:   'font-sans font-normal text-[0.92rem] leading-[1.45]',
  labelM:  'font-sans font-[550] text-[0.72rem] leading-[1.2] tracking-[0.06em] uppercase',
  numberL: 'font-sans font-[575] text-[3rem] leading-[1] tracking-[-0.03em]',
  numberM: 'font-sans font-[575] text-[1.5rem] leading-[1.1] tracking-[-0.01em]',
};

const COLOR_CLASSES: Record<TextColor, string> = {
  primary:   'text-text',
  secondary: 'text-text-muted',
  tertiary:  'text-text-subtle',
  accent:    'text-accent',
  inverse:   'text-bg',
};

export function AppText({
  variant,
  color = 'primary',
  as: Tag = 'span',
  className,
  children,
}: AppTextProps) {
  return (
    <Tag className={cn(VARIANT_CLASSES[variant], COLOR_CLASSES[color], className)}>
      {children}
    </Tag>
  );
}
