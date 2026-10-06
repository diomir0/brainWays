import type { SrsState } from '../../types/assessment';

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function initialState(): SrsState {
  return { ease: 2.5, interval: 0, reps: 0, due: 0, lapses: 0 };
}

/**
 * SM-2 scheduling. `quality` is the self/auto-graded recall quality 0..5
 * (>= 3 counts as "remembered").
 */
export function schedule(prev: SrsState, quality: number, now = Date.now()): SrsState {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const ease = Math.max(
    MIN_EASE,
    prev.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  if (q < 3) {
    // Failed: reset repetition, shorten interval to 1 day.
    return { ease, interval: 1, reps: 0, due: now + DAY_MS, lapses: prev.lapses + 1 };
  }

  let interval: number;
  if (prev.reps === 0) interval = 1;
  else if (prev.reps === 1) interval = 6;
  else interval = Math.round(prev.interval * prev.ease);

  return { ease, interval, reps: prev.reps + 1, due: now + interval * DAY_MS, lapses: prev.lapses };
}

export function isDue(state: SrsState, now = Date.now()): boolean {
  return state.due <= now;
}
