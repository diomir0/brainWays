import { useEffect, useMemo, useState } from 'react';
import { getAtlas, getSystems } from '../core/atlas/loader';
import { getQuestions } from '../core/content/loader';
import { allProgress } from '../core/assessment/engine';
import { buildReviewCards, loadAllCardStates } from '../core/assessment/cards';
import type { ProgressEntry } from '../types/assessment';

export function Progress() {
  const atlas = getAtlas();
  const systems = getSystems().systems;
  const questions = useMemo(() => getQuestions(), []);
  const cards = useMemo(() => buildReviewCards(), []);

  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});
  const [cardStates, setCardStates] = useState<Record<string, unknown>>({});

  useEffect(() => {
    (async () => {
      const [p, cs] = await Promise.all([allProgress(), loadAllCardStates()]);
      setProgress(p);
      setCardStates(cs);
    })();
  }, []);

  const attempted = Object.values(progress).filter((p) => p.attempts > 0);
  const totalCorrect = attempted.reduce((n, p) => n + p.correct, 0);
  const totalAttempts = attempted.reduce((n, p) => n + p.attempts, 0);
  const accuracy = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  const now = Date.now();
  const dueCards = cards.filter((c) => {
    const s = cardStates[c.id];
    return !s || (s as { due: number }).due <= now;
  }).length;

  const stats: { label: string; value: string }[] = [
    { label: 'Structures', value: String(atlas.structures.length) },
    { label: 'Functional systems', value: String(systems.length) },
    { label: 'Questions', value: String(questions.length) },
    { label: 'Review deck', value: String(cards.length) },
    { label: 'Questions answered', value: String(totalAttempts) },
    { label: 'Accuracy', value: accuracy == null ? '—' : `${accuracy}%` },
    { label: 'Cards due now', value: String(dueCards) },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-serif text-2xl font-semibold">Progress</h1>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="panel p-4">
              <p className="text-2xl font-bold text-accent">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Question mastery
        </h2>
        {attempted.length === 0 ? (
          <p className="text-sm text-slate-400">Answer some quiz questions to see mastery here.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(progress)
              .filter(([, p]) => p.attempts > 0)
              .sort((a, b) => b[1].correct / b[1].attempts - a[1].correct / a[1].attempts)
              .map(([id, p]) => {
                const q = questions.find((x) => x.id === id);
                const pct = Math.round((p.correct / p.attempts) * 100);
                return (
                  <div key={id} className="panel flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-200">{q?.stem ?? id}</p>
                      <p className="text-xs text-slate-500">
                        {p.correct}/{p.attempts} correct
                      </p>
                    </div>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-semibold text-slate-300">
                      {pct}%
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
