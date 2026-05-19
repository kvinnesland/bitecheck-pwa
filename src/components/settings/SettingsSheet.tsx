import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type User } from 'firebase/auth';
import { useUnits } from '../../contexts/UnitsContext';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import { QuietDivider } from '../ui/QuietDivider';
import { cn } from '@/lib/utils';
import { DEMO_PROFILES } from '../../lib/demoData';
import { seedProfile, unseedProfile, isProfileSeeded } from '../../lib/seedDemo';

interface Props {
  user: User;
  onClose: () => void;
  onSignOut: () => void;
}

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'nb', label: 'Norsk' },
] as const;

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-0.5 bg-bg rounded-[var(--radius-sm)] p-0.5">
      {options.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'px-3.5 py-1.5 rounded-[10px] text-[0.82rem] font-medium transition-colors duration-150',
            value === v ? 'bg-surface text-text' : 'text-text-subtle hover:text-text-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0',
        checked ? 'bg-accent' : 'bg-surface border border-divider',
      )}
    >
      <span className={cn(
        'absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200',
        checked && 'translate-x-[18px]',
      )} />
    </button>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <AppText variant="bodyM" color="primary">{label}</AppText>
      {children}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <AppText variant="labelM" color="tertiary" as="p" className="pt-5 pb-1 px-5">
      {label}
    </AppText>
  );
}

function DemoSection() {
  type Status = 'loading' | 'seeded' | 'unseeded' | 'working';
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    () => Object.fromEntries(DEMO_PROFILES.map(p => [p.id, 'loading'])),
  );

  useEffect(() => {
    DEMO_PROFILES.forEach(async p => {
      const seeded = await isProfileSeeded(p).catch(() => false);
      setStatuses(s => ({ ...s, [p.id]: seeded ? 'seeded' : 'unseeded' }));
    });
  }, []);

  async function toggle(id: string) {
    const profile = DEMO_PROFILES.find(p => p.id === id)!;
    setStatuses(s => ({ ...s, [id]: 'working' }));
    try {
      if (statuses[id] === 'seeded') {
        await unseedProfile(profile);
        setStatuses(s => ({ ...s, [id]: 'unseeded' }));
      } else {
        await seedProfile(profile);
        setStatuses(s => ({ ...s, [id]: 'seeded' }));
      }
    } catch {
      setStatuses(s => ({ ...s, [id]: statuses[id] === 'seeded' ? 'seeded' : 'unseeded' }));
    }
  }

  return (
    <>
      <SectionHeader label="Demo" />
      <div className="px-5 pb-2 space-y-3">
        {DEMO_PROFILES.map(p => {
          const status = statuses[p.id];
          const isSeeded = status === 'seeded';
          const isWorking = status === 'working' || status === 'loading';
          return (
            <div key={p.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <AppText variant="bodyM" color="primary" as="p" className="truncate">{p.name}</AppText>
                <AppText variant="labelM" color="tertiary" as="p" className="mt-0.5 normal-case tracking-normal text-[0.68rem]">
                  {p.trips.length} trips · {p.trips.reduce((n, t) => n + t.catches.filter(c => !c.isMoment).length, 0)} catches
                </AppText>
              </div>
              <button
                onClick={() => toggle(p.id)}
                disabled={isWorking}
                className={cn(
                  'shrink-0 px-3 py-1 rounded-[var(--radius-sm)] text-[0.78rem] font-medium transition-colors duration-150',
                  isSeeded ? 'text-error hover:bg-error/10' : 'text-accent hover:bg-accent-subtle',
                  isWorking && 'opacity-40 pointer-events-none',
                )}
              >
                {isWorking ? '…' : isSeeded ? 'Remove' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

const DISMISS_THRESHOLD = 80;

export function SettingsSheet({ user, onClose, onSignOut }: Props) {
  const { t, i18n } = useTranslation();
  const activeLang = i18n.language.startsWith('nb') ? 'nb' : 'en';
  const { prefs, update } = useUnits();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    dragging.current = true;
    setIsDragging(true);
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  }
  function handleTouchEnd() {
    dragging.current = false;
    setIsDragging(false);
    if (dragY > DISMISS_THRESHOLD) {
      setDragY(window.innerHeight);
      setTimeout(onClose, 220);
    } else {
      setDragY(0);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[1200] flex items-end" onClick={onClose}>
      <div
        className="bg-surface rounded-t-[var(--radius-lg)] w-full max-h-[88dvh] overflow-y-auto flex flex-col will-change-transform"
        style={{
          transform: visible ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 0.25s var(--ease-soft)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div
          className="w-8 h-[3px] bg-divider rounded-full mx-auto mt-3.5 mb-3 shrink-0 cursor-grab touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <div className="px-5 pb-4 border-b border-divider">
          <AppText variant="titleM" color="primary" as="h2">{t('settings.title')}</AppText>
        </div>

        {/* Language */}
        <SectionHeader label={t('settings.language')} />
        <div className="px-5 pb-4">
          <SegmentedControl
            options={LANGS.map(l => ({ value: l.code, label: l.label }))}
            value={activeLang}
            onChange={code => i18n.changeLanguage(code)}
          />
        </div>

        <QuietDivider className="mx-5" />

        {/* Appearance */}
        <SectionHeader label={t('settings.appearance')} />
        <div className="px-5">
          <SettingRow label={t('settings.darkMode')}>
            <Toggle checked={isDark} onChange={toggleTheme} />
          </SettingRow>
        </div>

        <QuietDivider className="mx-5" />

        {/* Units */}
        <SectionHeader label={t('settings.units')} />
        <div className="px-5 divide-y divide-divider">
          <SettingRow label={t('settings.weight')}>
            <SegmentedControl
              options={(['kg', 'lb'] as const).map(v => ({ value: v, label: v }))}
              value={prefs.weight}
              onChange={v => update({ weight: v })}
            />
          </SettingRow>
          <SettingRow label={t('settings.length')}>
            <SegmentedControl
              options={(['cm', 'in'] as const).map(v => ({ value: v, label: v }))}
              value={prefs.length}
              onChange={v => update({ length: v })}
            />
          </SettingRow>
          <SettingRow label={t('settings.temperature')}>
            <SegmentedControl
              options={(['c', 'f'] as const).map(v => ({ value: v, label: v === 'c' ? '°C' : '°F' }))}
              value={prefs.temp}
              onChange={v => update({ temp: v })}
            />
          </SettingRow>
        </div>

        <QuietDivider className="mx-5 mt-1" />

        <DemoSection />

        <QuietDivider className="mx-5 mt-3" />

        {/* Account */}
        <div className="px-5 py-4 flex items-center gap-3">
          {user.photoURL && (
            <img
              src={user.photoURL} alt={user.displayName ?? ''}
              className="w-9 h-9 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <AppText variant="bodyM" color="secondary" as="span" className="truncate">
            {user.displayName ?? user.email}
          </AppText>
        </div>

        <div className="px-5 pb-10">
          <button
            onClick={onSignOut}
            className="w-full py-3.5 text-error text-[0.9rem] font-medium rounded-[var(--radius-md)] border border-error/30 hover:bg-error/6 transition-colors duration-150"
          >
            {t('settings.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
