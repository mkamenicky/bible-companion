import { useEffect, useState, useCallback, useMemo } from 'react';
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
 * Optimized localization hook with caching and performance improvements
 */
export function useLocalization(): UseLocalizationReturn {
    const { t: i18nextT } = useReactI18nextTranslation();
    const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
        localizationService.getCurrentLanguage()
    );
    const [initialized, setInitialized] = useState(localizationService.isInitialized());

    // Cache for resource bundles to avoid repeated access
    const [resourceBundle, setResourceBundle] = useState<any>(null);

    // Initialize localization service (only once)
    useEffect(() => {
        const initializeLocalization = async () => {
            try {
                if (!localizationService.isInitialized()) {
                    await localizationService.initialize();
                }
                setCurrentLanguage(localizationService.getCurrentLanguage());
                setInitialized(true);

                // Cache the resource bundle
                const i18nInstance = localizationService.getI18nInstance();
                const bundle = i18nInstance.getResourceBundle(localizationService.getCurrentLanguage(), 'translation');
                setResourceBundle(bundle);
            } catch (error) {
                console.error('❌ Error initializing localization in hook:', error);
                setInitialized(true);
            }
        };

        initializeLocalization();
    }, []);

    // Listen for language changes and update cache
    useEffect(() => {
        const cleanup = localizationService.addLanguageChangeListener((newLanguage) => {
            setCurrentLanguage(newLanguage);

            // Update cached resource bundle
            const i18nInstance = localizationService.getI18nInstance();
            const bundle = i18nInstance.getResourceBundle(newLanguage, 'translation');
            setResourceBundle(bundle);
        });

        return cleanup;
    }, []);

    // Memoized language info to avoid repeated calculations
    const currentLanguageInfo = useMemo(() =>
            localizationService.getCurrentLanguageInfo(),
        [currentLanguage]
    );

    const availableLanguages = useMemo(() =>
            localizationService.availableLanguages,
        []
    );

    // Optimized translation function
    const t = useCallback((key: string, options?: Record<string, any>): string => {
        try {
            return i18nextT(key, options);
        } catch (error) {
            return localizationService.t(key, options);
        }
    }, [i18nextT]);

    // Cached column mapping
    const columnMap = useMemo<Record<SupportedLanguage, string>>(() => ({
        'en': 'BookDisplayTitle',
        'de': 'BookDisplayTitleGerman',
        'ja': 'BookDisplayTitleJapanese',
        'es': 'BookDisplayTitle',
        'fr': 'BookDisplayTitle',
        'zh': 'BookDisplayTitle'
    }), []);

    // Cached task mapping
    const taskKeyMap = useMemo<Record<string, string>>(() => ({
        'Daily Text': 'tasks.dailyText',
        'Weekly Bible Reading (Meeting)': 'tasks.weeklyBibleReading',
        'Midweek Meeting Preparation': 'tasks.midweekMeeting',
        'Weekend Meeting Preparation': 'tasks.weekendMeeting',
        'Family Worship': 'tasks.familyWorship'
    }), []);

    // Optimized helper functions
    const getBookDisplayColumn = useCallback((language?: SupportedLanguage): string => {
        const lang = language || currentLanguage;
        return columnMap[lang] || 'BookDisplayTitle';
    }, [currentLanguage, columnMap]);

    const translateTask = useCallback((taskName: string): string => {
        const translationKey = taskKeyMap[taskName];
        return translationKey ? t(translationKey) : taskName;
    }, [t, taskKeyMap]);

    // Heavily optimized achievement translation with caching
    const translateAchievement = useCallback((achievement: Achievement) => {
        // Use cached resource bundle instead of accessing i18next repeatedly
        if (!resourceBundle?.progress?.achievements) {
            return {
                name: achievement.name,
                description: achievement.description
            };
        }

        const achievementId = achievement.id.toLowerCase();
        const names = resourceBundle.progress.achievements.names;
        const descriptions = resourceBundle.progress.achievements.descriptions;

        return {
            name: names?.[achievementId] || achievement.name,
            description: descriptions?.[achievementId] || achievement.description
        };
    }, [resourceBundle]);

    // Simple helper for book titles
    const getLocalizedBookTitle = useCallback((assignment: EnhancedDailyReadingAssignment): string => {
        return assignment.localized_title || assignment.display_title;
    }, []);

    // Memoized service calls
    const setLanguage = useCallback(async (languageCode: SupportedLanguage): Promise<void> => {
        await localizationService.setLanguage(languageCode);
    }, []);

    const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions): string => {
        return localizationService.formatNumber(number, options);
    }, [currentLanguage]);

    const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions): string => {
        return localizationService.formatDate(date, options);
    }, [currentLanguage]);

    const isRTL = useMemo(() => localizationService.isRTL(), [currentLanguage]);

    return {
        // Core localization functionality
        t,
        currentLanguage,
        currentLanguageInfo,
        availableLanguages,
        setLanguage,
        isRTL,
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
 * Lightweight hook that only returns the translation function
 */
export function useTranslation(): (key: string, options?: Record<string, any>) => string {
    const { t } = useLocalization();
    return t;
}
