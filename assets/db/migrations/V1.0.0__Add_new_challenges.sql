-- New achievements for long-term Bible readers
INSERT OR IGNORE INTO achievements (id, name, description, icon, target_value, category, sort_order)
VALUES ('year_streak', 'Yearly Streak', 'Read for 365 consecutive days', '📆', 365, 'streak', 9),
       ('chapter_hero', 'Chapter Hero', 'Complete 500 chapters', '🏅', 500, 'reading', 10),
       ('full_bible_reader', 'Bible Conqueror', 'Complete all 1 189 chapters of the Bible', '👑', 1189, 'reading', 11),
       ('verse_champion', 'Verse Champion', 'Read 10 000 verses', '🏆', 10000, 'reading', 12),
       ('book_conqueror', 'Book Conqueror', 'Finish reading all 66 books of the Bible', '🏛️', 66, 'exploration', 13);

-- Rules for calculating progress toward each achievement
INSERT OR IGNORE INTO achievement_rules (achievement_id, rule_type, calculation_field)
VALUES ('year_streak', 'consecutive_days', 'bestStreak'),
       ('chapter_hero', 'chapters_read', 'totalChaptersRead'),
       ('full_bible_reader', 'chapters_read', 'totalChaptersRead'),
       ('verse_champion', 'total_verses', 'totalVersesRead'),
       ('book_conqueror', 'books_started', 'booksStarted')
;

-- Prerequisites to ensure proper progression
INSERT OR IGNORE INTO achievement_prerequisites (achievement_id, prerequisite_achievement_id)
VALUES ('year_streak', 'dedication'),
       ('chapter_hero', 'chapter_champion'),
       ('full_bible_reader', 'chapter_hero'),
       ('verse_champion', 'bible_scholar'),
       ('book_conqueror', 'testament_explorer')
;
