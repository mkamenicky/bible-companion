// DatabaseBackupCard.tsx (Fixed - follows proper architecture)
import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from '@/hooks';

export interface BackupFileInfo {
    name: string;
    path: string;
    size: number;
    created: Date;
    isValid: boolean;
}

interface DatabaseBackupCardProps {
    // Data props (passed from screen/hook)
    loading: boolean;
    backups: BackupFileInfo[];
    databaseInfo: {
        exists: boolean;
        size?: number;
        lastModified?: Date;
    };

    // Action props (handled by screen/hook)
    onCreateBackup: () => void;
    onRestoreFromFile: () => void;
    onRestoreFromBackup: (backup: BackupFileInfo) => void;
    onShareBackup: (backup: BackupFileInfo) => void;
    onDeleteBackup: (backup: BackupFileInfo) => void;
    onRefreshList: () => void;
    onCleanupOldBackups: () => void;

    // UI props
    styles: any;
    customColors: any;
}

export default function DatabaseBackupCard({
                                               loading,
                                               backups,
                                               databaseInfo,
                                               onCreateBackup,
                                               onRestoreFromFile,
                                               onRestoreFromBackup,
                                               onShareBackup,
                                               onDeleteBackup,
                                               onRefreshList,
                                               onCleanupOldBackups,
                                               styles,
                                               customColors,
                                           }: DatabaseBackupCardProps) {
    const t = useTranslation();

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderBackupItem = ({ item: backup }: { item: BackupFileInfo }) => (
        <View style={styles.backupItem}>
            <View style={[
                styles.itemIcon,
                { backgroundColor: backup.isValid ? '#e8f5e8' : '#ffebee' }
            ]}>
                <Text style={{ fontSize: 18 }}>
                    {backup.isValid ? '💾' : '⚠️'}
                </Text>
            </View>

            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{backup.name}</Text>
                <Text style={styles.itemSubtitle}>
                    {formatDate(backup.created)} • {formatBytes(backup.size)}
                </Text>
                {!backup.isValid && (
                    <Text style={[styles.itemSubtitle, { color: customColors.error }]}>
                        {t('settings.backup.invalidBackup')}
                    </Text>
                )}
            </View>

            <View style={styles.backupActions}>
                {backup.isValid && (
                    <TouchableOpacity
                        style={[styles.backupActionButton, { backgroundColor: customColors.instagramBlue }]}
                        onPress={() => onRestoreFromBackup(backup)}
                        disabled={loading}
                    >
                        <Text style={[styles.backupActionText, { color: 'white' }]}>
                            {t('settings.backup.restore')}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.backupActionButton, {
                        backgroundColor: customColors.surface,
                        borderWidth: 1,
                        borderColor: customColors.borderColor
                    }]}
                    onPress={() => onShareBackup(backup)}
                >
                    <Text style={[styles.backupActionText, { color: customColors.text }]}>
                        {t('settings.backup.share')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.backupActionButton, { backgroundColor: customColors.error }]}
                    onPress={() => onDeleteBackup(backup)}
                    disabled={loading}
                >
                    <Text style={[styles.backupActionText, { color: 'white' }]}>
                        {t('common.delete')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.card}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('settings.backup.databaseTitle')}</Text>
                <Text style={styles.sectionSubtitle}>{t('settings.backup.databaseSubtitle')}</Text>
            </View>

            {/* Database status */}
            <View style={styles.listItem}>
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: databaseInfo.exists ? '#e8f5e8' : '#ffebee' }
                ]}>
                    <Text style={{ fontSize: 18 }}>
                        {databaseInfo.exists ? '🗄️' : '❌'}
                    </Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.backup.databaseStatus')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {databaseInfo.exists
                            ? t('settings.backup.databaseFound', {
                                size: formatBytes(databaseInfo.size || 0),
                                lastModified: databaseInfo.lastModified
                                    ? formatDate(databaseInfo.lastModified)
                                    : t('common.unknown')
                            })
                            : t('settings.backup.databaseNotFound')
                        }
                    </Text>
                </View>
            </View>

            {/* Create backup */}
            <TouchableOpacity
                style={styles.listItem}
                onPress={onCreateBackup}
                disabled={loading || !databaseInfo.exists}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: '#e3f2fd' }
                ]}>
                    <Text style={{ fontSize: 18 }}>💾</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.backup.createBackup')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.backup.createDatabaseBackupSubtitle')}
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[
                        styles.actionText,
                        {
                            color: (!databaseInfo.exists || loading)
                                ? customColors.subtleGray
                                : customColors.instagramBlue
                        }
                    ]}>
                        {loading ? t('common.creating') : t('common.create')}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Import/Restore backup */}
            <TouchableOpacity
                style={styles.listItem}
                onPress={onRestoreFromFile}
                disabled={loading}
            >
                <View style={[
                    styles.itemIcon,
                    { backgroundColor: '#fff3e0' }
                ]}>
                    <Text style={{ fontSize: 18 }}>📥</Text>
                </View>

                <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{t('settings.backup.restoreFromFile')}</Text>
                    <Text style={styles.itemSubtitle}>
                        {t('settings.backup.restoreFromFileSubtitle')}
                    </Text>
                </View>

                <View style={styles.itemAction}>
                    <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                        {t('settings.backup.restore')}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Backup list */}
            {backups.length > 0 && (
                <>
                    <View style={styles.sectionDivider}>
                        <Text style={styles.sectionSubheader}>
                            {t('settings.backup.existingBackups', { count: backups.length })}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {backups.length > 3 && (
                                <TouchableOpacity onPress={onCleanupOldBackups}>
                                    <Text style={[styles.actionText, { color: customColors.error }]}>
                                        {t('settings.backup.cleanup')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onRefreshList} disabled={loading}>
                                <Text style={[styles.actionText, { color: customColors.instagramBlue }]}>
                                    {loading ? t('common.loading') : t('common.refresh')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={backups}
                        keyExtractor={(item) => item.path}
                        renderItem={renderBackupItem}
                        scrollEnabled={false}
                        style={styles.backupList}
                    />
                </>
            )}

            {/* Warning footer */}
            <View style={styles.infoFooter}>
                <Text style={styles.infoText}>
                    {t('settings.backup.databaseWarning')}
                </Text>
            </View>
        </View>
    );
}
