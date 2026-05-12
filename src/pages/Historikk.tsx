import { useState, useRef, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import { useUserCatches } from '../hooks/useUserCatches';
import { getUserCatches } from '../lib/db';
import { updateCatch, softDeleteCatch, undoDeleteCatch } from '../lib/catches';
import type { CatchRecord } from '../types';
import styles from './Historikk.module.css';

interface Props { user: User; }

export function Historikk({ user }: Props) {
  const rawCatches = useUserCatches(user.uid);
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [undoItem, setUndoItem] = useState<{ id: string; name: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [editTarget, setEditTarget] = useState<CatchRecord | null>(null);

  // Sync local state from hook, sorted newest first
  useEffect(() => {
    setCatches([...rawCatches].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ));
  }, [rawCatches]);

  const refreshFromDB = useCallback(async () => {
    const fresh = await getUserCatches(user.uid);
    setCatches([...fresh].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ));
  }, [user.uid]);

  useEffect(() => {
    return () => { if (undoItem) clearTimeout(undoItem.timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(record: CatchRecord) {
    setCatches((prev) => prev.filter((c) => c.catch_id !== record.catch_id));
    await softDeleteCatch(record.catch_id, user.uid);

    if (undoItem) clearTimeout(undoItem.timer);

    const timer = setTimeout(() => { setUndoItem(null); }, 5000);

    setUndoItem({ id: record.catch_id, name: record.species.name, timer });
  }

  async function handleUndo() {
    if (!undoItem) return;
    clearTimeout(undoItem.timer);
    setUndoItem(null);
    await undoDeleteCatch(undoItem.id, user.uid);
    await refreshFromDB();
  }

  async function handleEdit(
    catchId: string,
    updates: { species_name?: string; weight_kg?: number | null; length_cm?: number | null },
  ) {
    await updateCatch(catchId, user.uid, updates);
    await refreshFromDB();
    setEditTarget(null);
  }

  if (catches.length === 0) {
    return (
      <div className={styles.empty}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
        <p>Ingen fangster ennå</p>
        <span>Trykk på Logg-fanen for å registrere din første fangst</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.title}>Historikk</h2>
          <span className={styles.count}>{catches.length} fangster</span>
        </div>

        <ul className={styles.list}>
          {catches.map((c) => (
            <CatchRow
              key={c.catch_id}
              record={c}
              onDelete={() => handleDelete(c)}
              onEdit={() => setEditTarget(c)}
            />
          ))}
        </ul>
      </div>

      {undoItem && (
        <div className={styles.undoToast}>
          <span>{undoItem.name} slettet</span>
          <button className={styles.undoBtn} onClick={handleUndo}>
            Angre
          </button>
        </div>
      )}

      {editTarget && (
        <EditModal
          record={editTarget}
          onSave={(updates) => handleEdit(editTarget.catch_id, updates)}
          onDelete={() => { handleDelete(editTarget); setEditTarget(null); }}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}

// ─── Swipeable catch row ──────────────────────────────────────────────────────

function CatchRow({
  record,
  onDelete,
  onEdit,
}: {
  record: CatchRecord;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);
  const THRESHOLD = 80;

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    dragging.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const delta = e.touches[0].clientX - startX.current;
    if (delta < 0) setOffset(Math.max(delta, -120));
  }

  function onTouchEnd() {
    dragging.current = false;
    if (offset < -THRESHOLD) {
      onDelete();
    } else {
      setOffset(0);
    }
  }

  const date = new Date(record.created_at);
  const dateStr = date.toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

  const hasGps = record.location.accuracy_m !== -1;
  const syncColor =
    record.sync_status === 'synced'  ? 'var(--color-success)' :
    record.sync_status === 'pending' ? 'var(--color-warning)' :
    'var(--color-error)';

  return (
    <li className={styles.rowWrap}>
      <div className={styles.rowDelete} aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </div>

      <div
        className={styles.row}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => offset === 0 && onEdit()}
      >
        <div className={styles.rowLeft}>
          <span className={styles.species}>{record.species.name}</span>
          <span className={styles.meta}>
            {[
              record.species.weight_kg != null && `${record.species.weight_kg} kg`,
              record.species.length_cm != null && `${record.species.length_cm} cm`,
            ].filter(Boolean).join(' · ') || 'Ingen mål'}
          </span>
          <span className={styles.datetime}>{dateStr} {timeStr}</span>
        </div>

        <div className={styles.rowRight}>
          {hasGps && (
            <svg className={styles.gpsIcon} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
          <span className={styles.syncDot} style={{ background: syncColor }} title={record.sync_status} />
          <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </li>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  record,
  onSave,
  onDelete,
  onClose,
}: {
  record: CatchRecord;
  onSave: (u: { species_name?: string; weight_kg?: number | null; length_cm?: number | null }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name,   setName]   = useState(record.species.name);
  const [weight, setWeight] = useState(record.species.weight_kg?.toString() ?? '');
  const [length, setLength] = useState(record.species.length_cm?.toString() ?? '');

  function handleSave() {
    onSave({
      species_name: name.trim() || record.species.name,
      weight_kg: weight ? parseFloat(weight) : null,
      length_cm: length ? parseFloat(length) : null,
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <h3 className={styles.modalTitle}>Rediger fangst</h3>

        <label className={styles.modalField}>
          <span>Art</span>
          <input
            className={styles.modalInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className={styles.modalField}>
          <span>Vekt (kg)</span>
          <input
            className={styles.modalInput}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
          />
        </label>

        <label className={styles.modalField}>
          <span>Lengde (cm)</span>
          <input
            className={styles.modalInput}
            type="number"
            inputMode="decimal"
            step="1"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="—"
          />
        </label>

        <p className={styles.modalLocked}>
          GPS og tidspunkt kan ikke endres
        </p>

        <div className={styles.modalActions}>
          <button className={styles.modalDelete} onClick={onDelete}>Slett fangst</button>
          <div className={styles.modalActionsRight}>
            <button className={styles.modalCancel} onClick={onClose}>Avbryt</button>
            <button className={styles.modalSave}   onClick={handleSave}>Lagre</button>
          </div>
        </div>
      </div>
    </div>
  );
}
