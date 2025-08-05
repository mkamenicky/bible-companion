export interface MigrationFile {
    version: string;
    name: string;
    module: any;
}

export class MigrationProvider {
    async getMigrationFiles(): Promise<MigrationFile[]> {
        return [
            {
                version: '1.0.0',
                name: 'Add user preferences',
                module: require('../../../assets/db/migrations/V1.0.0__Add_new_challenges.sql'),
            }
        ];
    }
}

export const migrationProvider = new MigrationProvider();
