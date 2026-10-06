# BrainWays — Neuroanatomy & Systems Neuroscience Learning/Assessment Tool

A free, open-source, browser-based (PWA) tool for learning and assessing
graduate-level neuroanatomy and the functional (systems) organization of the
brain. Works as a website on desktop and as an installable app on phones.

## Vision

Reverse-engineer the *ideas* of two exemplary tools and combine them:

- **atlas.neuro2.ai** — a multimodal atlas (parcellations, tracts, receptor maps,
  functional↔landmark-paper links). Model for *functional depth*.
- **itayinbarr.github.io/brainproject** — an education-first 3D atlas with
  search, layer peeling, guided functional systems, and a quiz engine
  (multiple-choice + "find the structure on the 3D brain"). Model for
  *learning/assessment mechanics*.

## Audience & content focus

- **Audience:** neuroscience & cognitive-science graduate students and
  researchers.
- **Emphasis:** *systems neuroscience* — functional systems/pathways, not just
  static anatomy.
- **Level:** graduate — four content dimensions per structure:
  1. **Anatomy** (location, cytoarchitecture, relations)
  2. **Function** (roles, systems/pathways it belongs to)
  3. **Clinical / lesion** correlates
  4. **Methods & evidence** (imaging/receptor data, landmark papers)

## Licensing

Fully open, no commercial intent. Reused data is CC BY-SA 4.0 (Z-Anatomy /
BodyParts3D; CIT168, Najdenovska 2018, HCP1065 as noted per-structure). The
tool and its content are released CC BY-SA 4.0 with attribution.

---

## Architecture

Single TypeScript codebase → web + PWA (installable on phone & desktop).

- **UI/stack:** Vite + React 18 + TypeScript, Tailwind CSS, `zustand` state.
- **3D:** three.js via `@react-three/fiber` + `@react-three/drei`.
- **Persistence:** IndexedDB (local-first), versioned with migrations.
- **PWA:** `vite-plugin-pwa` (offline, add-to-home-screen).

### Data model — robust & backward-compatible

The core design principle (from requirement #7): **decouple identity, content,
and code**, and **version every data layer** so future additions never break
existing data or saved user state.

```
src/data/
  atlas.json        # anatomy (identity + geometry mapping)  schemaVersion
  systems.json      # functional systems / pathways          schemaVersion
  content/          # graduate content keyed by stable id     schemaVersion
```

- **Stable IDs:** every structure gets a permanent `id` (never reused). The
  `id` is the join key across anatomy, content, systems, questions, and saved
  progress. Renames of *display labels* do not affect the `id`.
- **Identity vs. content separated:** anatomy (`atlas.json`) can grow without
  touching content; content files can be edited independently.
- **Geometry mapping:** each structure records the GLB node `name`(s) it maps
  to. The real mesh (`public/models/brain.glb`, Z-Anatomy, 437 structures) is a
  swappable asset — replacing it only requires updating `meshNames`.
- **User data:** IndexedDB records carry a `schemaVersion` and are migrated
  forward via a migration chain (never destructive).

### Core layers

```
src/core/
  atlas/        # loaders, lookups, search index
  assessment/   # question engine, SRS (SM-2), scoring, progress
  storage/      # IndexedDB wrapper + migrations
```

---

## Milestones

### Phase 0 — Foundations ✅
- [x] Probe both reference sites (data model, features, licenses)
- [x] Source content library identified (Mind, Brain & Behavior folder)
- [x] Download Z-Anatomy `brain.glb` (437 structures, CC BY-SA 4.0)
- [x] Reverse-engineer GLB metadata (`bx_id/label/cat/side/region/source`)
- [x] Decide stack & architecture (see above)

### Phase 1 — Scaffold & data pipeline ✅
- [x] Vite + React + TS + Tailwind project scaffold
- [x] `scripts/build_atlas.mjs`: GLB metadata + brainproject taxonomy → `atlas.json`
- [x] `scripts/build_atlas.mjs`: brainproject systems → `systems.json`
- [x] Atlas loader + search index + stable ID generation
- [x] `scripts/check_data.mjs` content-reference validation

### Phase 2 — 3D viewer ✅
- [x] Load `brain.glb` with Draco decompression (bundled decoder, offline)
- [x] Orbit/zoom/pan + hemisphere & layer (peel) controls
- [x] Click-to-select a structure → info card
- [x] Search → highlight & fly-to
- [x] Mobile touch + responsive layout (browser-verified)

### Phase 3 — Graduate content ✅
- [x] Content schema (function, connectivity, clinical, methods, citations)
- [x] Author 3 flagship systems (motor, visual, language) at graduate level
- [x] Seed structure descriptions (baseline from open data)
- [x] Enrich remaining 5 systems (auditory, somatosensory, limbic, reward, CSF)

### Phase 4 — Assessment engine ✅
- [x] Question schema (mc, find)
- [x] SRS scheduler (SM-2) + review queue
- [x] Scoring & per-question explanations with citations
- [x] Progress tracking (local-first IndexedDB)
- [x] Clinical case-vignette question type

### Phase 5 — Learning flows ✅
- [x] Guided system lessons + narration (stage stepper)
- [x] Flashcards / spaced-repetition decks
- [x] Search & explore UX

### Phase 6 — Hardening
- [x] PWA manifest + service worker (offline model/Draco cache)
- [x] Native PNG app icons (192/512)
- [x] Accessibility & low-end-phone perf pass
- [x] Content schema validation (`check:data`)
- [x] Unit tests (SRS, migration)
- [x] Android build via Capacitor (`capacitor.config.ts`, `android/` platform, APK steps documented)
- [ ] User testing

---

## First slice (current focus)

- ~250 structures (curated from the 437-mesh atlas)
- 3 systems: **motor**, **visual**, **language**
- 2 question types: **multiple-choice** + **find-on-model**
- SRS + local progress tracking

## Status

- [x] Plan written (this file)
- [x] Scaffold built
- [x] Data pipeline producing `atlas.json` / `systems.json`
- [x] Working viewer + study + quiz + review + progress MVP (browser-verified)
- [x] Study-mode flow animation: bilateral simultaneous lighting (L/R pulse in
      lockstep), progressive layer fade, same-depth isolation so the highlighted
      region pops, and a follow-the-flow camera that stays outside the brain
      (browser-verified)
- [x] All 8 systems have graduate content + questions (auditory, somatosensory,
      limbic, reward, CSF enriched)
- [x] Explore sidebar shows functional systems/pathways + function/connectivity +
      references for the clicked structure
- [x] Study sidebar labels light up in sync with the flow animation
- [x] Tract-flow animation: moving pulses travel along white-matter tract
      centerlines (PCA-extracted), oriented source → target
- [x] Explore structure toggles moved to a left-side vertical panel
- [x] Home/start view faces the anterior (front) of the brain
- [x] Clinical case-vignette question type (vignette + MC, cited explanation)
- [x] Renamed project/app to BrainWays (internal IndexedDB name kept for data
      compatibility)
- [x] Capacitor configured for Android; `android/` platform generated; APK steps
      documented in README
- [x] Unit tests: SM-2 SRS + IndexedDB kv store (Vitest, 11 tests)

## Recent fixes (round 2 feedback)

- Bilateral regions light up simultaneously (flow grouped by label).
- Study resets layer/hemisphere filters on system entry; visibility fades
  progressively to reveal deeper recruited regions.
- Explore picking respects layer visibility (hidden/faded structures are not
  clickable, so deeper structures can be inspected when the cortex is toggled
  off).
- Explore Close resets the camera; home framing is idempotent across view
  remounts (scene transform reset to identity before re-boxing).
