
import { useEffect, useState, useCallback } from 'react';
import { useTranslation as useReactI18nextTranslation } from 'react-i18next';
import { localizationService, SupportedLanguage, LanguageOption } from '@/services';
import type { EnhancedDailyReadingAssignment, Achievement } from '@/models';

export interface UseLocalizationReturn {
    // Core localization functionality
    t: (key: string, options?: Record<string, any>) => string;
    currentLanguage: SupportedLanguage;
    currentLanguageInfo: LanguageOption;
    availableLanguages: LanguageOption[];
    setLanguage: (languageCode: SupportedLanguage) => Promise<void>;
    isRTL: boolean;
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
    initialized: boolean;

    // Database-specific translation helpers
    translateTask: (taskName: string) => string;
    translateAchievement: (achievement: Achievement) => {
        name: string;
        description: string;
    };
    getLocalizedBookTitle: (assignment: EnhancedDailyReadingAssignment) => string;
    getBookDisplayColumn: (language?: SupportedLanguage) => string;
}

/**
 * Comprehensive React hook for localization in components
 * Provides both core translation functionality and database-specific helpers
 */
export function useLocalization(): UseLocalizationReturn {
    const { t: i18nextT } = useReactI18nextTranslation();
    const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
        localizationService.getCurrentLanguage()
    );
    const [initialized, setInitialized] = useState(localizationService.isInitialized());

    // Initialize localization service
    useEffect(() => {
        const initializeLocalization = async () => {
            try {
                if (!localizationService.isInitialized()) {
                    await localizationService.initialize();
                }
                setCurrentLanguage(localizationService.getCurrentLanguage());
                setInitialized(true);
            } catch (error) {
                console.error('❌ Error initializing localization in hook:', error);
                setInitialized(true); // Set to true anyway to prevent infinite loading
            }
        };

        initializeLocalization();
    }, []);

    // Listen for language changes
    useEffect(() => {
        const cleanup = localizationService.addLanguageChangeListener((newLanguage) => {
            setCurrentLanguage(newLanguage);
        });

        return cleanup;
    }, []);

    // ========================================
    // CORE LOCALIZATION FUNCTIONS
    // ========================================

    // Translation function - use react-i18next's hook for better performance
    const t = useCallback((key: string, options?: Record<string, any>): string => {
        try {
            return i18nextT(key, options);
        } catch (error) {
            console.warn(`⚠️ Translation error for key: ${key}`, error);
            return localizationService.t(key, options); // Fallback to service method
        }
    }, [i18nextT]);

    // Language setter function
    const setLanguage = useCallback(async (languageCode: SupportedLanguage): Promise<void> => {
        await localizationService.setLanguage(languageCode);
    }, []);

    // Number formatter
    const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions): string => {
        return localizationService.formatNumber(number, options);
    }, [currentLanguage]);

    // Date formatter
    const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions): string => {
        return localizationService.formatDate(date, options);
    }, [currentLanguage]);

    // ========================================
    // DATABASE-SPECIFIC TRANSLATION HELPERS
    // ========================================

    // Helper function to get the correct database column for book titles
    const getBookDisplayColumn = useCallback((language?: SupportedLanguage): string => {
        const lang = language || currentLanguage;
        const columnMap: Record<SupportedLanguage, string> = {
            'en': 'ChapterDisplayTitle',
            'de': 'ChapterDisplayTitleGerman',
            'ja': 'ChapterDisplayTitleJapanese',
            // For languages without dedicated columns, fall back to English
            'es': 'ChapterDisplayTitle',
            'fr': 'ChapterDisplayTitle',
            'zh': 'ChapterDisplayTitle'
        };

        return columnMap[lang] || 'ChapterDisplayTitle';
    }, [currentLanguage]);

    // Helper function to translate database-driven task names
    const translateTask = useCallback((taskName: string): string => {
        const taskKeyMap: Record<string, string> = {
            'Daily Text': 'tasks.dailyText',
            'Weekly Bible Reading (Meeting)': 'tasks.weeklyBibleReading',
            'Midweek Meeting Preparation': 'tasks.midweekMeeting',
            'Weekend Meeting Preparation': 'tasks.weekendMeeting',
            'Family Worship': 'tasks.familyWorship'
        };

        const translationKey = taskKeyMap[taskName];
        return translationKey ? t(translationKey) : taskName;
    }, [t]);

    // Helper function to translate achievement names and descriptions

// Helper function to translate achievement names and descriptions

// Helper function to translate achievement names and descriptions
    const translateAchievement = useCallback((achievement: Achievement) => {
        const nameKey = `achievements.names.${achievement.id.toLowerCase()}`;
        const descKey = `achievements.descriptions.${achievement.id.toLowerCase()}`;

        const i18nInstance = localizationService.getI18nInstance();

        // Try different approaches to access the translation
        console.log('🔍 Namespace debug:', {
            // Try with explicit namespace
            withNamespace: i18nInstance.t(nameKey, { ns: 'translation' }),
            // Try without namespace (default)
            withoutNamespace: i18nInstance.t(nameKey),
            // Try accessing resource bundle directly and manually building the path
            manualAccess: i18nInstance.getResourceBundle('de', 'translation')?.progress?.achievements?.names?.[achievement.id.toLowerCase()],
            // Check current namespace
            defaultNS: i18nInstance.options.defaultNS,
            // Check available namespaces
            namespaces: i18nInstance.options.ns
        });

        // Try the manual approach as a workaround
        const germanBundle = i18nInstance.getResourceBundle('de', 'translation');
        const manualName = germanBundle?.progress?.achievements?.names?.[achievement.id.toLowerCase()];
        const manualDesc = germanBundle?.progress?.achievements?.descriptions?.[achievement.id.toLowerCase()];

        if (manualName && manualDesc) {
            console.log('✅ Manual access worked:', { name: manualName, desc: manualDesc });
            return {
                name: manualName,
                description: manualDesc
            };
        }

        // Fallback to original values
        return {
            name: achievement.name,
            description: achievement.description
        };
    }, [currentLanguage]);

    // Helper function to get localized book title from enhanced assignment
    // This will be used when the ReadingService has already provided the localized title
    const getLocalizedBookTitle = useCallback((assignment: EnhancedDailyReadingAssignment): string => {
        console.log(assignment);
        return assignment.localized_title || assignment.display_title;
    }, []);

    return {
        // Core localization functionality
        t,
        currentLanguage,
        currentLanguageInfo: localizationService.getCurrentLanguageInfo(),
        availableLanguages: localizationService.availableLanguages,
        setLanguage,
        isRTL: localizationService.isRTL(),
        formatNumber,
        formatDate,
        initialized,

        // Database-specific translation helpers
        translateTask,
        translateAchievement,
        getLocalizedBookTitle,
        getBookDisplayColumn,
    };
}

/**
 * Simplified hook that only returns the translation function
 * Use this when you only need basic translations and not language management
 */
export function useTranslation(): (key: string, options?: Record<string, any>) => string {
    const { t } = useLocalization();
    return t;
}
