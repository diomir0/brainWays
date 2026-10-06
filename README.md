# BrainWays — Systems Neuroscience Atlas

A free, open-source, browser-based (PWA) tool for learning and assessing
**graduate-level neuroanatomy** and the **functional (systems) organization** of
the brain. Runs on desktop and installs on phones via add-to-home-screen.

Built by reverse-engineering the ideas of two exemplary tools:

- **atlas.neuro2.ai** — multimodal atlas (parcellations, tracts, receptor maps,
  function↔landmark-paper links) → model for *functional depth*.
- **itayinbarr.github.io/brainproject** — education-first 3D atlas with search,
  layer peeling, functional systems, and a quiz engine → model for
  *learning/assessment mechanics*.

## Quick start

```bash
npm install        # installs deps + copies the Draco decoder into public/draco
npm run build:data # regenerate src/data/atlas.json + systems.json from the mesh
npm run dev        # start the dev server (http://localhost:5173)
```

Production build: `npm run build` → `npm run preview`.

## Features (first slice)

- **3D atlas** — 437 structures (Z-Anatomy / BodyParts3D, CC BY-SA 4.0) rendered
  in three.js with search, click-to-select, fly-to focus, hemisphere toggle, and
  layer (category) peel.
- **Study** — 8 functional systems (motor, visual, language, auditory,
  somatosensory, limbic, reward, CSF) with staged narration that highlights the
  relevant structures on the model.
- **Assessment** — multiple-choice and "find-the-structure" questions with cited
  explanations; graduate-level content authored for **motor, visual, language**.
- **Review** — SM-2 spaced repetition over a card deck derived from described
  structures.
- **Progress** — local-first tracking of question accuracy and due cards.

## Architecture

```
src/
  types/         # versioned data contracts (atlas, content, assessment)
  core/
    atlas/       # atlas loader, search index
    assessment/  # SM-2 scheduler, question engine, review cards
    content/     # authored-content loader (import.meta.glob)
    storage/     # IndexedDB wrapper (versioned, non-destructive)
  state/         # zustand stores (app view + 3D brain state)
  components/
    brain/       # react-three-fiber viewer (GLB load, picking, highlight)
    ui/          # NavBar, StructureCard
  views/         # Explore, Study, Quiz, Review, Progress
  data/
    atlas.json   # anatomy (identity + geometry)  — generated
    systems.json # functional systems            — generated
    content/     # authored graduate content      — hand-written
scripts/
  build_atlas.mjs  # GLB metadata + taxonomy -> atlas.json / systems.json
  check_data.mjs    # validates all content references resolve
  copy_draco.mjs    # Draco WASM decoder -> public/draco
public/
  models/brain.glb  # Z-Anatomy mesh (CC BY-SA 4.0)
  draco/            # Draco decoder
```

### Robustness & backward-compatibility (requirement #7)

- **Stable IDs** — every structure has a permanent `id` (`<category>.<label>.<side>`)
  that is the join key across anatomy, content, questions, and saved progress.
  Display labels can change without breaking references.
- **Decoupled layers** — anatomy (`atlas.json`), functional content
  (`content/*.json`), and user state are separate and independently versioned
  (`schemaVersion`).
- **Geometry is swappable** — structures join the mesh by the stable integer
  `bxId` (not cosmetic node names), so replacing the GLB only requires
  regenerating `atlas.json`.
- **Versioned storage** — IndexedDB uses namespaced keys in a single store;
  adding new kinds of user data never needs a destructive migration.

## License & attribution

- Tool and authored content: **CC BY-SA 4.0**.
- Brain mesh & anatomical taxonomy: Z-Anatomy / BodyParts3D (CC BY-SA 4.0);
  deep nuclei from CIT168 (CC BY 4.0) and Najdenovska 2018 (CC BY-SA 4.0);
  tracts from HCP1065 (Yeh 2022, CC BY-SA 4.0). See `src/data/atlas.json`
  `source` per structure.
- Functional systems/lessons adapted from the Brain Project (CC BY-SA 4.0).
- Graduate content references Kandel's *Principles of Neural Science* (6th ed.),
  Purves et al., and primary literature (cited inline).

## Roadmap

See [PLAN.md](./PLAN.md) for the full milestone tracker. Outstanding:
enrich remaining systems' graduate content, clinical vignette questions,
native app icons, and broader test coverage.

## Mobile app (Android via Capacitor)

BrainWays ships as a static bundle wrapped by [Capacitor](https://capacitorjs.com/).
The web build is copied into the native `android/` platform, which is what
produces the APK.

```bash
npm run build            # build the web bundle into dist/
npx cap sync android      # copy dist/ + native plugins into android/
cd android && ./gradlew assembleDebug
```

The debug APK is written to:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

One-time platform setup (already committed once generated):

```bash
npx cap add android      # or: npm run cap:add:android
npm run cap:open:android # opens the project in Android Studio
```

Builds require a JDK and the Android SDK; set `ANDROID_HOME` (or install
Android Studio) before running Gradle.
