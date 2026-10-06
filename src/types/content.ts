// Authored graduate-level content, keyed by stable structure/system IDs.
// Separate from anatomy (`atlas.json`) so it can be enriched independently.

import type { Citation, Question } from './assessment';

export interface ClinicalNote {
  condition: string;
  note: string;
}

export interface StructureContent {
  structureId: string;
  function: string[];
  connectivity?: { afferent: string[]; efferent: string[] };
  clinical?: ClinicalNote[];
  methods?: string[];
  citations: Citation[];
}

export interface SystemContent {
  systemId: string;
  overview: string;
  citations: Citation[];
  structures: StructureContent[];
  questions: Question[];
}

/** Landmark (functional system) definitions from `systems.json`. */
export interface Landmark {
  label: string;
  category: string;
  structureIds: string[];
}

export interface SystemStage {
  title: string;
  body: string;
  structureIds: string[];
}

export interface System {
  id: string;
  name: string;
  category: string;
  summary: string;
  flagship: boolean;
  stages: SystemStage[];
}

export interface SystemsData {
  schemaVersion: number;
  license: string;
  source: string;
  landmarks: Record<string, Landmark>;
  systems: System[];
  nodeDesc: Record<string, string>;
}
