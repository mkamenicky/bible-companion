import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {PaperProvider, MD3LightTheme, MD3DarkTheme, Card} from 'react-native-paper';
import { useFonts } from 'expo-font';

// @ts-ignore
import { initDatabase } from '@/services/db';
import {useColorScheme} from "react-native";

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

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    // Prepare DB and hide splash screen
    const prepare = useCallback(async () => {
        try {
            await initDatabase();
            console.log('✅ Database initialized successfully');
        } catch (err) {
            console.error('❌ Error initializing database:', err);
        }
        finally {
            if (loaded) await SplashScreen.hideAsync();
        }
    }, [loaded]);

    useEffect(() => {
        if (loaded) {
            prepare();
        }
    }, [loaded, prepare]);

    if (!loaded) return null;

    return <RootLayoutNav />;
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();

    const theme = useMemo(() => {
        const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
        const background = colorScheme === 'dark' ? '#121212' : '#f1f1f1';
        return {
            ...baseTheme,
            colors: {
                ...baseTheme.colors,
                primary: '#6200ee',
                secondary: '#03dac6',
                background: background,
                surface: baseTheme.colors.surface,
            },
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
