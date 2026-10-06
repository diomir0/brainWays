import { useEffect, useMemo, useState } from 'react';
import { BrainViewer } from '../components/brain/BrainViewer';
import { getSystems, structureById, structuresByLabel } from '../core/atlas/loader';
import { getQuestions } from '../core/content/loader';
import { drawQuestions, recordAnswer } from '../core/assessment/engine';
import type { Question } from '../types/assessment';
import { useApp, useBrain } from '../state/store';

type Phase = 'setup' | 'running' | 'done';

export function Quiz() {
  const systems = getSystems().systems;
  const quizSystemId = useApp((s) => s.quizSystemId);
  const setQuizSystemId = useApp((s) => s.setQuizSystemId);

  const setHighlight = useBrain((s) => s.setHighlight);
  const select = useBrain((s) => s.select);

  const [systemId, setSystemId] = useState<string | null>(quizSystemId ?? null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const pool = useMemo(() => (systemId ? getQuestions(systemId) : getQuestions()), [systemId]);
  const current = questions[index];

  function start() {
    const qs = drawQuestions(pool, Math.min(10, pool.length));
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setAnswered(false);
    setCorrect(null);
    setPickedOption(null);
    setPhase('running');
  }

  // Present the current find question: highlight candidates, clear selection.
  useEffect(() => {
    if (phase !== 'running' || !current) return;
    if (current.kind === 'find') {
      const expanded = current.candidateIds.flatMap((id) => {
        const s = structureById(id);
        return s ? structuresByLabel(s.label).map((x) => x.id) : [id];
      });
      setHighlight(expanded);
      select(null);
      setAnswered(false);
    } else {
      setHighlight(current.structureIds);
      select(null);
    }
  }, [phase, index, current?.id]);

  // Grade "find" questions on a brain tap.
  useEffect(() => {
    if (phase !== 'running' || !current || current.kind !== 'find' || answered) return;
    return useBrain.subscribe((s, prev) => {
      if (s.selectedId && s.selectedId !== prev.selectedId) {
        const target = structureById(current.answerId)?.label;
        const ok = target != null && structureById(s.selectedId)?.label === target;
        setCorrect(ok);
        setAnswered(true);
        if (ok) setScore((n) => n + 1);
        void recordAnswer(current.id, ok);
      }
    });
  }, [phase, current, answered]);

  function answerMc(optionIdx: number) {
    if (answered || !current || (current.kind !== 'mc' && current.kind !== 'case')) return;
    const ok = optionIdx === current.answerIndex;
    setPickedOption(optionIdx);
    setCorrect(ok);
    setAnswered(true);
    if (ok) setScore((n) => n + 1);
    void recordAnswer(current.id, ok);
  }

  function next() {
    setHighlight([]);
    select(null);
    if (index + 1 >= questions.length) {
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
      setAnswered(false);
      setCorrect(null);
      setPickedOption(null);
    }
  }

  // ---- setup screen ----
  if (phase === 'setup') {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-8">
        <div className="mx-auto max-w-xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">Assessment</h1>
          <p className="mb-6 text-sm text-slate-400">
            Multiple-choice, clinical-case, and "find-the-structure" questions with cited explanations.
          </p>
          <div className="panel p-4">
            <label className="mb-2 block text-sm font-medium text-slate-300">System</label>
            <select
              value={systemId ?? ''}
              onChange={(e) => {
                const v = e.target.value || null;
                setSystemId(v);
                setQuizSystemId(v);
              }}
              className="mb-4 w-full rounded-lg border border-edge bg-panel px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option value="">All systems ({pool.length} questions)</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({getQuestions(s.id).length})
                </option>
              ))}
            </select>
            <button className="btn-primary w-full" onClick={start} disabled={pool.length === 0}>
              Start quiz
            </button>
            {pool.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">No questions authored yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- done screen ----
  if (phase === 'done') {
    return (
      <div className="grid h-full place-items-center p-4">
        <div className="panel w-full max-w-md p-6 text-center">
          <h1 className="mb-2 font-serif text-2xl font-semibold">Quiz complete</h1>
          <p className="mb-4 text-4xl font-bold text-accent">
            {score} / {questions.length}
          </p>
          <p className="mb-6 text-sm text-slate-400">
            {Math.round((score / questions.length) * 100)}% correct
          </p>
          <div className="flex justify-center gap-2">
            <button className="btn" onClick={() => setPhase('setup')}>
              Change system
            </button>
            <button className="btn-primary" onClick={start}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- running ----
  return (
    <div className="flex h-full flex-col sm:flex-row">
      <div className="relative h-1/2 min-h-0 flex-1 sm:h-full">
        <BrainViewer className="h-full w-full" />
      </div>

      <div className="flex max-h-[50%] w-full flex-col border-t border-edge bg-panel/60 sm:max-h-none sm:w-96 sm:border-l sm:border-t-0">
        <div className="border-b border-edge px-4 py-3 text-xs text-slate-500">
          Question {index + 1} of {questions.length} ·{' '}
          {current.kind === 'find'
            ? 'Find on model'
            : current.kind === 'case'
              ? 'Clinical case'
              : 'Multiple choice'}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {current.kind === 'case' && (
            <div className="mb-4 rounded-lg border border-edge bg-slate-800/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Case vignette
              </p>
              <p className="whitespace-pre-line text-sm italic text-slate-300">{current.vignette}</p>
            </div>
          )}

          <p className="mb-4 text-base font-medium text-slate-100">{current.stem}</p>

          {(current.kind === 'mc' || current.kind === 'case') && (
            <div className="space-y-2">
              {current.options.map((opt, i) => {
                let cls = 'border-edge bg-panel hover:border-slate-500';
                if (answered) {
                  if (i === current.answerIndex) cls = 'border-green-500 bg-green-900/40';
                  else if (i === pickedOption) cls = 'border-red-500 bg-red-900/40';
                  else cls = 'border-edge bg-panel opacity-50';
                }
                return (
                  <button
                    key={i}
                    onClick={() => answerMc(i)}
                    disabled={answered}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm text-slate-200 transition ${cls}`}
                  >
                    <span className="mr-2 font-semibold text-slate-500">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {current.kind === 'find' && !answered && (
            <p className="text-sm text-slate-400">
              Tap the correct structure on the highlighted model to answer.
            </p>
          )}

          {answered && (
            <div className="mt-4 rounded-lg border border-edge bg-panel p-3">
              <p className={`mb-1 font-semibold ${correct ? 'text-green-400' : 'text-red-400'}`}>
                {correct ? 'Correct' : 'Incorrect'}
              </p>
              <p className="mb-2 text-sm text-slate-200">{current.explanation}</p>
              {current.citations.length > 0 && (
                <ul className="space-y-0.5 text-xs text-slate-500">
                  {current.citations.map((c, i) => (
                    <li key={i}>
                      {c.source}
                      {c.ref ? ` — ${c.ref}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {answered && (
          <div className="border-t border-edge p-3">
            <button className="btn-primary w-full" onClick={next}>
              {index + 1 >= questions.length ? 'Finish' : 'Next question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
