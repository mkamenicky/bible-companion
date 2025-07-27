import { readingRepo, ReadingPlan } from '@/repository/reading.repository';

export class TaskService {
    private today: Date;
    private weeklyTasks: string[];
    private dailyTasks: string[];

    constructor(today: Date, weeklyTasks: string[], dailyTasks: string[]) {
        this.today = today;
        this.weeklyTasks = weeklyTasks;
        this.dailyTasks = dailyTasks;
    }

    async fetchTaskStates(): Promise<Record<string, boolean>> {
        const weekly = await readingRepo.getWeeklyTaskStates(this.today, this.weeklyTasks);
        const daily = await readingRepo.getDailyTaskStates(this.today, this.dailyTasks);
        return { ...weekly, ...daily };
    }

    async fetchReadingPlan(): Promise<ReadingPlan[]> {
        return await readingRepo.getReadingPlan();
    }

    async confirmTaskCompletion(taskName: string | null): Promise<void> {
        if (!taskName) return;
        await readingRepo.setTaskState(taskName, this.today, true);
    }

    async markReadingPlanVersesAsRead(readingPlan: { bibleVerses: { BibleVerseId: number }[] }): Promise<void> {
        for (const verse of readingPlan.bibleVerses) {
            await readingRepo.markVerseAsRead(verse.BibleVerseId, this.today);
        }
    }
}
