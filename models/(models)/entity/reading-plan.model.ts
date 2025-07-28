import type {ReadingPlanConfig} from '@/models';

export interface ReadingPlan {
    readonly readingPlanConfig: ReadingPlanConfig;
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
