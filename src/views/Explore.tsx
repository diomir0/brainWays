import { useState } from 'react';
import { BrainViewer } from '../components/brain/BrainViewer';
import { StructureCard } from '../components/ui/StructureCard';
import { getAtlas, searchStructures } from '../core/atlas/loader';
import { useBrain } from '../state/store';

export function Explore() {
  const atlas = getAtlas();
  const selectedId = useBrain((s) => s.selectedId);
  const select = useBrain((s) => s.select);
  const requestFocus = useBrain((s) => s.requestFocus);
  const hiddenCategories = useBrain((s) => s.hiddenCategories);
  const toggleCategory = useBrain((s) => s.toggleCategory);
  const hemisphere = useBrain((s) => s.hemisphere);
  const setHemisphere = useBrain((s) => s.setHemisphere);

  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const results = searchStructures(query, 12);

  return (
    <div className="relative h-full">
      <BrainViewer className="h-full w-full" />

      {/* Search */}
      <div className="absolute left-3 right-3 top-3 sm:left-auto sm:w-96">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search regions, tracts, nuclei…"
          className="w-full rounded-lg border border-edge bg-panel/90 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-accent"
        />
        {query && (
          <div className="panel mt-1 max-h-72 overflow-y-auto py-1">
            {results.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No matches</p>}
            {results.map(({ structure }) => (
              <button
                key={structure.id}
                onClick={() => {
                  select(structure.id);
                  requestFocus([structure.id]);
                  setQuery('');
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                <span className="font-medium">{structure.label}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {structure.category} · {structure.side}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hemisphere + layer controls (left-side vertical panel) */}
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand controls"
          className="btn absolute left-3 top-1/2 -translate-y-1/2"
        >
          ›
        </button>
      ) : (
      <div className="absolute bottom-3 left-3 top-3 flex w-40 flex-col gap-3 overflow-y-auto sm:w-52">
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse controls"
          className="btn shrink-0 self-start"
        >
          ‹
        </button>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hemisphere
          </p>
          {(['both', 'left', 'right'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHemisphere(h)}
              className={`chip justify-start capitalize ${
                hemisphere === h ? 'border-accent text-accent' : 'bg-panel/80'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        <div className="h-px w-full bg-edge" />

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Layers</p>
          {atlas.depth.map((cat) => {
            const off = hiddenCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="chip justify-start text-left"
                style={{
                  opacity: off ? 0.4 : 1,
                  borderColor: atlas.categories[cat]?.color,
                }}
              >
                <span
                  className="mr-1 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ background: atlas.categories[cat]?.color }}
                />
                {atlas.categories[cat]?.label}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Info card */}
      {selectedId && (
        <div className="absolute bottom-0 right-0 top-0 flex w-full flex-col sm:w-96">
          <div className="flex justify-end p-3">
            <button
              className="btn"
              onClick={() => {
                select(null);
                requestFocus([]);
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 px-3 pb-3">
            <StructureCard structureId={selectedId} />
          </div>
        </div>
      )}
    </div>
  );
}
