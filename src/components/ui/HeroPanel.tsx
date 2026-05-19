import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface HeroPanelProps {
  children: ReactNode;
  className?: string;
  /** Gradient or solid background for the panel */
  background?: string;
  /** Image URL to use as panel background */
  imageUrl?: string;
  /** Overlay opacity 0–1. Default 0.45 for text readability. */
  overlayOpacity?: number;
  /** Warm dark overlay (true) or default black overlay (false) */
  warmOverlay?: boolean;
}

export function HeroPanel({
  children,
  className,
  background,
  imageUrl,
  overlayOpacity = 0.45,
  warmOverlay = false,
}: HeroPanelProps) {
  const overlayColor = warmOverlay
    ? `rgba(7, 17, 15, ${overlayOpacity})`
    : `rgba(0, 0, 0, ${overlayOpacity})`;

  return (
    <div
      className={cn('relative overflow-hidden rounded-[var(--radius-lg)]', className)}
      style={background ? { background } : undefined}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
        />
      )}
      {(imageUrl || background) && (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${overlayColor} 0%, rgba(0,0,0,0.15) 100%)` }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
