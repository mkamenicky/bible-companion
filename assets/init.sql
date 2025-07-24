-- schema: init.sql

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

CREATE TABLE IF NOT EXISTS chapter_verse_counts (
                                                    id INTEGER PRIMARY KEY,
                                                    chapter TEXT,
                                                    verse_count INTEGER
);

CREATE TABLE IF NOT EXISTS tasks (
                                     id INTEGER PRIMARY KEY,
                                     date TEXT NOT NULL,
                                     task_name TEXT NOT NULL,
                                     is_done BOOLEAN NOT NULL DEFAULT 0,
                                     UNIQUE(date, task_name)
);

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
