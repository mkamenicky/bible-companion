// React imports
import React from 'react';
import { useColorScheme, View, ScrollView } from 'react-native';

// Third-party library imports
import {
    Appbar,
    Card,
    List,
    Switch,
    ActivityIndicator,
    useTheme,
    Divider
} from 'react-native-paper';

// Service and utility imports
import { useSettingsData } from '@/hooks';
import { ThemeService } from '@/services';
import {ThemeSelector} from "@/components/theme/ThemeSelector";
import {ThemeVariant} from "@/services/(services)/theme/ThemeService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
    // Custom hook for data management
    const {
        settings,
        loading,
        updateSetting,
        resetSettings,
        exportSettings,
        importSettings,
    } = useSettingsData();

    // Theme and styling
    const { colors } = useTheme();
    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors, colorScheme);

    const handleThemeChange = async (newTheme: ThemeVariant) => {
        await AsyncStorage.setItem('selectedTheme', newTheme)
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!settings) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Settings" />
            </Appbar.Header>

            <ScrollView style={{ flex: 1 }}>
                <Card style={styles.card}>
                    <Card.Title title="Notifications" />
                    <Card.Content>
                        <List.Item
                            title="Enable Notifications"
                            right={() => (
                                <Switch
                                    value={settings.notifications}
                                    onValueChange={(value) => updateSetting('notifications', value)}
                                />
                            )}
                        />
                        <Divider />
                        <List.Item
                            title="Daily Reminder"
                            right={() => (
                                <Switch
                                    value={settings.dailyReminder}
                                    onValueChange={(value) => updateSetting('dailyReminder', value)}
                                />
                            )}
                        />
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title title="Appearance" />
                    <Card.Content>
                        <ThemeSelector onThemeChange={handleThemeChange} />
                        <Divider />
                        <List.Item
                            title="Font Size"
                            description={`Current: ${settings.fontSize}`}
                            onPress={() => {
                                // TODO: Implement font size picker modal
                            }}
                        />
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title title="Data & Storage" />
                    <Card.Content>
                        <List.Item
                            title="Offline Mode"
                            right={() => (
                                <Switch
                                    value={settings.offlineMode}
                                    onValueChange={(value) => updateSetting('offlineMode', value)}
                                />
                            )}
                        />
                        <Divider />
                        <List.Item
                            title="Export Settings"
                            onPress={exportSettings}
                        />
                        <Divider />
                        <List.Item
                            title="Reset Settings"
                            onPress={resetSettings}
                        />
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    );
}
