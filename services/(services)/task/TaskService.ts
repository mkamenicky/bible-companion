import {DailyReadingAssignment, ReadingPlan} from "@/models";
import {readingService} from "@/services/(services)/readings/ReadingService";
import {dateFormattingService} from "@/services";

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

    async fetchReadingAssignments(): Promise<DailyReadingAssignment[]>{
        return await readingService.fetchReadingAssignments()
    }

    async confirmTaskCompletion(taskName: string | null): Promise<void> {
        if (!taskName) return;
        await readingService.setTaskState(taskName, this.today, true);
    }

    async markDailyAssignmentAsRead(dailyReadingAssignment: DailyReadingAssignment): Promise<void> {
        console.log('Marking daily assignment as read:', dailyReadingAssignment);
        for (let verseId = dailyReadingAssignment.start_verse_id; verseId <= dailyReadingAssignment.end_verse_id; verseId++) {
            console.log('Marking verse as read:', verseId);
            await readingService.markVerseAsRead(verseId, this.today);
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
