import type { Atlas, AtlasStructure } from '../../types/atlas';
import type { SystemsData } from '../../types/content';
import atlasRaw from '../../data/atlas.json';
import systemsRaw from '../../data/systems.json';

const atlas = atlasRaw as Atlas;
const systems = systemsRaw as SystemsData;

const byId = new Map<string, AtlasStructure>();
const byLabel = new Map<string, AtlasStructure[]>();
for (const s of atlas.structures) {
  byId.set(s.id, s);
  const arr = byLabel.get(s.label) ?? [];
  arr.push(s);
  byLabel.set(s.label, arr);
}

/** Look up a structure by its stable id. */
export function structureById(id: string): AtlasStructure | undefined {
  return byId.get(id);
}

/** All structures sharing a display label (across sides). */
export function structuresByLabel(label: string): AtlasStructure[] {
  return byLabel.get(label) ?? [];
}

export function getAtlas(): Atlas {
  return atlas;
}

export function getSystems(): SystemsData {
  return systems;
}

export function categoryLabel(cat: string): string {
  return atlas.categories[cat]?.label ?? cat;
}

export function categoryColor(cat: string): string {
  return atlas.categories[cat]?.color ?? '#888888';
}

export interface SearchHit {
  structure: AtlasStructure;
  score: number;
}

/**
 * Simple ranked search over label, region, hierarchy, and category.
 * Higher score = better match (exact label prefix > label substring > region).
 */
export function searchStructures(query: string, limit = 24): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const s of atlas.structures) {
    let score = 0;
    const label = s.label.toLowerCase();
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else if (s.region.toLowerCase().includes(q)) score = 40;
    else if (s.hierarchy.some((h) => h.toLowerCase().includes(q))) score = 30;
    else if (categoryLabel(s.category).toLowerCase().includes(q)) score = 20;
    else continue;
    hits.push({ structure: s, score });
  }
  hits.sort((a, b) => b.score - a.score || a.structure.label.localeCompare(b.structure.label));
  return hits.slice(0, limit);
}
