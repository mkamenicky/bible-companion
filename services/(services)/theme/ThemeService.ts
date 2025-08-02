import { useColorScheme } from 'react-native';
import { StyleSheet } from 'react-native';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { ColorSchemeName } from 'react-native/Libraries/Utilities/Appearance';
import type { CustomColors } from '@/models';
import type {MD3Theme} from "react-native-paper/src/types";

// Theme variants that users can choose from
export type ThemeVariant = 'default' | 'rose' | 'minimal' | 'dark-modern';

export interface ThemeColors extends CustomColors {
    // Theme-specific colors
    instagramBlue: string;
    subtleGray: string;
    lightGray: string;
    borderColor: string;
    completedGreen: string;
    shadowColor: string;
    cardBackground: string;
    primaryColor: string;

    // Missing properties that your components need
    level1?: string;
    level2?: string;
    level3?: string;

    // Status colors
    warning: string;
    success: string;
    error: string;
    info: string;
}

export class ThemeService {
    // Current selected theme variant (you can store this in AsyncStorage)
    private static currentVariant: ThemeVariant = 'default';
    private static listeners: Array<(variant: ThemeVariant) => void> = [];

    static setThemeVariant(variant: ThemeVariant) {
        this.currentVariant = variant;
        // Notify all listeners about theme change
        this.listeners.forEach(listener => listener(variant));
    }

    static getCurrentVariant(): ThemeVariant {
        return this.currentVariant;
    }

    // Add listener for theme changes
    static addThemeChangeListener(listener: (variant: ThemeVariant) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Remove all listeners (for cleanup)
    static removeAllListeners() {
        this.listeners = [];
    }

    static getCustomColors(colorScheme: ColorSchemeName, variant: ThemeVariant = this.currentVariant): ThemeColors {
        const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
        const isDark = colorScheme === 'dark';

        let colors: ThemeColors;

        switch (variant) {
            case 'rose':
                colors = this.getRoseColors(baseTheme, isDark);
                break;
            case 'minimal':
                colors = this.getMinimalColors(baseTheme, isDark);
                break;
            case 'dark-modern':
                colors = this.getDarkModernColors(baseTheme, isDark);
                break;
            default:
                colors = this.getClassicColors(baseTheme, isDark);
                break;
        }

        // Add legacy compatibility properties
        return {
            ...colors,
            level1: colors.background,
            level2: colors.surface,
            level3: colors.cardBackground,
        };
    }

    /**
     * ROSE THEME - Vibrant, poppy, and colorful
     * UPDATED: Better background differentiation in light mode
     */
    private static getRoseColors(baseTheme: MD3Theme, isDark: boolean): ThemeColors {
        if (isDark) {
            // Rose Dark Theme - Still vibrant but dark (unchanged)
            return {
                ...baseTheme.colors,
                primary: '#ff3366',           // Bright pink/red
                secondary: '#ff6b35',         // Vibrant orange
                color: '#ffffff',            // Pure white text
                background: '#0a0a0a',       // Deep black
                surface: '#1a1a1a',          // Dark cards
                onSurface: '#ffffff',        // White text on cards
                onBackground: '#ffffff',     // White text on background
                foreground: '#111111',       // Card backgrounds
                titleBackground: '#0a0a0a',   // Header background
                footerBackground: '#0a0a0a',  // Footer background
                footerForeground: '#888888', // Footer text
                text: '#ffffff',             // Pure white text
                accent: '#ff3366',           // Bright accent

                // Theme-specific
                instagramBlue: '#00d4ff',    // Bright cyan
                subtleGray: '#888888',       // Mid gray
                lightGray: '#2a2a2a',        // Dark backgrounds
                borderColor: '#333333',      // Subtle borders
                completedGreen: '#00ff88',   // Neon green
                shadowColor: 'rgba(255, 51, 102, 0.3)',
                cardBackground: '#111111',    // Card background
                primaryColor: '#ff3366',     // For backward compatibility

                // Status colors - all vibrant
                warning: '#ffaa00',
                success: '#00ff88',
                error: '#ff3366',
                info: '#00d4ff',
            };
        }

        // Rose Light Theme - UPDATED: More vibrant and differentiated backgrounds
        return {
            ...baseTheme.colors,
            primary: '#e91e63',           // Instagram pink
            secondary: '#ff5722',         // Bright orange
            color: '#1a1a1a',            // Slightly softer than pure black
            background: '#fdf6f9',       // Very light pink background - CHANGED
            surface: '#fff8fb',          // Light pink surface - CHANGED
            onSurface: '#1a1a1a',        // Dark text on cards
            onBackground: '#1a1a1a',     // Dark text on background
            foreground: '#fff0f5',       // Pinkish card backgrounds - CHANGED
            titleBackground: '#fff8fb',   // Header background - CHANGED
            footerBackground: '#fff8fb',  // Footer background - CHANGED
            footerForeground: '#8e4a6b', // Pink-tinted footer text - CHANGED
            text: '#1a1a1a',             // Dark text
            accent: '#e91e63',           // Pink accent

            // Theme-specific - more vibrant differentiation
            instagramBlue: '#2196f3',    // Bright blue
            subtleGray: '#8e4a6b',       // Pink-tinted gray - CHANGED
            lightGray: '#f8e8f0',        // Light pink backgrounds - CHANGED
            borderColor: '#f0d1e0',      // Pink-tinted borders - CHANGED
            completedGreen: '#4caf50',   // Bright green
            shadowColor: 'rgba(233, 30, 99, 0.2)',
            cardBackground: '#ffffff',    // Card background
            primaryColor: '#e91e63',     // For backward compatibility

            // Status colors - all vibrant
            warning: '#ff9800',
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3',
        };
    }

    /**
     * MINIMAL THEME - Nearly total grayscale
     * UPDATED: Better contrast in light mode while staying minimal
     */
    private static getMinimalColors(baseTheme: MD3Theme, isDark: boolean): ThemeColors {
        if (isDark) {
            // Minimal Dark - Pure grayscale (unchanged)
            return {
                ...baseTheme.colors,
                primary: '#f5f5f5',           // Light gray primary
                secondary: '#e0e0e0',         // Lighter gray
                color: '#ffffff',            // Pure white text
                background: '#121212',       // Very dark background
                surface: '#1e1e1e',          // Dark cards
                onSurface: '#ffffff',        // White text on cards
                onBackground: '#ffffff',     // White text on background
                foreground: '#1a1a1a',       // Card backgrounds
                titleBackground: '#121212',   // Header background
                footerBackground: '#121212',  // Footer background
                footerForeground: '#9e9e9e', // Gray footer text
                text: '#ffffff',             // Pure white text
                accent: '#f5f5f5',           // Light gray accent

                // Theme-specific - all grayscale
                instagramBlue: '#bdbdbd',    // Mid gray
                subtleGray: '#9e9e9e',       // Mid gray
                lightGray: '#2a2a2a',        // Dark gray backgrounds
                borderColor: '#424242',      // Subtle borders
                completedGreen: '#e0e0e0',   // Light gray for completion
                shadowColor: 'rgba(245, 245, 245, 0.1)',
                cardBackground: '#1a1a1a',    // Card background
                primaryColor: '#f5f5f5',     // For backward compatibility

                // Status colors - all grayscale
                warning: '#bdbdbd',
                success: '#e0e0e0',
                error: '#9e9e9e',
                info: '#bdbdbd',
            };
        }

        // Minimal Light - UPDATED: Better grayscale differentiation
        return {
            ...baseTheme.colors,
            primary: '#424242',           // Dark gray primary
            secondary: '#616161',         // Mid gray
            color: '#1a1a1a',            // Very dark text
            background: '#f8f8f8',       // Slightly warmer gray background - CHANGED
            surface: '#ffffff',          // Pure white cards
            onSurface: '#1a1a1a',        // Dark text on cards
            onBackground: '#1a1a1a',     // Dark text on background
            foreground: '#ffffff',       // White card backgrounds
            titleBackground: '#fdfdfd',   // Very light gray header - CHANGED
            footerBackground: '#fdfdfd',  // Very light gray footer - CHANGED
            footerForeground: '#666666', // Darker gray footer text - CHANGED
            text: '#1a1a1a',             // Very dark text
            accent: '#424242',           // Dark gray accent

            // Theme-specific - better grayscale hierarchy
            instagramBlue: '#757575',    // Mid gray
            subtleGray: '#888888',       // Slightly darker gray - CHANGED
            lightGray: '#f0f0f0',        // Light gray backgrounds - CHANGED
            borderColor: '#e8e8e8',      // Lighter borders - CHANGED
            completedGreen: '#616161',   // Dark gray for completion
            shadowColor: 'rgba(66, 66, 66, 0.1)',
            cardBackground: '#ffffff',    // Card background
            primaryColor: '#424242',     // For backward compatibility

            // Status colors - all grayscale
            warning: '#757575',
            success: '#616161',
            error: '#9e9e9e',
            info: '#757575',
        };
    }

    /**
     * DARK MODERN THEME - Matt violet tone
     * UPDATED: Better violet differentiation in light mode
     */
    private static getDarkModernColors(baseTheme: MD3Theme, isDark: boolean): ThemeColors {
        if (isDark) {
            // Dark Modern - Matt violet theme (unchanged)
            return {
                ...baseTheme.colors,
                primary: '#8b7cb0',           // Matt violet
                secondary: '#a594c7',         // Lighter violet
                color: '#e8e6f0',            // Light violet-tinted text
                background: '#1a1820',       // Very dark violet background
                surface: '#2a2835',          // Dark violet cards
                onSurface: '#e8e6f0',        // Light text on cards
                onBackground: '#e8e6f0',     // Light text on background
                foreground: '#201e2a',       // Card backgrounds
                titleBackground: '#1a1820',   // Header background
                footerBackground: '#1a1820',  // Footer background
                footerForeground: '#a59cb8', // Violet-tinted footer text
                text: '#e8e6f0',             // Light violet-tinted text
                accent: '#8b7cb0',           // Matt violet accent

                // Theme-specific - violet tones
                instagramBlue: '#7a6fa3',    // Darker violet
                subtleGray: '#a59cb8',       // Violet-tinted gray
                lightGray: '#3a3545',        // Dark violet backgrounds
                borderColor: '#3a3545',      // Violet borders
                completedGreen: '#9bb88a',   // Muted green with violet undertone
                shadowColor: 'rgba(139, 124, 176, 0.4)',
                cardBackground: '#232030',    // Card background
                primaryColor: '#8b7cb0',     // For backward compatibility

                // Status colors - muted with violet undertones
                warning: '#d4b570',
                success: '#9bb88a',
                error: '#c9828a',
                info: '#7a9cc9',
            };
        }

        // Dark Modern Light - Still with violet undertones but lighter
        return {
            ...baseTheme.colors,
            primary: '#6b5b95',           // Deep violet
            secondary: '#8b7cb0',         // Matt violet
            color: '#2c2a35',            // Dark violet-tinted text
            background: '#f8f7fa',       // Very light violet background
            surface: '#ffffff',          // Pure white cards
            onSurface: '#2c2a35',        // Dark text on cards
            onBackground: '#2c2a35',     // Dark text on background
            foreground: '#ffffff',       // White card backgrounds
            titleBackground: '#ffffff',   // Header background
            footerBackground: '#ffffff',  // Footer background
            footerForeground: '#6b6575', // Violet-tinted footer text
            text: '#2c2a35',             // Dark violet-tinted text
            accent: '#6b5b95',           // Deep violet accent

            // Theme-specific - subtle violet tones
            instagramBlue: '#5a4a7a',    // Deep violet-blue
            subtleGray: '#8a8293',       // Violet-tinted gray
            lightGray: '#f0eff2',        // Very light violet backgrounds
            borderColor: '#e5e3ea',      // Light violet borders
            completedGreen: '#7a9668',   // Muted green
            shadowColor: 'rgba(107, 91, 149, 0.2)',
            cardBackground: '#ffffff',    // Card background
            primaryColor: '#6b5b95',     // For backward compatibility

            // Status colors - muted
            warning: '#b8935a',
            success: '#7a9668',
            error: '#a5616a',
            info: '#5a7da5',
        };
    }

    /**
     * CLASSIC THEME - Gentle with tender grays and oranges
     */
    private static getClassicColors(baseTheme: MD3Theme, isDark: boolean): ThemeColors {
        if (isDark) {
            // Classic Dark - Gentle warm theme
            return {
                ...baseTheme.colors,
                primary: '#8aade6',           // Gentle blue (as requested)
                secondary: '#e6b08a',         // Tender peach/orange
                color: '#f0f0f0',            // Soft white text
                background: '#2a2a2e',       // Gentle dark background
                surface: '#36363a',          // Soft dark cards
                onSurface: '#f0f0f0',        // Soft text on cards
                onBackground: '#f0f0f0',     // Soft text on background
                foreground: '#323236',       // Card backgrounds
                titleBackground: '#2a2a2e',   // Header background
                footerBackground: '#2a2a2e',  // Footer background
                footerForeground: '#b8b8ba', // Tender gray footer text
                text: '#f0f0f0',             // Soft white text
                accent: '#8aade6',           // Gentle blue accent

                // Theme-specific - tender tones
                instagramBlue: '#7ca3d9',    // Softer blue
                subtleGray: '#b8b8ba',       // Tender gray
                lightGray: '#42424a',        // Gentle dark backgrounds
                borderColor: '#42424a',      // Soft borders
                completedGreen: '#a6c98a',   // Tender green
                shadowColor: 'rgba(138, 173, 230, 0.3)',
                cardBackground: '#323236',    // Card background
                primaryColor: '#8aade6',     // For backward compatibility

                // Status colors - all tender
                warning: '#e6c08a',
                success: '#a6c98a',
                error: '#e6a68a',
                info: '#8aade6',
            };
        }

        // Classic Light - Gentle and tender
        return {
            ...baseTheme.colors,
            primary: '#8aade6',           // Gentle blue (as requested)
            secondary: '#e6b08a',         // Tender peach/orange
            color: '#4a4a4e',            // Soft dark text
            background: '#fafafa',       // Very soft background
            surface: '#ffffff',          // Pure white cards
            onSurface: '#4a4a4e',        // Soft text on cards
            onBackground: '#4a4a4e',     // Soft text on background
            foreground: '#ffffff',       // White card backgrounds
            titleBackground: '#ffffff',   // Header background
            footerBackground: '#ffffff',  // Footer background
            footerForeground: '#8a8a8e', // Tender gray footer text
            text: '#4a4a4e',             // Soft dark text
            accent: '#8aade6',           // Gentle blue accent

            // Theme-specific - tender tones
            instagramBlue: '#7ca3d9',    // Softer blue
            subtleGray: '#a8a8ac',       // Tender gray
            lightGray: '#f5f5f5',        // Very soft backgrounds
            borderColor: '#e8e8ea',      // Very soft borders
            completedGreen: '#9ec280',   // Tender green
            shadowColor: 'rgba(138, 173, 230, 0.2)',
            cardBackground: '#ffffff',    // Card background
            primaryColor: '#8aade6',     // For backward compatibility

            // Status colors - all tender
            warning: '#deb370',
            success: '#9ec280',
            error: '#de9970',
            info: '#8aade6',
        };
    }

    static getStyles(customColors: ThemeColors, variant: ThemeVariant = this.currentVariant) {
        // Get base styles for the variant
        const baseStyles = this.getBaseStyles(customColors);

        switch (variant) {
            case 'rose':
                return this.getInstagramStyles(baseStyles, customColors);
            case 'minimal':
                return this.getMinimalStyles(baseStyles, customColors);
            case 'dark-modern':
                return this.getDarkModernStyles(baseStyles, customColors);
            default:
                return this.getClassicStyles(baseStyles, customColors);
        }
    }

    // Base styles that all themes share - with ALL missing styles added
    private static getBaseStyles(colors: ThemeColors) {
        return StyleSheet.create({
            // Container styles
            container: {
                flex: 1,
                backgroundColor: colors.background,
            },

            // App bar styles
            appbar: {
                backgroundColor: colors.titleBackground,
                borderBottomColor: colors.borderColor,
                borderBottomWidth: 0.5,
                elevation: 0,
                shadowOpacity: 0,
            },

            // Card styles
            card: {
                backgroundColor: colors.cardBackground,
                marginBottom: 8,
                borderRadius: 0,
                elevation: 0,
                shadowOpacity: 0,
                borderTopWidth: 0.5,
                borderBottomWidth: 0.5,
                borderColor: colors.borderColor,
            },

            cardTitle: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 4,
            },

            cardSubtitle: {
                fontSize: 13,
                color: colors.subtleGray,
                marginBottom: 16,
            },

            // List item styles
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
                color: colors.text,
                marginBottom: 2,
            },

            itemSubtitle: {
                fontSize: 13,
                color: colors.subtleGray,
            },

            // Progress styles
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
                color: colors.text,
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
                backgroundColor: colors.primary,
                borderRadius: 1.5,
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
                color: colors.text,
                marginBottom: 4,
            },

            sectionSubtitle: {
                fontSize: 13,
                color: colors.subtleGray,
            },

            // Settings-specific styles (MISSING STYLES ADDED)
            settingsSection: {
                backgroundColor: colors.cardBackground,
                marginBottom: 8,
                borderTopWidth: 0.5,
                borderBottomWidth: 0.5,
                borderColor: colors.borderColor,
            },

            settingsSectionTitle: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
            },

            settingsItem: {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.borderColor,
            },

            settingsItemLast: {
                borderBottomWidth: 0,
            },

            settingsItemIcon: {
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.lightGray,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center',
            },

            settingsItemContent: {
                flex: 1,
            },

            settingsItemTitle: {
                fontSize: 16,
                fontWeight: '500',
                color: colors.text,
                marginBottom: 2,
            },

            settingsItemDescription: {
                fontSize: 13,
                color: colors.subtleGray,
                lineHeight: 16,
            },

            settingsItemRight: {
                marginLeft: 12,
            },

            // Quick status card (MISSING STYLE ADDED)
            quickStatusCard: {
                backgroundColor: colors.cardBackground,
                padding: 16,
                borderTopWidth: 0.5,
                borderBottomWidth: 0.5,
                borderColor: colors.borderColor,
                marginBottom: 8,
            },

            quickStatusRow: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            },

            quickStatusItem: {
                alignItems: 'center',
                flex: 1,
            },

            quickStatusValue: {
                fontSize: 24,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 4,
            },

            quickStatusLabel: {
                fontSize: 12,
                color: colors.subtleGray,
                textAlign: 'center',
            },

            quickStatusDivider: {
                width: 1,
                height: 40,
                backgroundColor: colors.borderColor,
                marginHorizontal: 16,
            },

            // Text styles
            text: {
                color: colors.text,
            },

            surface: {
                backgroundColor: colors.surface,
            },

            // Button styles
            primaryButton: {
                backgroundColor: colors.primary,
                borderRadius: 8,
            },

            primaryButtonText: {
                color: '#ffffff',
                fontWeight: '600',
            },

            // Status indicators
            statusIndicator: {
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
            },

            statusText: {
                fontSize: 12,
                fontWeight: '500',
                color: 'white',
            },

            // Form styles (MISSING STYLES ADDED)
            formInput: {
                backgroundColor: colors.surface,
                marginBottom: 16,
            },

            formButton: {
                backgroundColor: colors.accent,
                marginTop: 8,
            },

            formButtonText: {
                color: '#ffffff',
                fontWeight: '600',
            },

            // Dialog styles (MISSING STYLES ADDED)
            dialogSurface: {
                backgroundColor: colors.surface,
                borderRadius: 8,
            },

            dialogTitle: {
                color: colors.text,
                fontSize: 18,
                fontWeight: '600',
            },

            dialogContent: {
                color: colors.text,
                fontSize: 16,
                lineHeight: 22,
            },

            // Additional missing styles
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
                backgroundColor: colors.primary,
                borderColor: colors.primary,
            },

            checkboxIcon: {
                color: '#ffffff',
                fontSize: 12,
            },

            // Goal projections (MISSING STYLES ADDED)
            goalProjections: {
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
            },

            projectionItem: {
                flex: 1,
                alignItems: 'center',
            },

            projectionValue: {
                fontSize: 18,
                fontWeight: '600',
                color: colors.primary,
                marginBottom: 2,
            },

            projectionLabel: {
                fontSize: 12,
                color: colors.subtleGray,
            },

            projectionDivider: {
                width: 1,
                height: 24,
                backgroundColor: colors.borderColor,
                marginHorizontal: 16,
            },

            // Goal badge (MISSING STYLE ADDED)
            goalBadge: {
                minWidth: 40,
                height: 40,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 12,
            },

            goalBadgeText: {
                fontSize: 16,
                fontWeight: '600',
            },

            // Action text (MISSING STYLE ADDED)
            actionText: {
                fontSize: 16,
                fontWeight: '500',
            },

            // Item action (MISSING STYLE ADDED)
            itemAction: {
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 8,
            },

            // Retry button (MISSING STYLE ADDED)
            retryButton: {
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
            },

            retryButtonText: {
                fontSize: 16,
                fontWeight: '600',
            },

            // Chip style (MISSING STYLE ADDED)
            chip: {
                backgroundColor: colors.lightGray,
                borderRadius: 16,
            },

            chipText: {
                color: colors.text,
                fontSize: 12,
                fontWeight: '500',
            },
        });
    }

    // Theme-specific style overrides (same as before but with fallbacks)
    private static getInstagramStyles(baseStyles: any, colors: ThemeColors) {
        return StyleSheet.create({
            ...baseStyles,
            card: {
                ...baseStyles.card,
                borderRadius: 0,
                backgroundColor: colors.cardBackground,
                marginBottom: 8,
            },
        });
    }

    private static getMinimalStyles(baseStyles: any, colors: ThemeColors) {
        return StyleSheet.create({
            ...baseStyles,
            card: {
                ...baseStyles.card,
                borderRadius: 0,
                borderWidth: 1,
                borderColor: colors.borderColor,
                backgroundColor: colors.cardBackground,
                elevation: 0,
                shadowOpacity: 0,
            },
        });
    }

    private static getDarkModernStyles(baseStyles: any, colors: ThemeColors) {
        return StyleSheet.create({
            ...baseStyles,
            card: {
                ...baseStyles.card,
                borderRadius: 16,
                backgroundColor: colors.cardBackground,
                elevation: 8,
                shadowOpacity: 0.3,
                shadowColor: colors.shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                borderWidth: 0,
                marginBottom: 16,
            },
        });
    }

    private static getClassicStyles(baseStyles: any, colors: ThemeColors) {
        return StyleSheet.create({
            ...baseStyles,
            card: {
                ...baseStyles.card,
                borderRadius: 12,
                backgroundColor: colors.cardBackground,
                elevation: 2,
                shadowOpacity: 0.1,
                shadowColor: colors.shadowColor,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                borderWidth: 0,
                marginBottom: 16,
                marginHorizontal: 8,
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
    static getAvailableThemes(): { key: ThemeVariant; name: string; description: string; preview: { primary: string; background: string } }[] {
        return [
            {
                key: 'default',
                name: 'Classic',
                description: 'Gentle theme with tender grays and soft blues',
                preview: { primary: '#8aade6', background: '#fafafa' }
            },
            {
                key: 'rose',
                name: 'Rose',
                description: 'Vibrant, poppy, and colorful design',
                preview: { primary: '#e91e63', background: '#ffffff' }
            },
            {
                key: 'minimal',
                name: 'Minimal',
                description: 'Nearly total grayscale, ultra-clean design',
                preview: { primary: '#424242', background: '#fafafa' }
            },
            {
                key: 'dark-modern',
                name: 'Dark Modern',
                description: 'Matt violet tone with sophisticated dark aesthetics',
                preview: { primary: '#8b7cb0', background: '#1a1820' }
            }
        ];
    }

    // Helper method to get theme preview colors
    static getThemePreview(variant: ThemeVariant, isDark: boolean = false): { primary: string; background: string; surface: string } {
        const colors = this.getCustomColors(isDark ? 'dark' : 'light', variant);
        return {
            primary: colors.primary,
            background: colors.background,
            surface: colors.surface
        };
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
