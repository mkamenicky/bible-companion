import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

const BACKUP_FILE_PREFIX = 'bible_app_database_backup';
const DATABASE_NAME = 'bible.db';

export interface DatabaseBackupResult {
    success: boolean;
    filePath?: string;
    error?: string;
    size?: number;
}

export interface DatabaseRestoreResult {
    success: boolean;
    error?: string;
    warnings?: string[];
}

export interface BackupFileInfo {
    name: string;
    path: string;
    size: number;
    created: Date;
    isValid: boolean;
}

export class DatabaseBackupService {
    private get databasePath(): string {
        return `${FileSystem.documentDirectory}${DATABASE_NAME}`;
    }

    private get backupDirectory(): string {
        return `${FileSystem.documentDirectory}backups/`;
    }

    async createDatabaseBackup(): Promise<DatabaseBackupResult> {
        try {
            console.log('📦 Creating database backup...');

            const dbInfo = await FileSystem.getInfoAsync(this.databasePath);
            if (!dbInfo.exists) {
                return {
                    success: false,
                    error: 'Database file not found. Make sure the app has been used before backing up.',
                };
            }

            await this.ensureBackupDirectoryExists();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
            const backupFilename = `${BACKUP_FILE_PREFIX}_${timestamp}.db`;
            const backupPath = `${this.backupDirectory}${backupFilename}`;

            await FileSystem.copyAsync({
                from: this.databasePath,
                to: backupPath,
            });

            const backupInfo = await FileSystem.getInfoAsync(backupPath);
            const fileSize = backupInfo.exists ? backupInfo.size : 0;

            console.log(`✅ Database backup created: ${backupPath} (${this.formatBytes(fileSize)})`);

            return {
                success: true,
                filePath: backupPath,
                size: fileSize,
            };

        } catch (error) {
            console.error('❌ Database backup failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown backup error',
            };
        }
    }

    async restoreDatabaseBackup(backupPath?: string): Promise<DatabaseRestoreResult> {
        try {
            console.log('📥 Starting database restore...');

            let sourceFile: string;

            if (backupPath) {
                sourceFile = backupPath;
            } else {
                const pickerResult = await DocumentPicker.getDocumentAsync({
                    type: '*/*',
                    copyToCacheDirectory: true,
                });

                if (pickerResult.canceled) {
                    return {
                        success: false,
                        error: 'Restore cancelled by user',
                    };
                }

                sourceFile = pickerResult.assets[0].uri;
            }

            const backupInfo = await FileSystem.getInfoAsync(sourceFile);
            if (!backupInfo.exists) {
                return {
                    success: false,
                    error: 'Backup file not found',
                };
            }

            const currentBackupResult = await this.createDatabaseBackup();
            const warnings: string[] = [];

            if (!currentBackupResult.success) {
                warnings.push('Could not create safety backup of current database');
            } else {
                warnings.push(`Current database backed up to: ${currentBackupResult.filePath}`);
            }

            const dbDirectory = this.databasePath.substring(0, this.databasePath.lastIndexOf('/'));
            const dbDirInfo = await FileSystem.getInfoAsync(dbDirectory);
            if (!dbDirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dbDirectory, { intermediates: true });
            }

            await FileSystem.copyAsync({
                from: sourceFile,
                to: this.databasePath,
            });

            console.log('✅ Database restored successfully');
            return {
                success: true,
                warnings: warnings.length > 0 ? warnings : undefined,
            };

        } catch (error) {
            console.error('❌ Database restore failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown restore error',
            };
        }
    }

    async shareBackup(filePath: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'application/octet-stream',
                    dialogTitle: 'Share Bible App Database Backup',
                });
                return { success: true };
            } else {
                return { success: false, error: 'Sharing not available on this device' };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to share backup'
            };
        }
    }

    // NEW: Added missing shareTextData method
    async shareTextData(data: string, filename: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Create temporary file
            const tempPath = `${FileSystem.cacheDirectory}${filename}`;
            await FileSystem.writeAsStringAsync(tempPath, data);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(tempPath, {
                    mimeType: 'application/json',
                    dialogTitle: 'Share Settings Backup',
                });

                // Clean up temp file
                await FileSystem.deleteAsync(tempPath, { idempotent: true });

                return { success: true };
            } else {
                return { success: false, error: 'Sharing not available on this device' };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to share text data'
            };
        }
    }

    async copyToDownloads(backupFilePath: string): Promise<{
        success: boolean;
        error?: string;
        downloadPath?: string
    }> {
        try {
            const filename = backupFilePath.split('/').pop();
            if (!filename) {
                return { success: false, error: 'Invalid backup file path' };
            }

            if (Platform.OS === 'android') {
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    return {
                        success: false,
                        error: 'Permission denied. Please allow storage access to download files.'
                    };
                }

                const asset = await MediaLibrary.createAssetAsync(backupFilePath);

                let downloadsAlbum = await MediaLibrary.getAlbumAsync('Download');
                if (!downloadsAlbum) {
                    downloadsAlbum = await MediaLibrary.createAlbumAsync('Download', asset, false);
                } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], downloadsAlbum, false);
                }

                console.log(`✅ Backup saved to Downloads: ${filename}`);

                return {
                    success: true,
                    downloadPath: `Downloads/${filename}`,
                };

            } else {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(backupFilePath, {
                        mimeType: 'application/octet-stream',
                        dialogTitle: 'Save Bible App Database Backup',
                        UTI: 'public.data',
                    });

                    return {
                        success: true,
                        downloadPath: 'Shared to Files app',
                    };
                } else {
                    return {
                        success: false,
                        error: 'File sharing not available on this device'
                    };
                }
            }

        } catch (error) {
            console.error('❌ Failed to save to Downloads:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save to Downloads',
            };
        }
    }

    // Additional methods remain the same...
    async listBackups(): Promise<BackupFileInfo[]> {
        try {
            await this.ensureBackupDirectoryExists();
            const files = await FileSystem.readDirectoryAsync(this.backupDirectory);
            const backupFiles = files.filter(file =>
                file.startsWith(BACKUP_FILE_PREFIX) && file.endsWith('.db')
            );

            const backupInfo = await Promise.all(
                backupFiles.map(async (filename): Promise<BackupFileInfo> => {
                    const filePath = `${this.backupDirectory}${filename}`;
                    const fileInfo = await FileSystem.getInfoAsync(filePath);
                    const isValid = fileInfo.exists && (fileInfo.size || 0) > 1024;
                    const created = fileInfo.exists ? fileInfo.modificationTime : 0;
                    return {
                        name: filename,
                        path: filePath,
                        size: fileInfo.exists ? fileInfo.size : 0,
                        created: new Date(created * 1000),
                        isValid,
                    };
                })
            );

            return backupInfo.sort((a, b) => b.created.getTime() - a.created.getTime());

        } catch (error) {
            console.error('Failed to list backups:', error);
            return [];
        }
    }

    private async ensureBackupDirectoryExists(): Promise<void> {
        const dirInfo = await FileSystem.getInfoAsync(this.backupDirectory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(this.backupDirectory, { intermediates: true });
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const databaseBackupService = new DatabaseBackupService();
