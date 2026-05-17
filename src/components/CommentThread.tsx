import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2 } from 'lucide-react';
import { useTripComments } from '../hooks/useTripComments';
import { useMyFollowing, type FollowingUser } from '../hooks/social/useMyFollowing';
import { addComment, deleteComment } from '../lib/social/comments';
import { cn } from '@/lib/utils';
import type { TripComment } from '../types';

interface Props {
  tripId: string;
  tripOwnerId: string;
  currentUserId: string;
  currentUsername: string;
  currentPhotoURL: string | null;
}

function Avatar({ photoURL, username }: { photoURL: string | null; username: string }) {
  if (photoURL) {
    return <img src={photoURL} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-bold text-accent uppercase">{username.slice(0, 1)}</span>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: {
  comment: TripComment;
  currentUserId: string;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5 py-2.5 border-b border-divider last:border-0">
      <Avatar photoURL={comment.photoURL} username={comment.username} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold text-text">@{comment.username}</span>
          <span className="text-[10px] text-text-muted">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-text leading-snug mt-0.5 break-words">{comment.text}</p>
      </div>
      {comment.userId === currentUserId && (
        <button
          onClick={() => onDelete(comment.commentId)}
          className="shrink-0 p-1 text-text-muted hover:text-error transition-colors"
          aria-label="Delete comment"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

export function CommentThread({ tripId, tripOwnerId, currentUserId, currentUsername, currentPhotoURL }: Props) {
  const { t } = useTranslation();
  const { comments } = useTripComments(tripId);
  const following = useMyFollowing(currentUserId);

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedUids, setMentionedUids] = useState<{ username: string; uid: string }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions: FollowingUser[] =
    mentionQuery !== null
      ? following
          .filter(
            f =>
              f.username.toLowerCase().startsWith(mentionQuery.toLowerCase()) ||
              f.displayName.toLowerCase().startsWith(mentionQuery.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  function handleTextChange(val: string) {
    setText(val);
    const match = val.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function selectMention(user: FollowingUser) {
    const newText = text.replace(/@\w*$/, `@${user.username} `);
    setText(newText);
    setMentionQuery(null);
    setMentionedUids(prev =>
      prev.some(m => m.uid === user.uid) ? prev : [...prev, { username: user.username, uid: user.uid }],
    );
    inputRef.current?.focus();
  }

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);

    const activeMentions = mentionedUids.filter(m => trimmed.includes(`@${m.username}`));

    try {
      await addComment({
        tripId,
        tripOwnerId,
        userId: currentUserId,
        username: currentUsername,
        photoURL: currentPhotoURL,
        text: trimmed,
        mentionedUids: activeMentions.map(m => m.uid),
      });
      setText('');
      setMentionedUids([]);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    await deleteComment(tripId, commentId, currentUserId).catch(() => {});
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-2">
        {t('comments.label')}
      </p>

      {/* Comment list */}
      <div className="bg-surface border border-divider rounded-[var(--radius-md)] px-4 divide-y divide-divider mb-3">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-muted">{t('comments.empty')}</p>
        ) : (
          comments.map(c => (
            <CommentItem
              key={c.commentId}
              comment={c}
              currentUserId={currentUserId}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* @mention suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-surface border border-divider rounded-[var(--radius-md)] mb-2 overflow-hidden">
          {suggestions.map(u => (
            <button
              key={u.uid}
              onMouseDown={e => { e.preventDefault(); selectMention(u); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-divider/40 text-left"
            >
              <Avatar photoURL={u.photoURL} username={u.username} />
              <div>
                <p className="text-sm font-semibold text-text">@{u.username}</p>
                {u.displayName !== u.username && (
                  <p className="text-xs text-text-muted">{u.displayName}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t('comments.placeholder')}
          maxLength={500}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-surface border border-divider rounded-[var(--radius-md)]',
            'px-3 py-2 text-sm text-text placeholder:text-text-muted',
            'focus:outline-none focus:border-accent transition-colors duration-150',
            'overflow-hidden',
          )}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className={cn(
            'shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-150',
            text.trim() && !submitting
              ? 'bg-accent text-white'
              : 'bg-divider text-text-muted cursor-not-allowed',
          )}
          aria-label={t('comments.post')}
        >
          <Send size={15} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
