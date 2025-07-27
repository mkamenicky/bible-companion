import type { BibleBook, BibleChapter, BibleVerse } from '@/models';

export interface ReadingPlan {
  readonly bibleBook: BibleBook;
  readonly bibleChapter: BibleChapter;
  readonly bibleVerses: readonly BibleVerse[];
}

export interface ProgressSummary {
  readonly read: number;
  readonly total: number;
}

export interface BookProgress {
  readonly total: number;
  readonly read: number;
}

export type TaskState = boolean;

export interface TaskStates {
  readonly [taskName: string]: TaskState;
}
