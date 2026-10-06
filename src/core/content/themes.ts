import { getSystems } from '../atlas/loader';
import themesRaw from '../../data/themes.json';

export interface Theme {
  id: string;
  name: string;
  kind: 'system' | 'transversal';
  summary: string;
  structureIds: string[];
}

let cache: Theme[] | null = null;

/**
 * Themes = the 8 functional systems (derived from `systems.json`) plus authored
 * "transversal" themes that span multiple systems (from `themes.json`).
 */
export function getThemes(): Theme[] {
  if (cache) return cache;

  const systems = getSystems();
  const systemThemes: Theme[] = systems.systems.map((s) => {
    const ids = new Set<string>();
    for (const st of s.stages) for (const id of st.structureIds) ids.add(id);
    return {
      id: s.id,
      name: s.name,
      kind: 'system' as const,
      summary: s.summary,
      structureIds: [...ids],
    };
  });

  const transversal: Theme[] = (themesRaw as { themes: Theme[] }).themes.map((t) => ({
    ...t,
    kind: 'transversal' as const,
  }));

  cache = [...systemThemes, ...transversal];
  return cache;
}

/** Theme ids a structure belongs to (for grouping review cards). */
export function themesForStructure(id: string): string[] {
  return getThemes()
    .filter((t) => t.structureIds.includes(id))
    .map((t) => t.id);
}

export interface StructurePathway {
  systemId: string;
  name: string;
  summary: string;
  stages: string[];
}

/** Functional systems/pathways a structure participates in, with the stages it
 * appears in (for the Explore sidebar's "pathways" list). */
export function pathwaysForStructure(id: string): StructurePathway[] {
  const systems = getSystems();
  const result: StructurePathway[] = [];
  for (const s of systems.systems) {
    const stages: string[] = [];
    for (const st of s.stages) {
      if (st.structureIds.includes(id)) stages.push(st.title);
    }
    if (stages.length) {
      result.push({ systemId: s.id, name: s.name, summary: s.summary, stages });
    }
  }
  return result;
}
