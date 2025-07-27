export interface AppSettings {
    notifications: boolean;
    dailyReminder: boolean;
    reminderTime: string;
    theme: 'auto' | 'light' | 'dark';
    fontSize: 'small' | 'medium' | 'large';
    offlineMode: boolean;
}
