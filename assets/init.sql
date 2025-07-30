-- schema: init.sql

-- === Bible Reference Tables ===

CREATE TABLE IF NOT EXISTS BibleBook (
                                         BibleBookId INTEGER PRIMARY KEY,
                                         BookDisplayTitle TEXT
);

CREATE TABLE IF NOT EXISTS BibleVerse (
                                          BibleVerseId INTEGER PRIMARY KEY,
                                          Label TEXT,
                                          Content TEXT
);

CREATE TABLE IF NOT EXISTS BibleChapter (
                                            BibleChapterId INTEGER PRIMARY KEY,
                                            BibleBookId INTEGER NOT NULL,
                                            Content TEXT,
                                            FirstVerseId INTEGER REFERENCES BibleVerse(BibleVerseId),
                                            LastVerseId INTEGER REFERENCES BibleVerse(BibleVerseId),
                                            FOREIGN KEY (BibleBookId) REFERENCES BibleBook(BibleBookId)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_BibleChapter_BookChapter
    ON BibleChapter (BibleBookId, BibleChapterId);

-- === Bible App Tables ===


CREATE TABLE IF NOT EXISTS BibleVerseProgress (
                                                  id           INTEGER PRIMARY KEY,
                                                  bibleVerseId INTEGER           NOT NULL REFERENCES BibleVerse,
                                                  dateRead     TEXT              NOT NULL,
                                                  isRead       INTEGER DEFAULT 1 NOT NULL,
                                                  UNIQUE(bibleVerseId, dateRead)
);


CREATE TABLE IF NOT EXISTS readings (
                                        id INTEGER PRIMARY KEY,
                                        date TEXT,
                                        chapter TEXT,
                                        verse_count INTEGER,
                                        is_read BOOLEAN,
                                        plan_name TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
                                        id INTEGER PRIMARY KEY,
                                        date TEXT,
                                        feedback TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
                       id INTEGER PRIMARY KEY,
                       date TEXT NOT NULL,
                       task_name TEXT NOT NULL,
                       is_done BOOLEAN NOT NULL DEFAULT 0,
                       UNIQUE(date, task_name)
);

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_date_task ON tasks(date, task_name);

-- Add a new table for reading plan configurations
CREATE TABLE IF NOT EXISTS reading_plan_config (
                                                   id INTEGER PRIMARY KEY,
                                                   plan_name TEXT NOT NULL DEFAULT 'chronological',
                                                   plan_type TEXT NOT NULL DEFAULT 'chronological', -- 'chronological' or 'topical'
                                                   is_active BOOLEAN NOT NULL DEFAULT 1,
                                                   created_at TEXT NOT NULL DEFAULT (datetime('now')),
                                                   UNIQUE(plan_name)
);

-- Add a new table for daily reading assignments
CREATE TABLE IF NOT EXISTS daily_reading_assignments (
                                                         id INTEGER PRIMARY KEY,
                                                         date TEXT NOT NULL,
                                                         plan_name TEXT NOT NULL DEFAULT 'chronological',
                                                         start_verse_id INTEGER NOT NULL REFERENCES BibleVerse(BibleVerseId),
                                                         end_verse_id INTEGER NOT NULL REFERENCES BibleVerse(BibleVerseId),
                                                         display_title TEXT NOT NULL,
                                                         is_completed BOOLEAN NOT NULL DEFAULT 0,
                                                         completed_at TEXT,
                                                         UNIQUE(date, plan_name),
                                                         FOREIGN KEY (start_verse_id) REFERENCES BibleVerse(BibleVerseId),
                                                         FOREIGN KEY (end_verse_id) REFERENCES BibleVerse(BibleVerseId)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_reading_date ON daily_reading_assignments(date);
CREATE INDEX IF NOT EXISTS idx_daily_reading_plan ON daily_reading_assignments(plan_name);
CREATE INDEX IF NOT EXISTS idx_bible_verse_progress_date ON BibleVerseProgress(dateRead);

-- Enhanced Database Schema for Progress Tracking
-- Add these tables to your existing init.sql

-- === Progress Tracking Tables ===

-- Persistent streak tracking
CREATE TABLE IF NOT EXISTS reading_streaks (
                                               id INTEGER PRIMARY KEY AUTOINCREMENT,
                                               user_id INTEGER DEFAULT 1, -- For future multi-user support
                                               current_streak INTEGER NOT NULL DEFAULT 0,
                                               longest_streak INTEGER NOT NULL DEFAULT 0,
                                               last_reading_date TEXT NOT NULL,
                                               longest_streak_start_date TEXT,
                                               longest_streak_end_date TEXT,
                                               updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                                               created_at TEXT NOT NULL DEFAULT (datetime('now')),
                                               UNIQUE(user_id)
);

-- Reading sessions for detailed tracking
CREATE TABLE IF NOT EXISTS reading_sessions (
                                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                date TEXT NOT NULL,
                                                start_time TEXT NOT NULL,
                                                end_time TEXT,
                                                verses_read INTEGER NOT NULL DEFAULT 0,
                                                chapters_read INTEGER NOT NULL DEFAULT 0,
                                                books_read TEXT, -- JSON array of book names
                                                reading_plan TEXT,
                                                notes TEXT,
                                                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                                                UNIQUE(date, start_time)
);

-- Achievement progress tracking
CREATE TABLE IF NOT EXISTS achievement_progress (
                                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                    achievement_id TEXT NOT NULL,
                                                    user_id INTEGER DEFAULT 1,
                                                    progress INTEGER NOT NULL DEFAULT 0,
                                                    is_unlocked BOOLEAN NOT NULL DEFAULT 0,
                                                    unlocked_at TEXT,
                                                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                                                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                                                    UNIQUE(achievement_id, user_id)
);

-- Reading goals and targets
CREATE TABLE IF NOT EXISTS reading_goals (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             user_id INTEGER DEFAULT 1,
                                             goal_type TEXT NOT NULL, -- 'daily_verses', 'weekly_chapters', 'yearly_books', etc.
                                             target_value INTEGER NOT NULL,
                                             current_progress INTEGER NOT NULL DEFAULT 0,
                                             start_date TEXT NOT NULL,
                                             end_date TEXT,
                                             is_active BOOLEAN NOT NULL DEFAULT 1,
                                             is_completed BOOLEAN NOT NULL DEFAULT 0,
                                             completed_at TEXT,
                                             created_at TEXT NOT NULL DEFAULT (datetime('now')),
                                             updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reading preferences and settings
CREATE TABLE IF NOT EXISTS reading_preferences (
                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                   user_id INTEGER DEFAULT 1,
                                                   preferred_reading_time TEXT, -- 'morning', 'afternoon', 'evening'
                                                   daily_verse_goal INTEGER DEFAULT 10,
                                                   streak_grace_hours INTEGER DEFAULT 2, -- Hours past midnight to count as previous day
                                                   notification_enabled BOOLEAN DEFAULT 1,
                                                   notification_time TEXT DEFAULT '08:00',
                                                   theme_preference TEXT DEFAULT 'auto',
                                                   font_size TEXT DEFAULT 'medium',
                                                   created_at TEXT NOT NULL DEFAULT (datetime('now')),
                                                   updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                                                   UNIQUE(user_id)
);

-- === Indexes for Performance ===

-- Reading streaks indexes
CREATE INDEX IF NOT EXISTS idx_reading_streaks_user ON reading_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_streaks_updated ON reading_streaks(updated_at);

-- Reading sessions indexes
CREATE INDEX IF NOT EXISTS idx_reading_sessions_date ON reading_sessions(date);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_plan ON reading_sessions(reading_plan);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created ON reading_sessions(created_at);

-- Achievement progress indexes
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user ON achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_achievement ON achievement_progress(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_unlocked ON achievement_progress(is_unlocked);

-- Reading goals indexes
CREATE INDEX IF NOT EXISTS idx_reading_goals_user ON reading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_active ON reading_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_reading_goals_type ON reading_goals(goal_type);

-- Enhanced indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_bible_verse_progress_user_date ON BibleVerseProgress(dateRead, isRead);
CREATE INDEX IF NOT EXISTS idx_tasks_date_done ON tasks(date, is_done);
CREATE INDEX IF NOT EXISTS idx_daily_reading_completed ON daily_reading_assignments(is_completed, date);

-- === Initial Data ===

-- Insert default reading preferences
INSERT OR IGNORE INTO reading_preferences (user_id) VALUES (1);

-- Insert default reading streak record
INSERT OR IGNORE INTO reading_streaks (user_id, current_streak, longest_streak, last_reading_date)
VALUES (1, 0, 0, date('now', '-1 day'));

-- === Views for Common Queries ===

-- Recent reading activity view
CREATE VIEW IF NOT EXISTS recent_reading_activity AS
SELECT
    date,
    COUNT(*) as verses_read,
    COALESCE(SUM(CASE WHEN rs.end_time IS NOT NULL THEN
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
WHERE is_done = 1 AND (
    task_name LIKE '%Daily Text%' OR
    task_name LIKE '%Bible Reading%' OR
    task_name LIKE '%Reading%'
    )
ORDER BY reading_date DESC;
