import React, { createContext, useContext, useState } from 'react';
import { type UnitPrefs, loadUnitPrefs, saveUnitPrefs } from '../lib/units';

interface UnitsContextValue {
  prefs: UnitPrefs;
  update: (patch: Partial<UnitPrefs>) => void;
}

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UnitPrefs>(loadUnitPrefs);

  function update(patch: Partial<UnitPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveUnitPrefs(next);
  }

  return <UnitsContext.Provider value={{ prefs, update }}>{children}</UnitsContext.Provider>;
}

export function useUnits(): UnitsContextValue {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
}
