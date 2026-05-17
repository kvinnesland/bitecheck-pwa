import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useUserCatches } from '../hooks/useUserCatches';
import { getUserCatches } from '../lib/db';
import { updateCatch, softDeleteCatch, undoDeleteCatch } from '../lib/catches';
import { useUnits } from '../contexts/UnitsContext';
import {
  formatWeight, formatLength,
  weightUnitLabel, lengthUnitLabel,
  weightToDisplay, lengthToDisplay,
  parseWeightToKg, parseLengthToCm,
} from '../lib/units';
import { cn } from '@/lib/utils';
import type { CatchRecord } from '../types';

interface Props { user: User; }

export function Historikk({ user }: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('nb') ? 'no-NO' : 'en-US';
  const { prefs } = useUnits();
  const rawCatches = useUserCatches(user.uid);
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [undoItem, setUndoItem] = useState<{ id: string; name: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [editTarget, setEditTarget] = useState<CatchRecord | null>(null);

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
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center text-text-muted">
        <svg className="w-12 h-12 stroke-divider mb-1" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
        <p className="text-base font-semibold text-text">{t('history.empty')}</p>
        <span className="text-[0.85rem] max-w-[260px] leading-relaxed">{t('history.emptyHint')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-baseline justify-between px-4 pt-5 pb-3 shrink-0">
          <h2 className="text-[1.25rem] font-bold tracking-tight">{t('history.title')}</h2>
          <span className="text-[0.8rem] text-text-muted">{t('history.count', { count: catches.length })}</span>
        </div>

        <ul className="list-none flex flex-col gap-[1px] bg-divider">
          {catches.map((c) => (
            <CatchRow
              key={c.catch_id}
              record={c}
              dateLocale={dateLocale}
              weightUnit={prefs.weight}
              lengthUnit={prefs.length}
              onDelete={() => handleDelete(c)}
              onEdit={() => setEditTarget(c)}
            />
          ))}
        </ul>
      </div>

      {undoItem && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-surface border border-accent rounded-[var(--radius-md)] px-4 py-3 flex items-center gap-4 text-sm shadow-lg z-[9999] whitespace-nowrap"
          style={{ animation: 'slideUp 0.2s ease' }}
        >
          <span>{t('history.deleted', { name: undoItem.name })}</span>
          <button
            onClick={handleUndo}
            className="bg-accent text-white text-[0.8rem] font-bold px-3 py-[5px] rounded-[var(--radius-sm)] transition-colors duration-150 hover:bg-accent/80"
          >
            {t('history.undo')}
          </button>
        </div>
      )}

      {editTarget && (
        <EditModal
          record={editTarget}
          weightUnit={prefs.weight}
          lengthUnit={prefs.length}
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
  dateLocale,
  weightUnit,
  lengthUnit,
}: {
  record: CatchRecord;
  onDelete: () => void;
  onEdit: () => void;
  dateLocale: string;
  weightUnit: import('../lib/units').WeightUnit;
  lengthUnit: import('../lib/units').LengthUnit;
}) {
  const { t } = useTranslation();
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
  const dateStr = date.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

  const hasGps = record.location.accuracy_m !== -1;
  const syncColor =
    record.sync_status === 'synced'  ? 'var(--color-success)' :
    record.sync_status === 'pending' ? 'var(--color-warning)' :
    'var(--color-error)';

  return (
    <li className="relative overflow-hidden bg-error">
      <div className="absolute inset-0 flex items-center justify-end pr-6" aria-hidden>
        <svg className="w-[22px] h-[22px] stroke-white" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </div>

      <div
        className="flex items-center justify-between gap-3 px-4 py-3.5 bg-bg transition-transform duration-150 ease-in-out cursor-pointer select-none active:bg-surface"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => offset === 0 && onEdit()}
      >
        <div className="flex flex-col gap-[3px] flex-1 min-w-0">
          <span className="text-base font-semibold text-text whitespace-nowrap overflow-hidden text-ellipsis">
            {t(`speciesNames.${record.species.name}`, { defaultValue: record.species.name })}
          </span>
          <span className="text-[0.82rem] text-text-muted">
            {[
              record.species.weight_kg != null && formatWeight(record.species.weight_kg, weightUnit),
              record.species.length_cm != null && formatLength(record.species.length_cm, lengthUnit),
            ].filter(Boolean).join(' · ') || t('history.noMeasurements')}
          </span>
          <span className="text-[0.75rem] text-text-muted">{dateStr} {timeStr}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasGps && (
            <svg className="w-3.5 h-3.5 text-success opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
          <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: syncColor }} title={record.sync_status} />
          <svg className="w-4 h-4 text-divider" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  weightUnit,
  lengthUnit,
  onSave,
  onDelete,
  onClose,
}: {
  record: CatchRecord;
  weightUnit: import('../lib/units').WeightUnit;
  lengthUnit: import('../lib/units').LengthUnit;
  onSave: (u: { species_name?: string; weight_kg?: number | null; length_cm?: number | null }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name,   setName]   = useState(record.species.name);
  const [weight, setWeight] = useState(weightToDisplay(record.species.weight_kg, weightUnit));
  const [length, setLength] = useState(lengthToDisplay(record.species.length_cm, lengthUnit));

  function handleSave() {
    onSave({
      species_name: name.trim() || record.species.name,
      weight_kg: weight ? parseWeightToKg(weight, weightUnit) : null,
      length_cm: length ? parseLengthToCm(length, lengthUnit) : null,
    });
  }

  const inputCls = 'bg-bg border border-divider rounded-[var(--radius-md)] text-text text-base font-medium px-3.5 py-3 outline-none w-full transition-colors duration-150 focus:border-accent placeholder:text-divider';

  return (
    <div className="fixed inset-0 bg-black/[0.55] z-[1000] flex items-end" onClick={onClose}>
      <div
        className="bg-surface border border-divider rounded-[var(--radius-lg)_var(--radius-lg)_0_0] w-full px-5 pt-3 pb-8 flex flex-col gap-4"
        style={{ animation: 'slideModal 0.25s ease' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-divider rounded-full self-center mb-1" />
        <h3 className="text-[1.1rem] font-bold">{t('editModal.title')}</h3>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-text-muted">{t('editModal.species')}</span>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {t('editModal.weight')} ({weightUnitLabel(weightUnit)})
          </span>
          <input
            className={cn(inputCls, 'placeholder:text-text-muted')}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {t('editModal.length')} ({lengthUnitLabel(lengthUnit)})
          </span>
          <input
            className={cn(inputCls, 'placeholder:text-text-muted')}
            type="number"
            inputMode="decimal"
            step="1"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="—"
          />
        </label>

        <p className="text-xs text-text-muted">{t('editModal.lockedFields')}</p>

        <div className="flex items-center justify-between gap-2.5 mt-1">
          <button
            onClick={onDelete}
            className="py-3.5 bg-transparent text-error text-[0.9rem] font-semibold underline underline-offset-2 transition-opacity duration-150 hover:opacity-70"
          >
            {t('editModal.delete')}
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 bg-transparent border border-divider rounded-[var(--radius-md)] text-text-muted text-[0.95rem] font-semibold transition-colors duration-150 hover:border-text-muted hover:text-text"
            >
              {t('editModal.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] py-3.5 px-4 bg-accent rounded-[var(--radius-md)] text-white text-[0.95rem] font-bold transition-colors duration-150 hover:bg-accent/80"
            >
              {t('editModal.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
