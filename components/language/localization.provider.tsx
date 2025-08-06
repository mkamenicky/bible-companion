// LocalizationProvider.tsx
import React, {useEffect, useState} from 'react';
import {I18nextProvider} from 'react-i18next';
import {localizationService} from '@/services';
import { logger } from "@/utils/(utils)/logger";

interface LocalizationProviderProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that provides i18next context to the app
 * This should wrap your entire app at the root level
 */
export function LocalizationProvider({children}: LocalizationProviderProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const initializeLocalization = async () => {
            try {
                await localizationService.initialize();
                setIsReady(true);
            } catch (error) {
                logger.error('❌ Failed to initialize localization:', error);
                setIsReady(true); // Set ready anyway to prevent infinite loading
            }
        };

        initializeLocalization();
    }, []);

    if (!isReady) {
        // You can return a loading screen here if needed
        return null;
    }

    return (
        <I18nextProvider i18n={localizationService.getI18nInstance()}>
            {children}
        </I18nextProvider>
    );
}
