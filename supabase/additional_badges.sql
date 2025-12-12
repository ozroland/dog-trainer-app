-- Additional achievements/badges for DogTrainerApp v1
-- Run this after gamification.sql

INSERT INTO achievements (id, title, description, icon, condition_type, condition_value, title_hu, description_hu) VALUES

-- Lesson milestones
('lesson_explorer', 'Lesson Explorer', 'Complete 10 lessons', 'compass', 'lesson_count', 10,
 'Lecke Felfedező', 'Teljesíts 10 leckét'),

('training_pro', 'Training Pro', 'Complete 20 lessons', 'ribbon', 'lesson_count', 20,
 'Kiképzési Profi', 'Teljesíts 20 leckét'),

('master_trainer', 'Master Trainer', 'Complete all lessons', 'star', 'lesson_count', 15,
 'Mesterkiképző', 'Teljesíts minden leckét'),

-- Streak achievements
('week_warrior', 'Week Warrior', 'Maintain a 7-day training streak', 'calendar', 'streak_days', 7,
 'Hét Harcosa', 'Tarts fenn 7 napos edzéssorozatot'),

('streak_legend', 'Streak Legend', 'Maintain a 30-day training streak', 'trophy', 'streak_days', 30,
 'Sorozat Legenda', 'Tarts fenn 30 napos edzéssorozatot'),

-- Walk achievements
('first_walk', 'First Walk', 'Complete your first tracked walk', 'footsteps', 'walk_count', 1,
 'Első Séta', 'Teljesítsd az első nyomkövetett sétádat'),

('walk_enthusiast', 'Walk Enthusiast', 'Complete 10 walks', 'walk', 'walk_count', 10,
 'Séta Rajongó', 'Teljesíts 10 sétát'),

('marathon_walker', 'Marathon Walker', 'Walk a total of 42km', 'map', 'total_distance', 42000,
 'Maratoni Sétáló', 'Sétálj összesen 42 km-t'),

-- Difficulty milestones
('beginner_complete', 'Beginner Graduate', 'Complete all beginner lessons', 'school-outline', 'difficulty_complete', 1,
 'Kezdő Diplomás', 'Teljesítsd az összes kezdő leckét'),

('intermediate_complete', 'Intermediate Champion', 'Complete all intermediate lessons', 'medal', 'difficulty_complete', 2,
 'Középhaladó Bajnok', 'Teljesítsd az összes középhaladó leckét'),

('advanced_complete', 'Advanced Expert', 'Complete all advanced lessons', 'diamond', 'difficulty_complete', 3,
 'Haladó Szakértő', 'Teljesítsd az összes haladó leckét'),

-- Special badges
('health_tracker', 'Health Hero', 'Log 5 health records', 'heart', 'health_count', 5,
 'Egészség Hős', 'Jegyezz fel 5 egészségügyi rekordot'),

('photo_lover', 'Photo Fanatic', 'Upload 10 photos of your dog', 'camera', 'photo_count', 10,
 'Fotó Rajongó', 'Tölts fel 10 fotót a kutyádról'),

('early_bird', 'Early Bird', 'Complete a training session before 8 AM', 'sunny', 'early_training', 1,
 'Korán Kelő', 'Teljesíts egy edzést reggel 8 előtt'),

('night_owl', 'Night Owl', 'Complete a training session after 9 PM', 'moon', 'late_training', 1,
 'Éjszakai Bagoly', 'Teljesíts egy edzést este 9 után')

ON CONFLICT (id) DO NOTHING;
