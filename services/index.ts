// Import service classes
import {DatabaseManager} from '@/services/(services)/database/DatabaseManager';
import {DateFormattingService} from '@/services/(services)/date/DateFormattingService';
import {ProgressService} from '@/services/(services)/progress/ProgressService';
import {ReadingService} from '@/services/(services)/readings/ReadingService';
import {SettingsService} from '@/services/(services)/settings/SettingsService';
import {TaskService} from '@/services/(services)/task/TaskService';
import {ThemeService} from '@/services/(services)/theme/ThemeService';
import {NotificationService} from "@/services/(services)/notifications/NotificationsServices";

// Create singleton instances
export const databaseManager = DatabaseManager.getInstance();
export const dateFormattingService = new DateFormattingService();
export const progressService = new ProgressService();
export const readingService = new ReadingService();
export const settingsService = new SettingsService();
export const taskService = new TaskService();
export const themeService = new ThemeService();
export const notificationService = new NotificationService();

// Export service classes
export {DatabaseManager} from '@/services/(services)/database/DatabaseManager';
export {DatabaseService} from '@/services/(services)/database/DatabaseService';
export {DateFormattingService} from '@/services/(services)/date/DateFormattingService';
export {ProgressService} from '@/services/(services)/progress/ProgressService';
export {ReadingService} from '@/services/(services)/readings/ReadingService';
export {SettingsService} from '@/services/(services)/settings/SettingsService';
export {TaskService} from '@/services/(services)/task/TaskService';
export {ThemeService} from '@/services/(services)/theme/ThemeService';
export {NotificationService, NotificationSchedule, NotificationPermissionStatus} from '@/services/(services)/notifications/NotificationsServices';

// Export platform-specific database services
export {AndroidDatabaseService, getAndroidDatabaseService} from '@/services/(services)/database/db.android';
export {IOSDatabaseService, getIOSDatabaseService} from '@/services/(services)/database/db.ios';
export {WebDatabaseService, getWebDatabaseService} from '@/services/(services)/database/db.web';

export { localizationService, SupportedLanguage, LanguageOption } from '@/services/(services)/localization/localization.service';

