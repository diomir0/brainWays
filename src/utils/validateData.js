import { PATHWAYS } from "../data/pathways";

/**
 * Validate that all edge `from`/`to` references point to existing node IDs.
 * Runs once at module load; logs warnings to the console for any broken refs.
 */
export function validatePathwayData() {
  const errors = [];

  for (const [key, pathway] of Object.entries(PATHWAYS)) {
    const nodeIds = new Set(pathway.nodes.map((n) => n.id));

    // Check for duplicate node IDs
    const seen = new Set();
    for (const n of pathway.nodes) {
      if (seen.has(n.id)) {
        errors.push(`[${key}] Duplicate node id: "${n.id}"`);
      }
      seen.add(n.id);
    }

    // Check edge references
    for (const edge of pathway.edges) {
      if (!nodeIds.has(edge.from)) {
        errors.push(`[${key}] Edge references missing node "from": "${edge.from}"`);
      }
      if (!nodeIds.has(edge.to)) {
        errors.push(`[${key}] Edge references missing node "to": "${edge.to}"`);
      }
      if (!["ff", "fb", "bypass"].includes(edge.type)) {
        errors.push(`[${key}] Edge has invalid type "${edge.type}" (expected ff, fb, or bypass)`);
      }
    }
  }

  if (errors.length > 0) {
    console.warn("Pathway data validation errors:\n" + errors.join("\n"));
  }

  return errors;
}
