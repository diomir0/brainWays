import type { View } from '../../state/store';
import { useApp } from '../../state/store';

const TABS: { id: View; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'study', label: 'Study' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'review', label: 'Review' },
  { id: 'progress', label: 'Progress' },
];

export function NavBar() {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);

  return (
    <header className="flex items-center justify-between border-b border-edge px-3 py-2 sm:px-5">
      <button
        className="flex items-center gap-2 text-left"
        onClick={() => setView('explore')}
        aria-label="BrainWays home"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm font-bold text-slate-900">
          N
        </span>
        <span className="hidden text-sm font-semibold tracking-tight sm:block">
          BrainWays <span className="font-normal text-slate-400">· systems atlas</span>
        </span>
      </button>

      <nav className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
              view === t.id ? 'bg-accent text-slate-900' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
