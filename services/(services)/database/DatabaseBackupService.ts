// DatabaseBackupService.ts
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import {Platform} from 'react-native';

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

    /**
     * Create a backup of the entire database file
     */
    async createDatabaseBackup(): Promise<DatabaseBackupResult> {
        try {
            console.log('📦 Creating database backup...');

            // Check if database file exists
            const dbInfo = await FileSystem.getInfoAsync(this.databasePath);
            if (!dbInfo.exists) {
                return {
                    success: false,
                    error: 'Database file not found. Make sure the app has been used before backing up.',
                };
            }

            // Ensure backup directory exists
            await this.ensureBackupDirectoryExists();

            // Generate backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
            const backupFilename = `${BACKUP_FILE_PREFIX}_${timestamp}.db`;
            const backupPath = `${this.backupDirectory}${backupFilename}`;

            // Copy database file to backup location
            await FileSystem.copyAsync({
                from: this.databasePath,
                to: backupPath,
            });

            // Get file size
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

    /**
     * Restore database from backup file
     */
    async restoreDatabaseBackup(backupPath?: string): Promise<DatabaseRestoreResult> {
        try {
            console.log('📥 Starting database restore...');

            let sourceFile: string;

            if (backupPath) {
                // Use provided backup file path
                sourceFile = backupPath;
            } else {
                // Let user pick backup file
                const pickerResult = await DocumentPicker.getDocumentAsync({
                    type: '*/*', // Allow all files since .db might not be recognized
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

            // Validate backup file
            const backupInfo = await FileSystem.getInfoAsync(sourceFile);
            if (!backupInfo.exists) {
                return {
                    success: false,
                    error: 'Backup file not found',
                };
            }

            // Create backup of current database before restore (safety measure)
            const currentBackupResult = await this.createDatabaseBackup();
            const warnings: string[] = [];

            if (!currentBackupResult.success) {
                warnings.push('Could not create safety backup of current database');
            } else {
                warnings.push(`Current database backed up to: ${currentBackupResult.filePath}`);
            }

            // Ensure database directory exists
            const dbDirectory = this.databasePath.substring(0, this.databasePath.lastIndexOf('/'));
            const dbDirInfo = await FileSystem.getInfoAsync(dbDirectory);
            if (!dbDirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dbDirectory, {intermediates: true});
            }

            // Copy backup file to database location
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

    /**
     * Share backup file
     */
    async shareBackup(filePath: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'application/octet-stream',
                    dialogTitle: 'Share Bible App Database Backup',
                });
                return {success: true};
            } else {
                return {success: false, error: 'Sharing not available on this device'};
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to share backup'
            };
        }
    }

    /**
     * Copy backup to system Downloads folder (Android) or save to Files (iOS)
     */
    async copyToDownloads(backupFilePath: string): Promise<{
        success: boolean;
        error?: string;
        downloadPath?: string
    }> {
        try {
            // Get the filename from the backup path
            const filename = backupFilePath.split('/').pop();
            if (!filename) {
                return {success: false, error: 'Invalid backup file path'};
            }

            if (Platform.OS === 'android') {
                // Android: Save to public Downloads folder using MediaLibrary

                // Request permissions
                const {status} = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    return {
                        success: false,
                        error: 'Permission denied. Please allow storage access to download files.'
                    };
                }

                // Create asset from the backup file
                const asset = await MediaLibrary.createAssetAsync(backupFilePath);

                // Try to get or create Downloads album
                let downloadsAlbum = await MediaLibrary.getAlbumAsync('Download');
                if (!downloadsAlbum) {
                    // If Downloads album doesn't exist, create it
                    downloadsAlbum = await MediaLibrary.createAlbumAsync('Download', asset, false);
                } else {
                    // Add asset to existing Downloads album
                    await MediaLibrary.addAssetsToAlbumAsync([asset], downloadsAlbum, false);
                }

                console.log(`✅ Backup saved to Downloads: ${filename}`);

                return {
                    success: true,
                    downloadPath: `Downloads/${filename}`,
                };

            } else {
                // iOS: Use sharing to save to Files app (iOS doesn't have a public Downloads folder)
                try {
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(backupFilePath, {
                            mimeType: 'application/octet-stream',
                            dialogTitle: 'Save Bible App Database Backup',
                            UTI: 'public.data', // This helps iOS recognize it as a file
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
                } catch (shareError) {
                    return {
                        success: false,
                        error: shareError instanceof Error ? shareError.message : 'Failed to save file'
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

    /**
     * List available backup files
     */
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

                    // Basic validation - check if file exists and has reasonable size
                    const isValid = fileInfo.exists && (fileInfo.size || 0) > 1024; // At least 1KB
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

            // Sort by creation date (newest first)
            return backupInfo.sort((a, b) => b.created.getTime() - a.created.getTime());

        } catch (error) {
            console.error('Failed to list backups:', error);
            return [];
        }
    }

    /**
     * Delete backup file
     */
    async deleteBackup(filePath: string): Promise<{ success: boolean; error?: string }> {
        try {
            await FileSystem.deleteAsync(filePath);
            return {success: true};
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete backup'
            };
        }
    }

    /**
     * Get database file info
     */
    async getDatabaseInfo(): Promise<{
        exists: boolean;
        size?: number;
        lastModified?: Date;
        path: string;
    }> {
        try {
            const dbInfo = await FileSystem.getInfoAsync(this.databasePath);

            const modificationTime = dbInfo.exists ? dbInfo.modificationTime : null;
            return {
                exists: dbInfo.exists,
                size: dbInfo.exists ? dbInfo.size : 0,
                lastModified: modificationTime ? new Date(modificationTime * 1000) : undefined,
                path: this.databasePath,
            };
        } catch (error) {
            return {
                exists: false,
                path: this.databasePath,
            };
        }
    }

    /**
     * Clean up old backups (keep only the most recent N backups)
     */
    async cleanupOldBackups(keepCount: number = 5): Promise<{
        success: boolean;
        deletedCount?: number;
        error?: string;
    }> {
        try {
            const backups = await this.listBackups();

            if (backups.length <= keepCount) {
                return {success: true, deletedCount: 0};
            }

            const backupsToDelete = backups.slice(keepCount);
            let deletedCount = 0;

            for (const backup of backupsToDelete) {
                const result = await this.deleteBackup(backup.path);
                if (result.success) {
                    deletedCount++;
                }
            }

            return {success: true, deletedCount};

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to cleanup backups',
            };
        }
    }

    // Private helper methods

    private async ensureBackupDirectoryExists(): Promise<void> {
        const dirInfo = await FileSystem.getInfoAsync(this.backupDirectory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(this.backupDirectory, {intermediates: true});
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

// Export singleton instance
export const databaseBackupService = new DatabaseBackupService();
