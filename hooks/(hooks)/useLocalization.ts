import { useEffect, useState, useCallback } from 'react';
import { useTranslation as useReactI18nextTranslation } from 'react-i18next';
import { localizationService, SupportedLanguage, LanguageOption } from '@/services';

export interface UseLocalizationReturn {
    t: (key: string, options?: Record<string, any>) => string;
    currentLanguage: SupportedLanguage;
    currentLanguageInfo: LanguageOption;
    availableLanguages: LanguageOption[];
    setLanguage: (languageCode: SupportedLanguage) => Promise<void>;
    isRTL: boolean;
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
    initialized: boolean;
}

/**
 * React hook for using localization in components
 * Provides translation function and language management
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

    return {
        t,
        currentLanguage,
        currentLanguageInfo: localizationService.getCurrentLanguageInfo(),
        availableLanguages: localizationService.availableLanguages,
        setLanguage,
        isRTL: localizationService.isRTL(),
        formatNumber,
        formatDate,
        initialized,
    };
}

/**
 * Simplified hook that only returns the translation function
 * Use this when you only need translations and not language management
 */
export function useTranslation(): (key: string, options?: Record<string, any>) => string {
    const { t } = useLocalization();
    return t;
}
