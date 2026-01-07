-- ============================================
-- Fix Leaderboard Streak Calculation
-- This updates the update_leaderboard_stats function
-- to properly calculate streaks from training_sessions
-- ============================================

-- Drop and recreate the function with streak calculation
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
    v_current_streak INTEGER := 0;
    v_best_streak INTEGER := 0;
    v_today DATE;
    v_check_date DATE;
    v_session_date DATE;
    v_streak_count INTEGER := 0;
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
    
    -- Calculate current streak from training_sessions
    -- A streak counts consecutive days with at least one training session
    v_today := CURRENT_DATE;
    v_check_date := v_today;
    v_current_streak := 0;
    
    LOOP
        -- Check if there's a training session on v_check_date
        SELECT trained_at::DATE INTO v_session_date
        FROM training_sessions
        WHERE dog_id = p_dog_id
          AND trained_at::DATE = v_check_date
        LIMIT 1;
        
        IF v_session_date IS NOT NULL THEN
            v_current_streak := v_current_streak + 1;
            v_check_date := v_check_date - INTERVAL '1 day';
        ELSE
            EXIT; -- Break the loop when no session found
        END IF;
        
        -- Safety limit to prevent infinite loops
        IF v_current_streak > 1000 THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Get previous best_streak to compare
    SELECT COALESCE(best_streak, 0) INTO v_best_streak
    FROM leaderboard_stats
    WHERE dog_id = p_dog_id;
    
    -- Update best_streak if current is better
    IF v_current_streak > v_best_streak THEN
        v_best_streak := v_current_streak;
    END IF;
    
    -- Upsert stats
    INSERT INTO leaderboard_stats (
        user_id, dog_id, dog_name,
        total_walks, total_distance_meters,
        total_lessons, current_streak, best_streak,
        updated_at
    ) VALUES (
        v_user_id, p_dog_id, v_dog_name,
        v_total_walks, v_total_distance,
        v_total_lessons, v_current_streak, v_best_streak,
        now()
    )
    ON CONFLICT (user_id, dog_id) DO UPDATE SET
        dog_name = EXCLUDED.dog_name,
        total_walks = EXCLUDED.total_walks,
        total_distance_meters = EXCLUDED.total_distance_meters,
        total_lessons = EXCLUDED.total_lessons,
        current_streak = EXCLUDED.current_streak,
        best_streak = GREATEST(leaderboard_stats.best_streak, EXCLUDED.best_streak),
        updated_at = now();
END;
$$;

-- ============================================
-- Add trigger to update stats after training session
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_leaderboard_after_training()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM update_leaderboard_stats(NEW.dog_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_leaderboard_on_training ON training_sessions;
CREATE TRIGGER update_leaderboard_on_training
    AFTER INSERT ON training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_leaderboard_after_training();

-- ============================================
-- Also add trigger after lesson completion
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_leaderboard_after_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM update_leaderboard_stats(NEW.dog_id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_leaderboard_on_progress ON progress;
CREATE TRIGGER update_leaderboard_on_progress
    AFTER INSERT OR UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_leaderboard_after_progress();
