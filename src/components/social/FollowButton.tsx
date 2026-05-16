import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useFollow } from '../../hooks/social/useFollow';

interface Props {
  myUid: string;
  targetUid: string;
  targetIsPrivate: boolean;
}

export function FollowButton({ myUid, targetUid, targetIsPrivate }: Props) {
  const { t } = useTranslation();
  const { status, follow, unfollow } = useFollow(myUid, targetUid, targetIsPrivate);
  const [working, setWorking] = useState(false);

  if (myUid === targetUid || status === 'loading') return null;

  async function handleClick() {
    setWorking(true);
    try {
      if (status === 'none') await follow();
      else await unfollow();
    } finally {
      setWorking(false);
    }
  }

  const isFollowing = status === 'active';
  const isPending = status === 'pending';

  return (
    <button
      onClick={handleClick}
      disabled={working}
      className={cn(
        'px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors duration-150',
        isFollowing || isPending
          ? 'border-divider text-text-muted hover:border-error hover:text-error'
          : 'bg-accent text-white border-accent hover:bg-accent/90',
        working && 'opacity-40 pointer-events-none',
      )}
    >
      {working ? '…' : isFollowing ? t('follow.following') : isPending ? t('follow.requested') : t('follow.follow')}
    </button>
  );
}
