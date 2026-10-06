import { useEffect } from 'react';
import { useApp, useBrain } from './state/store';
import { NavBar } from './components/ui/NavBar';
import { Explore } from './views/Explore';
import { Study } from './views/Study';
import { Quiz } from './views/Quiz';
import { Review } from './views/Review';
import { Progress } from './views/Progress';

export default function App() {
  const view = useApp((s) => s.view);

  // Clear transient 3D state (selection, highlight, focus, flow) when switching
  // views so nothing leaks into the next screen.
  useEffect(() => {
    useBrain.getState().select(null);
    useBrain.getState().setHighlight([]);
    useBrain.getState().setFlow([]);
    useBrain.getState().setFlowActive([]);
    useBrain.getState().requestFocus([]);
  }, [view]);

  return (
    <div className="flex h-full flex-col">
      <NavBar />
      <main className="min-h-0 flex-1 overflow-hidden">
        {view === 'explore' && <Explore />}
        {view === 'study' && <Study />}
        {view === 'quiz' && <Quiz />}
        {view === 'review' && <Review />}
        {view === 'progress' && <Progress />}
      </main>
    </div>
  );
}
