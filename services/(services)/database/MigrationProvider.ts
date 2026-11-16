export interface MigrationFile {
    /** Semantic version; migrations run in ascending order. */
    version: string;
    name: string;
    /** `require()` of the .sql asset (Metro bundles .sql files as assets). */
    module: number;
    /**
     * When this returns true the migration is recorded as done without
     * running, for data fixes that only apply to some devices.
     */
    skipWhen?: () => boolean;
}

/** True when local time is ahead of UTC (getTimezoneOffset is negative there). */
const isEastOfUtc = (): boolean => new Date().getTimezoneOffset() < 0;

/**
 * All migrations, in order. A new .sql file in assets/db/migrations only runs
 * once it is listed here.
 */
export const MIGRATION_FILES: MigrationFile[] = [
    {
        version: '1.0.0',
        name: 'Add new challenges',
        module: require('../../../assets/db/migrations/V1.0.0__Add_new_challenges.sql'),
    },
    {
        version: '1.1.0',
        name: 'Manual progress tracking',
        module: require('../../../assets/db/migrations/V1.1.0__Manual_progress.sql'),
    },
    {
        version: '1.1.1',
        name: 'Shift legacy UTC dates to local dates',
        module: require('../../../assets/db/migrations/V1.1.1__Shift_legacy_utc_dates.sql'),
        skipWhen: () => !isEastOfUtc(),
    },
    {
        version: '1.1.2',
        name: 'Align completion dates with reading days',
        module: require('../../../assets/db/migrations/V1.1.2__Align_completion_dates.sql'),
    },
    {
        version: '1.2.0',
        name: 'Consistency achievements',
        module: require('../../../assets/db/migrations/V1.2.0__Consistency_achievements.sql'),
    },
];

export const INITIAL_SCHEMA_MODULE: number = require('../../../assets/db/init.sql');
