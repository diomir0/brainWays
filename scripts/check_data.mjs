// Validates that every structureId referenced by authored content resolves in
// atlas.json, so bad references fail loudly at build time rather than in the UI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const atlas = JSON.parse(fs.readFileSync(path.join(root, 'src/data/atlas.json'), 'utf8'));
const ids = new Set(atlas.structures.map((s) => s.id));

let errors = 0;
const report = (msg) => {
  console.error('  ' + msg);
  errors++;
};

const contentDir = path.join(root, 'src/data/content');
for (const f of fs.readdirSync(contentDir)) {
  if (!f.endsWith('.json')) continue;
  const sc = JSON.parse(fs.readFileSync(path.join(contentDir, f), 'utf8'));

  for (const s of sc.structures ?? []) {
    if (!ids.has(s.structureId)) report(`${f}: structure → unknown id "${s.structureId}"`);
  }

  for (const q of sc.questions ?? []) {
    for (const sid of q.structureIds ?? []) {
      if (!ids.has(sid)) report(`${f}: q "${q.id}" → unknown structureId "${sid}"`);
    }
    if (q.kind === 'find') {
      for (const cid of q.candidateIds ?? []) {
        if (!ids.has(cid)) report(`${f}: q "${q.id}" → unknown candidateId "${cid}"`);
      }
      if (!ids.has(q.answerId)) report(`${f}: q "${q.id}" → unknown answerId "${q.answerId}"`);
      if (!(q.candidateIds ?? []).some((c) => c === q.answerId)) {
        report(`${f}: q "${q.id}" → answerId not present in candidateIds`);
      }
    }
    if ((q.kind === 'mc' || q.kind === 'case') && (q.answerIndex < 0 || q.answerIndex >= (q.options?.length ?? 0))) {
      report(`${f}: q "${q.id}" → answerIndex out of range`);
    }
  }
}

// Validate transversal theme structure references.
const themesPath = path.join(root, 'src/data/themes.json');
if (fs.existsSync(themesPath)) {
  const themes = JSON.parse(fs.readFileSync(themesPath, 'utf8'));
  for (const t of themes.themes ?? []) {
    for (const sid of t.structureIds ?? []) {
      if (!ids.has(sid)) report(`themes.json: theme "${t.id}" → unknown structureId "${sid}"`);
    }
  }
}

// Validate network structure references.
const networksPath = path.join(root, 'src/data/networks.json');
if (fs.existsSync(networksPath)) {
  const networks = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
  for (const n of networks.networks ?? []) {
    for (const sid of n.structureIds ?? []) {
      if (!ids.has(sid)) report(`networks.json: network "${n.id}" → unknown structureId "${sid}"`);
    }
  }
}

// Validate cognitive-systems structure + network references.
const cogPath = path.join(root, 'src/data/cognitive-systems.json');
if (fs.existsSync(cogPath)) {
  const networkIds = new Set((JSON.parse(fs.readFileSync(path.join(root, 'src/data/networks.json'), 'utf8')).networks ?? []).map((n) => n.id));
  const cog = JSON.parse(fs.readFileSync(cogPath, 'utf8'));
  const checkStruct = (sid, where) => { if (!ids.has(sid)) report(`${where} → unknown structureId "${sid}"`); };
  const checkNet = (nid, where) => { if (!networkIds.has(nid)) report(`${where} → unknown network "${nid}"`); };
  for (const s of cog.systems ?? []) {
    for (const sid of s.structureIds ?? []) checkStruct(sid, `cognitive-systems.json: "${s.id}"`);
    for (const nid of s.networks ?? []) checkNet(nid, `cognitive-systems.json: "${s.id}"`);
    for (const c of s.components ?? []) {
      for (const sid of c.structureIds ?? []) checkStruct(sid, `cognitive-systems.json: "${s.id}" component "${c.name}"`);
      for (const nid of c.networks ?? []) checkNet(nid, `cognitive-systems.json: "${s.id}" component "${c.name}"`);
    }
    for (const st of s.stages ?? []) {
      for (const sid of st.structureIds ?? []) checkStruct(sid, `cognitive-systems.json: "${s.id}" stage "${st.title}"`);
    }
    for (const q of s.questions ?? []) {
      for (const sid of q.structureIds ?? []) {
        if (!ids.has(sid)) report(`cognitive-systems.json: "${s.id}" q "${q.id}" → unknown structureId "${sid}"`);
      }
      if (q.kind === 'find') {
        for (const cid of q.candidateIds ?? []) {
          if (!ids.has(cid)) report(`cognitive-systems.json: "${s.id}" q "${q.id}" → unknown candidateId "${cid}"`);
        }
        if (!ids.has(q.answerId)) report(`cognitive-systems.json: "${s.id}" q "${q.id}" → unknown answerId "${q.answerId}"`);
        if (!(q.candidateIds ?? []).some((c) => c === q.answerId)) {
          report(`cognitive-systems.json: "${s.id}" q "${q.id}" → answerId not present in candidateIds`);
        }
      }
      if ((q.kind === 'mc' || q.kind === 'case') && (q.answerIndex < 0 || q.answerIndex >= (q.options?.length ?? 0))) {
        report(`cognitive-systems.json: "${s.id}" q "${q.id}" → answerIndex out of range`);
      }
    }
  }
}

if (errors) {
  console.error(`\ncheck:data FAILED with ${errors} error(s)`);
  process.exit(1);
}
console.log('check:data OK — all content references resolve');
