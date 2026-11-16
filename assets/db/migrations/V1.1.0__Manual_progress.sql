-- Where a "read" mark came from:
--   'plan'   = checked off through the daily reading plan (counts for today,
--              the streak and the calendar)
--   'manual' = marked in the Bible overview as "already read earlier"
--              (counts only towards overall Bible progress)
ALTER TABLE BibleVerseProgress ADD COLUMN source TEXT NOT NULL DEFAULT 'plan';

CREATE INDEX IF NOT EXISTS idx_bible_verse_progress_verse ON BibleVerseProgress (bibleVerseId, isRead);

-- init.sql used to insert the achievement rules again on top of the bundled
-- database, leaving every rule in there twice.
DELETE FROM achievement_rules
WHERE id NOT IN (SELECT MIN(id) FROM achievement_rules GROUP BY achievement_id, rule_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_achievement_rules_unique ON achievement_rules (achievement_id, rule_type);

-- "Finish reading all 66 books" was counting books *started*.
UPDATE achievement_rules
SET rule_type = 'books_completed', calculation_field = 'booksCompleted'
WHERE achievement_id = 'book_conqueror';
