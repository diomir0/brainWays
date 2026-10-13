import type { Citation } from './assessment';

export interface NetworkDisorder {
  condition: string;
  note: string;
}

/** A resting-state intrinsic network (Yeo 7-network parcellation). */
export interface Network {
  id: string;
  name: string;
  taxonomy: string;
  /** CSS hex color used to tint the isolated network. */
  color: string;
  summary: string;
  /** Stable atlas structure ids making up the network (both hemispheres). */
  structureIds: string[];
  /** Subregion/role note per structure, keyed by display label (side-invariant). */
  nodeNotes?: Record<string, string>;
  tracts?: string[];
  function?: string[];
  states?: string[];
  paradigms?: string[];
  disorders?: NetworkDisorder[];
  citations: Citation[];
}

export interface NetworksData {
  schemaVersion: number;
  license: string;
  source: string;
  networks: Network[];
}
