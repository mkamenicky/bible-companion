import { useColorScheme } from 'react-native';
import { StyleSheet } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { ColorSchemeName } from 'react-native/Libraries/Utilities/Appearance';
import type { CustomColors } from '@/models';

export class ThemeService {
    static getCustomColors(colorScheme: ColorSchemeName): CustomColors {
        const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
        const isDark = colorScheme === 'dark';

        // App-specific color definitions
        const background = isDark ? '#292929' : '#f1f1f1';
        const foreground = isDark ? '#121212' : '#ffffff';
        const titleBackground = isDark ? '#292929' : '#e0e0e0';
        const footerBackground = isDark ? '#292929' : '#e0e0e0';
        const footerForeground = isDark ? '#a1a1a1' : '#818080';
        const color = isDark ? '#fefefe' : '#000000';

        return {
            // Material Design 3 base colors
            ...baseTheme.colors,

            // Custom primary and secondary
            primary: '#79aafb',
            secondary: '#03dac6',

            // App-specific colors
            color,
            background,
            surface: baseTheme.colors.surface,
            onSurface: baseTheme.colors.onSurface,
            onBackground: baseTheme.colors.onBackground,
            foreground,
            titleBackground,
            footerBackground,
            footerForeground,

            // Legacy support for existing components
            text: color,
            accent: '#79aafb',
        };
    }

    static getStyles(customColors: CustomColors) {
        return StyleSheet.create({
            // Container styles
            container: {
                flex: 1,
                backgroundColor: customColors.background,
            },

            // App bar styles
            appbar: {
                backgroundColor: customColors.titleBackground,
                borderBottomColor: customColors.footerForeground,
                borderStyle: 'solid',
                borderBottomWidth: 1,
            },

            // Icon styles
            icon: {
                color: customColors.color,
                marginRight: 8,
            },

            // Card styles
            card: {
                marginBottom: 16,
                borderRadius: 12,
                elevation: 2,
                color: customColors.color,
                backgroundColor: customColors.foreground,
            },

            cardTitle: {
                fontSize: 16,
                alignSelf: 'center',
                fontWeight: 'bold',
                marginBottom: 8,
                color: customColors.color,
            },

            // List item styles
            listItem: {
                borderRadius: 6,
                color: customColors.color,
            },

            itemTitle: {
                fontSize: 16,
                color: customColors.color,
            },

            // Modal styles
            modalContainer: {
                alignSelf: 'center',
                width: '80%',
            },

            modalCard: {
                padding: 16,
                backgroundColor: customColors.foreground,
            },

            // Daily banner styles
            dailyBanner: {
                backgroundColor: customColors.foreground,
                padding: 16,
                marginTop: 0,
                color: customColors.color,
                marginBottom: 12,
                elevation: 1,
            },

            dailyTitle: {
                color: customColors.color,
                fontSize: 16,
                alignSelf: 'center',
                fontWeight: 'bold',
                marginBottom: 8,
            },

            dailyLink: {
                alignSelf: 'center',
                paddingVertical: 4,
                color: customColors.primary,
            },

            dailyLinkText: {
                fontWeight: 'bold',
                fontSize: 16,
                color: customColors.primary,
            },

            // Progress bar styles
            progressBar: {
                height: 10,
                borderRadius: 5,
            },

            // Text styles
            text: {
                color: customColors.color,
            },

            // Surface styles
            surface: {
                backgroundColor: customColors.surface,
            },

            // Legacy support styles
            legacyCard: {
                backgroundColor: customColors.surface,
                marginVertical: 8,
                marginHorizontal: 16,
                borderRadius: 12,
                elevation: 4,
            },
        });
    }

    static useThemedStyles() {
        const colorScheme = useColorScheme();
        const customColors = this.getCustomColors(colorScheme);
        return this.getStyles(customColors);
    }

    // Legacy support method to maintain compatibility
    static getCustomColorsLegacy(scheme: ColorSchemeName) {
        return this.getCustomColors(scheme);
    }

    // Legacy support method to maintain compatibility
    static getStylesLegacy(customColors: any) {
        return this.getStyles(customColors);
    }
}

// Create singleton instance for legacy support
export const themeService = new ThemeService();

// Legacy export for backward compatibility
export const colorUtils = {
    getCustomColors: ThemeService.getCustomColors,
    getStyles: ThemeService.getStyles,
};
