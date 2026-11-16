-- Achievements for keeping routines regularly: the daily text, family
-- worship, meeting preparation and reading days. Until now achievements only
-- looked at Bible verses.
--
-- Streak rules compare against the best streak ever reached (in days for the
-- daily text, in weeks for the weekly tasks); "total" rules count every time
-- it was done, so progress is not lost after a missed day.

INSERT OR IGNORE INTO achievements (id, name, description, icon, target_value, category, sort_order)
VALUES ('dt_week', 'Daily Text Week', 'Read the daily text 7 days in a row', '🌅', 7, 'daily_text', 20),
       ('dt_month', 'Daily Text Month', 'Read the daily text 30 days in a row', '☀️', 30, 'daily_text', 21),
       ('dt_hundred', 'Daily Text Devotee', 'Read the daily text 100 days in a row', '🌟', 100, 'daily_text', 22),
       ('daily_devotion', 'Daily Devotion', 'Complete 50 daily texts', '📅', 50, 'daily_text', 23),
       ('dt_year', 'A Year of Daily Texts', 'Complete 365 daily texts', '🗓️', 365, 'daily_text', 24),
       ('fw_month', 'Family Rhythm', 'Family worship 4 weeks in a row', '👨‍👩‍👧‍👦', 4, 'family', 30),
       ('fw_quarter', 'Family Tradition', 'Family worship 12 weeks in a row', '🏡', 12, 'family', 31),
       ('fw_year', 'A Year of Family Worship', 'Family worship in 52 weeks', '💞', 52, 'family', 32),
       ('prep_month', 'Well Prepared', 'Prepare both meetings 4 weeks in a row', '📝', 4, 'meetings', 40),
       ('prep_quarter', 'Always Prepared', 'Prepare both meetings 12 weeks in a row', '🎓', 12, 'meetings', 41),
       ('perfect_week', 'Perfect Week', 'Complete every weekly task in one week', '✅', 1, 'consistency', 50),
       ('perfect_month', 'Perfect Month', 'Complete every weekly task 4 weeks in a row', '🏅', 4, 'consistency', 51),
       ('reading_days_30', '30 Reading Days', 'Read the Bible on 30 days', '📖', 30, 'consistency', 52),
       ('reading_days_100', '100 Reading Days', 'Read the Bible on 100 days', '📚', 100, 'consistency', 53),
       ('reading_days_365', '365 Reading Days', 'Read the Bible on 365 days', '👑', 365, 'consistency', 54);

INSERT OR IGNORE INTO achievement_rules (achievement_id, rule_type, calculation_field)
VALUES ('dt_week', 'daily_text_streak', 'dailyTextBestStreak'),
       ('dt_month', 'daily_text_streak', 'dailyTextBestStreak'),
       ('dt_hundred', 'daily_text_streak', 'dailyTextBestStreak'),
       ('daily_devotion', 'daily_text_total', 'dailyTextTotal'),
       ('dt_year', 'daily_text_total', 'dailyTextTotal'),
       ('fw_month', 'family_worship_streak', 'familyWorshipBestStreak'),
       ('fw_quarter', 'family_worship_streak', 'familyWorshipBestStreak'),
       ('fw_year', 'family_worship_total', 'familyWorshipTotal'),
       ('prep_month', 'meeting_prep_streak', 'meetingPreparationBestStreak'),
       ('prep_quarter', 'meeting_prep_streak', 'meetingPreparationBestStreak'),
       ('perfect_week', 'perfect_week_total', 'perfectWeeksTotal'),
       ('perfect_month', 'perfect_week_streak', 'perfectWeeksBestStreak'),
       ('reading_days_30', 'reading_days_total', 'totalReadingDays'),
       ('reading_days_100', 'reading_days_total', 'totalReadingDays'),
       ('reading_days_365', 'reading_days_total', 'totalReadingDays');
