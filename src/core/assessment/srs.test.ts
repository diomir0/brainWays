import { describe, it, expect } from 'vitest';
import { initialState, schedule, isDue } from './srs';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('SM-2 scheduler', () => {
  it('starts with a neutral ease and no reps', () => {
    const s = initialState();
    expect(s).toEqual({ ease: 2.5, interval: 0, reps: 0, due: 0, lapses: 0 });
  });

  it('schedules 1 day then 6 days for the first two successes', () => {
    const now = 1_000_000_000_000;
    const first = schedule(initialState(), 5, now);
    expect(first.reps).toBe(1);
    expect(first.interval).toBe(1);
    expect(first.due).toBe(now + DAY_MS);

    const second = schedule(first, 5, now);
    expect(second.reps).toBe(2);
    expect(second.interval).toBe(6);
    expect(second.due).toBe(now + 6 * DAY_MS);
  });

  it('multiplies the interval by the previous ease on later reviews', () => {
    const now = 0;
    const s2 = { ease: 2.5, interval: 6, reps: 2, due: 0, lapses: 0 };
    const s3 = schedule(s2, 5, now);
    expect(s3.interval).toBe(Math.round(6 * 2.5));
    expect(s3.reps).toBe(3);
  });

  it('resets reps and shortens the interval on a lapse', () => {
    const now = 0;
    const learned = { ease: 2.5, interval: 30, reps: 4, due: 0, lapses: 1 };
    const failed = schedule(learned, 1, now);
    expect(failed.reps).toBe(0);
    expect(failed.interval).toBe(1);
    expect(failed.due).toBe(now + DAY_MS);
    expect(failed.lapses).toBe(2);
  });

  it('never lets ease fall below the 1.3 floor', () => {
    let s = initialState();
    for (let i = 0; i < 20; i++) s = schedule(s, 0, 0);
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('reports due state relative to now', () => {
    expect(isDue({ ease: 2.5, interval: 1, reps: 1, due: 100, lapses: 0 }, 100)).toBe(true);
    expect(isDue({ ease: 2.5, interval: 1, reps: 1, due: 100, lapses: 0 }, 99)).toBe(false);
  });
});
