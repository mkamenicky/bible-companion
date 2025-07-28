import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card, RadioButton } from 'react-native-paper';
import { ThemeService } from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ThemeVariant} from "@/services/(services)/theme/ThemeService";

interface ThemeSelectorProps {
    onThemeChange?: (theme: ThemeVariant) => void;
}

export function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
    const [selectedTheme, setSelectedTheme] = useState<ThemeVariant>(
        ThemeService.getCurrentVariant()
    );

    const themes = ThemeService.getAvailableThemes();
    const styles = ThemeService.useThemedStyles();
    const colorScheme = 'light'; // You can get this from useColorScheme()
    const colors = ThemeService.getCustomColors(colorScheme, selectedTheme);

    const handleThemeSelect = async (theme: ThemeVariant) => {
        setSelectedTheme(theme);
        ThemeService.setThemeVariant(theme);

        // Persist theme selection
        await AsyncStorage.setItem('selectedTheme', theme);

        // Notify parent component
        onThemeChange?.(theme);
    };

    return (
        <Card style={styles.card}>
            <View style={{ padding: 16 }}>
                <Text style={[styles.cardTitle, { textAlign: 'left' }]}>
                    Choose Theme
                </Text>
                <Text style={[styles.text, { fontSize: 14, color: colors.subtleGray, marginBottom: 16 }]}>
                    Select your preferred app appearance
                </Text>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {themes.map((theme) => (
                        <TouchableOpacity
                            key={theme.key}
                            style={[
                                styles.listItem,
                                {
                                    backgroundColor: selectedTheme === theme.key ? colors.lightGray : 'transparent',
                                    borderRadius: 8,
                                    marginBottom: 8,
                                }
                            ]}
                            onPress={() => handleThemeSelect(theme.key)}
                        >
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>{theme.name}</Text>
                                <Text style={[styles.itemSubtitle, { color: colors.subtleGray }]}>
                                    {theme.description}
                                </Text>
                            </View>
                            <RadioButton
                                value={theme.key}
                                status={selectedTheme === theme.key ? 'checked' : 'unchecked'}
                                onPress={() => handleThemeSelect(theme.key)}
                                color={colors.instagramBlue}
                            />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Theme Preview */}
                <View style={{ marginTop: 16, padding: 12, backgroundColor: colors.lightGray, borderRadius: 8 }}>
                    <Text style={[styles.text, { fontSize: 12, color: colors.subtleGray, marginBottom: 8 }]}>
                        Preview
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.itemIcon, { marginRight: 12 }]}>
                            <Text>📖</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemTitle}>Sample Task</Text>
                            <Text style={[styles.itemSubtitle, { color: colors.subtleGray }]}>
                                This is how tasks will look
                            </Text>
                        </View>
                        <View style={[styles.checkbox, styles.checkboxChecked]}>
                            <Text style={styles.checkboxIcon}>✓</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Card>
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
                console.log('Failed to load theme preference:', error);
            }
        };

        loadTheme();
    }, []);
}
