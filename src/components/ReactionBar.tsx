import { useTranslation } from 'react-i18next';
import { useTripReactions } from '../hooks/useTripReactions';
import { addReaction, removeReaction, REACTION_EMOJIS, type ReactionEmoji } from '../lib/social/reactions';
import { cn } from '@/lib/utils';

interface Props {
  tripId: string;
  tripOwnerId: string;
  currentUserId: string;
  currentUsername: string;
  currentPhotoURL: string | null;
}

export function ReactionBar({ tripId, tripOwnerId, currentUserId, currentUsername, currentPhotoURL }: Props) {
  const { t } = useTranslation();
  const { reactions, myReaction } = useTripReactions(tripId, currentUserId);

  const counts = REACTION_EMOJIS.reduce<Record<string, number>>((acc, e) => {
    acc[e] = reactions.filter(r => r.emoji === e).length;
    return acc;
  }, {});

  async function handleToggle(emoji: ReactionEmoji) {
    if (myReaction === emoji) {
      await removeReaction(tripId, currentUserId).catch(() => {});
    } else {
      await addReaction({ tripId, userId: currentUserId, tripOwnerId, fromUsername: currentUsername, fromPhotoURL: currentPhotoURL, emoji }).catch(() => {});
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-2">
        {t('reactions.label')}
      </p>
      <div className="flex gap-2 flex-wrap">
        {REACTION_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleToggle(emoji)}
            aria-pressed={myReaction === emoji}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors duration-150',
              myReaction === emoji
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-surface border-divider text-text-muted hover:border-accent/50',
            )}
          >
            <span>{emoji}</span>
            {counts[emoji] > 0 && (
              <span className={cn('text-xs font-semibold', myReaction === emoji ? 'text-accent' : 'text-text-muted')}>
                {counts[emoji]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
