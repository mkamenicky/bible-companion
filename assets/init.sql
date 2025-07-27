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
