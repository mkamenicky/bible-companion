export class DateFormattingService {
    static getWeekday(date: Date): string {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    static getFormattedWeekRange(date: Date): string {
        const day = date.getDay();
        const monday = new Date(date);
        const sunday = new Date(date);
        monday.setDate(date.getDate() - ((day + 6) % 7));
        sunday.setDate(monday.getDate() + 6);

        const format = (targetDate: Date) => 
            `${targetDate.getDate().toString().padStart(2, '0')}.${(targetDate.getMonth() + 1)
                .toString()
                .padStart(2, '0')}`;

        return `${format(monday)} - ${format(sunday)}`;
    }
}
