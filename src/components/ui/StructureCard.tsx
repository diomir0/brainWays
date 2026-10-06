import { structureById, categoryLabel } from '../../core/atlas/loader';
import { structureContentById } from '../../core/content/loader';
import { pathwaysForStructure } from '../../core/content/themes';

export function StructureCard({ structureId }: { structureId: string }) {
  const s = structureById(structureId);
  if (!s) return null;
  const content = structureContentById(structureId);
  const pathways = pathwaysForStructure(structureId);

  return (
    <div className="panel max-h-full overflow-y-auto p-4 text-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold leading-tight">{s.label}</h2>
        <span className="chip shrink-0 capitalize">{s.side}</span>
      </div>
      <p className="mb-2 text-xs text-slate-400">
        {categoryLabel(s.category)} · {s.region}
      </p>

      {s.hierarchy.length > 1 && (
        <p className="mb-2 text-xs text-slate-500">{s.hierarchy.join(' › ')}</p>
      )}

      {s.description && <p className="mb-3 text-slate-200">{s.description}</p>}

      {pathways.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Functional systems
          </h3>
          <ul className="space-y-1.5">
            {pathways.map((p) => (
              <li key={p.systemId} className="text-slate-300">
                <span className="font-medium text-slate-100">{p.name}</span>
                <span className="ml-1 text-xs text-slate-500">
                  {p.stages.map((st) => `“${st}”`).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content && (
        <>
          {content.function.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Function
              </h3>
              <ul className="list-disc space-y-1 pl-4 text-slate-200">
                {content.function.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {content.connectivity && (
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {content.connectivity.afferent.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                    Afferent
                  </h3>
                  <p className="text-slate-300">{content.connectivity.afferent.join('; ')}</p>
                </div>
              )}
              {content.connectivity.efferent.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                    Efferent
                  </h3>
                  <p className="text-slate-300">{content.connectivity.efferent.join('; ')}</p>
                </div>
              )}
            </div>
          )}

          {content.clinical && content.clinical.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Clinical / lesion
              </h3>
              <ul className="space-y-1">
                {content.clinical.map((c, i) => (
                  <li key={i} className="text-slate-300">
                    <span className="font-medium text-slate-100">{c.condition}:</span> {c.note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {content.methods && content.methods.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                Methods & evidence
              </h3>
              <p className="text-slate-300">{content.methods.join('; ')}</p>
            </div>
          )}

          {content.citations.length > 0 && (
            <div className="border-t border-edge pt-2">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                References
              </h3>
              <ul className="space-y-0.5 text-xs text-slate-400">
                {content.citations.map((c, i) => (
                  <li key={i}>
                    {c.source}
                    {c.ref ? ` — ${c.ref}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {s.source && <p className="mt-3 text-[11px] text-slate-600">Data: {s.source}</p>}
    </div>
  );
}
