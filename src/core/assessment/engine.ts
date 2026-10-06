import type { ProgressEntry, Question } from '../../types/assessment';
import { kvGet, kvKeys, kvSet } from '../storage/db';

const PROGRESS_PREFIX = 'progress:question:';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Draw up to `n` questions, shuffled. */
export function drawQuestions(questions: Question[], n: number): Question[] {
  return shuffle(questions).slice(0, n);
}

function progressKey(id: string) {
  return `${PROGRESS_PREFIX}${id}`;
}

export async function recordAnswer(
  questionId: string,
  correct: boolean,
): Promise<ProgressEntry> {
  const prev = await getProgress(questionId);
  const entry: ProgressEntry = {
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (correct ? 1 : 0),
    lastCorrect: correct,
    lastSeen: Date.now(),
  };
  await kvSet(progressKey(questionId), entry);
  return entry;
}

export async function getProgress(questionId: string): Promise<ProgressEntry | undefined> {
  return kvGet<ProgressEntry>(progressKey(questionId));
}

export async function allProgress(): Promise<Record<string, ProgressEntry>> {
  const keys = await kvKeys(PROGRESS_PREFIX);
  const out: Record<string, ProgressEntry> = {};
  for (const k of keys) {
    const entry = await kvGet<ProgressEntry>(k);
    if (entry) out[k.slice(PROGRESS_PREFIX.length)] = entry;
  }
  return out;
}
