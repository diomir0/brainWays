// Builds the canonical data files from the Z-Anatomy brain.glb metadata and
// the Brain Project's open taxonomy (CC BY-SA 4.0).
//
//   node scripts/build_atlas.mjs
//
// Outputs:
//   src/data/atlas.json   - structures, categories, descriptions
//   src/data/systems.json - functional systems, landmarks, node descriptions

import fs from 'node:fs';
import vm from 'node:vm';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const GLB = `${ROOT}/public/models/brain.glb`;
const BP_DATA = `${ROOT}/scripts/_bp_data.js`;
const BP_SYS = `${ROOT}/scripts/_bp_systems.js`;
const OUT_ATLAS = `${ROOT}/src/data/atlas.json`;
const OUT_SYS = `${ROOT}/src/data/systems.json`;

// ---- slug helpers ---------------------------------------------------------
const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const structureId = (cat, label, side) => `${slug(cat)}.${slug(label)}.${side}`;

// ---- load Brain Project JS (window.BRAIN / window.SYS) -------------------
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(BP_DATA, 'utf8'), ctx);
const BRAIN = ctx.window.BRAIN;
vm.runInContext(fs.readFileSync(BP_SYS, 'utf8'), ctx);
const SYS = ctx.window.SYS;

// ---- parse GLB node extras ------------------------------------------------
const glb = fs.readFileSync(GLB);
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));

const extras = gltf.nodes
  .map((n) => ({ name: n.name, ...(n.extras || {}) }))
  .filter((e) => e.bx_id != null);

// ---- enrich with Brain Project taxonomy (crumb + descriptions) -----------
// key: label|side -> { crumb, source, parent, decussation }
const bpByLabel = new Map();
for (const n of BRAIN.nodes || []) {
  bpByLabel.set(`${n.label}|${n.side}`, n);
}
// label -> description (functional text, side-independent)
const descByLabel = new Map(Object.entries(BRAIN.descriptions || {}));

const structures = extras.map((e) => {
  const bp = bpByLabel.get(`${e.bx_label}|${e.bx_side}`);
  const id = structureId(e.bx_cat, e.bx_label, e.bx_side);
  return {
    id,
    label: e.bx_label,
    category: e.bx_cat,
    side: e.bx_side,
    region: bp?.region || e.bx_region || e.bx_cat,
    hierarchy: bp?.crumb && bp.crumb.length ? bp.crumb : [e.bx_region || e.bx_cat],
    meshName: e.name,
    bxId: e.bx_id,
    source: bp?.source || e.bx_source || null,
    parent: bp?.parent ?? null,
    decussation: bp?.decussation ?? e.bx_decussation ?? null,
    description: descByLabel.get(e.bx_label) ?? null,
  };
});

structures.sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));

// ---- categories & palette -------------------------------------------------
const categories = {};
for (const [key, val] of Object.entries(BRAIN.categories || {})) {
  categories[key] = { label: val.label, color: (BRAIN.palette || {})[key] || '#888888' };
}

// ---- systems --------------------------------------------------------------
// label -> [structureId]  (both sides)  for resolving landmark "real" labels
const idsByLabel = new Map();
for (const s of structures) {
  const arr = idsByLabel.get(s.label) || [];
  arr.push(s.id);
  idsByLabel.set(s.label, arr);
}

const resolveReal = (labels) => {
  const out = [];
  for (const l of labels || []) {
    const ids = idsByLabel.get(l);
    if (ids) out.push(...ids);
  }
  return out;
};

const landmarks = {};
for (const [key, n] of Object.entries(SYS.NODES || {})) {
  landmarks[key] = {
    label: n.label,
    category: n.cat,
    structureIds: resolveReal(n.real),
  };
}

const systems = (SYS.SYSTEMS || []).map((s) => ({
  id: s.id,
  name: s.label,
  category: s.cat,
  summary: s.blurb || '',
  flagship: !!s.flagship,
  stages: (s.stages || []).map((st) => ({
    title: st.title,
    body: st.body,
    structureIds: (st.nodes || []).flatMap((k) => landmarks[k]?.structureIds || []),
  })),
}));

// ---- write ---------------------------------------------------------------
fs.mkdirSync(`${ROOT}/src/data`, { recursive: true });

fs.writeFileSync(
  OUT_ATLAS,
  JSON.stringify(
    {
      schemaVersion: 1,
      license: 'CC BY-SA 4.0',
      source: BRAIN.generatedFrom,
      categories,
      depth: BRAIN.depth || [],
      structures,
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  OUT_SYS,
  JSON.stringify(
    {
      schemaVersion: 1,
      license: 'CC BY-SA 4.0',
      source: 'Brain Project systems & lessons (CC BY-SA 4.0)',
      landmarks,
      systems,
      nodeDesc: SYS.NODE_DESC || {},
    },
    null,
    2,
  ),
);

console.log(`structures: ${structures.length}`);
console.log(`categories: ${Object.keys(categories).length}`);
console.log(`systems: ${systems.length}`);
console.log(`landmarks: ${Object.keys(landmarks).length}`);
console.log(`descriptions: ${structures.filter((s) => s.description).length}`);
console.log('wrote', OUT_ATLAS.replace(ROOT + '/', ''));
console.log('wrote', OUT_SYS.replace(ROOT + '/', ''));
