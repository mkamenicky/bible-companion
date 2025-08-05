export interface AppSettings {
    // Master notification toggle
    notifications: boolean;

    // Individual notification preferences
    dailyReminder: boolean;
    streakReminder: boolean;
    goalReminder: boolean;
    achievementNotifications: boolean;

    // Notification timing
    reminderTime: string; // Format: "HH:MM" - Daily reminder time
    streakReminderTime: string; // Format: "HH:MM" - Streak reminder time
    goalReminderTime: string; // Format: "HH:MM" - Goal reminder time

    // App preferences
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    offlineMode: boolean;
}
