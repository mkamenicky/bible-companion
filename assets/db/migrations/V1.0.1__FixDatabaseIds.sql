-- Update to match JavaScript getDay() numbering
UPDATE reading_topics SET day_of_week = 1 WHERE topic_name = 'Law';     -- Monday: stays 1
UPDATE reading_topics SET day_of_week = 2 WHERE topic_name = 'History'; -- Tuesday: stays 2
UPDATE reading_topics SET day_of_week = 3 WHERE topic_name = 'Psalms';  -- Wednesday: stays 3
UPDATE reading_topics SET day_of_week = 4 WHERE topic_name = 'Poetry';  -- Thursday: stays 4
UPDATE reading_topics SET day_of_week = 5 WHERE topic_name = 'Prophecy';-- Friday: stays 5
UPDATE reading_topics SET day_of_week = 6 WHERE topic_name = 'Gospels'; -- Saturday: stays 6
UPDATE reading_topics SET day_of_week = 0 WHERE topic_name = 'Letters'; -- Sunday: 7 -> 0
