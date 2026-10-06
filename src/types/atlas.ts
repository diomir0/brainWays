// Data contracts. Each data layer is versioned (`schemaVersion`) so future
// additions are backward-compatible: readers key off the version, and saved
// user state references stable `structureId`s that never change.

export type Side = 'left' | 'right' | 'median';

export interface AtlasStructure {
  /** Stable, permanent identity (join key across data, content, and saved progress). */
  id: string;
  label: string;
  category: string;
  side: Side;
  region: string;
  hierarchy: string[];
  /** GLB node name(s) this structure maps to in the 3D mesh. */
  meshName: string;
  /** Stable integer identity of the GLB mesh node (authoritative join key). */
  bxId: number;
  source: string | null;
  parent: string | null;
  decussation: string | null;
  description: string | null;
}

export interface AtlasCategory {
  label: string;
  color: string;
}

export interface Atlas {
  schemaVersion: number;
  license: string;
  source: string;
  categories: Record<string, AtlasCategory>;
  /** Peel order, outer → inner. */
  depth: string[];
  structures: AtlasStructure[];
}
