// Assessment & spaced-repetition contracts.

export interface Citation {
  source: string;
  ref?: string;
}

export interface McqQuestion {
  id: string;
  kind: 'mc';
  systemId: string;
  stem: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  citations: Citation[];
  /** Structures relevant to this question (for context/linking). */
  structureIds: string[];
}

export interface FindQuestion {
  id: string;
  kind: 'find';
  systemId: string;
  stem: string;
  /** Structures to highlight on the 3D model (must include `answerId`). */
  candidateIds: string[];
  answerId: string;
  explanation: string;
  citations: Citation[];
  structureIds: string[];
}

export interface CaseQuestion {
  id: string;
  kind: 'case';
  systemId: string;
  /** Clinical presentation / scenario shown above the question. */
  vignette: string;
  stem: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  citations: Citation[];
  structureIds: string[];
}

export type Question = McqQuestion | FindQuestion | CaseQuestion;

/** SM-2 spaced-repetition state for a single card. */
export interface SrsState {
  ease: number; // ease factor, >= 1.3
  interval: number; // days
  reps: number; // consecutive successful reviews
  due: number; // epoch ms
  lapses: number;
}

export interface ProgressEntry {
  attempts: number;
  correct: number;
  lastCorrect: boolean;
  lastSeen: number; // epoch ms
}
