-- ============================================
-- Advanced Leaderboard Features
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DOG FOLLOWS / RIVALRY SYSTEM
-- Allows users to follow/track specific dogs
CREATE TABLE IF NOT EXISTS dog_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_user_id, followed_dog_id)
);

-- Enable RLS
ALTER TABLE dog_follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows
CREATE POLICY "Users can view own follows" ON dog_follows
    FOR SELECT USING (auth.uid() = follower_user_id);

-- Users can follow/unfollow dogs
CREATE POLICY "Users can insert own follows" ON dog_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can delete own follows" ON dog_follows
    FOR DELETE USING (auth.uid() = follower_user_id);


-- 2. LEADERBOARD HISTORY (for trend indicators)
-- Stores daily snapshots of rankings
CREATE TABLE IF NOT EXISTS leaderboard_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rank_walks INTEGER,
    rank_distance INTEGER,
    rank_streak INTEGER,
    rank_lessons INTEGER,
    score_walks INTEGER DEFAULT 0,
    score_distance INTEGER DEFAULT 0,
    score_streak INTEGER DEFAULT 0,
    score_lessons INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dog_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE leaderboard_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view leaderboard history for public profiles
CREATE POLICY "View leaderboard history" ON leaderboard_history
    FOR SELECT USING (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_history_dog_date 
    ON leaderboard_history(dog_id, snapshot_date DESC);


-- 3. PERSONAL BESTS
-- Tracks personal records for achievements
CREATE TABLE IF NOT EXISTS personal_bests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'walks', 'distance', 'streak', 'lessons', 'single_walk_distance'
    best_score DECIMAL NOT NULL,
    previous_best DECIMAL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dog_id, category)
);

-- Enable RLS
ALTER TABLE personal_bests ENABLE ROW LEVEL SECURITY;

-- Users can view their own personal bests
CREATE POLICY "View own personal bests" ON personal_bests
    FOR SELECT USING (auth.uid() = user_id);

-- System can update personal bests
CREATE POLICY "Update own personal bests" ON personal_bests
    FOR ALL USING (auth.uid() = user_id);


-- 4. WEEKLY ACTIVITY SUMMARY (for sparklines)
-- Aggregated weekly data for sparkline charts
CREATE TABLE IF NOT EXISTS weekly_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, -- Always a Monday
    walks_count INTEGER DEFAULT 0,
    total_distance INTEGER DEFAULT 0, -- meters
    lessons_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dog_id, week_start)
);

-- Enable RLS
ALTER TABLE weekly_activity ENABLE ROW LEVEL SECURITY;

-- Public profiles' activity is viewable
CREATE POLICY "View weekly activity" ON weekly_activity
    FOR SELECT USING (true);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_weekly_activity_dog_week 
    ON weekly_activity(dog_id, week_start DESC);


-- 5. FUNCTION: Update personal bests on leaderboard stat change
CREATE OR REPLACE FUNCTION update_personal_bests()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user_id for this dog
    SELECT owner_id INTO v_user_id FROM dogs WHERE id = NEW.dog_id;
    
    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Update personal bests for each category
    INSERT INTO personal_bests (dog_id, user_id, category, best_score, previous_best, achieved_at)
    VALUES (NEW.dog_id, v_user_id, 'walks', NEW.total_walks, NULL, NOW())
    ON CONFLICT (dog_id, category) DO UPDATE
    SET previous_best = personal_bests.best_score,
        best_score = GREATEST(personal_bests.best_score, EXCLUDED.best_score),
        achieved_at = CASE WHEN EXCLUDED.best_score > personal_bests.best_score THEN NOW() ELSE personal_bests.achieved_at END;

    INSERT INTO personal_bests (dog_id, user_id, category, best_score, previous_best, achieved_at)
    VALUES (NEW.dog_id, v_user_id, 'distance', NEW.total_distance_meters, NULL, NOW())
    ON CONFLICT (dog_id, category) DO UPDATE
    SET previous_best = personal_bests.best_score,
        best_score = GREATEST(personal_bests.best_score, EXCLUDED.best_score),
        achieved_at = CASE WHEN EXCLUDED.best_score > personal_bests.best_score THEN NOW() ELSE personal_bests.achieved_at END;

    INSERT INTO personal_bests (dog_id, user_id, category, best_score, previous_best, achieved_at)
    VALUES (NEW.dog_id, v_user_id, 'streak', NEW.best_streak, NULL, NOW())
    ON CONFLICT (dog_id, category) DO UPDATE
    SET previous_best = personal_bests.best_score,
        best_score = GREATEST(personal_bests.best_score, EXCLUDED.best_score),
        achieved_at = CASE WHEN EXCLUDED.best_score > personal_bests.best_score THEN NOW() ELSE personal_bests.achieved_at END;

    INSERT INTO personal_bests (dog_id, user_id, category, best_score, previous_best, achieved_at)
    VALUES (NEW.dog_id, v_user_id, 'lessons', NEW.total_lessons, NULL, NOW())
    ON CONFLICT (dog_id, category) DO UPDATE
    SET previous_best = personal_bests.best_score,
        best_score = GREATEST(personal_bests.best_score, EXCLUDED.best_score),
        achieved_at = CASE WHEN EXCLUDED.best_score > personal_bests.best_score THEN NOW() ELSE personal_bests.achieved_at END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on leaderboard_stats update
DROP TRIGGER IF EXISTS trigger_update_personal_bests ON leaderboard_stats;
CREATE TRIGGER trigger_update_personal_bests
    AFTER INSERT OR UPDATE ON leaderboard_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_personal_bests();


-- 6. FUNCTION: Daily snapshot for leaderboard history
-- Should be called by a cron job or Supabase Edge Function daily
CREATE OR REPLACE FUNCTION take_leaderboard_snapshot()
RETURNS void AS $$
DECLARE
    r RECORD;
    v_rank_walks INTEGER := 0;
    v_rank_distance INTEGER := 0;
    v_rank_streak INTEGER := 0;
    v_rank_lessons INTEGER := 0;
BEGIN
    -- Calculate ranks for each category and insert snapshot
    FOR r IN (
        SELECT 
            ls.dog_id,
            ls.total_walks,
            ls.total_distance_meters,
            ls.best_streak,
            ls.total_lessons,
            ROW_NUMBER() OVER (ORDER BY ls.total_walks DESC) as rw,
            ROW_NUMBER() OVER (ORDER BY ls.total_distance_meters DESC) as rd,
            ROW_NUMBER() OVER (ORDER BY ls.best_streak DESC) as rs,
            ROW_NUMBER() OVER (ORDER BY ls.total_lessons DESC) as rl
        FROM leaderboard_stats ls
        JOIN profiles p ON ls.user_id = p.id
        WHERE p.is_public = true
    ) LOOP
        INSERT INTO leaderboard_history (
            dog_id, snapshot_date,
            rank_walks, rank_distance, rank_streak, rank_lessons,
            score_walks, score_distance, score_streak, score_lessons
        ) VALUES (
            r.dog_id, CURRENT_DATE,
            r.rw, r.rd, r.rs, r.rl,
            r.total_walks, r.total_distance_meters, r.best_streak, r.total_lessons
        )
        ON CONFLICT (dog_id, snapshot_date) DO UPDATE
        SET rank_walks = EXCLUDED.rank_walks,
            rank_distance = EXCLUDED.rank_distance,
            rank_streak = EXCLUDED.rank_streak,
            rank_lessons = EXCLUDED.rank_lessons,
            score_walks = EXCLUDED.score_walks,
            score_distance = EXCLUDED.score_distance,
            score_streak = EXCLUDED.score_streak,
            score_lessons = EXCLUDED.score_lessons;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. FUNCTION: Update weekly activity when walk completes
CREATE OR REPLACE FUNCTION update_weekly_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_week_start DATE;
BEGIN
    -- Calculate the Monday of the current week
    v_week_start := DATE_TRUNC('week', NEW.created_at)::DATE;
    
    -- Upsert weekly activity
    INSERT INTO weekly_activity (dog_id, week_start, walks_count, total_distance)
    VALUES (NEW.dog_id, v_week_start, 1, COALESCE(NEW.distance_meters, 0))
    ON CONFLICT (dog_id, week_start) DO UPDATE
    SET walks_count = weekly_activity.walks_count + 1,
        total_distance = weekly_activity.total_distance + COALESCE(NEW.distance_meters, 0),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if walks table exists before creating trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'walks') THEN
        DROP TRIGGER IF EXISTS trigger_update_weekly_activity ON walks;
        CREATE TRIGGER trigger_update_weekly_activity
            AFTER INSERT ON walks
            FOR EACH ROW
            EXECUTE FUNCTION update_weekly_activity();
    END IF;
END $$;


-- 8. Grant permissions
GRANT SELECT ON dog_follows TO authenticated;
GRANT INSERT, DELETE ON dog_follows TO authenticated;
GRANT SELECT ON leaderboard_history TO authenticated;
GRANT SELECT ON personal_bests TO authenticated;
GRANT ALL ON personal_bests TO authenticated;
GRANT SELECT ON weekly_activity TO authenticated;
