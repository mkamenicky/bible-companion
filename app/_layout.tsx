import {useCallback, useEffect, useMemo, useState} from 'react';
import {AppState, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {MD3DarkTheme, MD3LightTheme, PaperProvider} from 'react-native-paper';
import {useFonts} from 'expo-font';
import {SplashScreen, Stack} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
    initDatabase,
    localizationService,
    notificationService,
    progressService,
    resetDatabase,
    ThemeService,
} from '@/services';
import {useThemeInitializer} from '@/components/theme/ThemeSelector';
import {AchievementProvider} from '@/components/progress/AchievementContext';
import {GlobalAchievementModal} from '@/components/progress/GlobalAchievementModal';
import StartupErrorScreen from '@/components/StartupErrorScreen';
import {logger} from '@/utils/(utils)/logger';

export {ErrorBoundary} from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

// Keep the splash screen up until fonts, localization and database are ready.
SplashScreen.preventAutoHideAsync();

type StartupState =
    | { status: 'loading' }
    | { status: 'ready' }
    | { status: 'error'; details: string };

/** Marking several verses in a row should trigger one reminder sync, not many. */
const REMINDER_SYNC_DELAY_MS = 800;

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
    });
    const [startup, setStartup] = useState<StartupState>({status: 'loading'});

    useEffect(() => {
        if (fontError) throw fontError;
    }, [fontError]);

    const start = useCallback(async () => {
        // Localization first and independent of the database, so that the
        // error screen below can be shown in the user's language.
        await localizationService.initialize();

        try {
            await initDatabase();
            setStartup({status: 'ready'});
        } catch (error) {
            logger.error('Startup failed', error);
            setStartup({status: 'error', details: error instanceof Error ? error.message : String(error)});
        }
    }, []);

    const resetAndStart = useCallback(async () => {
        try {
            await resetDatabase();
            setStartup({status: 'ready'});
        } catch (error) {
            logger.error('Database reset failed', error);
            setStartup({status: 'error', details: error instanceof Error ? error.message : String(error)});
        }
    }, []);

    useEffect(() => {
        start();
    }, [start]);

    useEffect(() => {
        if (fontsLoaded && startup.status !== 'loading') {
            SplashScreen.hideAsync().catch(() => undefined);
        }
    }, [fontsLoaded, startup.status]);

    if (!fontsLoaded || startup.status === 'loading') return null;

    if (startup.status === 'error') {
        return <StartupErrorScreen details={startup.details} onRetry={start} onReset={resetAndStart}/>;
    }

    return <RootLayoutNav/>;
}

/**
 * Keeps the scheduled reminders in line with the real reading progress: on
 * start, whenever the app returns to the foreground (which also covers a new
 * day), after reading was marked and after a language change.
 */
function useReminderSync() {
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;

        const syncSoon = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                notificationService.syncReminders();
            }, REMINDER_SYNC_DELAY_MS);
        };

        notificationService.syncReminders();

        const appStateSubscription = AppState.addEventListener('change', state => {
            if (state === 'active') syncSoon();
        });
        const removeProgressListener = progressService.addChangeListener(syncSoon);
        const removeLanguageListener = localizationService.addLanguageChangeListener(syncSoon);

        return () => {
            if (timer) clearTimeout(timer);
            appStateSubscription.remove();
            removeProgressListener();
            removeLanguageListener();
        };
    }, []);
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    useThemeInitializer();
    useReminderSync();

    const theme = useMemo(() => {
        const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
        const colors = ThemeService.getCustomColors(colorScheme);
        const styles = ThemeService.getStyles(colors);
        return {
            ...baseTheme,
            ...styles,
            colors,
        };
    }, [colorScheme]);

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <AchievementProvider>
                    <Stack screenOptions={{headerShown: false}}/>
                    <GlobalAchievementModal/>
                </AchievementProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
