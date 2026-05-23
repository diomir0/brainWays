# BrainWays — Neural Pathways Explorer

An interactive visualization of neural pathways in the human brain. Explore sensory, motor, and cognitive circuits through clickable node-and-edge diagrams with detailed anatomical and functional descriptions.

## Pathways included

| Category | Pathways |
|----------|----------|
| Sensory | Visual, Auditory, Somatosensory, Olfactory, Vestibular |
| Motor | Motor |
| Higher-order | Executive, Reward, Memory, Emotion |

## Features

- Interactive SVG diagrams with selectable nodes
- Feedforward, feedback, and bypass/rec reflex edge types
- Detailed descriptions of each brain region
- Dark theme UI

## Getting started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project structure

```
src/
  data/pathways.js       — Pathway node/edge data and category definitions
  utils/geometry.js      — Geometry helpers for diagram layout
  utils/validateData.js  — Runtime validation of pathway data integrity
  components/
    BrainPathways.jsx    — Main application component
    PathwayDiagram.jsx   — SVG diagram container
    PathEdge.jsx         — Edge renderer
    PathNode.jsx         — Node renderer
    DetailPanel.jsx      — Node detail panel
    Legend.jsx           — Edge type legend
  brainWays.css          — Global styles, animations, fonts
  main.jsx               — Entry point
```

## Tech stack

- React 19 + Vite 8
- React Compiler (via Babel plugin)
- ESLint