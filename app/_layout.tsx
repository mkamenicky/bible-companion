import {SafeAreaProvider} from 'react-native-safe-area-context';
import {MD3DarkTheme, MD3LightTheme, PaperProvider} from 'react-native-paper';
import {useFonts} from 'expo-font';

// @ts-ignore
import {initDatabase} from '@/services/(services)/database/db';
import {useColorScheme} from "react-native";
import {ThemeService} from "@/services/(services)/theme/ThemeService";
import {useThemeInitializer} from "@/components/theme/ThemeSelector";
import { localizationService } from '@/services';
import {SplashScreen, Stack} from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {useCallback, useEffect, useMemo, useState} from "react";

// NEW: Import AchievementProvider and GlobalAchievementModal
import { AchievementProvider } from '@/components/progress/AchievementContext';
import { GlobalAchievementModal } from '@/components';
import { logger } from "@/utils/(utils)/logger";

export {ErrorBoundary} from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

// Prevent auto-hiding the splash screen before fonts, DB, and localization are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
    });

    const [dbReady, setDbReady] = useState(false);
    const [localizationReady, setLocalizationReady] = useState(false);

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    const prepare = useCallback(async () => {
        try {
            await initDatabase();
            logger.debug('✅ Database initialized successfully');
            setDbReady(true);

            await localizationService.initialize();
            logger.debug('✅ Localization initialized successfully');
            setLocalizationReady(true);
        } catch (err) {
            logger.error('❌ Error during initialization:', err);
            // Set to true anyway to prevent infinite loading
            setDbReady(true);
            setLocalizationReady(true);
        } finally {
            if (loaded) await SplashScreen.hideAsync();
        }
    }, [loaded]);

    useEffect(() => {
        if (loaded && (!dbReady || !localizationReady)) {
            prepare();
        }
    }, [loaded, dbReady, localizationReady, prepare]);

    // ❗ Don't render anything until everything is ready
    if (!loaded || !dbReady || !localizationReady) return null;

    return <RootLayoutNav/>;
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();
    useThemeInitializer();

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
                {/* NEW: Wrap everything in AchievementProvider */}
                <AchievementProvider>
                    <Stack screenOptions={{headerShown: false}}/>
                    <GlobalAchievementModal />
                </AchievementProvider>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
