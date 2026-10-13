import type { CognitiveSystem, CognitiveSystemsData } from '../../types/cognitiveSystem';
import type { Question } from '../../types/assessment';
import raw from '../../data/cognitive-systems.json';

const data = raw as CognitiveSystemsData;

export function getCognitiveSystems(): CognitiveSystem[] {
  return data.systems;
}

export function cognitiveSystemById(id: string): CognitiveSystem | undefined {
  return data.systems.find((s) => s.id === id);
}

/** Cognitive systems a structure participates in (top-level or component membership). */
export function cognitiveSystemsForStructure(id: string): CognitiveSystem[] {
  return data.systems.filter(
    (s) =>
      s.structureIds.includes(id) ||
      (s.components ?? []).some((c) => c.structureIds.includes(id)),
  );
}

/** All questions authored across cognitive systems. */
export function getCognitiveQuestions(): Question[] {
  return data.systems.flatMap((s) => s.questions ?? []);
}
