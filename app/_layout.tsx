import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {PaperProvider, MD3LightTheme, MD3DarkTheme, Card} from 'react-native-paper';
import { useFonts } from 'expo-font';

// @ts-ignore
import { initDatabase } from '@/services/(services)/database/db';
import {useColorScheme} from "react-native";
import {ThemeService} from "@/services/(services)/theme/ThemeService";

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

// Prevent auto-hiding the splash screen before fonts and DB are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
    });

    const [dbReady, setDbReady] = useState(false);

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    const prepare = useCallback(async () => {
        try {
            await initDatabase();
            console.log('✅ Database initialized successfully');
            setDbReady(true);
        } catch (err) {
            console.error('❌ Error initializing database:', err);
        } finally {
            if (loaded) await SplashScreen.hideAsync();
        }
    }, [loaded]);

    useEffect(() => {
        if (loaded && !dbReady) {
            prepare();
        }
    }, [loaded, dbReady, prepare]);

    // ❗ Don't render anything until fonts and DB are ready
    if (!loaded || !dbReady) return null;

    return <RootLayoutNav />;
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();

    const theme = useMemo(() => {
        const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
        const colors = ThemeService.getCustomColors(colorScheme);
        return {
            ...baseTheme,
            colors,
        };
    }, [colorScheme]);

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <Stack screenOptions={{ headerShown: false }} />
            </PaperProvider>
        </SafeAreaProvider>
    );
}
