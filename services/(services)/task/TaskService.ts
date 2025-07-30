import {DailyReadingAssignment, ReadingPlan} from "@/models";
import {readingService} from "@/services/(services)/readings/ReadingService";

export class TaskService {
    private weeklyTasks: string[];
    private dailyTasks: string[];

    constructor(weeklyTasks: string[] = [], dailyTasks: string[] = []) {
        this.weeklyTasks = weeklyTasks;
        this.dailyTasks = dailyTasks;
    }

    async fetchTaskStates(): Promise<Record<string, boolean>> {
        const weekly = await readingService.getWeeklyTaskStates(new Date(), this.weeklyTasks);
        const daily = await readingService.getDailyTaskStates(new Date(), this.dailyTasks);
        return {...weekly, ...daily};
    }

    async fetchReadingPlan(): Promise<ReadingPlan[]> {
        return await readingService.getReadingPlan();
    }

    async fetchReadingAssignments(): Promise<DailyReadingAssignment[]> {
        return await readingService.fetchReadingAssignments()
    }

    async toggleTaskCompletion(taskName: string, done: boolean): Promise<void> {
        if (!taskName) return;
        await readingService.setTaskState(taskName, new Date(), done);
    }

    async markDailyAssignmentAsRead(dailyReadingAssignment: DailyReadingAssignment): Promise<void> {
        console.log('Marking daily assignment as read:', dailyReadingAssignment);
        for (let verseId = dailyReadingAssignment.start_verse_id; verseId <= dailyReadingAssignment.end_verse_id; verseId++) {
            console.log('Marking verse as read on:', verseId, new Date());
            await readingService.markVerseAsRead(verseId, new Date());
        }

        await readingService.markDailyReadingAssignmentAsRead(dailyReadingAssignment, new Date(), true);
    }

    async unmarkDailyAssignmentAsRead(dailyReadingAssignment: DailyReadingAssignment): Promise<void> {
        console.log('Unmarking daily assignment as not read:', dailyReadingAssignment);
        for (let verseId = dailyReadingAssignment.start_verse_id; verseId <= dailyReadingAssignment.end_verse_id; verseId++) {
            console.log('Marking verse as not read:', verseId);
            await readingService.unmarkVerseAsRead(verseId);
        }

        await readingService.markDailyReadingAssignmentAsRead(dailyReadingAssignment, undefined, false);
    }
}
