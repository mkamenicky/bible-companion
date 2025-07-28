import { useColorScheme } from 'react-native';
import { StyleSheet } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { ColorSchemeName } from 'react-native/Libraries/Utilities/Appearance';
import type { CustomColors } from '@/models';

// Theme variants that users can choose from
export type ThemeVariant = 'default' | 'instagram' | 'minimal' | 'dark-modern';

interface ThemeColors extends CustomColors {
    // Instagram-style specific colors
    instagramBlue: string;
    subtleGray: string;
    lightGray: string;
    borderColor: string;
    completedGreen: string;
    shadowColor: string;
}

export class ThemeService {
    // Current selected theme variant (you can store this in AsyncStorage)
    private static currentVariant: ThemeVariant = 'instagram';

    static setThemeVariant(variant: ThemeVariant) {
        this.currentVariant = variant;
    }

    static getCurrentVariant(): ThemeVariant {
        return this.currentVariant;
    }

    static getCustomColors(colorScheme: ColorSchemeName, variant: ThemeVariant = this.currentVariant): ThemeColors {
        const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
        const isDark = colorScheme === 'dark';

        switch (variant) {
            case 'instagram':
                return this.getInstagramColors(isDark, baseTheme);
            case 'minimal':
                return this.getMinimalColors(isDark, baseTheme);
            case 'dark-modern':
                return this.getDarkModernColors(isDark, baseTheme);
            default:
                return this.getDefaultColors(isDark, baseTheme);
        }
    }

    private static getInstagramColors(isDark: boolean, baseTheme: any): ThemeColors {
        if (isDark) {
            return {
                ...baseTheme.colors,
                primary: '#0095f6',
                secondary: '#03dac6',
                color: '#ffffff',
                background: '#000000',
                surface: '#1a1a1a',
                onSurface: '#ffffff',
                onBackground: '#ffffff',
                foreground: '#262626',
                titleBackground: '#000000',
                footerBackground: '#000000',
                footerForeground: '#8e8e8e',
                text: '#ffffff',
                accent: '#0095f6',
                instagramBlue: '#0095f6',
                subtleGray: '#8e8e8e',
                lightGray: '#262626',
                borderColor: '#363636',
                completedGreen: '#10b981',
                shadowColor: 'rgba(0, 0, 0, 0.25)',
            };
        }

        return {
            ...baseTheme.colors,
            primary: '#0095f6',
            secondary: '#03dac6',
            color: '#262626',
            background: '#fafafa',
            surface: '#ffffff',
            onSurface: '#262626',
            onBackground: '#262626',
            foreground: '#ffffff',
            titleBackground: '#ffffff',
            footerBackground: '#ffffff',
            footerForeground: '#8e8e8e',
            text: '#262626',
            accent: '#0095f6',
            instagramBlue: '#0095f6',
            subtleGray: '#8e8e8e',
            lightGray: '#f0f0f0',
            borderColor: '#dbdbdb',
            completedGreen: '#10b981',
            shadowColor: 'rgba(0, 0, 0, 0.1)',
        };
    }

    private static getMinimalColors(isDark: boolean, baseTheme: any): ThemeColors {
        return {
            ...baseTheme.colors,
            primary: isDark ? '#ffffff' : '#000000',
            secondary: '#03dac6',
            color: isDark ? '#ffffff' : '#000000',
            background: isDark ? '#000000' : '#ffffff',
            surface: isDark ? '#121212' : '#f8f8f8',
            onSurface: isDark ? '#ffffff' : '#000000',
            onBackground: isDark ? '#ffffff' : '#000000',
            foreground: isDark ? '#121212' : '#ffffff',
            titleBackground: isDark ? '#000000' : '#ffffff',
            footerBackground: isDark ? '#000000' : '#ffffff',
            footerForeground: '#999999',
            text: isDark ? '#ffffff' : '#000000',
            accent: isDark ? '#ffffff' : '#000000',
            instagramBlue: isDark ? '#ffffff' : '#000000',
            subtleGray: '#999999',
            lightGray: isDark ? '#1e1e1e' : '#f2f2f2',
            borderColor: isDark ? '#333333' : '#e0e0e0',
            completedGreen: isDark ? '#ffffff' : '#000000',
            shadowColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        };
    }

    private static getDarkModernColors(isDark: boolean, baseTheme: any): ThemeColors {
        return {
            ...baseTheme.colors,
            primary: '#144cfb',
            secondary: '#009789',
            color: isDark ? '#f1f1f1' : '#000000',
            background: isDark ? '#0f0f0f' : '#f1f1f1',
            surface: isDark ? '#1a1a1a' : '#ffffff',
            onSurface: baseTheme.colors.onSurface,
            onBackground: baseTheme.colors.onBackground,
            foreground: isDark ? '#1e1e1e' : '#ffffff',
            titleBackground: isDark ? '#1e1e1e' : '#e0e0e0',
            footerBackground: isDark ? '#1e1e1e' : '#e0e0e0',
            footerForeground: isDark ? '#a3a3a3' : '#818080',
            text: isDark ? '#f1f1f1' : '#000000',
            accent: '#144cfb',
            instagramBlue: '#144cfb',
            subtleGray: isDark ? '#a3a3a3' : '#818080',
            lightGray: isDark ? '#2a2a2a' : '#f0f0f0',
            borderColor: isDark ? '#2e2e2e' : '#dbdbdb',
            completedGreen: '#008a34',
            shadowColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)',
        };
    }

    private static getDefaultColors(isDark: boolean, baseTheme: any): ThemeColors {
        return {
            ...baseTheme.colors,
            primary: '#8aade6',
            secondary: '#7adcd2',
            color: isDark ? '#f1f1f1' : '#1f2937',
            background: isDark ? '#292929' : '#f3f4f6',
            surface: '#ffffff',
            onSurface: '#1f2937',
            onBackground: '#1f2937',
            foreground: isDark ? '#121212' : '#ffffff',
            titleBackground: isDark ? '#292929' : '#e0e0e0',
            footerBackground: isDark ? '#292929' : '#e0e0e0',
            footerForeground: '#6b7280',
            text: isDark ? '#f1f1f1' : '#1f2937',
            accent: '#8aade6',
            instagramBlue: '#8aade6',
            subtleGray: '#6b7280',
            lightGray: '#e5e7eb',
            borderColor: '#d1d5db',
            completedGreen: '#7d9e98',
            shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.05)',
        };
    }

    static getStyles(customColors: ThemeColors, variant: ThemeVariant = this.currentVariant) {
        // Use Instagram styles as the base default
        const baseStyles = this.getBaseStyles(customColors);

        switch (variant) {
            case 'minimal':
                return this.getMinimalStyles(baseStyles, customColors);
            case 'dark-modern':
                return this.getDarkModernStyles(baseStyles, customColors);
            case 'default':
                return this.getDefaultStyles(baseStyles, customColors);
            case 'instagram':
            default:
                return baseStyles;
        }
    }

    // Base Instagram-style component styles (used as foundation)
    private static getBaseStyles(colors: ThemeColors) {
        return StyleSheet.create({
            // Container styles
            container: {
                flex: 1,
                backgroundColor: colors.background,
            },

            // App bar styles (clean Instagram header)
            appbar: {
                backgroundColor: colors.titleBackground,
                borderBottomColor: colors.borderColor,
                borderBottomWidth: 0.5,
                elevation: 0,
                shadowOpacity: 0,
            },

            // Card styles (Instagram-like cards)
            card: {
                backgroundColor: colors.foreground,
                marginBottom: 8,
                borderRadius: 0, // Instagram uses sharp corners
                elevation: 0,
                shadowOpacity: 0,
                borderTopWidth: 0.5,
                borderBottomWidth: 0.5,
                borderColor: colors.borderColor,
            },

            cardTitle: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.color,
                marginBottom: 4,
            },

            cardSubtitle: {
                fontSize: 13,
                color: colors.subtleGray,
                marginBottom: 16,
            },

            // List item styles (Instagram-like)
            listItem: {
                backgroundColor: 'transparent',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.borderColor,
                flexDirection: 'row',
                alignItems: 'center',
            },

            listItemLast: {
                borderBottomWidth: 0,
            },

            itemIcon: {
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.lightGray,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center',
            },

            itemContent: {
                flex: 1,
            },

            itemTitle: {
                fontSize: 16,
                fontWeight: '500',
                color: colors.color,
                marginBottom: 2,
            },

            itemSubtitle: {
                fontSize: 13,
                color: colors.subtleGray,
            },

            // Checkbox styles (Instagram circular checkboxes)
            checkbox: {
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: colors.borderColor,
                justifyContent: 'center',
                alignItems: 'center',
            },

            checkboxChecked: {
                backgroundColor: colors.instagramBlue,
                borderColor: colors.instagramBlue,
            },

            checkboxIcon: {
                color: '#ffffff',
                fontSize: 12,
            },

            // Progress bar styles
            progressContainer: {
                padding: 16,
                paddingTop: 16,
                paddingBottom: 20,
            },

            progressHeader: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
            },

            progressLabel: {
                fontSize: 13,
                color: colors.subtleGray,
                fontWeight: '500',
            },

            progressValue: {
                fontSize: 13,
                color: colors.color,
                fontWeight: '600',
            },

            progressBar: {
                height: 3,
                backgroundColor: colors.lightGray,
                borderRadius: 1.5,
                overflow: 'hidden',
            },

            progressFill: {
                height: '100%',
                backgroundColor: colors.instagramBlue,
                borderRadius: 1.5,
            },

            // Completion badge (Instagram-like)
            completionBadge: {
                backgroundColor: colors.foreground,
                padding: 16,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.borderColor,
            },

            badgeContent: {
                flexDirection: 'row',
                alignItems: 'center',
            },

            badgeIcon: {
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.completedGreen,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
            },

            badgeText: {
                fontSize: 15,
                fontWeight: '500',
                color: colors.color,
            },

            // Modal styles
            modalContainer: {
                alignSelf: 'center',
                width: '80%',
            },

            modalCard: {
                padding: 16,
                backgroundColor: colors.foreground,
                borderRadius: 8,
            },

            // Daily banner styles
            dailyBanner: {
                backgroundColor: colors.foreground,
                padding: 16,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.borderColor,
            },

            dailyTitle: {
                color: colors.color,
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: 8,
            },

            dailyLink: {
                alignSelf: 'center',
                paddingVertical: 4,
            },

            dailyLinkText: {
                fontWeight: '600',
                fontSize: 16,
                color: colors.instagramBlue,
            },

            // Icon styles
            icon: {
                color: colors.color,
                marginRight: 8,
            },

            // Text styles
            text: {
                color: colors.color,
            },

            surface: {
                backgroundColor: colors.surface,
            },

            // Section header styles
            sectionHeader: {
                padding: 20,
                paddingBottom: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.lightGray,
            },

            sectionTitle: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.color,
                marginBottom: 4,
            },

            sectionSubtitle: {
                fontSize: 13,
                color: colors.subtleGray,
            },
        });
    }

    // Theme-specific overrides
    private static getMinimalStyles(baseStyles: any, colors: ThemeColors) {
        return StyleSheet.create({
            ...baseStyles,
            // Override with minimal-specific styles
            card: {
                ...baseStyles.card,
                borderWidth: 1,
                borderColor: colors.borderColor,
                borderRadius: 4,
                borderTopWidth: 1,
                borderBottomWidth: 1,
            },
            progressFill: {
                ...baseStyles.progressFill,
                backgroundColor: colors.color,
            },
            checkboxChecked: {
                ...baseStyles.checkboxChecked,
                backgroundColor: colors.color,
                borderColor: colors.color,
            },
            dailyLinkText: {
                ...baseStyles.dailyLinkText,
                color: colors.color,
            },
        });
    }

    private static getDarkModernStyles(baseStyles: any, colors: ThemeColors) {
        return StyleSheet.create({
            ...baseStyles,
            // Override with dark modern-specific styles
            card: {
                ...baseStyles.card,
                borderRadius: 12,
                elevation: 4,
                shadowOpacity: 0.3,
                borderTopWidth: 0,
                borderBottomWidth: 0,
                marginBottom: 16,
            },
            appbar: {
                ...baseStyles.appbar,
                elevation: 4,
                borderBottomWidth: 1,
            },
            progressBar: {
                ...baseStyles.progressBar,
                height: 6,
                borderRadius: 3,
            },
            progressFill: {
                ...baseStyles.progressFill,
                borderRadius: 3,
            },
            itemIcon: {
                ...baseStyles.itemIcon,
                borderRadius: 8,
            },
        });
    }

    private static getDefaultStyles(baseStyles: any, colors: ThemeColors) {
        return StyleSheet.create({
            ...baseStyles,
            // Override with original app-specific styles
            appbar: {
                ...baseStyles.appbar,
                borderBottomColor: colors.footerForeground,
                borderBottomWidth: 1,
                elevation: 2,
            },
            card: {
                ...baseStyles.card,
                marginBottom: 16,
                borderRadius: 12,
                elevation: 2,
                borderTopWidth: 0,
                borderBottomWidth: 0,
            },
            cardTitle: {
                ...baseStyles.cardTitle,
                fontSize: 16,
                textAlign: 'center',
                fontWeight: 'bold',
                marginBottom: 8,
            },
            listItem: {
                ...baseStyles.listItem,
                borderRadius: 6,
                borderBottomWidth: 0,
            },
            progressBar: {
                ...baseStyles.progressBar,
                height: 10,
                borderRadius: 5,
            },
            progressFill: {
                ...baseStyles.progressFill,
                borderRadius: 5,
            },
            dailyBanner: {
                ...baseStyles.dailyBanner,
                marginBottom: 12,
                elevation: 1,
                borderBottomWidth: 0,
            },
            dailyTitle: {
                ...baseStyles.dailyTitle,
                fontWeight: 'bold',
            },
            dailyLinkText: {
                ...baseStyles.dailyLinkText,
                fontWeight: 'bold',
                color: colors.primary,
            },
            // Legacy support
            legacyCard: {
                backgroundColor: colors.surface,
                marginVertical: 8,
                marginHorizontal: 16,
                borderRadius: 12,
                elevation: 4,
            },
        });
    }

    // Convenience methods
    static useThemedStyles(variant?: ThemeVariant) {
        const colorScheme = useColorScheme();
        const customColors = this.getCustomColors(colorScheme, variant);
        return this.getStyles(customColors, variant);
    }

    // Theme management methods
    static getAvailableThemes(): { key: ThemeVariant; name: string; description: string }[] {
        return [
            {
                key: 'instagram',
                name: 'Instagram',
                description: 'Clean, minimal design inspired by Instagram'
            },
            {
                key: 'minimal',
                name: 'Minimal',
                description: 'Ultra-clean design with minimal colors'
            },
            {
                key: 'dark-modern',
                name: 'Dark Modern',
                description: 'Modern dark theme with refined colors'
            },
            {
                key: 'default',
                name: 'Classic',
                description: 'Original app theme'
            }
        ];
    }

    // Legacy support
    static getCustomColorsLegacy(scheme: ColorSchemeName) {
        return this.getCustomColors(scheme);
    }

    static getStylesLegacy(customColors: any) {
        return this.getStyles(customColors);
    }
}

// Export singleton for easy access
export const themeService = new ThemeService();
