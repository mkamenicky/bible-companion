-- Versions up to 1.0.3 stored "today" as the UTC date of local midnight. East
-- of UTC that is always the previous day, so every daily assignment and every
-- checklist entry was filed one day early (weekly tasks under Sunday instead
-- of Monday). This moves the existing rows to the day they really belong to.
--
-- Only run on devices east of UTC (see MigrationProvider): west of UTC the
-- stored dates were already correct.
--
-- Both tables have a UNIQUE constraint that includes the date. Shifting rows
-- one by one would collide with the neighbouring day's row that has not been
-- moved yet, so the rows are first moved to a temporary '~' value.

UPDATE tasks
SET task_name = replace(task_name, '_WEEKLY_' || date, '_WEEKLY_' || date(date, '+1 day')),
    date      = '~' || date(date, '+1 day')
WHERE date(date) IS NOT NULL;

UPDATE tasks SET date = substr(date, 2) WHERE date LIKE '~%';

UPDATE daily_reading_assignments
SET date = '~' || date(date, '+1 day')
WHERE date(date) IS NOT NULL;

UPDATE daily_reading_assignments SET date = substr(date, 2) WHERE date LIKE '~%';
