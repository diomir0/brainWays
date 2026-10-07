# AGENTS.md — Orientation for LLM agents

This file exists so an agent (or human) examining this project for the first time
can build an accurate mental model **without reading files blindly**. It explains
how the project is laid out, the core design principles, the build/verify commands,
and the non-obvious technical gotchas that took real debugging to learn.

For a narrative overview of the project and its current status, read:

- **`README.md`** — what the project is, how to run it, licensing.
- **`PLAN.md`** — milestones, architecture, and the up-to-date "Status" checklist
  (what is done vs. planned). This is the authoritative source for *future*
  development direction.

---

## What this is

**BrainWays** (formerly "Neurofun") — a free, open-source, browser/PWA (and
Capacitor/Android) tool for **graduate-level neuroanatomy and systems-neuroscience
learning and assessment**. It renders a 3D brain atlas (three.js), lets users
explore/peel structures, follow animated functional-system "pathways", take quizzes
(multiple-choice, "find-on-model", and clinical case-vignettes), and review with
spaced repetition.

**Audience/level:** neuroscience & cognitive-science graduate students, with an
emphasis on *systems* neuroscience.

---

## Stack

- **Vite 5 + React 18 + TypeScript + Tailwind + zustand** (state).
- **three.js 0.160** via **`@react-three/fiber` 8** (`@react-three/drei` was
  mentioned in PLAN but is not actually a dependency — only `@react-three/fiber`).
- **PWA** (`vite-plugin-pwa` is *not* used; PWA is hand-rolled via
  `public/manifest.webmanifest` + `public/sw.js`).
- **Capacitor 8** for the Android APK (`@capacitor/core`, `@capacitor/cli`,
  `@capacitor/android`).
- **Vitest 1.6** (pinned to 1.x because Vitest 5 needs Vite 6) + `fake-indexeddb`.
- **IndexedDB** (local-first, non-destructive).

---

## Directory map

```
src/
  main.tsx                entry
  App.tsx                 top-level view switch; clears transient 3D state on view change
  index.css               global Tailwind + custom utility classes (chip/panel/btn/…)
  state/store.ts          zustand stores: useApp (view, quizSystemId) + useBrain (3D state)
  types/                  contracts for data + assessment (see "Data model")
  data/                   ALL data files (see "Data model")
    atlas.json            GENERATED — anatomy identity + geometry mapping
    systems.json          GENERATED — functional systems, landmarks, stages
    themes.json           hand-written transversal themes
    content/*.json         hand-written graduate content + questions (8 systems)
  core/
    atlas/loader.ts       lookups + search over atlas.json/systems.json
    atlas/tractPaths.ts   PCA centerline extraction for white-matter tracts
    content/loader.ts     content + question loading (import.meta.glob)
    content/themes.ts     themes + "pathways" reverse-index (structure → systems)
    assessment/engine.ts  question drawing, answer recording, progress (IndexedDB)
    assessment/srs.ts     SM-2 spaced-repetition scheduler
    assessment/cards.ts   review cards derived from structures
    storage/db.ts         minimal IndexedDB `kv` wrapper (namespaced keys)
  components/
    brain/BrainViewer.tsx the 3D viewer (Canvas + BrainScene + flow animation) — see "Gotchas"
    ui/NavBar.tsx         top nav + brand
    ui/StructureCard.tsx  the Explore info card (function/pathways/references)
  views/
    Explore.tsx           search + layer/hemisphere toggles (left panel) + info card
    Study.tsx             guided system lessons (stage stepper + flow animation)
    Quiz.tsx             assessment (mc / find / case)
    Review.tsx            Anki-style cards (spaced repetition)
    Progress.tsx          stats

scripts/
  build_atlas.mjs         GENERATES atlas.json + systems.json from GLB metadata + Brain Project taxonomy
  check_data.mjs          validates content references resolve in atlas.json
  copy_draco.mjs          copies the Draco decoder into public/ (runs on postinstall)
  gen_icons.mjs           regenerates PWA PNG icons from an inline SVG (uses sharp)
  _bp_*.js / _mesh_names.json   vendored Brain Project source data (inputs to build_atlas)

public/                   brain.glb, draco/, icon.svg, icons/*.png, manifest, sw.js
android/                  generated Capacitor platform (commit it; see "Commands")
```

---

## Data model — the most important design principle

The project is built so **identity, content, and code are decoupled**, and every
data layer is **versioned** (`schemaVersion`), so future additions never break
existing data or saved user state.

- **`atlas.json`** — anatomy. Each structure has a stable, permanent `id`
  (`<category>.<label>.<side>`, e.g. `cortex.precentral-gyrus.left`) plus `label`,
  `category`, `side` (`left`/`right`/`median`), `region`, `hierarchy`, `meshName`,
  and **`bxId`** (see gotcha #1). Also `categories` (name → color) and `depth`
  (peel order, outer→inner).
- **`systems.json`** — functional systems. Each `system` has `stages`, and each
  stage lists `structureIds` (the ordered "pathway"). This ordering drives the
  study-mode flow animation and the tract-flow direction.
- **`content/*.json`** — graduate content keyed by `systemId`, with per-structure
  `function`/`connectivity`/`clinical`/`methods`/`citations` and a `questions` array
  (kinds: `mc`, `find`, `case`).
- **Stable IDs are the join key** across anatomy, content, systems, questions, and
  saved progress. **Never reuse an `id`**; renaming a display `label` must not
  change the `id`.
- **`atlas.json` and `systems.json` are generated** by `npm run build:data`
  (`scripts/build_atlas.mjs`) from the GLB metadata + the vendored Brain Project
  taxonomy. **Do not hand-edit them** — edit the script/inputs and regenerate.
- **User data** lives in IndexedDB (`kv` store, namespaced keys) with a
  `schemaVersion`-style version bump; migrations are non-destructive.

To add a structure/system: edit content/systems sources, regenerate data, then run
`npm run check:data`.

---

## Commands

```bash
npm run dev            # dev server
npm run build          # tsc --noEmit && vite build
npm run preview        # preview the production build
npm run build:data     # regenerate atlas.json + systems.json (from GLB + taxonomy)
npm run check:data     # validate all content structureId/question references resolve
npm test               # Vitest (SRS + storage tests)
npm run cap:sync       # sync web build into android/ (run after npm run build)
npm run cap:add:android
npm run cap:open:android
```

**APK generation** (requires a JDK + Android SDK — NOT available in this dev env):

```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Critical technical gotchas

These are hard-won; ignoring them will silently break the 3D viewer or data.

1. **Join geometry by `bxId`, never by node name.** `GLTFLoader` sanitizes
   `node.name` (spaces → underscores) but preserves the original name and
   `bx_id`/`bx_label` in `userData`. `BrainViewer.tsx` builds a `bxId → structure`
   map and keys `meshMap` by the atlas `bxId`.

2. **126 of 437 GLB meshes are multi-primitive.** three.js wraps them in `Group`s
   carrying `bx_id`. When traversing, read `o.userData.bx_id` and assign **all
   descendant meshes** (not just `Mesh` objects) — skipping this silently drops all
   cortical gyri.

3. **Relative asset paths (required by Capacitor).** `vite.config` sets
   `base: './'`, and the GLB/Draco/icon/manifest URLs are relative
   (`./models/brain.glb`, `./draco/`, …). Keep them relative. `useLoader`
   **suspends**, so `<BrainScene>` must be inside `<Suspense>` *inside* `<Canvas>`.

4. **Scene setup must be idempotent.** `useLoader` caches the same `gltf.scene`
   across view remounts, so on remount the scene is already scaled/rotated/positioned.
   `BrainViewer.tsx` therefore **resets the transform to identity at the top of the
   setup `useMemo`** before re-computing the box/center/scale. Don't remove that reset.

5. **Focus must be applied from `useFrame`, not a mount effect.** The GLB loads
   asynchronously; a mount effect runs before it's ready. The focus is "self-healing"
   and keyed by the sorted id set.

6. **Pulse/fade are per-frame; visibility `apply()` is per-store-change.** The
   `apply()` effect sets visibility + base color only — **do NOT set emissive there**,
   or it clobbers the per-frame flow pulse. Fade is applied every frame but only
   recompiles a material when the `faded` state flips.

7. **Camera must stay outside the brain.** The focus distance is clamped (min from
   origin) so the camera never dives inside when targeting deep structures.

8. **The IndexedDB name is intentionally still `'neurofun'`** (`db.ts` `DB_NAME`),
   even though the app is "BrainWays" — renaming it would orphan saved user data.
   Leave it.

9. **Bilateral flow is grouped by label** (`groupByLabel`) so L/R light
   simultaneously; the active group is published to the store (`flowActiveIds`)
   only on change, not per frame (to avoid per-frame React renders).

10. **Tract "flow" pulses** use PCA-extracted centerlines (`core/atlas/tractPaths.ts`),
    oriented source→target from the stage's structure order.

---

## Testing & verification approach

- **Unit tests:** `npm test` (Vitest; `src/**/*.test.ts`). Existing tests cover the
  SM-2 SRS scheduler and the IndexedDB `kv` store (using `fake-indexeddb`).
- **Data integrity:** `npm run check:data` (must pass; run after any content edit).
- **Browser/visual:** a Playwright-driven smoke test (the `webapp-testing` skill's
  `scripts/with_server.py`) has been used to verify the 3D viewer, study flow,
  quiz, and mobile layout. It measures **canvas-only** pixels (full-page measurement
  causes false positives). The `window.__neurofunBrain`/`__neurofunMeshes`/
  `__neurofunCamera` debug hooks were removed — re-add temporarily in `store.ts` and
  `BrainViewer.tsx` if you need runtime store/camera introspection during debugging.

---

## Conventions

- TypeScript strict; Tailwind utility classes plus custom `chip`/`panel`/`btn`/
  `btn-primary`/`border-edge`/`bg-panel`/`text-accent` classes defined in
  `src/index.css` (and `tailwind.config.js`).
- Content is graduate-level and **cited** (Kandel 6th ed., Purves, primary papers).
- Licensing: CC BY-SA 4.0, no commercial intent (see README).
