export type WeightUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'in';
export type TempUnit = 'c' | 'f';

export interface UnitPrefs {
  weight: WeightUnit;
  length: LengthUnit;
  temp: TempUnit;
}

const STORAGE_KEY = 'bc_units';
const DEFAULTS: UnitPrefs = { weight: 'kg', length: 'cm', temp: 'c' };

export function loadUnitPrefs(): UnitPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<UnitPrefs>) };
  } catch {}
  return { ...DEFAULTS };
}

export function saveUnitPrefs(prefs: UnitPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// ── Weight ─────────────────────────────────────────────────────────────────────

export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === 'lb') return `${(kg * 2.20462).toFixed(1)} lb`;
  return `${kg} kg`;
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'lb' ? 'lb' : 'kg';
}

export function weightToDisplay(kg: number | null | undefined, unit: WeightUnit): string {
  if (kg == null) return '';
  if (unit === 'lb') return (kg * 2.20462).toFixed(1);
  return kg.toString();
}

export function parseWeightToKg(value: string, unit: WeightUnit): number | null {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return null;
  return unit === 'lb' ? n / 2.20462 : n;
}

// ── Length ─────────────────────────────────────────────────────────────────────

export function formatLength(cm: number, unit: LengthUnit): string {
  if (unit === 'in') return `${(cm * 0.393701).toFixed(1)} in`;
  return `${cm} cm`;
}

export function lengthUnitLabel(unit: LengthUnit): string {
  return unit === 'in' ? 'in' : 'cm';
}

export function lengthToDisplay(cm: number | null | undefined, unit: LengthUnit): string {
  if (cm == null) return '';
  if (unit === 'in') return (cm * 0.393701).toFixed(1);
  return cm.toString();
}

export function parseLengthToCm(value: string, unit: LengthUnit): number | null {
  const n = parseFloat(value);
  if (isNaN(n) || n < 0) return null;
  return unit === 'in' ? n / 0.393701 : n;
}

// ── Temperature ────────────────────────────────────────────────────────────────

export function celsiusToDisplay(c: number, unit: TempUnit): number {
  if (unit === 'f') return Math.round((c * 9 / 5 + 32) * 10) / 10;
  return c;
}

export function displayToCelsius(display: number, unit: TempUnit): number {
  if (unit === 'f') return (display - 32) * 5 / 9;
  return display;
}

export function tempUnitLabel(unit: TempUnit): string {
  return unit === 'f' ? '°F' : '°C';
}
