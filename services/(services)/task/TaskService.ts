import {ReadingPlan} from "@/models";
import {readingService} from "@/services";

export class TaskService {
    private today: Date;
    private weeklyTasks: string[];
    private dailyTasks: string[];

    constructor(today: Date = new Date(), weeklyTasks: string[] = [], dailyTasks: string[] = []) {
        this.today = today;
        this.weeklyTasks = weeklyTasks;
        this.dailyTasks = dailyTasks;
    }

    async fetchTaskStates(): Promise<Record<string, boolean>> {
        const weekly = await readingService.getWeeklyTaskStates(this.today, this.weeklyTasks);
        const daily = await readingService.getDailyTaskStates(this.today, this.dailyTasks);
        return { ...weekly, ...daily };
    }

    async fetchReadingPlan(): Promise<ReadingPlan[]> {
        return await readingService.getReadingPlan();
    }

    async confirmTaskCompletion(taskName: string | null): Promise<void> {
        if (!taskName) return;
        await readingService.setTaskState(taskName, this.today, true);
    }

    async markReadingPlanVersesAsRead(readingPlan: ReadingPlan): Promise<void> {
        for (const verse of readingPlan.bibleVerses) {
            await readingService.markVerseAsRead(verse.BibleVerseId, this.today);
        }
    }
}
