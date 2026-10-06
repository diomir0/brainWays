import type { SrsState } from '../../types/assessment';
import { getAtlas } from '../atlas/loader';
import { structureContentById } from '../content/loader';
import { themesForStructure } from '../content/themes';
import { kvGet, kvKeys, kvSet } from '../storage/db';
import { initialState } from './srs';

const REVIEW_PREFIX = 'review:card:';

export interface ReviewCard {
  id: string;
  front: string;
  hint: string;
  back: string[];
  category: string;
  themes: string[];
}

/** Cards derived from structures that carry a description or authored content. */
export function buildReviewCards(): ReviewCard[] {
  const atlas = getAtlas();
  const cards: ReviewCard[] = [];
  for (const s of atlas.structures) {
    const content = structureContentById(s.id);
    if (!s.description && !content) continue;
    const back: string[] = [];
    if (s.description) back.push(s.description);
    if (content) {
      for (const f of content.function) back.push(f);
      for (const c of content.clinical ?? []) back.push(`${c.condition}: ${c.note}`);
    }
    cards.push({
      id: s.id,
      front: s.label,
      hint: `${s.category} · ${s.side}`,
      back,
      category: s.category,
      themes: themesForStructure(s.id),
    });
  }
  return cards;
}

export async function getCardState(cardId: string): Promise<SrsState> {
  const s = await kvGet<SrsState>(`${REVIEW_PREFIX}${cardId}`);
  return s ?? initialState();
}

export async function saveCardState(cardId: string, state: SrsState): Promise<void> {
  await kvSet(`${REVIEW_PREFIX}${cardId}`, state);
}

export async function loadAllCardStates(): Promise<Record<string, SrsState>> {
  const keys = await kvKeys(REVIEW_PREFIX);
  const out: Record<string, SrsState> = {};
  for (const k of keys) {
    const s = await kvGet<SrsState>(k);
    if (s) out[k.slice(REVIEW_PREFIX.length)] = s;
  }
  return out;
}
