import { useState, useEffect } from 'react';
import { getUserCatches } from '../lib/db';
import type { CatchRecord } from '../types';

export function useUserCatches(userId: string) {
  const [catches, setCatches] = useState<CatchRecord[]>([]);

  useEffect(() => {
    getUserCatches(userId).then(setCatches);
  }, [userId]);

  return catches;
}
