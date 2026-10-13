import type { Network, NetworksData } from '../../types/network';
import networksRaw from '../../data/networks.json';
import { structureById } from '../atlas/loader';

const networksData = networksRaw as NetworksData;

export function getNetworks(): Network[] {
  return networksData.networks;
}

export function networkById(id: string): Network | undefined {
  return networksData.networks.find((n) => n.id === id);
}

/** Networks a structure belongs to (reverse index, for the info card). */
export function networksForStructure(id: string): Network[] {
  return networksData.networks.filter((n) => n.structureIds.includes(id));
}

export function structureIdsForNetwork(id: string): string[] {
  return networkById(id)?.structureIds ?? [];
}

/** Subregion/role note a network attaches to a structure (keyed by display label). */
export function nodeNote(networkId: string, structureId: string): string | undefined {
  const n = networkById(networkId);
  if (!n?.nodeNotes) return undefined;
  const label = structureById(structureId)?.label;
  return label ? n.nodeNotes[label] : undefined;
}

export interface NetworkAssignment {
  networkId: string;
  color: string;
}

// Assignment priority for the full-brain map. Structures in multiple networks
// take the FIRST network in this order as their "primary" network (a hard
// parcellation). This encodes the pedagogically-canonical hub for each overlap
// (e.g. angular gyrus -> default mode, hippocampus -> limbic); overlaps are
// inherent to the atlas's gyral granularity.
const ASSIGNMENT_PRIORITY = [
  'visual',
  'somatomotor',
  'dorsal-attention',
  'limbic',
  'default-mode',
  'ventral-attention',
  'frontoparietal',
];

let assignmentCache: Map<string, NetworkAssignment> | null = null;

/** structureId -> { networkId, color } for every structure in any network. */
export function getNetworkAssignment(): Map<string, NetworkAssignment> {
  if (assignmentCache) return assignmentCache;
  const byId = new Map(networksData.networks.map((n) => [n.id, n]));
  const out = new Map<string, NetworkAssignment>();
  for (const networkId of ASSIGNMENT_PRIORITY) {
    const n = byId.get(networkId);
    if (!n) continue;
    for (const sid of n.structureIds) {
      if (!out.has(sid)) out.set(sid, { networkId, color: n.color });
    }
  }
  assignmentCache = out;
  return out;
}
