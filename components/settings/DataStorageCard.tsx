// DataStorageCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface DataStorageCardProps {
    settings: any;
    onOfflineModeToggle: (value: boolean) => void;
    onExportSettings: () => void;
    onResetSettings: () => void;
    styles: any;
    customColors: any;
}

export default function DataStorageCard({
                                            settings,
                                            onOfflineModeToggle,
                                            onExportSettings,
                                            onResetSettings,
                                            styles,
                                            customColors,
                                        }: DataStorageCardProps) {
    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Data & Storage</Text>
                <Text style={styles.sectionSubtitle}>Manage your app data and preferences</Text>
            </View>

            {/* Offline mode toggle */}
            <TouchableOpacity
                style={styles.listItem}
                onPress={() => onOfflineModeToggle(!settings.offlineMode)}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: settings.offlineMode ? '#e8f5e8' : '#fff3e0' }
                ]}>
                    <Text style={{ fontSize: 18 }}>
                        {settings.offlineMode ? '📱' : '🌐'}
                    </Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>Offline Mode</Text>
                    <Text style={styles.itemSubtitle}>
                        {settings.offlineMode
                            ? 'Content downloaded for offline reading'
                            : 'Download content for offline reading'}
                    </Text>
                </View>

                <View style={[
                    styles.checkbox,
                    settings.offlineMode && styles.checkboxChecked
                ]}>
                    {settings.offlineMode && (
                        <Text style={styles.checkboxIcon}>✓</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Export settings */}
            <TouchableOpacity
                style={styles.listItem}
                onPress={onExportSettings}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: '#e3f2fd' }
                ]}>
                    <Text style={{ fontSize: 18 }}>📤</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>Export Settings</Text>
                    <Text style={styles.itemSubtitle}>
                        Save your preferences as a backup file
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                        Export
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Reset settings */}
            <TouchableOpacity
                style={[styles.listItem, styles.listItemLast]}
                onPress={onResetSettings}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: '#ffebee' }
                ]}>
                    <Text style={{ fontSize: 18 }}>🔄</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, { color: customColors.error || '#ef4444' }]}>
                        Reset All Settings
                    </Text>
                    <Text style={styles.itemSubtitle}>
                        Restore everything to default values
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[styles.actionText, { color: customColors.error || '#ef4444' }]}>
                        Reset
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Storage info */}
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Storage Status</Text>
                    <Text style={styles.progressValue}>
                        {settings.offlineMode ? 'Offline Ready' : 'Online Only'}
                    </Text>
                </View>
            </View>

            {/* Warning message for reset */}
            <View style={{
                padding: 16,
                alignItems: 'center',
                borderTopWidth: 0.5,
                borderTopColor: customColors?.borderColor || '#dbdbdb',
            }}>
                <Text style={{
                    fontSize: 13,
                    color: customColors?.subtleGray || '#8e8e8e',
                    textAlign: 'center',
                    lineHeight: 18
                }}>
                    ⚠️ Resetting settings will restore all preferences to their default values and cannot be undone.
                </Text>
            </View>
        </View>
    );
}
