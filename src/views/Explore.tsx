import { useState } from 'react';
import { BrainViewer } from '../components/brain/BrainViewer';
import { StructureCard } from '../components/ui/StructureCard';
import { NetworkCard } from '../components/ui/NetworkCard';
import { CognitiveSystemCard } from '../components/ui/CognitiveSystemCard';
import { getAtlas, searchStructures } from '../core/atlas/loader';
import { getNetworks } from '../core/content/networks';
import { getCognitiveSystems } from '../core/content/cognitiveSystems';
import type { Network } from '../types/network';
import type { CognitiveSystem } from '../types/cognitiveSystem';
import { useBrain, DEFAULT_HIGHLIGHT_COLOR } from '../state/store';

export function Explore() {
  const atlas = getAtlas();
  const selectedId = useBrain((s) => s.selectedId);
  const select = useBrain((s) => s.select);
  const requestFocus = useBrain((s) => s.requestFocus);
  const hiddenCategories = useBrain((s) => s.hiddenCategories);
  const toggleCategory = useBrain((s) => s.toggleCategory);
  const hemisphere = useBrain((s) => s.hemisphere);
  const setHemisphere = useBrain((s) => s.setHemisphere);
  const setHighlight = useBrain((s) => s.setHighlight);
  const setHighlightColor = useBrain((s) => s.setHighlightColor);
  const showNetworkMap = useBrain((s) => s.showNetworkMap);
  const setShowNetworkMap = useBrain((s) => s.setShowNetworkMap);

  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState<'anatomy' | 'networks' | 'cognition'>('anatomy');
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const [activeCognitive, setActiveCognitive] = useState<string | null>(null);
  const networks = getNetworks();
  const cognitiveSystems = getCognitiveSystems();
  const results = searchStructures(query, 12);

  const clearNetwork = () => {
    setActiveNetwork(null);
    setHighlight([]);
    setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
  };

  const toggleNetwork = (n: Network) => {
    if (activeNetwork === n.id) {
      clearNetwork();
      return;
    }
    setShowNetworkMap(false);
    setActiveNetwork(n.id);
    setHighlight(n.structureIds);
    setHighlightColor(n.color);
  };

  const clearCognitive = () => {
    setActiveCognitive(null);
    setHighlight([]);
    setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
  };

  const toggleCognitive = (c: CognitiveSystem) => {
    if (activeCognitive === c.id) {
      clearCognitive();
      return;
    }
    setShowNetworkMap(false);
    setActiveNetwork(null);
    setActiveCognitive(c.id);
    setHighlight(c.structureIds);
    setHighlightColor(c.color);
  };

  const toggleMap = () => {
    const on = !showNetworkMap;
    setShowNetworkMap(on);
    if (on) {
      setActiveNetwork(null);
      setHighlight([]);
      setHighlightColor(DEFAULT_HIGHLIGHT_COLOR);
    }
  };

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
      <div className="absolute bottom-3 left-3 top-3 flex w-44 flex-col gap-3 overflow-y-auto sm:w-72">
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse controls"
          className="btn shrink-0 self-start"
        >
          ‹
        </button>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-1.5 sm:flex-row">
            {(['anatomy', 'networks', 'cognition'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`chip flex-1 justify-center capitalize ${
                  mode === m ? 'border-accent text-accent' : 'bg-panel/80'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {mode === 'anatomy' && (
          <>
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
          </>
        )}

        {mode === 'networks' && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Brain networks
            </p>
            <button
              onClick={toggleMap}
              className={`chip justify-start text-left ${
                showNetworkMap ? 'border-accent text-accent' : 'bg-panel/80'
              }`}
            >
              <span className="mr-1 inline-block h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-purple-500 via-amber-500 to-red-500" />
              Full-brain network map
            </button>
            {networks.map((n) => {
              const on = activeNetwork === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => toggleNetwork(n)}
                  className="chip justify-start text-left"
                  style={{ borderColor: n.color, opacity: on ? 1 : 0.6 }}
                >
                  <span
                    className="mr-1 inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: n.color }}
                  />
                  {n.name}
                </button>
              );
            })}
            {activeNetwork && (
              <button onClick={clearNetwork} className="btn mt-1 shrink-0 self-start text-xs">
                Show all
              </button>
            )}
          </div>
        )}

        {mode === 'cognition' && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cognitive systems
            </p>
            {cognitiveSystems.map((c) => {
              const on = activeCognitive === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCognitive(c)}
                  className="chip justify-start text-left"
                  style={{ borderColor: c.color, opacity: on ? 1 : 0.6 }}
                >
                  <span
                    className="mr-1 inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                </button>
              );
            })}
            {activeCognitive && (
              <button onClick={clearCognitive} className="btn mt-1 shrink-0 self-start text-xs">
                Show all
              </button>
            )}
          </div>
        )}
      </div>
      )}

      {/* Info card */}
      {activeCognitive ? (
        <div className="absolute bottom-0 right-0 top-0 flex w-full flex-col sm:w-96">
          <div className="flex justify-end p-3">
            <button className="btn" onClick={clearCognitive} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 px-3 pb-3">
            <CognitiveSystemCard systemId={activeCognitive} />
          </div>
        </div>
      ) : activeNetwork ? (
        <div className="absolute bottom-0 right-0 top-0 flex w-full flex-col sm:w-96">
          <div className="flex justify-end p-3">
            <button className="btn" onClick={clearNetwork} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 px-3 pb-3">
            <NetworkCard networkId={activeNetwork} />
          </div>
        </div>
      ) : (
        selectedId && (
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
        )
      )}
    </div>
  );
}
