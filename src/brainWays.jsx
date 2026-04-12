import { useState, useRef } from "react";

// ─── CATEGORIES & MODALITIES ──────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "sensory",
    label: "Sensory",
    modalities: [
      { id: "visual", label: "Visual", icon: "◎", color: "#7C6FCD" },
      { id: "auditory", label: "Auditory", icon: "◑", color: "#3A9E82" },
      { id: "somatosensory", label: "Somatosensory", icon: "◈", color: "#C4714A" },
      { id: "olfactory", label: "Olfactory", icon: "◉", color: "#9E6BAA" },
      { id: "vestibular", label: "Vestibular", icon: "◐", color: "#B8963A" },
    ],
  },
  {
    id: "motor",
    label: "Motor",
    modalities: [{ id: "motor", label: "Motor", icon: "◆", color: "#5A8FC4" }],
  },
  {
    id: "cognition",
    label: "Higher-order",
    modalities: [
      { id: "executive", label: "Executive", icon: "▣", color: "#4EAED0" },
      { id: "reward", label: "Reward", icon: "▢", color: "#D4A843" },
      { id: "memory", label: "Memory", icon: "▤", color: "#7EC47E" },
      { id: "emotion", label: "Emotion", icon: "▥", color: "#D06B8A" },
    ],
  },
];

const ALL_MODALITIES = CATEGORIES.flatMap((c) => c.modalities);

// ─── PATHWAY DATA ─────────────────────────────────────────────────────────────
const PATHWAYS = {
  visual: {
    title: "Visual pathway",
    subtitle: "Retina → LGN → V1 → Association cortex",
    color: "#7C6FCD",
    nodes: [
      {
        id: "rgc",
        x: 320,
        y: 40,
        w: 200,
        label: "Retinal ganglion cells",
        sub: "M / P / K types",
        color: "#7C6FCD",
        detail:
          "Three RGC populations encode different visual properties. M cells (magnocellular) respond to motion and low contrast. P cells (parvocellular) encode fine detail and color. K cells (koniocellular) contribute to color and project to LGN konio layers and V1 layer 1.",
      },
      {
        id: "chiasm",
        x: 320,
        y: 148,
        w: 200,
        label: "Optic chiasm",
        sub: "Partial decussation",
        color: "#666",
        detail:
          "Nasal retinal fibers from each eye cross at the chiasm; temporal fibers stay ipsilateral. Each hemisphere receives visual input from the contralateral hemifield — a principle maintained throughout the pathway.",
      },
      {
        id: "lgn",
        x: 230,
        y: 256,
        w: 200,
        label: "LGN",
        sub: "Layers 1–6 (M/P/K)",
        color: "#7C6FCD",
        detail:
          "The lateral geniculate nucleus has 6 layers: 1–2 magnocellular, 3–6 parvocellular, with koniocellular neurons interleaved. Output travels via the optic radiation to V1 layer 4C. V1 layer 6 sends corticothalamic feedback outnumbering retinal afferents ~10:1.",
      },
      {
        id: "sc",
        x: 490,
        y: 256,
        w: 150,
        label: "Superior colliculus",
        sub: "Retinotectal",
        color: "#888",
        detail:
          "The retinotectal pathway mediates reflexive saccades, spatial orienting, and is the anatomical substrate of blindsight. It projects to the pulvinar.",
      },
      {
        id: "v1",
        x: 230,
        y: 364,
        w: 200,
        label: "V1 — Primary visual cortex",
        sub: "Striate cortex",
        color: "#7C6FCD",
        detail:
          "V1 contains a precise retinotopic map organized in cortical columns. LGN afferents arrive at layer 4C; layers 2/3 project to V2 and MT; layer 6 sends feedback to LGN. More top-down input arrives from higher cortex than from the LGN.",
      },
      {
        id: "v2",
        x: 230,
        y: 460,
        w: 200,
        label: "V2",
        sub: "Extrastriate",
        color: "#7C6FCD",
        detail:
          "V2 is organized in thin (color), thick (disparity/motion), and pale (form) cytochrome oxidase stripes. Thin stripes feed the ventral stream; thick stripes feed the dorsal stream. V2 sends feedback to V1.",
      },
      {
        id: "v4",
        x: 110,
        y: 556,
        w: 150,
        label: "V4",
        sub: "Color, shape",
        color: "#C4714A",
        detail:
          "V4 is a key ventral-stream node involved in color constancy, shape selectivity, and figure-ground segmentation. Lesions cause achromatopsia. Projects to inferotemporal cortex.",
      },
      {
        id: "mt",
        x: 380,
        y: 556,
        w: 150,
        label: "MT / V5",
        sub: "Motion, optic flow",
        color: "#3A9E82",
        detail:
          "MT receives direct input from V1 layer 4B and from the pulvinar. Direction-selective neurons. Lesions cause akinetopsia. Receives top-down signals from frontal eye fields.",
      },
      {
        id: "it",
        x: 110,
        y: 652,
        w: 200,
        label: "Inferotemporal cortex",
        sub: "TEO, TE — 'what'",
        color: "#C4714A",
        detail:
          "IT cortex (TEO and TE) is the ventral stream apex. Neurons respond to objects, faces, scenes. Large receptive fields. Tightly connected to memory systems (perirhinal, hippocampus). Sends feedback to V1.",
      },
      {
        id: "ppc",
        x: 380,
        y: 652,
        w: 200,
        label: "Posterior parietal cortex",
        sub: "PPC — 'where/how'",
        color: "#5A8FC4",
        detail:
          "PPC (LIP, VIP, AIP, MIP) is the dorsal stream apex. Encodes spatial location, guides visually-directed actions. Projects to frontal motor areas. Lesions cause hemispatial neglect.",
      },
    ],
    edges: [
      { from: "rgc", to: "chiasm", type: "ff" },
      { from: "chiasm", to: "lgn", type: "ff" },
      { from: "chiasm", to: "sc", type: "bypass" },
      { from: "lgn", to: "v1", type: "ff" },
      { from: "v1", to: "lgn", type: "fb" },
      { from: "sc", to: "mt", type: "bypass" },
      { from: "v1", to: "v2", type: "ff" },
      { from: "v2", to: "v1", type: "fb" },
      { from: "v2", to: "v4", type: "ff" },
      { from: "v4", to: "v2", type: "fb" },
      { from: "v2", to: "mt", type: "ff" },
      { from: "mt", to: "v2", type: "fb" },
      { from: "v4", to: "it", type: "ff" },
      { from: "it", to: "v4", type: "fb" },
      { from: "mt", to: "ppc", type: "ff" },
      { from: "ppc", to: "mt", type: "fb" },
    ],
  },

  auditory: {
    title: "Auditory pathway",
    subtitle: "Cochlea → MGB → A1 → Association cortex",
    color: "#3A9E82",
    nodes: [
      {
        id: "cochlea",
        x: 320,
        y: 40,
        w: 200,
        label: "Cochlea / spiral ganglion",
        sub: "Tonotopic encoding",
        color: "#3A9E82",
        detail:
          "Hair cells in the organ of Corti transduce sound. Inner hair cells (95% of afferents) drive the auditory nerve; outer hair cells sharpen tuning via the olivocochlear bundle. Tonotopically organized — high frequencies at the base, low at the apex.",
      },
      {
        id: "cn",
        x: 320,
        y: 148,
        w: 200,
        label: "Cochlear nuclei (CN)",
        sub: "Dorsal + ventral",
        color: "#3A9E82",
        detail:
          "First central synapse. Bifurcates into DCN (spectral analysis) and AVCN/PVCN (timing, binaural cues). Each feeds separate brainstem pathways.",
      },
      {
        id: "soc",
        x: 200,
        y: 256,
        w: 200,
        label: "Superior olivary complex",
        sub: "Binaural processing",
        color: "#3A9E82",
        detail:
          "First site where both ears converge. MSO detects interaural time differences (ITDs) for low-frequency localization; LSO detects interaural level differences (ILDs) for high-frequency localization. Origin of olivocochlear efferents.",
      },
      {
        id: "ic",
        x: 320,
        y: 364,
        w: 200,
        label: "Inferior colliculus",
        sub: "Midbrain integration",
        color: "#3A9E82",
        detail:
          "Major obligatory relay. Virtually all ascending auditory pathways converge here. Integrates monaural and binaural information, processes temporal patterns. Projects to MGB; receives corticofugal feedback.",
      },
      {
        id: "mgb",
        x: 320,
        y: 460,
        w: 200,
        label: "MGB (medial geniculate body)",
        sub: "Auditory thalamus",
        color: "#3A9E82",
        detail:
          "Auditory thalamus. Ventral division: tonotopic, lemniscal → A1. Dorsal division: non-lemniscal → belt areas. Medial division: multisensory. Receives massive corticothalamic feedback.",
      },
      {
        id: "a1",
        x: 320,
        y: 556,
        w: 200,
        label: "A1 — Primary auditory cortex",
        sub: "Tonotopic, bilateral",
        color: "#3A9E82",
        detail:
          "On Heschl's gyrus. Tonotopically organized. Receives bilateral input — unlike V1. Thalamic afferents in layer 4; layer 6 sends corticothalamic feedback to MGB.",
      },
      {
        id: "belt",
        x: 150,
        y: 652,
        w: 180,
        label: "Auditory belt / parabelt",
        sub: "Pitch, timbre, rhythm",
        color: "#3A9E82",
        detail:
          "Belt areas process complex acoustic features. Parabelt further abstracts. Analogous to V1 → V2 → extrastriate hierarchy.",
      },
      {
        id: "stg",
        x: 390,
        y: 652,
        w: 200,
        label: "STG / STS",
        sub: "Speech, music, voices",
        color: "#3A9E82",
        detail:
          "Superior temporal gyrus and sulcus: speech comprehension (Wernicke's area in left posterior STG), voice identity, music. Two streams: ventral 'what' and dorsal 'where/how'.",
      },
    ],
    edges: [
      { from: "cochlea", to: "cn", type: "ff" },
      { from: "cn", to: "soc", type: "ff" },
      { from: "soc", to: "ic", type: "ff" },
      { from: "ic", to: "mgb", type: "ff" },
      { from: "mgb", to: "ic", type: "fb" },
      { from: "mgb", to: "a1", type: "ff" },
      { from: "a1", to: "mgb", type: "fb" },
      { from: "a1", to: "belt", type: "ff" },
      { from: "belt", to: "a1", type: "fb" },
      { from: "belt", to: "stg", type: "ff" },
      { from: "stg", to: "belt", type: "fb" },
    ],
  },

  somatosensory: {
    title: "Somatosensory pathway",
    subtitle: "Receptors → VPL/VPM → S1 → Association cortex",
    color: "#C4714A",
    nodes: [
      {
        id: "receptors",
        x: 280,
        y: 40,
        w: 240,
        label: "Peripheral receptors",
        sub: "Meissner, Pacinian, Merkel…",
        color: "#C4714A",
        detail:
          "Mechanoreceptors: Meissner (light touch, RA1), Merkel (pressure/form, SA1), Pacinian (vibration, RA2), Ruffini (stretch, SA2). Free nerve endings: pain/temperature via Aδ and C fibers.",
      },
      {
        id: "drg",
        x: 280,
        y: 148,
        w: 240,
        label: "Dorsal root ganglia (DRG)",
        sub: "First-order neurons",
        color: "#C4714A",
        detail:
          "Pseudounipolar neurons — one branch to periphery, one into spinal cord. Carry all somatosensory modalities. Facial equivalent: trigeminal ganglion (CN V).",
      },
      {
        id: "dcml",
        x: 150,
        y: 256,
        w: 190,
        label: "Dorsal column / med. lemniscus",
        sub: "Touch, proprioception",
        color: "#C4714A",
        detail:
          "Fine touch and proprioception ascend ipsilaterally in dorsal columns (gracilis/cuneatus) to nucleus gracilis/cuneatus in medulla, decussate, then ascend as the medial lemniscus to VPL.",
      },
      {
        id: "stt",
        x: 410,
        y: 256,
        w: 170,
        label: "Spinothalamic tract",
        sub: "Pain, temperature",
        color: "#888",
        detail:
          "Pain/temperature (Aδ, C) synapse in dorsal horn laminae I/IV/V, immediately decussate via anterior commissure, and ascend as the lateral STT to VPL and intralaminar nuclei.",
      },
      {
        id: "vpl",
        x: 280,
        y: 364,
        w: 240,
        label: "VPL / VPM thalamus",
        sub: "Somatosensory thalamus",
        color: "#C4714A",
        detail:
          "VPL relays body input → S1; VPM relays facial/trigeminal input → S1. Both somatotopically organized. POm (posterior medial nucleus) is a higher-order relay receiving S1 layer 5 input.",
      },
      {
        id: "s1",
        x: 280,
        y: 460,
        w: 240,
        label: "S1 — Primary somatosensory",
        sub: "Areas 3a, 3b, 1, 2",
        color: "#C4714A",
        detail:
          "Postcentral gyrus: area 3a (proprioception), 3b (cutaneous — main thalamic target), 1 (texture), 2 (size/shape). Somatotopically organized (homunculus). Layer 6 → dense corticothalamic feedback.",
      },
      {
        id: "s2",
        x: 150,
        y: 556,
        w: 200,
        label: "S2 — Secondary somatosensory",
        sub: "Bilateral, haptic",
        color: "#C4714A",
        detail:
          "Receives input from all four S1 areas. Bilateral representation. Involved in tactile learning, haptic object recognition, pain. Projects to insula and parietal cortex.",
      },
      {
        id: "insula",
        x: 150,
        y: 652,
        w: 180,
        label: "Insular cortex",
        sub: "Interoception, pain",
        color: "#9E6BAA",
        detail:
          "Posterior insula: pain, temperature, visceral signals, interoception. Anterior insula: integrates body signals with emotional and cognitive context. Major target of the spinothalamic affective branch.",
      },
      {
        id: "ppc",
        x: 410,
        y: 556,
        w: 200,
        label: "Posterior parietal cortex",
        sub: "Areas 5, 7 — spatial",
        color: "#5A8FC4",
        detail:
          "Area 5 and 7 integrate somatosensory with visual and vestibular input to build a body-centered spatial map. Guides reach-to-grasp. Lesions impair tactile attention and spatial cognition.",
      },
    ],
    edges: [
      { from: "receptors", to: "drg", type: "ff" },
      { from: "drg", to: "dcml", type: "ff" },
      { from: "drg", to: "stt", type: "ff" },
      { from: "dcml", to: "vpl", type: "ff" },
      { from: "stt", to: "vpl", type: "ff" },
      { from: "vpl", to: "s1", type: "ff" },
      { from: "s1", to: "vpl", type: "fb" },
      { from: "s1", to: "s2", type: "ff" },
      { from: "s2", to: "s1", type: "fb" },
      { from: "s2", to: "insula", type: "ff" },
      { from: "s1", to: "ppc", type: "ff" },
      { from: "ppc", to: "s1", type: "fb" },
    ],
  },

  olfactory: {
    title: "Olfactory pathway",
    subtitle: "Epithelium → Piriform cortex (no thalamic relay)",
    color: "#9E6BAA",
    nodes: [
      {
        id: "oe",
        x: 320,
        y: 40,
        w: 220,
        label: "Olfactory epithelium",
        sub: "~400 receptor types",
        color: "#9E6BAA",
        detail:
          "Olfactory sensory neurons (OSNs) express ~400 receptor genes. Each OSN expresses only one type. Continuously regenerated from basal stem cells — the only neurons that directly contact the environment.",
      },
      {
        id: "ob",
        x: 320,
        y: 148,
        w: 220,
        label: "Olfactory bulb",
        sub: "Glomerular map",
        color: "#9E6BAA",
        detail:
          "OSN axons project through the cribriform plate to glomeruli. All OSNs of the same type converge on ~2 glomeruli — creating a spatial identity map. Mitral/tufted cells relay the signal; periglomerular and granule cells provide lateral inhibition.",
      },
      {
        id: "lot",
        x: 320,
        y: 256,
        w: 220,
        label: "Lateral olfactory tract",
        sub: "Direct cortical access",
        color: "#9E6BAA",
        detail:
          "Olfaction is the only sense projecting directly to cortex without a thalamic relay. The LOT carries mitral/tufted axons to piriform cortex, olfactory tubercle, entorhinal cortex, and amygdala. This explains the powerful emotional and mnemonic quality of odors.",
      },
      {
        id: "piriform",
        x: 190,
        y: 364,
        w: 200,
        label: "Piriform cortex",
        sub: "Primary olfactory cortex",
        color: "#9E6BAA",
        detail:
          "3-layer paleocortex on the ventral temporal lobe. Encodes odor identity and quality. Projects to OFC via MD thalamus — the only thalamic step in the olfactory pathway.",
      },
      {
        id: "amygdala",
        x: 450,
        y: 364,
        w: 180,
        label: "Amygdala",
        sub: "Emotional valence",
        color: "#D06B8A",
        detail:
          "Corticomedial division receives direct olfactory input and assigns emotional valence — fear, attraction, disgust. Modulates hippocampal memory consolidation. Explains why smells trigger strong emotional memories.",
      },
      {
        id: "ento",
        x: 190,
        y: 460,
        w: 200,
        label: "Entorhinal cortex",
        sub: "Gateway to hippocampus",
        color: "#9E6BAA",
        detail:
          "Receives olfactory, piriform, and amygdala input. Main gateway into the hippocampus via the perforant path. Underlies Proustian phenomenon — odors triggering vivid autobiographical memories.",
      },
      {
        id: "hippo",
        x: 450,
        y: 460,
        w: 180,
        label: "Hippocampus",
        sub: "Olfactory memory",
        color: "#7EC47E",
        detail:
          "Receives olfactory signals via entorhinal cortex. Involved in episodic olfactory memory — long-term storage and recall of odor-context associations. Hippocampal damage profoundly impairs odor recognition.",
      },
      {
        id: "ofc",
        x: 320,
        y: 556,
        w: 220,
        label: "Orbitofrontal cortex (OFC)",
        sub: "Odor identity, hedonics",
        color: "#9E6BAA",
        detail:
          "Receives piriform input via MD thalamus. Encodes odor pleasantness and identity. Integrates olfactory and gustatory signals (flavor perception). Modulated by hunger state.",
      },
    ],
    edges: [
      { from: "oe", to: "ob", type: "ff" },
      { from: "ob", to: "lot", type: "ff" },
      { from: "lot", to: "piriform", type: "ff" },
      { from: "lot", to: "amygdala", type: "ff" },
      { from: "lot", to: "ento", type: "ff" },
      { from: "piriform", to: "lot", type: "fb" },
      { from: "piriform", to: "ofc", type: "ff" },
      { from: "piriform", to: "ento", type: "ff" },
      { from: "amygdala", to: "hippo", type: "ff" },
      { from: "ento", to: "hippo", type: "ff" },
      { from: "hippo", to: "ento", type: "fb" },
      { from: "ofc", to: "piriform", type: "fb" },
    ],
  },

  vestibular: {
    title: "Vestibular pathway",
    subtitle: "Labyrinth → Vestibular nuclei → PIVC → PPC",
    color: "#B8963A",
    nodes: [
      {
        id: "labyrinth",
        x: 320,
        y: 40,
        w: 240,
        label: "Vestibular labyrinth",
        sub: "Otoliths + semicircular canals",
        color: "#B8963A",
        detail:
          "Semicircular canals (3, orthogonal) detect angular acceleration via endolymph/cupula. Utricle and saccule detect linear acceleration and gravity via otolithic membrane. Hair cells transduce mechanical deflection.",
      },
      {
        id: "vn8",
        x: 320,
        y: 148,
        w: 240,
        label: "Vestibular nerve (CN VIII)",
        sub: "Scarpa's ganglion",
        color: "#B8963A",
        detail:
          "Vestibular ganglion neurons project via CN VIII to the vestibular nuclear complex. Superior and inferior nerves carry signals from different labyrinthine regions. Some fibers project directly to the cerebellum.",
      },
      {
        id: "vn",
        x: 320,
        y: 256,
        w: 240,
        label: "Vestibular nuclear complex",
        sub: "Sup., lateral, medial, inf.",
        color: "#B8963A",
        detail:
          "Four nuclei integrate labyrinthine, cerebellar, visual, and spinal input. Project to: cerebellum (calibration), oculomotor nuclei (VOR), spinal cord (VSR), and thalamus.",
      },
      {
        id: "cerebellum",
        x: 120,
        y: 364,
        w: 170,
        label: "Cerebellum (FNL)",
        sub: "Flocculonodular lobe",
        color: "#B8963A",
        detail:
          "Archicerebellum. Receives direct vestibular nerve input. Modulates vestibular nuclei to calibrate the VOR and maintain postural stability. Lesions cause ataxia and vertigo.",
      },
      {
        id: "vor",
        x: 540,
        y: 364,
        w: 110,
        label: "VOR / oculomotor",
        sub: "Gaze stabilization",
        color: "#888",
        detail:
          "Vestibulo-ocular reflex. Pathway: vestibular nuclei → CN III/IV/VI → extraocular muscles. Fastest reflex (~7ms). Cerebellum continuously calibrates its gain.",
      },
      {
        id: "thalamus",
        x: 320,
        y: 364,
        w: 180,
        label: "VPL / VPIM thalamus",
        sub: "Vestibular thalamus",
        color: "#B8963A",
        detail:
          "No dedicated vestibular thalamic nucleus — signals share somatosensory nuclei (VPL, VPIM, intralaminar). Reflects deep integration of vestibular and proprioceptive information.",
      },
      {
        id: "pivc",
        x: 230,
        y: 460,
        w: 210,
        label: "PIVC — parieto-insular cortex",
        sub: "Primary vestibular cortex",
        color: "#B8963A",
        detail:
          "At the junction of posterior insula and parietal operculum. Primary vestibular cortex. Strongly modulated by visual input — visual-vestibular conflict here produces vection and motion sickness.",
      },
      {
        id: "ppc",
        x: 470,
        y: 460,
        w: 180,
        label: "Posterior parietal cortex",
        sub: "VIP, MSTd — heading",
        color: "#5A8FC4",
        detail:
          "VIP and MSTd integrate vestibular with visual (optic flow) and somatosensory signals to compute self-motion and heading direction. MSTd neurons respond to both optic flow and vestibular linear acceleration.",
      },
    ],
    edges: [
      { from: "labyrinth", to: "vn8", type: "ff" },
      { from: "vn8", to: "vn", type: "ff" },
      { from: "vn8", to: "cerebellum", type: "bypass" },
      { from: "vn", to: "cerebellum", type: "ff" },
      { from: "cerebellum", to: "vn", type: "fb" },
      { from: "vn", to: "vor", type: "bypass" },
      { from: "vn", to: "thalamus", type: "ff" },
      { from: "thalamus", to: "pivc", type: "ff" },
      { from: "pivc", to: "thalamus", type: "fb" },
      { from: "pivc", to: "ppc", type: "ff" },
      { from: "ppc", to: "pivc", type: "fb" },
    ],
  },

  motor: {
    title: "Motor pathway",
    subtitle: "PFC → SMA → M1 → CST + BG/Cerebellar loops",
    color: "#5A8FC4",
    nodes: [
      {
        id: "pfc",
        x: 320,
        y: 40,
        w: 200,
        label: "Prefrontal cortex",
        sub: "Goal / intention",
        color: "#5A8FC4",
        detail:
          "DLPFC and anterior cingulate encode abstract goals and action intentions. Projects to premotor and SMA to initiate voluntary movement sequences. Highest level of the motor hierarchy.",
      },
      {
        id: "sma",
        x: 320,
        y: 148,
        w: 200,
        label: "SMA / premotor cortex",
        sub: "Planning, sequences",
        color: "#5A8FC4",
        detail:
          "SMA: internally generated (self-initiated) movements. PMC: externally cued movements. Both project directly to M1 and to the spinal cord via the corticospinal tract.",
      },
      {
        id: "bg",
        x: 100,
        y: 256,
        w: 200,
        label: "Basal ganglia",
        sub: "Action selection",
        color: "#5A8FC4",
        detail:
          "Direct pathway (D1 receptors) facilitates desired actions; indirect pathway (D2) suppresses competing actions. Dopamine from SNc modulates this balance. Loop: cortex → striatum → GPi/SNr → VA/VL thalamus → cortex.",
      },
      {
        id: "cerebellum",
        x: 530,
        y: 256,
        w: 140,
        label: "Cerebellum",
        sub: "Error correction",
        color: "#5A8FC4",
        detail:
          "Compares motor command (efference copy) with sensory feedback and computes a correction signal. Lateral cerebellum: voluntary limb movements. Vermis: posture/gait. Output: deep nuclei → VL thalamus → M1.",
      },
      {
        id: "va_vl",
        x: 320,
        y: 364,
        w: 200,
        label: "VA / VL thalamus",
        sub: "Motor thalamus",
        color: "#5A8FC4",
        detail:
          "VA receives basal ganglia output (GPi/SNr) → premotor/SMA. VL receives cerebellar output (dentate nucleus) → M1. Two loops use the same relay but target different cortical areas.",
      },
      {
        id: "m1",
        x: 320,
        y: 460,
        w: 200,
        label: "M1 — Primary motor cortex",
        sub: "Somatotopic execution",
        color: "#5A8FC4",
        detail:
          "Precentral gyrus. Motor homunculus. Upper motor neurons project via corticospinal and corticobulbar tracts to spinal motor neurons. Layer 5 Betz cells are the largest neurons in the CNS.",
      },
      {
        id: "cst",
        x: 320,
        y: 556,
        w: 200,
        label: "Corticospinal tract",
        sub: "Lateral + anterior",
        color: "#5A8FC4",
        detail:
          "~85% decussate at the pyramidal decussation → lateral CST (fine finger movements). ~15% remain ipsilateral → anterior CST (axial/proximal muscles). Lateral CST synapses directly on alpha motor neurons.",
      },
      {
        id: "mn",
        x: 320,
        y: 652,
        w: 200,
        label: "Spinal motor neurons (α/γ)",
        sub: "Lower motor neurons",
        color: "#5A8FC4",
        detail:
          "Alpha motor neurons innervate extrafusal muscle fibers. Gamma motor neurons innervate intrafusal fibers (muscle spindles) to maintain spindle sensitivity. The final common pathway — all motor commands converge here.",
      },
    ],
    edges: [
      { from: "pfc", to: "sma", type: "ff" },
      { from: "sma", to: "pfc", type: "fb" },
      { from: "sma", to: "bg", type: "ff" },
      { from: "bg", to: "va_vl", type: "ff" },
      { from: "va_vl", to: "sma", type: "ff" },
      { from: "cerebellum", to: "va_vl", type: "ff" },
      { from: "va_vl", to: "m1", type: "ff" },
      { from: "m1", to: "va_vl", type: "fb" },
      { from: "sma", to: "m1", type: "ff" },
      { from: "m1", to: "cerebellum", type: "bypass" },
      { from: "m1", to: "cst", type: "ff" },
      { from: "cst", to: "mn", type: "ff" },
      { from: "mn", to: "cerebellum", type: "bypass" },
    ],
  },

  executive: {
    title: "Executive function pathway",
    subtitle: "PFC circuits — working memory, inhibition, cognitive control",
    color: "#4EAED0",
    nodes: [
      {
        id: "sensory_assoc",
        x: 300,
        y: 40,
        w: 220,
        label: "Sensory association cortices",
        sub: "Parietal, temporal",
        color: "#888",
        detail:
          "Posterior cortices (temporal, parietal, occipital association areas) provide the content of cognition — perceptual representations, semantic knowledge, spatial maps. They project to PFC to inform working memory and decision-making, and receive top-down attentional feedback.",
      },
      {
        id: "md_thal",
        x: 300,
        y: 148,
        w: 220,
        label: "Mediodorsal thalamus (MD)",
        sub: "Prefrontal relay",
        color: "#4EAED0",
        detail:
          "MD is the primary thalamic relay for the PFC. Divided into parvocellular (→ DLPFC), magnocellular (→ OFC/ACC), and multiformis (→ premotor). Crucial for sustaining PFC representations and temporal context. Lesions impair working memory and cognitive flexibility.",
      },
      {
        id: "dlpfc",
        x: 140,
        y: 256,
        w: 200,
        label: "DLPFC",
        sub: "Working memory, planning",
        color: "#4EAED0",
        detail:
          "Dorsolateral PFC (areas 9, 46) is the core of working memory — maintaining and manipulating information online. Also involved in cognitive flexibility, planning, and abstract rule representation. Receives input from MD thalamus, PPC, and temporal cortex. Projects back as top-down control.",
      },
      {
        id: "vlpfc",
        x: 460,
        y: 256,
        w: 180,
        label: "VLPFC",
        sub: "Inhibition, retrieval",
        color: "#4EAED0",
        detail:
          "Ventrolateral PFC (areas 44, 45, 47) mediates response inhibition (stopping actions), phonological and semantic retrieval, and selection among competing representations. Right VLPFC is critical for inhibitory control — lesions cause response perseveration.",
      },
      {
        id: "acc",
        x: 140,
        y: 364,
        w: 200,
        label: "Anterior cingulate cortex",
        sub: "Conflict monitoring",
        color: "#4EAED0",
        detail:
          "ACC (area 32/24) detects response conflict — situations where multiple incompatible response tendencies are simultaneously active. Signals the need for increased cognitive control to DLPFC. Also involved in error monitoring, pain affect, and motivation.",
      },
      {
        id: "ofc",
        x: 460,
        y: 364,
        w: 180,
        label: "Orbitofrontal cortex",
        sub: "Value, decision-making",
        color: "#D4A843",
        detail:
          "OFC (areas 11, 13) represents the expected value of options and outcomes. Crucial for reversal learning. Integrates emotional signals into decision-making. Strongly connected to amygdala and striatum. Lesions cause inability to make advantageous choices (somatic marker hypothesis).",
      },
      {
        id: "bg_pfc",
        x: 300,
        y: 460,
        w: 220,
        label: "Prefrontal-BG loop",
        sub: "Caudate → VA/MD → PFC",
        color: "#4EAED0",
        detail:
          "The 'cognitive' cortico-basal ganglia loop: DLPFC/OFC → caudate head → GPi/SNr → MD/VA thalamus → PFC. Gates which cognitive representations gain access to working memory — the BG acts as a gating mechanism, preventing irrelevant information from entering and stabilizing relevant representations.",
      },
      {
        id: "parietal",
        x: 140,
        y: 556,
        w: 190,
        label: "Posterior parietal cortex",
        sub: "Attentional selection",
        color: "#5A8FC4",
        detail:
          "PPC (areas 7, LIP, SPL) implements spatial attention — selecting where to attend. Sends top-down signals to visual cortex to bias processing. The frontoparietal network (PPC ↔ FEF ↔ DLPFC) is the core of top-down attentional control.",
      },
      {
        id: "fef",
        x: 460,
        y: 556,
        w: 180,
        label: "Frontal eye fields (FEF)",
        sub: "Voluntary gaze control",
        color: "#4EAED0",
        detail:
          "FEF (area 8) controls voluntary eye movements and is part of the top-down attentional network. Projects to V4, MT, and parietal cortex to modulate sensory processing. Also projects to superior colliculus for saccade execution.",
      },
    ],
    edges: [
      { from: "sensory_assoc", to: "md_thal", type: "ff" },
      { from: "md_thal", to: "dlpfc", type: "ff" },
      { from: "dlpfc", to: "md_thal", type: "fb" },
      { from: "md_thal", to: "vlpfc", type: "ff" },
      { from: "md_thal", to: "ofc", type: "ff" },
      { from: "dlpfc", to: "acc", type: "ff" },
      { from: "acc", to: "dlpfc", type: "ff" },
      { from: "dlpfc", to: "vlpfc", type: "ff" },
      { from: "vlpfc", to: "dlpfc", type: "fb" },
      { from: "acc", to: "bg_pfc", type: "ff" },
      { from: "dlpfc", to: "bg_pfc", type: "ff" },
      { from: "bg_pfc", to: "dlpfc", type: "ff" },
      { from: "dlpfc", to: "parietal", type: "fb" },
      { from: "parietal", to: "dlpfc", type: "ff" },
      { from: "dlpfc", to: "fef", type: "ff" },
      { from: "fef", to: "parietal", type: "ff" },
      { from: "ofc", to: "bg_pfc", type: "ff" },
      { from: "sensory_assoc", to: "dlpfc", type: "ff" },
    ],
  },

  reward: {
    title: "Reward / dopamine pathway",
    subtitle: "VTA / SNc → striatum → PFC — motivation & prediction error",
    color: "#D4A843",
    nodes: [
      {
        id: "vta",
        x: 160,
        y: 40,
        w: 260,
        label: "VTA — Ventral tegmental area",
        sub: "Mesolimbic / mesocortical DA",
        color: "#D4A843",
        detail:
          "Origin of the two main dopaminergic reward pathways. VTA DA neurons fire tonically at low rates and phasically burst to unexpected rewards or reward-predicting cues — encoding reward prediction error (RPE). They are inhibited by GABAergic interneurons and by the lateral habenula.",
      },
      {
        id: "snc",
        x: 460,
        y: 40,
        w: 200,
        label: "SNc — Substantia nigra pars compacta",
        sub: "Nigrostriatal DA",
        color: "#D4A843",
        detail:
          "SNc dopamine neurons project via the nigrostriatal pathway to the dorsal striatum (putamen/caudate). Critical for motor control and habit formation. SNc degeneration causes Parkinson's disease. Also encodes RPE for instrumental conditioning.",
      },
      {
        id: "nac",
        x: 100,
        y: 160,
        w: 210,
        label: "Nucleus accumbens (NAc)",
        sub: "Ventral striatum",
        color: "#D4A843",
        detail:
          "Core of the limbic-motor interface. Shell: receives VTA DA, amygdala, and hippocampal input; encodes incentive salience and drug addiction. Core: receives VTA DA and PFC input; involved in goal-directed behavior. NAc DA release is the final common pathway for most drugs of abuse.",
      },
      {
        id: "dorsal_str",
        x: 430,
        y: 160,
        w: 230,
        label: "Dorsal striatum",
        sub: "Caudate + putamen",
        color: "#D4A843",
        detail:
          "Caudate: receives corticostriatal input from PFC, especially DLPFC — involved in cognitive and goal-directed control. Putamen: receives input from motor/premotor cortex — involved in motor sequences and habit learning. Both modulated by SNc dopamine.",
      },
      {
        id: "amygdala",
        x: 100,
        y: 280,
        w: 210,
        label: "Amygdala (BLA)",
        sub: "Reward/threat prediction",
        color: "#D06B8A",
        detail:
          "Basolateral amygdala assigns affective value to stimuli — both rewarding and aversive. Projects to NAc to modulate incentive motivation. Projects to OFC to inform value-based decision-making. Critical for Pavlovian conditioning.",
      },
      {
        id: "lhb",
        x: 430,
        y: 280,
        w: 200,
        label: "Lateral habenula (LHb)",
        sub: "Negative reward prediction",
        color: "#888",
        detail:
          "Key source of negative RPE signals — activates when expected rewards are omitted and inhibits VTA/SNc DA neurons (via the RMTg). This is the 'disappointment' circuit. Abnormal LHb hyperactivity is strongly linked to depression and anhedonia.",
      },
      {
        id: "ofc_r",
        x: 100,
        y: 390,
        w: 210,
        label: "Orbitofrontal cortex",
        sub: "Value representation",
        color: "#D4A843",
        detail:
          "OFC represents the expected value and hedonic properties of outcomes. Receives strong DA-modulated input from striatum and amygdala. Critical for reversal learning. Damage impairs the ability to update value estimates when reward contingencies change.",
      },
      {
        id: "pfc_da",
        x: 430,
        y: 390,
        w: 200,
        label: "DLPFC / ACC",
        sub: "Mesocortical DA target",
        color: "#4EAED0",
        detail:
          "Mesocortical dopamine (VTA → PFC) modulates working memory, cognitive flexibility, and executive control. Inverted-U relationship: too little DA impairs PFC function (ADHD, schizophrenia), too much also impairs it. D1 receptors stabilize WM representations; D2 receptors promote flexibility.",
      },
      {
        id: "vp",
        x: 280,
        y: 500,
        w: 240,
        label: "Ventral pallidum",
        sub: "Hedonic hotspot",
        color: "#D4A843",
        detail:
          "Receives inhibitory input from NAc and is a key output of the ventral striatum. Contains a 'hedonic hotspot' where mu-opioid and cannabinoid activation generates strong pleasure responses. Projects to MD thalamus, brainstem, and back to VTA — forming the core reward loop.",
      },
    ],
    edges: [
      { from: "vta", to: "nac", type: "ff" },
      { from: "vta", to: "pfc_da", type: "ff" },
      { from: "vta", to: "amygdala", type: "ff" },
      { from: "snc", to: "dorsal_str", type: "ff" },
      { from: "nac", to: "vta", type: "fb" },
      { from: "nac", to: "vp", type: "ff" },
      { from: "dorsal_str", to: "snc", type: "fb" },
      { from: "amygdala", to: "nac", type: "ff" },
      { from: "amygdala", to: "ofc_r", type: "ff" },
      { from: "lhb", to: "vta", type: "fb" },
      { from: "lhb", to: "snc", type: "fb" },
      { from: "ofc_r", to: "nac", type: "ff" },
      { from: "ofc_r", to: "amygdala", type: "ff" },
      { from: "pfc_da", to: "nac", type: "ff" },
      { from: "pfc_da", to: "lhb", type: "ff" },
      { from: "vp", to: "vta", type: "bypass" },
    ],
  },

  memory: {
    title: "Memory / hippocampal pathway",
    subtitle: "Entorhinal cortex → HPC → consolidation → retrieval",
    color: "#7EC47E",
    nodes: [
      {
        id: "ctx_input",
        x: 280,
        y: 40,
        w: 260,
        label: "Neocortical association areas",
        sub: "Temporal, parietal, frontal",
        color: "#888",
        detail:
          "Memory encoding begins in neocortical areas: temporal (object identity, semantic), parietal (spatial), and frontal (source, context). These project to parahippocampal gyrus and perirhinal cortex. Each cortical area maintains its own distributed representation of the memoranda.",
      },
      {
        id: "perirhinal",
        x: 130,
        y: 148,
        w: 200,
        label: "Perirhinal cortex (PRc)",
        sub: "Object familiarity",
        color: "#7EC47E",
        detail:
          "Perirhinal cortex (areas 35, 36) receives heavily processed sensory input from all modalities. Sensitive to stimulus familiarity and novelty — first stage of recognition memory. Projects to entorhinal cortex and directly back to cortical areas.",
      },
      {
        id: "phc",
        x: 400,
        y: 148,
        w: 200,
        label: "Parahippocampal cortex (PHc)",
        sub: "Scenes, spatial context",
        color: "#7EC47E",
        detail:
          "PHc (areas TH, TF) is specialized for scene and spatial context processing — activated whenever we encounter or recall a scene. Projects to entorhinal cortex. PHc and PRc represent two major input streams to the hippocampus, analogous to dorsal/ventral visual streams.",
      },
      {
        id: "ec",
        x: 280,
        y: 256,
        w: 260,
        label: "Entorhinal cortex (EC)",
        sub: "Hippocampal gateway",
        color: "#7EC47E",
        detail:
          "EC is the main interface between neocortex and hippocampus. Layer 2 neurons project via the perforant path to DG and CA3 (direct path). Layer 3 neurons project to CA1 and subiculum (temporoammonic path). Contains grid cells (medial EC) — spatial coordinate system for navigation and episodic memory.",
      },
      {
        id: "dg",
        x: 130,
        y: 364,
        w: 190,
        label: "Dentate gyrus (DG)",
        sub: "Pattern separation",
        color: "#7EC47E",
        detail:
          "DG receives perforant path input from EC layer 2 and projects to CA3 via mossy fibers. Critical for pattern separation — making highly similar inputs more distinct to prevent interference. One of only two brain regions with adult neurogenesis; new neurons are important for temporal separation of memories.",
      },
      {
        id: "ca3",
        x: 130,
        y: 460,
        w: 190,
        label: "CA3",
        sub: "Pattern completion",
        color: "#7EC47E",
        detail:
          "Receives input from DG (mossy fibers) and direct EC input. Its extensive recurrent (Schaffer) collaterals make it an autoassociative network capable of pattern completion — reconstructing complete memories from partial cues. Projects to CA1 via Schaffer collaterals.",
      },
      {
        id: "ca1",
        x: 400,
        y: 460,
        w: 190,
        label: "CA1",
        sub: "Comparison, output",
        color: "#7EC47E",
        detail:
          "Receives Schaffer collateral input from CA3 and direct EC input (temporoammonic path). Compares incoming input with stored pattern — a mismatch detector. Main hippocampal output, projecting to the subiculum and directly back to EC. Place cells are densely concentrated here.",
      },
      {
        id: "subiculum",
        x: 280,
        y: 556,
        w: 260,
        label: "Subiculum",
        sub: "Main hippocampal output hub",
        color: "#7EC47E",
        detail:
          "Major output structure of the hippocampus. Projects to: entorhinal cortex (back-projection to neocortex), mammillary bodies (→ Papez circuit), prefrontal cortex (episodic-executive interface), and nucleus accumbens (memory-motivated behavior).",
      },
      {
        id: "thal_mem",
        x: 120,
        y: 652,
        w: 190,
        label: "Anterior thalamus / MD",
        sub: "Papez circuit",
        color: "#7EC47E",
        detail:
          "Mammillary bodies (from subiculum via fornix) → anterior thalamic nuclei (ATN) → cingulate cortex — the Papez circuit, critical for episodic memory, spatial navigation, and temporal coding. ATN lesions (as in Wernicke-Korsakoff) cause severe anterograde amnesia.",
      },
      {
        id: "pfc_mem",
        x: 400,
        y: 652,
        w: 210,
        label: "Prefrontal cortex",
        sub: "Strategic encoding/retrieval",
        color: "#4EAED0",
        detail:
          "PFC governs strategic encoding (VLPFC: deep semantic processing) and retrieval (DLPFC: sustained retrieval attempt, monitoring). Left PFC preferentially activated during verbal encoding; right PFC during retrieval. PFC-hippocampus dialogue is key for source memory and context-dependent recall.",
      },
    ],
    edges: [
      { from: "ctx_input", to: "perirhinal", type: "ff" },
      { from: "ctx_input", to: "phc", type: "ff" },
      { from: "perirhinal", to: "ec", type: "ff" },
      { from: "phc", to: "ec", type: "ff" },
      { from: "ec", to: "dg", type: "ff" },
      { from: "ec", to: "ca3", type: "ff" },
      { from: "ec", to: "ca1", type: "ff" },
      { from: "dg", to: "ca3", type: "ff" },
      { from: "ca3", to: "ca1", type: "ff" },
      { from: "ca3", to: "ca3", type: "fb" },
      { from: "ca1", to: "subiculum", type: "ff" },
      { from: "ca1", to: "ec", type: "fb" },
      { from: "subiculum", to: "ec", type: "fb" },
      { from: "subiculum", to: "thal_mem", type: "ff" },
      { from: "subiculum", to: "pfc_mem", type: "ff" },
      { from: "thal_mem", to: "subiculum", type: "fb" },
      { from: "ec", to: "ctx_input", type: "fb" },
      { from: "pfc_mem", to: "ec", type: "fb" },
    ],
  },

  emotion: {
    title: "Emotion / fear pathway",
    subtitle: "Amygdala-centered — threat detection, affect, regulation",
    color: "#D06B8A",
    nodes: [
      {
        id: "sensory_in",
        x: 280,
        y: 40,
        w: 260,
        label: "Sensory thalamus & cortex",
        sub: "Low + high road",
        color: "#888",
        detail:
          "Two routes to the amygdala (LeDoux's 'low road' and 'high road'). Low road: thalamus → amygdala directly (~12ms) — fast, coarse, phylogenetically ancient. High road: thalamus → sensory cortex → amygdala (~40ms) — slower but provides fine-grained representation. Both routes are needed for full emotional responses.",
      },
      {
        id: "bla",
        x: 150,
        y: 148,
        w: 210,
        label: "Basolateral amygdala (BLA)",
        sub: "Threat / value learning",
        color: "#D06B8A",
        detail:
          "BLA (lateral, basal, accessory basal nuclei) is the primary input nucleus of the amygdala. It assigns affective significance to stimuli via Pavlovian conditioning. LTP in BLA synapses is the cellular substrate of fear conditioning. Receives direct thalamic and cortical sensory input.",
      },
      {
        id: "cea",
        x: 440,
        y: 148,
        w: 200,
        label: "Central amygdala (CeA)",
        sub: "Fear expression / output",
        color: "#D06B8A",
        detail:
          "CeA is the main output nucleus. Drives fear expression via projections to: hypothalamus (autonomic responses), PAG (freezing, pain modulation), brainstem (startle, vocalization), and bed nucleus of the stria terminalis (sustained anxiety).",
      },
      {
        id: "hippo_e",
        x: 150,
        y: 256,
        w: 210,
        label: "Hippocampus",
        sub: "Contextual fear",
        color: "#7EC47E",
        detail:
          "Provides contextual information to the amygdala — enabling context-dependent fear (fear in a specific place but not elsewhere). Basis of PTSD: when context fails to gate the fear response, fear is expressed regardless of safety context. Also enables extinction by encoding the safe context.",
      },
      {
        id: "insula_e",
        x: 440,
        y: 256,
        w: 200,
        label: "Insular cortex",
        sub: "Interoceptive awareness",
        color: "#9E6BAA",
        detail:
          "Represents interoceptive body states (heartbeat, gut feeling) that accompany emotional responses. Anterior insula integrates bodily signals with affective context, generating the subjective feeling of emotion (somatic marker). The insula-amygdala circuit is critical for disgust and negative affect.",
      },
      {
        id: "hypo",
        x: 150,
        y: 364,
        w: 210,
        label: "Hypothalamus",
        sub: "Autonomic / endocrine",
        color: "#D06B8A",
        detail:
          "Receives CeA output and coordinates autonomic (sympathetic activation) and endocrine (HPA axis: CRH → ACTH → cortisol) stress responses. The HPA axis maintains fear/stress states beyond the immediate trigger. Chronic HPA dysregulation is a key mechanism in anxiety disorders and depression.",
      },
      {
        id: "pag",
        x: 440,
        y: 364,
        w: 200,
        label: "Periaqueductal gray (PAG)",
        sub: "Freezing, pain modulation",
        color: "#D06B8A",
        detail:
          "Ventral PAG: freezing behavior via brainstem motor nuclei. Dorsal PAG: active defense (flight/fight). Also a key node in the descending pain modulatory system: PAG → RVM → spinal dorsal horn. Opioids work partly via PAG.",
      },
      {
        id: "mpfc",
        x: 150,
        y: 460,
        w: 210,
        label: "Medial PFC / vmPFC",
        sub: "Extinction, regulation",
        color: "#4EAED0",
        detail:
          "Ventromedial PFC (infralimbic area, area 25) is the key extinction consolidation site — stores the 'safety memory' that inhibits amygdala output during extinction retrieval. vmPFC → BLA projections gate fear expression. vmPFC hypoactivity + amygdala hyperactivity is the most replicated neural finding in PTSD.",
      },
      {
        id: "acc_e",
        x: 440,
        y: 460,
        w: 200,
        label: "ACC / dACC",
        sub: "Conflict, pain affect",
        color: "#4EAED0",
        detail:
          "Dorsal ACC (area 24) encodes the affective-motivational component of pain and is activated by negative social emotions. Subgenual ACC (area 25) is strongly implicated in depression — deep brain stimulation of this area is an experimental treatment for treatment-resistant depression.",
      },
      {
        id: "bnst",
        x: 280,
        y: 560,
        w: 260,
        label: "Bed nucleus of stria terminalis",
        sub: "Sustained anxiety",
        color: "#D06B8A",
        detail:
          "BNST is the 'extended amygdala'. While CeA mediates phasic fear to specific cues, BNST mediates sustained anxiety states triggered by diffuse or unpredictable threats. Receives BLA and hippocampal input and projects to hypothalamus, PAG, and VTA. CRH neurons in BNST are a key anxiety substrate.",
      },
    ],
    edges: [
      { from: "sensory_in", to: "bla", type: "ff" },
      { from: "sensory_in", to: "cea", type: "bypass" },
      { from: "bla", to: "cea", type: "ff" },
      { from: "bla", to: "mpfc", type: "ff" },
      { from: "bla", to: "hippo_e", type: "ff" },
      { from: "hippo_e", to: "bla", type: "ff" },
      { from: "insula_e", to: "bla", type: "ff" },
      { from: "cea", to: "hypo", type: "ff" },
      { from: "cea", to: "pag", type: "ff" },
      { from: "cea", to: "bnst", type: "ff" },
      { from: "hypo", to: "bla", type: "fb" },
      { from: "mpfc", to: "bla", type: "fb" },
      { from: "mpfc", to: "cea", type: "fb" },
      { from: "acc_e", to: "bla", type: "ff" },
      { from: "acc_e", to: "mpfc", type: "ff" },
      { from: "bnst", to: "hypo", type: "ff" },
      { from: "bnst", to: "pag", type: "ff" },
    ],
  },
};

// ─── GEOMETRY ────────────────────────────────────────────────────────────────
const NODE_H = 56;

function getCenter(node) {
  return { x: node.x + node.w / 2, y: node.y + NODE_H / 2 };
}

// ─── EDGE ────────────────────────────────────────────────────────────────────
function PathEdge({ edge, nodes, activeNode }) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to || from === to) return null;

  const fc = getCenter(from);
  const tc = getCenter(to);
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const shift = edge.type === "fb" ? 14 : -9;
  const nx = -uy * shift;
  const ny = ux * shift;

  const x1 = fc.x + nx + ux * (NODE_H / 2 + 4);
  const y1 = fc.y + ny + uy * (NODE_H / 2 + 4);
  const x2 = tc.x + nx - ux * (NODE_H / 2 + 4);
  const y2 = tc.y + ny - uy * (NODE_H / 2 + 4);

  const color = edge.type === "ff" ? "#6e8ecc" : edge.type === "fb" ? "#c47a5a" : "#777";
  const dash = edge.type === "fb" ? "6 4" : edge.type === "bypass" ? "4 4" : "none";
  const dimmed = activeNode && edge.from !== activeNode && edge.to !== activeNode;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={1.4}
      strokeDasharray={dash}
      markerEnd="url(#arr)"
      opacity={dimmed ? 0.1 : 0.8}
      style={{ transition: "opacity 0.2s" }}
    />
  );
}

// ─── NODE ────────────────────────────────────────────────────────────────────
function PathNode({ node, active, onSelect }) {
  const isActive = active === node.id;
  const col = node.color || "#888";
  return (
    <g style={{ cursor: "pointer" }} onClick={() => onSelect(isActive ? null : node.id)}>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={NODE_H}
        rx={7}
        fill={col}
        fillOpacity={isActive ? 0.2 : 0.08}
        stroke={col}
        strokeOpacity={isActive ? 1 : 0.38}
        strokeWidth={isActive ? 1.5 : 0.7}
        style={{ transition: "all 0.15s" }}
      />
      <text
        x={node.x + node.w / 2}
        y={node.y + 20}
        textAnchor="middle"
        dominantBaseline="central"
        fill={col}
        fontSize={11.5}
        fontWeight={600}
        fontFamily="'DM Mono', monospace"
      >
        {node.label}
      </text>
      <text
        x={node.x + node.w / 2}
        y={node.y + 39}
        textAnchor="middle"
        dominantBaseline="central"
        fill={col}
        fontSize={9.5}
        fontWeight={400}
        opacity={0.6}
        fontFamily="'DM Mono', monospace"
      >
        {node.sub}
      </text>
    </g>
  );
}

// ─── DIAGRAM ────────────────────────────────────────────────────────────────
function PathwayDiagram({ pathway, activeNode, onSelectNode }) {
  const { nodes, edges } = pathway;
  const maxY = Math.max(...nodes.map((n) => n.y)) + NODE_H + 40;
  const maxX = Math.max(...nodes.map((n) => n.x + n.w)) + 40;
  const vbW = Math.max(maxX, 680);

  return (
    <svg width="100%" viewBox={`0 0 ${vbW} ${maxY}`} style={{ overflow: "visible" }}>
      <defs>
        <marker
          id="arr"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="context-stroke"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      {edges.map((e, i) => (
        <PathEdge key={i} edge={e} nodes={nodes} activeNode={activeNode} />
      ))}
      {nodes.map((n) => (
        <PathNode key={n.id} node={n} active={activeNode} onSelect={onSelectNode} />
      ))}
    </svg>
  );
}

// ─── DETAIL PANEL ────────────────────────────────────────────────────────────
function DetailPanel({ node, onClose }) {
  const col = node.color || "#888";
  return (
    <div
      style={{
        background: "rgba(10,10,14,0.97)",
        borderTop: `1px solid ${col}44`,
        padding: "16px 18px 18px",
        backdropFilter: "blur(12px)",
        animation: "slideUp 0.18s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12.5,
              fontWeight: 600,
              color: col,
              marginBottom: 2,
            }}
          >
            {node.label}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#555" }}>
            {node.sub}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            fontSize: 18,
            cursor: "pointer",
            padding: "0 0 0 12px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12.5,
          color: "#bbb",
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {node.detail}
      </p>
    </div>
  );
}

// ─── LEGEND ─────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        padding: "5px 0 3px",
        flexWrap: "wrap",
      }}
    >
      {[
        { color: "#6e8ecc", dash: false, label: "Feedforward" },
        { color: "#c47a5a", dash: true, label: "Feedback" },
        { color: "#777", dash: true, label: "Bypass / reflex" },
      ].map((l) => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width={30} height={10}>
            <defs>
              <marker
                id={`leg-${l.label}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M2 1L8 5L2 9" fill="none" stroke={l.color} strokeWidth="1.5" />
              </marker>
            </defs>
            <line
              x1={2}
              y1={5}
              x2={26}
              y2={5}
              stroke={l.color}
              strokeWidth={1.4}
              strokeDasharray={l.dash ? "5 3" : "none"}
              markerEnd={`url(#leg-${l.label})`}
            />
          </svg>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: "#666" }}>
            {l.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function BrainPathways() {
  const [modality, setModality] = useState("visual");
  const [activeNode, setActiveNode] = useState(null);
  const [openCat, setOpenCat] = useState(null);
  const scrollRef = useRef(null);

  const pathway = PATHWAYS[modality];
  const activeNodeData = pathway.nodes.find((n) => n.id === activeNode);
  const activeMod = ALL_MODALITIES.find((m) => m.id === modality);

  const handleSelect = (id) => {
    setModality(id);
    setActiveNode(null);
    setOpenCat(null);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#09090d",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "#eee",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 2px; }
        .cat-btn { border: none; cursor: pointer; transition: all 0.15s; }
        .cat-btn:hover { opacity: 0.8; }
        .mod-pill { border: none; cursor: pointer; transition: all 0.15s; text-align: left; }
        .mod-pill:hover { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #181820", flexShrink: 0 }}>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "#3a3a4a",
            letterSpacing: "0.14em",
            marginBottom: 4,
          }}
        >
          NEURAL PATHWAYS EXPLORER
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: activeMod?.color || "#fff",
            fontFamily: "'DM Mono', monospace",
            transition: "color 0.2s",
          }}
        >
          {pathway.title}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "#3a3a4a",
            fontFamily: "'DM Mono', monospace",
            marginTop: 2,
          }}
        >
          {pathway.subtitle}
        </div>
      </div>

      {/* Category + modality nav */}
      <div style={{ borderBottom: "1px solid #181820", flexShrink: 0, padding: "8px 14px 0" }}>
        <div
          style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, flexWrap: "wrap" }}
        >
          {CATEGORIES.map((cat) => {
            const isOpen = openCat === cat.id;
            const hasActive = cat.modalities.some((m) => m.id === modality);
            return (
              <div key={cat.id} style={{ position: "relative" }}>
                <button
                  className="cat-btn"
                  onClick={() => setOpenCat(isOpen ? null : cat.id)}
                  style={{
                    padding: "4px 11px",
                    borderRadius: 6,
                    border: `1px solid ${hasActive ? activeMod.color + "88" : "#242430"}`,
                    background: hasActive
                      ? activeMod.color + "14"
                      : isOpen
                        ? "#1c1c28"
                        : "transparent",
                    color: hasActive ? activeMod.color : isOpen ? "#bbb" : "#555",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10.5,
                    fontWeight: hasActive ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat.label}{" "}
                  <span style={{ opacity: 0.5, fontSize: 9 }}>{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      background: "#111118",
                      border: "1px solid #222230",
                      borderRadius: 8,
                      padding: "6px",
                      zIndex: 20,
                      minWidth: 170,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                      animation: "fadeIn 0.12s ease",
                    }}
                  >
                    {cat.modalities.map((m) => {
                      const isAct = modality === m.id;
                      return (
                        <button
                          key={m.id}
                          className="mod-pill"
                          onClick={() => handleSelect(m.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: 5,
                            background: isAct ? m.color + "20" : "transparent",
                            border: `1px solid ${isAct ? m.color + "66" : "transparent"}`,
                            color: isAct ? m.color : "#888",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11,
                            fontWeight: isAct ? 600 : 400,
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{m.icon}</span>
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: "2px 18px 0", borderBottom: "1px solid #111116", flexShrink: 0 }}>
        <Legend />
      </div>

      {/* Diagram */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          padding: "14px 10px 10px",
          minHeight: 0,
        }}
        onClick={() => {
          if (openCat) setOpenCat(null);
        }}
      >
        <div key={modality} style={{ animation: "fadeIn 0.22s ease", minWidth: 340 }}>
          <PathwayDiagram pathway={pathway} activeNode={activeNode} onSelectNode={setActiveNode} />
        </div>
        {!activeNode && (
          <div
            style={{
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
              fontSize: 9.5,
              color: "#222230",
              marginTop: 6,
            }}
          >
            tap any node for details
          </div>
        )}
      </div>

      {/* Detail panel */}
      {activeNodeData && <DetailPanel node={activeNodeData} onClose={() => setActiveNode(null)} />}
    </div>
  );
}
