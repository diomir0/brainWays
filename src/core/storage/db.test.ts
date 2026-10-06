import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

beforeEach(() => {
  // `fake-indexeddb/auto` installs a shared global. Swap in a fresh factory and
  // reset the module registry so the module-level `dbPromise` cache in db.ts is
  // also cleared, keeping tests isolated.
  globalThis.indexedDB = new IDBFactory();
  vi.resetModules();
});

// Imported per-test (after the reset above) so each test gets a fresh db.ts.
const db = () => import('./db');

describe('kv storage', () => {
  it('round-trips a nested object through kvSet/kvGet', async () => {
    const { kvGet, kvSet } = await db();
    const value = { ease: 2.5, tags: ['a', 'b'], meta: { reps: 3, seen: true } };
    await kvSet('progress:question:1', value);
    await expect(kvGet('progress:question:1')).resolves.toEqual(value);
  });

  it('resolves undefined for an unknown key', async () => {
    const { kvGet } = await db();
    await expect(kvGet('does:not:exist')).resolves.toBeUndefined();
  });

  it('overwrites an existing key', async () => {
    const { kvGet, kvSet } = await db();
    await kvSet('review:card:x', { reps: 1 });
    await kvSet('review:card:x', { reps: 2 });
    await expect(kvGet('review:card:x')).resolves.toEqual({ reps: 2 });
  });

  it('removes a key with kvDelete', async () => {
    const { kvGet, kvSet, kvDelete } = await db();
    await kvSet('review:card:x', { reps: 1 });
    await kvDelete('review:card:x');
    await expect(kvGet('review:card:x')).resolves.toBeUndefined();
  });

  it('returns only keys sharing the given prefix', async () => {
    const { kvSet, kvKeys } = await db();
    await kvSet('progress:question:a', 1);
    await kvSet('progress:question:b', 2);
    await kvSet('review:card:x', 3);

    const keys = await kvKeys('progress:question:');
    expect(keys.sort()).toEqual(['progress:question:a', 'progress:question:b']);
  });
});
