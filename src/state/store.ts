import { create } from 'zustand';

/**
 * Default highlight color (amber). Used as the `highlightColor` default and as
 * the sentinel that distinguishes plain highlight mode from network isolation
 * (where a network's own color overrides it).
 */
export const DEFAULT_HIGHLIGHT_COLOR = '#ffb020';

export type View = 'explore' | 'study' | 'quiz' | 'review' | 'progress';

interface AppState {
  view: View;
  setView: (v: View) => void;
  /** System pre-selected for the quiz (set from Study). */
  quizSystemId: string | null;
  setQuizSystemId: (id: string | null) => void;
}

export const useApp = create<AppState>((set) => ({
  view: 'explore',
  setView: (view) => set({ view }),
  quizSystemId: null,
  setQuizSystemId: (quizSystemId) => set({ quizSystemId }),
}));

export type Hemisphere = 'both' | 'left' | 'right';

interface BrainState {
  /** Structure id shown in the info card / most recent tap. */
  selectedId: string | null;
  /** Extra highlight set (quiz candidates, system-stage structures). */
  highlightIds: string[];
  /** Hidden categories (layer peel). */
  hiddenCategories: string[];
  hemisphere: Hemisphere;
  /** Highlight color override (used to tint an isolated network). Default amber. */
  highlightColor: string;
  /** Full-brain map: colour every structure by its primary resting-state network. */
  showNetworkMap: boolean;
  /** Request to frame the camera on one or more structures (empty = reset). */
  focusIds: string[];
  /** Ordered structures to animate a "flow" pulse through (study mode). */
  flowIds: string[];
  /** The currently-active flow group (the structures being lit up right now). */
  flowActiveIds: string[];
  select: (id: string | null) => void;
  setHighlight: (ids: string[]) => void;
  toggleCategory: (cat: string) => void;
  setHiddenCategories: (cats: string[]) => void;
  setHemisphere: (h: Hemisphere) => void;
  setHighlightColor: (color: string) => void;
  setShowNetworkMap: (v: boolean) => void;
  requestFocus: (ids: string[]) => void;
  setFlow: (ids: string[]) => void;
  setFlowActive: (ids: string[]) => void;
}

export const useBrain = create<BrainState>((set) => ({
  selectedId: null,
  highlightIds: [],
  hiddenCategories: [],
  hemisphere: 'both',
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  showNetworkMap: false,
  focusIds: [],
  flowIds: [],
  flowActiveIds: [],
  select: (id) => set({ selectedId: id }),
  setHighlight: (ids) => set({ highlightIds: ids }),
  toggleCategory: (cat) =>
    set((s) => ({
      hiddenCategories: s.hiddenCategories.includes(cat)
        ? s.hiddenCategories.filter((c) => c !== cat)
        : [...s.hiddenCategories, cat],
    })),
  setHiddenCategories: (hiddenCategories) => set({ hiddenCategories }),
  setHemisphere: (hemisphere) => set({ hemisphere }),
  setHighlightColor: (highlightColor) => set({ highlightColor }),
  setShowNetworkMap: (showNetworkMap) => set({ showNetworkMap }),
  requestFocus: (focusIds) => set({ focusIds }),
  setFlow: (flowIds) => set({ flowIds }),
  setFlowActive: (flowActiveIds) => set({ flowActiveIds }),
}));
