import { structureById } from '../../core/atlas/loader';
import { networkById } from '../../core/content/networks';
import { cognitiveSystemById } from '../../core/content/cognitiveSystems';

/** Dedupe a set of structure ids by display label (bilateral L/R share one label) and sort. */
function structureLabels(structureIds: string[]): string[] {
  const labels = new Map<string, string>();
  for (const id of structureIds) {
    const label = structureById(id)?.label;
    if (label && !labels.has(label)) labels.set(label, label);
  }
  return [...labels.keys()].sort((a, b) => a.localeCompare(b));
}

export function CognitiveSystemCard({ systemId }: { systemId: string }) {
  const s = cognitiveSystemById(systemId);
  if (!s) return null;

  const structures = structureLabels(s.structureIds);

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
        <h2 className="font-serif text-lg font-semibold leading-tight">{s.name}</h2>
        <span className="chip shrink-0">Cognitive system</span>
      </div>
      <p className="mb-3 text-slate-200">{s.summary}</p>

      {s.networks.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Recruited networks
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {s.networks.map((nid) => {
              const net = networkById(nid);
              if (!net) return null;
              return (
                <li key={nid} className="chip" style={{ borderColor: net.color }}>
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full"
                    style={{ background: net.color }}
                  />
                  {net.name}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {structures.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Key structures
          </h3>
          <ul className="space-y-1">
            {structures.map((label) => (
              <li key={label} className="text-slate-300">
                <span className="font-medium text-slate-100">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.components && s.components.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Components
          </h3>
          <div className="space-y-3">
            {s.components.map((c, i) => {
              const componentLabels = structureLabels(c.structureIds);
              return (
                <div key={i}>
                  <h4 className="mb-1 font-semibold text-slate-100">{c.name}</h4>
                  <p className="mb-1 text-xs text-slate-400">{c.summary}</p>
                  {c.networks.length > 0 && (
                    <ul className="mb-1 flex flex-wrap gap-1.5">
                      {c.networks.map((nid) => {
                        const net = networkById(nid);
                        if (!net) return null;
                        return (
                          <li key={nid} className="chip text-xs" style={{ borderColor: net.color }}>
                            <span
                              className="mr-1 inline-block h-2 w-2 rounded-full"
                              style={{ background: net.color }}
                            />
                            {net.name}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {componentLabels.length > 0 && (
                    <p className="text-xs text-slate-300">{componentLabels.join(', ')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {s.function && s.function.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Function</h3>
          {bullets(s.function)}
        </div>
      )}

      {s.states && s.states.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Associated states
          </h3>
          {bullets(s.states)}
        </div>
      )}

      {s.paradigms && s.paradigms.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Experimental paradigms
          </h3>
          {bullets(s.paradigms)}
        </div>
      )}

      {s.disorders && s.disorders.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Clinical alterations
          </h3>
          <ul className="space-y-1">
            {s.disorders.map((d, i) => (
              <li key={i} className="text-slate-300">
                <span className="font-medium text-slate-100">{d.condition}:</span> {d.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.citations.length > 0 && (
        <div className="border-t border-edge pt-2">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            References
          </h3>
          <ul className="space-y-0.5 text-xs text-slate-400">
            {s.citations.map((c, i) => (
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
