// DataStorageCard.tsx (Fixed - Two Separate Cards)
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/hooks';

interface DataStorageCardProps {
    settings: any;
    onOfflineModeToggle: (value: boolean) => void;
    onExportSettings: () => void;
    onResetSettings: () => void;
    onDatabaseBackup: () => void;
    onDatabaseRestore: () => void;
    styles: any;
    customColors: any;
}

export default function DataStorageCard({
                                            settings,
                                            onOfflineModeToggle,
                                            onExportSettings,
                                            onResetSettings,
                                            onDatabaseBackup,
                                            onDatabaseRestore,
                                            styles,
                                            customColors,
                                        }: DataStorageCardProps) {
    const t = useTranslation();

    return (
        <>
            {/* Database Backup & Restore Card */}
            <View style={styles.card}>
                {/* Section header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('settings.backup.title')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('settings.backup.subtitle')}</Text>
                </View>

                {/* Database backup */}
                <TouchableOpacity
                    style={styles.listItem}
                    onPress={onDatabaseBackup}
                >
                    <View style={[
                        styles.itemIcon,
                        { backgroundColor: '#e3f2fd' }
                    ]}>
                        <Text style={{ fontSize: 18 }}>💾</Text>
                    </View>

                    <View style={styles.itemContent}>
                        <Text style={styles.itemTitle}>{t('settings.databaseBackup')}</Text>
                        <Text style={styles.itemSubtitle}>
                            {t('settings.databaseBackupSubtitle')}
                        </Text>
                    </View>

                    <View style={styles.itemAction}>
                        <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                            {t('settings.backup.export')}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Database restore */}
                <TouchableOpacity
                    style={[styles.listItem, styles.listItemLast]}
                    onPress={onDatabaseRestore}
                >
                    <View style={[
                        styles.itemIcon,
                        { backgroundColor: '#fff3e0' }
                    ]}>
                        <Text style={{ fontSize: 18 }}>📥</Text>
                    </View>

                    <View style={styles.itemContent}>
                        <Text style={styles.itemTitle}>{t('settings.databaseRestore')}</Text>
                        <Text style={styles.itemSubtitle}>
                            {t('settings.databaseRestoreSubtitle')}
                        </Text>
                    </View>

                    <View style={styles.itemAction}>
                        <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                            {t('settings.restore')}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Warning message for database operations */}
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
                        {t('settings.databaseBackupWarning')}
                    </Text>
                </View>
            </View>

            {/* App Settings Card */}
            <View style={styles.card}>
                {/* Section header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('settings.appSettings')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('settings.appSettingsSubtitle')}</Text>
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
                        <Text style={styles.itemTitle}>{t('settings.offlineMode')}</Text>
                        <Text style={styles.itemSubtitle}>
                            {settings.offlineMode
                                ? t('settings.offlineModeEnabled')
                                : t('settings.offlineModeDisabled')}
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
                        <Text style={styles.itemTitle}>{t('settings.exportSettings')}</Text>
                        <Text style={styles.itemSubtitle}>
                            {t('settings.exportSettingsSubtitle')}
                        </Text>
                    </View>

                    <View style={styles.itemAction}>
                        <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                            {t('settings.export')}
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
                            {t('settings.resetSettings')}
                        </Text>
                        <Text style={styles.itemSubtitle}>
                            {t('settings.resetSettingsSubtitle')}
                        </Text>
                    </View>

                    <View style={styles.itemAction}>
                        <Text style={[styles.actionText, { color: customColors.error || '#ef4444' }]}>
                            {t('settings.reset')}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Storage info */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>{t('settings.storageStatus')}</Text>
                        <Text style={styles.progressValue}>
                            {settings.offlineMode ? t('settings.offlineReady') : t('settings.onlineOnly')}
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
                        {t('settings.resetWarning')}
                    </Text>
                </View>
            </View>
        </>
    );
}
