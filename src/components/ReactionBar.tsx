import { useTripReactions } from '../hooks/useTripReactions';
import { addReaction, removeReaction, REACTION_EMOJI } from '../lib/social/reactions';
import { cn } from '@/lib/utils';

interface Props {
  tripId: string;
  tripOwnerId: string;
  currentUserId: string;
  currentUsername: string;
  currentPhotoURL: string | null;
}

export function ReactionBar({ tripId, tripOwnerId, currentUserId, currentUsername, currentPhotoURL }: Props) {
  const { reactions, myReaction } = useTripReactions(tripId, currentUserId);
  const count = reactions.length;
  const liked = myReaction === REACTION_EMOJI;

  async function handleToggle() {
    if (liked) {
      await removeReaction(tripId, currentUserId).catch(() => {});
    } else {
      await addReaction({
        tripId, userId: currentUserId, tripOwnerId,
        fromUsername: currentUsername, fromPhotoURL: currentPhotoURL,
        emoji: REACTION_EMOJI,
      }).catch(() => {});
    }
  }

  return (
    <button
      onClick={handleToggle}
      aria-pressed={liked}
      className={cn(
        'flex items-center gap-2 transition-colors duration-150 group',
        liked ? 'text-accent' : 'text-text-muted hover:text-text',
      )}
    >
      <span className={cn('transition-transform duration-150 active:scale-75', liked && 'scale-110')}>
        {liked ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.593c-.425-.396-8.993-8.06-8.993-12.597C3.007 5.589 5.61 3 8.993 3c1.87 0 3.593.896 4.674 2.293C14.748 3.895 16.47 3 18.34 3c3.383 0 5.986 2.59 5.986 5.996-.001 4.537-8.569 12.201-8.994 12.597H12z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        )}
      </span>
      {count > 0 && (
        <span className="text-[0.8rem] font-medium tabular-nums">{count}</span>
      )}
    </button>
  );
}
