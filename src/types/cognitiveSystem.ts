import type { Citation, Question } from './assessment';

export interface CognitiveComponent {
  name: string;
  summary: string;
  networks: string[];
  structureIds: string[];
}

export interface CognitiveStage {
  title: string;
  body: string;
  structureIds: string[];
}

export interface CognitiveSystem {
  id: string;
  name: string;
  color: string;
  summary: string;
  /** Ids of the 7 resting-state networks this system recruits (see networks.json). */
  networks: string[];
  structureIds: string[];
  components?: CognitiveComponent[];
  stages?: CognitiveStage[];
  function?: string[];
  states?: string[];
  paradigms?: string[];
  disorders?: { condition: string; note: string }[];
  citations: Citation[];
  questions?: Question[];
}

export interface CognitiveSystemsData {
  schemaVersion: number;
  license: string;
  source: string;
  systems: CognitiveSystem[];
}
