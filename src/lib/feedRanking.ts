import type { Trip } from '../types';

export function computeFeedScore(trip: Trip, seenIds: Set<string>): number {
  const ageHours = (Date.now() - new Date(trip.startedAt).getTime()) / 3600000;

  // Live trips always score high; closed trips decay over 72h
  const freshness = trip.status === 'open'
    ? 1.5
    : Math.max(0, 1 - ageHours / 72);

  const reactionTotal = Object.values(trip.reactionCounts ?? {}).reduce((a, b) => a + b, 0);
  const engagement = trip.catchCount * 0.2 + reactionTotal * 0.3 + (trip.commentCount ?? 0) * 0.5;

  // Already-seen trips surface lower
  const seenMultiplier = seenIds.has(trip.tripId) ? 0.4 : 1.0;

  return (freshness + engagement) * seenMultiplier;
}

export function rankTrips<T extends Trip>(trips: T[], seenIds: Set<string>): T[] {
  return [...trips].sort((a, b) => computeFeedScore(b, seenIds) - computeFeedScore(a, seenIds));
}
