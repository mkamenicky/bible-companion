// AppSettings interface - add this to your models file
export interface AppSettings {
    // Master notification toggle
    notifications: boolean;

    // Individual notification preferences
    dailyReminder: boolean;
    streakReminder: boolean;
    goalReminder: boolean;
    achievementNotifications: boolean;

    // Notification timing
    reminderTime: string; // Format: "HH:MM"

    // App preferences
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    offlineMode: boolean;
}
