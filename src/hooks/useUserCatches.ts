import { useState, useEffect } from 'react';
import { getUserCatches, onCatchesChanged } from '../lib/db';
import type { CatchRecord } from '../types';

export function useUserCatches(userId: string) {
  const [catches, setCatches] = useState<CatchRecord[]>([]);

  useEffect(() => {
    const fetch = () => getUserCatches(userId).then(setCatches);
    fetch();
    return onCatchesChanged(fetch);
  }, [userId]);

  return catches;
}
