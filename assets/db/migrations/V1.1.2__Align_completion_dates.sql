-- Versions up to 1.0.3 stamped a completed assignment and its verses with the
-- UTC date of the moment it was checked off. Around midnight UTC (in Japan:
-- before 09:00) that is a different day than the one the reading was done on.
--
-- An assignment could only ever be checked off on its own day, so its date is
-- the true reading day. Where the completion date is one day off, the verses
-- read with it and the completion date itself are moved to that day. This
-- puts early-morning readings on the right day in calendar and streak.

UPDATE OR IGNORE BibleVerseProgress
SET dateRead = (SELECT a.date
                FROM daily_reading_assignments a
                WHERE a.is_completed = 1
                  AND a.completed_at = BibleVerseProgress.dateRead
                  AND a.completed_at IN (date(a.date, '-1 day'), date(a.date, '+1 day'))
                  AND BibleVerseProgress.bibleVerseId BETWEEN a.start_verse_id AND a.end_verse_id
                LIMIT 1)
WHERE EXISTS (SELECT 1
              FROM daily_reading_assignments a
              WHERE a.is_completed = 1
                AND a.completed_at = BibleVerseProgress.dateRead
                AND a.completed_at IN (date(a.date, '-1 day'), date(a.date, '+1 day'))
                AND BibleVerseProgress.bibleVerseId BETWEEN a.start_verse_id AND a.end_verse_id);

UPDATE daily_reading_assignments
SET completed_at = date
WHERE is_completed = 1
  AND completed_at IN (date(date, '-1 day'), date(date, '+1 day'));
