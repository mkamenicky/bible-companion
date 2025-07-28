// React imports
import React from 'react';
import {ScrollView, useColorScheme, View} from 'react-native';

// Third-party library imports
import {ActivityIndicator, Appbar, Card, Divider, List, Switch, Text} from 'react-native-paper';

// Service and utility imports
import {useSettingsData} from '@/hooks';
import {ThemeService} from '@/services';
import {ThemeSelector} from '@/components/theme/ThemeSelector';
import {ThemeVariant} from '@/services/(services)/theme/ThemeService';

export default function SettingsScreen() {
    const {
        settings,
        loading,
        updateSetting,
        resetSettings,
        exportSettings,
    } = useSettingsData();

    const colorScheme = useColorScheme();
    const customColors = ThemeService.getCustomColors(colorScheme);
    const styles = ThemeService.getStyles(customColors);

    const handleThemeChange = async (newTheme: ThemeVariant) => {
        console.log("Theme changed: " + newTheme);
    };

    if (loading) {
        return (
            <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color={customColors.accent}/>
                <Text style={{marginTop: 16, color: customColors.text}}>Loading settings...</Text>
            </View>
        );
    }

    if (!settings) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbar}>
                <Appbar.Content title="Settings"/>
            </Appbar.Header>

            <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 16}}>
                <Card style={styles.card}>
                    <Card.Title title="Notifications" titleStyle={{color: customColors.text}}/>
                    <Card.Content>
                        <List.Item
                            title="Enable Notifications"
                            titleStyle={{color: customColors.text}}
                            right={() => (
                                <Switch
                                    value={settings.notifications}
                                    onValueChange={(value) => updateSetting('notifications', value)}
                                    color={customColors.accent}
                                />
                            )}
                        />
                        <Divider/>
                        <List.Item
                            title="Daily Reminder"
                            titleStyle={{color: customColors.text}}
                            right={() => (
                                <Switch
                                    value={settings.dailyReminder}
                                    onValueChange={(value) => updateSetting('dailyReminder', value)}
                                    color={customColors.accent}
                                />
                            )}
                        />
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title title="Appearance" titleStyle={{color: customColors.text}}/>
                    <Card.Content>
                        <ThemeSelector onThemeChange={handleThemeChange}/>
                        <Divider style={{marginVertical: 12}}/>
                        <List.Item
                            title="Font Size"
                            description={`Current: ${settings.fontSize}`}
                            titleStyle={{color: customColors.text}}
                            descriptionStyle={{color: customColors.subtleGray}}
                            onPress={() => {
                                // TODO: Implement font size picker modal
                            }}
                        />
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title title="Data & Storage" titleStyle={{color: customColors.text}}/>
                    <Card.Content>
                        <List.Item
                            title="Offline Mode"
                            titleStyle={{color: customColors.text}}
                            right={() => (
                                <Switch
                                    value={settings.offlineMode}
                                    onValueChange={(value) => updateSetting('offlineMode', value)}
                                    color={customColors.accent}
                                />
                            )}
                        />
                        <Divider/>
                        <List.Item
                            title="Export Settings"
                            titleStyle={{color: customColors.text}}
                            onPress={exportSettings}
                        />
                        <Divider/>
                        <List.Item
                            title="Reset Settings"
                            titleStyle={{color: customColors.text}}
                            onPress={resetSettings}
                        />
                    </Card.Content>
                </Card>
            </ScrollView>
        </View>
    );
}
