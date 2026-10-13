import { useEffect, useMemo, useState } from 'react';
import { buildReviewCards, getCardState, loadAllCardStates, saveCardState } from '../core/assessment/cards';
import { getNetworks } from '../core/content/networks';
import { getCognitiveSystems } from '../core/content/cognitiveSystems';
import { getThemes } from '../core/content/themes';
import { schedule } from '../core/assessment/srs';
import type { SrsState } from '../types/assessment';

const SESSION_LIMIT = 20;

const GRADE_BUTTONS: { label: string; quality: number; cls: string }[] = [
  { label: 'Again', quality: 1, cls: 'bg-red-900/60 hover:bg-red-800' },
  { label: 'Hard', quality: 3, cls: 'bg-amber-900/60 hover:bg-amber-800' },
  { label: 'Good', quality: 4, cls: 'bg-green-900/60 hover:bg-green-800' },
  { label: 'Easy', quality: 5, cls: 'bg-sky-900/60 hover:bg-sky-800' },
];

export function Review() {
  const allCards = useMemo(() => buildReviewCards(), []);
  const themes = useMemo(() => getThemes(), []);
  const networks = useMemo(() => getNetworks(), []);
  const cognitiveSystems = useMemo(() => getCognitiveSystems(), []);

  const [deckFilter, setDeckFilter] = useState<{ kind: 'theme' | 'network' | 'cognitive'; id: string } | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);

  const deck = useMemo(
    () =>
      deckFilter
        ? allCards.filter((c) =>
            (deckFilter.kind === 'theme'
              ? c.themes
              : deckFilter.kind === 'network'
                ? c.networks
                : c.cognitiveSystems
            ).includes(deckFilter.id),
          )
        : allCards,
    [allCards, deckFilter],
  );
  const current = queue.length ? allCards.find((c) => c.id === queue[0]) : undefined;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const states = await loadAllCardStates();
      const now = Date.now();
      const due = deck
        .filter((c) => {
          const s = states[c.id];
          return !s || s.due <= now;
        })
        .map((c) => c.id)
        .slice(0, SESSION_LIMIT);
      if (!alive) return;
      setQueue(due);
      setRemaining(due.length);
      setLoading(false);
      setFlipped(false);
    })();
    return () => {
      alive = false;
    };
  }, [deck]);

  async function grade(quality: number) {
    if (!current) return;
    const prev = await getCardState(current.id);
    const next: SrsState = schedule(prev, quality);
    await saveCardState(current.id, next);
    setFlipped(false);
    setQueue((q) => q.slice(1));
    setRemaining((n) => n - 1);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Deck selector */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-edge px-4 py-2.5">
        <button
          onClick={() => setDeckFilter(null)}
          className={`chip shrink-0 ${deckFilter === null ? 'border-accent text-accent' : ''}`}
        >
          All
        </button>
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setDeckFilter({ kind: 'theme', id: t.id })}
            className={`chip shrink-0 ${deckFilter?.kind === 'theme' && deckFilter.id === t.id ? 'border-accent text-accent' : ''}`}
            title={t.summary}
          >
            {t.name}
            {t.kind === 'transversal' && (
              <span className="ml-1 text-[10px] uppercase text-amber-400">×</span>
            )}
          </button>
        ))}
        <div className="h-5 w-px bg-edge" />
        {networks.map((n) => (
          <button
            key={n.id}
            onClick={() => setDeckFilter({ kind: 'network', id: n.id })}
            className={`chip shrink-0 ${deckFilter?.kind === 'network' && deckFilter.id === n.id ? 'border-accent text-accent' : ''}`}
            title={n.summary}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: n.color }} />
            {n.name}
          </button>
        ))}
        <div className="h-5 w-px bg-edge" />
        {cognitiveSystems.map((c) => (
          <button
            key={c.id}
            onClick={() => setDeckFilter({ kind: 'cognitive', id: c.id })}
            className={`chip shrink-0 ${deckFilter?.kind === 'cognitive' && deckFilter.id === c.id ? 'border-accent text-accent' : ''}`}
            title={c.summary}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4">
        {loading ? (
          <div className="text-slate-400">Loading review queue…</div>
        ) : !current ? (
          <div className="panel max-w-md p-6 text-center">
            <h1 className="mb-2 font-serif text-2xl font-semibold">All caught up</h1>
            <p className="text-sm text-slate-400">
              No cards are due in this deck right now.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-500">
              {remaining} due · {deck.length} in {deckFilter ? 'deck' : 'all'}
            </p>

            <div className="panel w-full max-w-md p-6">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                {current.hint}
              </p>
              <h1 className="mb-4 font-serif text-2xl font-semibold">{current.front}</h1>

              {flipped ? (
                <ul className="mb-6 space-y-2 text-sm text-slate-200">
                  {current.back.map((b, i) => (
                    <li key={i} className="border-l-2 border-accent pl-3">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mb-6 flex h-24 items-center justify-center text-slate-500">
                  <button className="btn-primary" onClick={() => setFlipped(true)}>
                    Show answer
                  </button>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                {GRADE_BUTTONS.map((g) => (
                  <button
                    key={g.label}
                    disabled={!flipped}
                    onClick={() => grade(g.quality)}
                    className={`rounded-lg px-2 py-2 text-sm font-medium text-slate-100 transition disabled:opacity-30 ${g.cls}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
