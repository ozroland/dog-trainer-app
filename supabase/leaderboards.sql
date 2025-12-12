-- ============================================
-- Leaderboard Schema
-- Migration V010: Leaderboards
-- ============================================

-- Add public profile opt-in to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================
-- Leaderboard Stats Table
-- Aggregated stats for fast leaderboard queries
-- ============================================
CREATE TABLE IF NOT EXISTS public.leaderboard_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
    dog_name TEXT NOT NULL,
    
    -- Stats for different categories
    total_walks INTEGER DEFAULT 0,
    total_distance_meters INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    total_training_minutes INTEGER DEFAULT 0,
    
    -- Timestamps
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id, dog_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_user ON leaderboard_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_walks ON leaderboard_stats(total_walks DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_distance ON leaderboard_stats(total_distance_meters DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_streak ON leaderboard_stats(best_streak DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_stats_lessons ON leaderboard_stats(total_lessons DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- Users can see their own stats always
CREATE POLICY "Users can view own stats"
ON leaderboard_stats FOR SELECT
USING (auth.uid() = user_id);

-- Users can see public profiles' stats
CREATE POLICY "View public leaderboard stats"
ON leaderboard_stats FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = leaderboard_stats.user_id 
        AND profiles.is_public = true
    )
);

-- Users can update their own stats
CREATE POLICY "Users can update own stats"
ON leaderboard_stats FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
ON leaderboard_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Function to update leaderboard stats
-- Called after walks/lessons complete
-- ============================================
CREATE OR REPLACE FUNCTION update_leaderboard_stats(p_dog_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_dog_name TEXT;
    v_total_walks INTEGER;
    v_total_distance INTEGER;
    v_total_lessons INTEGER;
    v_streak INTEGER;
BEGIN
    -- Get dog info
    SELECT owner_id, name INTO v_user_id, v_dog_name
    FROM dogs WHERE id = p_dog_id;
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate totals
    SELECT COUNT(*), COALESCE(SUM(distance_meters), 0)
    INTO v_total_walks, v_total_distance
    FROM walks WHERE dog_id = p_dog_id AND end_time IS NOT NULL;
    
    SELECT COUNT(DISTINCT lesson_id)
    INTO v_total_lessons
    FROM progress WHERE dog_id = p_dog_id;
    
    -- Simplified streak (could enhance later)
    v_streak := 0;
    
    -- Upsert stats
    INSERT INTO leaderboard_stats (
        user_id, dog_id, dog_name,
        total_walks, total_distance_meters,
        total_lessons, current_streak, best_streak,
        updated_at
    ) VALUES (
        v_user_id, p_dog_id, v_dog_name,
        v_total_walks, v_total_distance,
        v_total_lessons, v_streak, v_streak,
        now()
    )
    ON CONFLICT (user_id, dog_id) DO UPDATE SET
        dog_name = EXCLUDED.dog_name,
        total_walks = EXCLUDED.total_walks,
        total_distance_meters = EXCLUDED.total_distance_meters,
        total_lessons = EXCLUDED.total_lessons,
        updated_at = now();
END;
$$;

-- ============================================
-- Trigger to auto-update stats after walk
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_leaderboard_after_walk()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM update_leaderboard_stats(NEW.dog_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_leaderboard_on_walk ON walks;
CREATE TRIGGER update_leaderboard_on_walk
    AFTER INSERT OR UPDATE ON walks
    FOR EACH ROW
    WHEN (NEW.end_time IS NOT NULL)
    EXECUTE FUNCTION trigger_update_leaderboard_after_walk();

-- ============================================
-- Record migration
-- ============================================
INSERT INTO schema_migrations (version, name) VALUES (10, 'leaderboards')
ON CONFLICT DO NOTHING;
