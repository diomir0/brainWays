import type { StructureContent, SystemContent } from '../../types/content';
import type { Question } from '../../types/assessment';
import { structureById } from '../atlas/loader';

const modules = import.meta.glob('../../data/content/*.json', { eager: true });

const contentBySystem = new Map<string, SystemContent>();
const contentByStructure = new Map<string, StructureContent>();
const contentByLabel = new Map<string, StructureContent>();
const allQuestions: Question[] = [];

for (const path in modules) {
  const mod = modules[path] as { default?: unknown };
  const sc = (mod.default ?? mod) as SystemContent;
  contentBySystem.set(sc.systemId, sc);
  for (const c of sc.structures) {
    contentByStructure.set(c.structureId, c);
    const s = structureById(c.structureId);
    if (s) contentByLabel.set(s.label, c);
  }
  for (const q of sc.questions) allQuestions.push(q);
}

export function systemContent(systemId: string): SystemContent | undefined {
  return contentBySystem.get(systemId);
}

export function allSystemContent(): SystemContent[] {
  return [...contentBySystem.values()];
}

export function getQuestions(systemId?: string): Question[] {
  return systemId ? allQuestions.filter((q) => q.systemId === systemId) : allQuestions;
}

export function questionById(id: string): Question | undefined {
  return allQuestions.find((q) => q.id === id);
}

export function structureContentById(id: string): StructureContent | undefined {
  const direct = contentByStructure.get(id);
  if (direct) return direct;
  // Fall back to label match so content authored for one side applies to both.
  const s = structureById(id);
  return s ? contentByLabel.get(s.label) : undefined;
}
