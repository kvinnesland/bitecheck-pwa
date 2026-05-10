let _pending: string | null = null;
export function setPendingSpecies(name: string) { _pending = name; }
export function consumePendingSpecies(): string | null { const v = _pending; _pending = null; return v; }
