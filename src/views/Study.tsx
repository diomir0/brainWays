import { useEffect, useState } from 'react';
import { BrainViewer } from '../components/brain/BrainViewer';
import { getSystems, structureById } from '../core/atlas/loader';
import { getCognitiveSystems } from '../core/content/cognitiveSystems';
import { systemContent } from '../core/content/loader';
import { useApp, useBrain } from '../state/store';

type LessonKind = 'functional' | 'cognitive';

interface LessonStage {
  title: string;
  body: string;
  structureIds: string[];
}

interface Lesson {
  kind: LessonKind;
  id: string;
  name: string;
  summary: string;
  stages: LessonStage[];
  hasQuiz: boolean;
  questionCount: number;
}

function buildLessons(): { functional: Lesson[]; cognitive: Lesson[] } {
  const functional = getSystems().systems.map((s) => ({
    kind: 'functional' as const,
    id: s.id,
    name: s.name,
    summary: s.summary,
    stages: s.stages,
    hasQuiz: !!systemContent(s.id),
    questionCount: systemContent(s.id)?.questions.length ?? 0,
  }));
  const cognitive = getCognitiveSystems().map((c) => ({
    kind: 'cognitive' as const,
    id: c.id,
    name: c.name,
    summary: c.summary,
    stages: c.stages ?? [],
    hasQuiz: (c.questions?.length ?? 0) > 0,
    questionCount: c.questions?.length ?? 0,
  }));
  return { functional, cognitive };
}

function SystemList({ onSelect }: { onSelect: (kind: LessonKind, id: string) => void }) {
  const { functional, cognitive } = buildLessons();
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 font-serif text-2xl font-semibold">Functional systems</h1>
        <p className="mb-6 text-sm text-slate-400">
          Guided pathways through the neural circuits of behavior, each mapped onto the 3D atlas.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {functional.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.kind, s.id)}
              className="panel p-4 text-left transition hover:border-accent"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-semibold">{s.name}</h2>
                {getSystems().systems.find((x) => x.id === s.id)?.flagship && (
                  <span className="chip border-accent text-accent">flagship</span>
                )}
              </div>
              <p className="mb-2 text-sm text-slate-300">{s.summary}</p>
              <p className="text-xs text-slate-500">
                {s.stages.length} stages
                {s.questionCount > 0 ? ` · ${s.questionCount} questions` : ''}
              </p>
            </button>
          ))}
        </div>

        <h1 className="mb-1 mt-10 font-serif text-2xl font-semibold">Cognitive systems</h1>
        <p className="mb-6 text-sm text-slate-400">
          Higher-order cognition — working memory, attention, control, self, and social reasoning.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cognitive.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.kind, s.id)}
              className="panel p-4 text-left transition hover:border-accent"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-semibold">{s.name}</h2>
              </div>
              <p className="mb-2 text-sm text-slate-300">{s.summary}</p>
              <p className="text-xs text-slate-500">
                {s.stages.length} stages
                {s.questionCount > 0 ? ` · ${s.questionCount} questions` : ''}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Lesson({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const setHighlight = useBrain((s) => s.setHighlight);
  const requestFocus = useBrain((s) => s.requestFocus);
  const setFlow = useBrain((s) => s.setFlow);
  const setFlowActive = useBrain((s) => s.setFlowActive);
  const flowActiveIds = useBrain((s) => s.flowActiveIds);
  const setHiddenCategories = useBrain((s) => s.setHiddenCategories);
  const setHemisphere = useBrain((s) => s.setHemisphere);
  const setView = useApp((s) => s.setView);
  const setQuizSystemId = useApp((s) => s.setQuizSystemId);

  const [stageIndex, setStageIndex] = useState(0);
  const stage = lesson.stages[stageIndex];

  // Reset layers to a clean visualization of the system on entry.
  useEffect(() => {
    setHiddenCategories([]);
    setHemisphere('both');
  }, [lesson.id]);

  useEffect(() => {
    setHighlight(stage.structureIds);
    requestFocus(stage.structureIds);
    if (lesson.kind === 'functional') setFlow(stage.structureIds);
    else setFlow([]);
    setFlowActive([]);
    return () => {
      setHighlight([]);
      setFlow([]);
      setFlowActive([]);
      requestFocus([]);
    };
  }, [stageIndex, lesson.id, lesson.kind]);

  // Deduplicate structure labels (bilateral pairs share one label) so the
  // sidebar lists each structure once; a label is "active" when any of its
  // structures is currently being lit up by the flow animation.
  const uniqueStructures = stage.structureIds
    .map((id) => structureById(id))
    .filter((s): s is NonNullable<typeof s> => !!s);
  const seen = new Set<string>();
  const labels = uniqueStructures.filter((s) => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
  const activeLabels = new Set(
    flowActiveIds.map((id) => structureById(id)?.label).filter((l): l is string => !!l),
  );

  return (
    <div className="flex h-full flex-col sm:flex-row">
      <div className="relative h-1/2 min-h-0 flex-1 sm:h-full">
        <BrainViewer className="h-full w-full" />
        <button className="btn absolute left-3 top-3" onClick={onBack}>
          ← Systems
        </button>
      </div>

      <div className="flex max-h-[50%] w-full flex-col border-t border-edge bg-panel/60 sm:max-h-none sm:w-96 sm:border-l sm:border-t-0">
        <div className="border-b border-edge px-4 py-3">
          <h2 className="font-serif text-lg font-semibold">{lesson.name}</h2>
          <p className="text-xs text-slate-500">
            Stage {stageIndex + 1} of {lesson.stages.length}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <h3 className="mb-2 text-base font-semibold text-accent">{stage.title}</h3>
          <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-slate-200">
            {stage.body}
          </p>
          {labels.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Key structures
              </h4>
              <ul className="flex flex-wrap gap-1.5">
                {labels.map((s) => {
                  const isActive = activeLabels.has(s.label);
                  return (
                    <li
                      key={s.id}
                      className={`chip transition-colors ${
                        isActive ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : ''
                      }`}
                    >
                      {s.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-edge p-3">
          <button
            className="btn"
            disabled={stageIndex === 0}
            onClick={() => setStageIndex((i) => Math.max(0, i - 1))}
          >
            ← Back
          </button>
          {stageIndex < lesson.stages.length - 1 ? (
            <button className="btn-primary" onClick={() => setStageIndex((i) => i + 1)}>
              Next →
            </button>
          ) : lesson.hasQuiz ? (
            <button
              className="btn-primary"
              onClick={() => {
                setQuizSystemId(lesson.id);
                setView('quiz');
              }}
            >
              Test understanding
            </button>
          ) : (
            <button className="btn-primary" onClick={onBack}>
              Back to systems
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Study() {
  const [selection, setSelection] = useState<{ kind: LessonKind; id: string } | null>(null);
  if (!selection) return <SystemList onSelect={(kind, id) => setSelection({ kind, id })} />;
  const lesson = buildLessons()[selection.kind].find((l) => l.id === selection.id);
  if (!lesson) return <SystemList onSelect={(kind, id) => setSelection({ kind, id })} />;
  return <Lesson lesson={lesson} onBack={() => setSelection(null)} />;
}
