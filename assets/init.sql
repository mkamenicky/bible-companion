-- schema: init.sql

-- === Bible Reference Tables ===

CREATE TABLE IF NOT EXISTS BibleBook
(
    BibleBookId      INTEGER PRIMARY KEY,
    BookDisplayTitle TEXT
);

CREATE TABLE IF NOT EXISTS BibleVerse
(
    BibleVerseId INTEGER PRIMARY KEY,
    Label        TEXT,
    Content      TEXT
);

CREATE TABLE IF NOT EXISTS BibleChapter
(
    BibleChapterId INTEGER PRIMARY KEY,
    BibleBookId    INTEGER NOT NULL,
    Content        TEXT,
    FirstVerseId   INTEGER REFERENCES BibleVerse (BibleVerseId),
    LastVerseId    INTEGER REFERENCES BibleVerse (BibleVerseId),
    FOREIGN KEY (BibleBookId) REFERENCES BibleBook (BibleBookId)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_BibleChapter_BookChapter
    ON BibleChapter (BibleBookId, BibleChapterId);

-- === Bible App Tables ===


CREATE TABLE IF NOT EXISTS BibleVerseProgress
(
    id           INTEGER PRIMARY KEY,
    bibleVerseId INTEGER           NOT NULL REFERENCES BibleVerse,
    dateRead     TEXT              NOT NULL,
    isRead       INTEGER DEFAULT 1 NOT NULL,
    UNIQUE (bibleVerseId, dateRead)
);


CREATE TABLE IF NOT EXISTS readings
(
    id          INTEGER PRIMARY KEY,
    date        TEXT,
    chapter     TEXT,
    verse_count INTEGER,
    is_read     BOOLEAN,
    plan_name   TEXT
);

CREATE TABLE IF NOT EXISTS feedback
(
    id       INTEGER PRIMARY KEY,
    date     TEXT,
    feedback TEXT
);

CREATE TABLE IF NOT EXISTS tasks
(
    id        INTEGER PRIMARY KEY,
    date      TEXT    NOT NULL,
    task_name TEXT    NOT NULL,
    is_done   BOOLEAN NOT NULL DEFAULT 0,
    UNIQUE (date, task_name)
);

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_date_task ON tasks (date, task_name);

-- Add a new table for reading plan configurations
CREATE TABLE IF NOT EXISTS reading_plan_config
(
    id         INTEGER PRIMARY KEY,
    plan_name  TEXT    NOT NULL DEFAULT 'chronological',
    plan_type  TEXT    NOT NULL DEFAULT 'chronological', -- 'chronological' or 'topical'
    is_active  BOOLEAN NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (plan_name)
);

-- Add a new table for daily reading assignments
CREATE TABLE IF NOT EXISTS daily_reading_assignments
(
    id             INTEGER PRIMARY KEY,
    date           TEXT    NOT NULL,
    plan_name      TEXT    NOT NULL DEFAULT 'chronological',
    chapter_id     INTEGER NOT NULL REFERENCES BibleChapter (BibleChapterId),
    start_verse_id INTEGER NOT NULL REFERENCES BibleVerse (BibleVerseId),
    end_verse_id   INTEGER NOT NULL REFERENCES BibleVerse (BibleVerseId),
    display_title  TEXT    NOT NULL,
    is_completed   BOOLEAN NOT NULL DEFAULT 0,
    completed_at   TEXT,
    UNIQUE (date, plan_name, chapter_id),
    FOREIGN KEY (start_verse_id) REFERENCES BibleVerse (BibleVerseId),
    FOREIGN KEY (end_verse_id) REFERENCES BibleVerse (BibleVerseId)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_reading_date ON daily_reading_assignments (date);
CREATE INDEX IF NOT EXISTS idx_daily_reading_plan ON daily_reading_assignments (plan_name);
CREATE INDEX IF NOT EXISTS idx_bible_verse_progress_date ON BibleVerseProgress (dateRead);

-- Enhanced Database Schema for Progress Tracking
-- Add these tables to your existing init.sql

-- === Progress Tracking Tables ===

-- Persistent streak tracking
CREATE TABLE IF NOT EXISTS reading_streaks
(
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id                   INTEGER          DEFAULT 1, -- For future multi-user support
    current_streak            INTEGER NOT NULL DEFAULT 0,
    longest_streak            INTEGER NOT NULL DEFAULT 0,
    last_reading_date         TEXT    NOT NULL,
    longest_streak_start_date TEXT,
    longest_streak_end_date   TEXT,
    updated_at                TEXT    NOT NULL DEFAULT (datetime('now')),
    created_at                TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id)
);

-- Reading sessions for detailed tracking
CREATE TABLE IF NOT EXISTS reading_sessions
(
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    date          TEXT    NOT NULL,
    start_time    TEXT    NOT NULL,
    end_time      TEXT,
    verses_read   INTEGER NOT NULL DEFAULT 0,
    chapters_read INTEGER NOT NULL DEFAULT 0,
    books_read    TEXT, -- JSON array of book names
    reading_plan  TEXT,
    notes         TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (date, start_time)
);

-- Achievement progress tracking
CREATE TABLE IF NOT EXISTS achievement_progress
(
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    achievement_id TEXT    NOT NULL,
    user_id        INTEGER          DEFAULT 1,
    progress       INTEGER NOT NULL DEFAULT 0,
    is_unlocked    BOOLEAN NOT NULL DEFAULT 0,
    unlocked_at    TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (achievement_id, user_id)
);

-- Reading goals and targets
CREATE TABLE IF NOT EXISTS reading_goals
(
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER          DEFAULT 1,
    goal_type        TEXT    NOT NULL, -- 'daily_verses', 'weekly_chapters', 'yearly_books', etc.
    target_value     INTEGER NOT NULL,
    current_progress INTEGER NOT NULL DEFAULT 0,
    start_date       TEXT    NOT NULL,
    end_date         TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT 1,
    is_completed     BOOLEAN NOT NULL DEFAULT 0,
    completed_at     TEXT,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Reading preferences and settings
CREATE TABLE IF NOT EXISTS reading_preferences
(
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id                INTEGER       DEFAULT 1,
    preferred_reading_time TEXT,                    -- 'morning', 'afternoon', 'evening'
    daily_verse_goal       INTEGER       DEFAULT 10,
    streak_grace_hours     INTEGER       DEFAULT 2, -- Hours past midnight to count as previous day
    notification_enabled   BOOLEAN       DEFAULT 1,
    notification_time      TEXT          DEFAULT '08:00',
    theme_preference       TEXT          DEFAULT 'auto',
    font_size              TEXT          DEFAULT 'medium',
    created_at             TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id)
);

-- === Indexes for Performance ===

-- Reading streaks indexes
CREATE INDEX IF NOT EXISTS idx_reading_streaks_user ON reading_streaks (user_id);
CREATE INDEX IF NOT EXISTS idx_reading_streaks_updated ON reading_streaks (updated_at);

-- Reading sessions indexes
CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON reading_sessions (date);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_plan ON reading_sessions (reading_plan);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created ON reading_sessions (created_at);

-- Achievement progress indexes
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user ON achievement_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_achievement ON achievement_progress (achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_unlocked ON achievement_progress (is_unlocked);

-- Reading goals indexes
CREATE INDEX IF NOT EXISTS idx_reading_goals_user ON reading_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_active ON reading_goals (is_active);
CREATE INDEX IF NOT EXISTS idx_reading_goals_type ON reading_goals (goal_type);

-- Enhanced indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_bible_verse_progress_user_date ON BibleVerseProgress (dateRead, isRead);
CREATE INDEX IF NOT EXISTS idx_tasks_date_done ON tasks (date, is_done);
CREATE INDEX IF NOT EXISTS idx_daily_reading_completed ON daily_reading_assignments (is_completed, date);

-- === Initial Data ===

-- Insert default reading preferences
INSERT OR IGNORE INTO reading_preferences (user_id)
VALUES (1);

-- Insert default reading streak record
INSERT OR IGNORE INTO reading_streaks (user_id, current_streak, longest_streak, last_reading_date)
VALUES (1, 0, 0, date('now', '-1 day'));

-- === Views for Common Queries ===

-- Recent reading activity view
CREATE VIEW IF NOT EXISTS recent_reading_activity AS
SELECT date,
       COUNT(*)     as verses_read,
       COALESCE(SUM(CASE
                        WHEN rs.end_time IS NOT NULL THEN
                            (julianday(rs.end_time) - julianday(rs.start_time)) * 24 * 60
           END), 0) as minutes_spent
FROM BibleVerseProgress bvp
         LEFT JOIN reading_sessions rs ON bvp.dateRead = rs.date
WHERE bvp.isRead = 1
GROUP BY date
ORDER BY date DESC;

-- Streak calculation view
CREATE VIEW IF NOT EXISTS streak_dates AS
SELECT DISTINCT dateRead as reading_date
FROM BibleVerseProgress
WHERE isRead = 1
UNION
SELECT DISTINCT date as reading_date
FROM tasks
WHERE is_done = 1
  AND (
    task_name LIKE '%Daily Text%' OR
    task_name LIKE '%Bible Reading%' OR
    task_name LIKE '%Reading%'
    )
ORDER BY reading_date DESC;

-- Enhanced schema additions for reading plan logic

-- Reading topics/themes table
CREATE TABLE IF NOT EXISTS reading_topics
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_name   TEXT    NOT NULL UNIQUE,            -- 'Law', 'History', 'Psalms', 'Poetry', 'Prophecy', 'Gospels', 'Letters'
    display_name TEXT    NOT NULL,                   -- 'The Law', 'Historical Books', etc.
    day_of_week  INTEGER,                            -- 1-7, NULL for sequential mode
    color_hex    TEXT             DEFAULT '#4F46E5', -- For UI theming
    icon_name    TEXT,                               -- For UI icons
    is_active    BOOLEAN NOT NULL DEFAULT 1,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Bible book to topic mapping
CREATE TABLE IF NOT EXISTS bible_book_topics
(
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    bible_book_id INTEGER NOT NULL REFERENCES BibleBook (BibleBookId),
    topic_id      INTEGER NOT NULL REFERENCES reading_topics (id),
    sort_order    INTEGER          DEFAULT 0, -- Order within the topic
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (bible_book_id, topic_id)
);

-- Reading plan progress tracking
CREATE TABLE IF NOT EXISTS reading_plan_progress
(
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_config_id     INTEGER NOT NULL REFERENCES reading_plan_config (id),
    current_book_id    INTEGER REFERENCES BibleBook (BibleBookId),
    current_chapter_id INTEGER REFERENCES BibleChapter (BibleChapterId),
    current_verse_id   INTEGER REFERENCES BibleVerse (BibleVerseId),
    last_topic_id      INTEGER REFERENCES reading_topics (id), -- For topic-based plans
    verses_read_today  INTEGER          DEFAULT 0,
    last_updated       TEXT    NOT NULL DEFAULT (datetime('now')),
    created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (plan_config_id)
);

-- Update reading_plan_config to be more comprehensive
-- Note: This assumes you want to modify the existing table
-- If you can't modify, we'll work with what you have

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bible_book_topics_book ON bible_book_topics (bible_book_id);
CREATE INDEX IF NOT EXISTS idx_bible_book_topics_topic ON bible_book_topics (topic_id);
CREATE INDEX IF NOT EXISTS idx_reading_plan_progress_config ON reading_plan_progress (plan_config_id);
CREATE INDEX IF NOT EXISTS idx_reading_topics_day ON reading_topics (day_of_week);

-- === Initial Data ===

-- Insert default reading topics
INSERT OR IGNORE INTO reading_topics (topic_name, display_name, day_of_week, color_hex, icon_name)
VALUES ('Law', 'The Law', 1, '#DC2626', 'book-open'),
       ('History', 'Historical Books', 2, '#D97706', 'scroll'),
       ('Psalms', 'Psalms & Worship', 3, '#059669', 'music'),
       ('Poetry', 'Wisdom & Poetry', 4, '#7C3AED', 'feather'),
       ('Prophecy', 'Prophetic Books', 5, '#BE185D', 'eye'),
       ('Gospels', 'The Gospels', 6, '#2563EB', 'heart'),
       ('Letters', 'Letters & Revelation', 7, '#EA580C', 'mail');

-- Example Bible book to topic mappings
-- Law (Torah)
INSERT OR IGNORE INTO bible_book_topics (bible_book_id, topic_id, sort_order)
SELECT BibleBookId, 1, ROW_NUMBER() OVER (ORDER BY BibleBookId)
FROM BibleBook
WHERE BibleBookId IN (1, 2, 3, 4, 5);

-- History
INSERT OR IGNORE INTO bible_book_topics (bible_book_id, topic_id, sort_order)
SELECT BibleBookId, 2, ROW_NUMBER() OVER (ORDER BY BibleBookId)
FROM BibleBook
WHERE BibleBookId IN (6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17);

-- Psalms
INSERT OR IGNORE INTO bible_book_topics (bible_book_id, topic_id, sort_order)
SELECT BibleBookId, 3, ROW_NUMBER() OVER (ORDER BY BibleBookId)
FROM BibleBook
WHERE BibleBookId IN (19);

-- Poetry/Wisdom
INSERT OR IGNORE INTO bible_book_topics (bible_book_id, topic_id, sort_order)
SELECT BibleBookId, 4, ROW_NUMBER() OVER (ORDER BY BibleBookId)
FROM BibleBook
WHERE BibleBookId IN (18, 20, 21, 22);

-- Prophecy
INSERT OR IGNORE INTO bible_book_topics (bible_book_id, topic_id, sort_order)
SELECT BibleBookId, 5, ROW_NUMBER() OVER (ORDER BY BibleBookId)
FROM BibleBook
WHERE BibleBookId IN (23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39);

-- Gospels
INSERT OR IGNORE INTO bible_book_topics (bible_book_id, topic_id, sort_order)
SELECT BibleBookId, 6, ROW_NUMBER() OVER (ORDER BY BibleBookId)
FROM BibleBook
WHERE BibleBookId IN (40, 41, 42, 43, 44);

-- Letters
INSERT OR IGNORE INTO bible_book_topics (bible_book_id, topic_id, sort_order)
SELECT BibleBookId, 7, ROW_NUMBER() OVER (ORDER BY BibleBookId)
FROM BibleBook
WHERE BibleBookId IN (45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66);

-- Update reading_preferences to include reading plan preferences
-- Add new columns if they don't exist (use ALTER TABLE if possible, or recreate)
-- This is a conceptual addition - you may need to handle this differently

-- Example default reading plan configuration
INSERT OR IGNORE INTO reading_plan_config (plan_name, plan_type, is_active)
VALUES ('Sequential Reading', 'sequential', 0),
       ('Topical Weekly', 'topical', 1),
       ('Chronological', 'chronological', 0);

-- === Views for Easy Querying ===

-- View to get books by topic with details
CREATE VIEW IF NOT EXISTS books_by_topic AS
SELECT rt.id           as topic_id,
       rt.topic_name,
       rt.display_name as topic_display_name,
       rt.day_of_week,
       rt.color_hex,
       bb.BibleBookId,
       bb.BookDisplayTitle,
       bbt.sort_order
FROM reading_topics rt
         JOIN bible_book_topics bbt ON rt.id = bbt.topic_id
         JOIN BibleBook bb ON bbt.bible_book_id = bb.BibleBookId
WHERE rt.is_active = 1
ORDER BY rt.day_of_week, bbt.sort_order;

-- View to get current reading progress with details
CREATE VIEW IF NOT EXISTS current_reading_progress AS
SELECT rpp.*,
       rpc.plan_name,
       rpc.plan_type,
       bb.BookDisplayTitle as current_book_title,
       rt.topic_name       as current_topic
FROM reading_plan_progress rpp
         JOIN reading_plan_config rpc ON rpp.plan_config_id = rpc.id
         LEFT JOIN BibleBook bb ON rpp.current_book_id = bb.BibleBookId
         LEFT JOIN reading_topics rt ON rpp.last_topic_id = rt.id
WHERE rpc.is_active = 1;
