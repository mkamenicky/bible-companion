import React, {useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View, useColorScheme} from 'react-native';
import {RadioButton} from 'react-native-paper';
import {ThemeService} from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ThemeVariant} from "@/services/(services)/theme/ThemeService";

interface ThemeSelectorProps {
    onThemeChange?: (theme: ThemeVariant) => void;
}

export function ThemeSelector({onThemeChange}: ThemeSelectorProps) {
    const [selectedTheme, setSelectedTheme] = useState<ThemeVariant>(
        ThemeService.getCurrentVariant()
    );

    const themes = ThemeService.getAvailableThemes();
    const styles = ThemeService.useThemedStyles();
    const colorScheme = useColorScheme(); // Use actual color scheme
    const colors = ThemeService.getCustomColors(colorScheme, selectedTheme);

    const handleThemeSelect = async (theme: ThemeVariant) => {
        setSelectedTheme(theme);
        ThemeService.setThemeVariant(theme);

        // Persist theme selection
        await AsyncStorage.setItem('selectedTheme', theme);

        // Notify parent component
        onThemeChange?.(theme);
    };

    // Get proper selection background color based on the theme
    const getSelectionBackgroundColor = (isSelected: boolean) => {
        if (!isSelected) return 'transparent';

        // Use surface color for selection to ensure proper contrast
        // In dark mode, surface is darker than lightGray
        // In light mode, surface provides good contrast
        return colors.surface === colors.background ? colors.lightGray : colors.surface;
    };

    // Get proper border color for selected items
    const getSelectionBorderColor = (isSelected: boolean) => {
        return isSelected ? colors.primary : colors.borderColor;
    };

    return (
        <View>
            <Text style={[styles.cardTitle, {textAlign: 'left'}]}>
                Choose Theme
            </Text>
            <Text style={[styles.text, {fontSize: 14, color: colors.subtleGray, marginBottom: 16}]}>
                Select your preferred app appearance
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
                {themes.map((theme) => {
                    const isSelected = selectedTheme === theme.key;

                    return (
                        <TouchableOpacity
                            key={theme.key}
                            style={[
                                styles.listItem,
                                {
                                    backgroundColor: getSelectionBackgroundColor(isSelected),
                                    borderWidth: 1,
                                    borderColor: getSelectionBorderColor(isSelected),
                                    borderRadius: 8,
                                    marginBottom: 8,
                                    // Add subtle elevation for selected items in dark mode
                                    ...(isSelected && colorScheme === 'dark' && {
                                        elevation: 2,
                                        shadowColor: colors.primary,
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 2,
                                    })
                                }
                            ]}
                            onPress={() => handleThemeSelect(theme.key)}
                        >
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>{theme.name}</Text>
                                <Text style={[styles.itemSubtitle, {color: colors.subtleGray}]}>
                                    {theme.description}
                                </Text>
                            </View>
                            <RadioButton
                                value={theme.key}
                                status={selectedTheme === theme.key ? 'checked' : 'unchecked'}
                                onPress={() => handleThemeSelect(theme.key)}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Theme Preview */}
            <View style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: colors.surface, // Use surface instead of lightGray
                borderWidth: 1,
                borderColor: colors.borderColor,
                borderRadius: 8
            }}>
                <Text style={[styles.text, {fontSize: 12, color: colors.subtleGray, marginBottom: 8}]}>
                    Preview
                </Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.itemIcon, {marginRight: 12}]}>
                        <Text>📖</Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.itemTitle}>Sample Task</Text>
                        <Text style={[styles.itemSubtitle, {color: colors.subtleGray}]}>
                            This is how tasks will look
                        </Text>
                    </View>
                    <View style={[styles.checkbox, styles.checkboxChecked]}>
                        <Text style={styles.checkboxIcon}>✓</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

// Hook to load theme from storage on app start
export function useThemeInitializer() {
    React.useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('selectedTheme') as ThemeVariant;
                if (savedTheme) {
                    ThemeService.setThemeVariant(savedTheme);
                }
            } catch (error) {
                console.error('Failed to load theme preference:', error);
            }
        };

        loadTheme();
    }, []);
}
