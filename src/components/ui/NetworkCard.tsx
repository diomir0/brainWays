import { structureById } from '../../core/atlas/loader';
import { networkById } from '../../core/content/networks';
import type { NetworkDisorder } from '../../types/network';

export function NetworkCard({ networkId }: { networkId: string }) {
  const n = networkById(networkId);
  if (!n) return null;

  // Dedupe by display label (bilateral L/R share one label) and sort.
  const labels = new Map<string, string>();
  for (const id of n.structureIds) {
    const label = structureById(id)?.label;
    if (label && !labels.has(label)) labels.set(label, label);
  }
  const structures = [...labels.keys()].sort((a, b) => a.localeCompare(b));

  const bullets = (items: string[]) => (
    <ul className="list-disc space-y-1 pl-4 text-slate-200">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );

  return (
    <div className="panel max-h-full overflow-y-auto p-4 text-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold leading-tight">{n.name}</h2>
        <span className="chip shrink-0">{n.taxonomy}</span>
      </div>
      <p className="mb-3 text-slate-200">{n.summary}</p>

      {structures.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Key structures
          </h3>
          <ul className="space-y-1">
            {structures.map((label) => {
              const note = n.nodeNotes?.[label];
              return (
                <li key={label} className="text-slate-300">
                  <span className="font-medium text-slate-100">{label}</span>
                  {note && <span className="ml-1 text-xs text-slate-500">({note})</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {n.tracts && n.tracts.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Supporting tracts
          </h3>
          {bullets(n.tracts)}
        </div>
      )}

      {n.function && n.function.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Function</h3>
          {bullets(n.function)}
        </div>
      )}

      {n.states && n.states.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Associated states
          </h3>
          {bullets(n.states)}
        </div>
      )}

      {n.paradigms && n.paradigms.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Experimental paradigms
          </h3>
          {bullets(n.paradigms)}
        </div>
      )}

      {n.disorders && n.disorders.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Clinical alterations
          </h3>
          <ul className="space-y-1">
            {n.disorders.map((d: NetworkDisorder, i: number) => (
              <li key={i} className="text-slate-300">
                <span className="font-medium text-slate-100">{d.condition}:</span> {d.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {n.citations.length > 0 && (
        <div className="border-t border-edge pt-2">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            References
          </h3>
          <ul className="space-y-0.5 text-xs text-slate-400">
            {n.citations.map((c, i) => (
              <li key={i}>
                {c.source}
                {c.ref ? ` — ${c.ref}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
