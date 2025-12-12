import { supabase } from './supabase';
import { Achievement } from '../types';
import { calculateStreak } from './trainingUtils';

interface AchievementCheckResult {
    newlyUnlocked: Achievement[];
}

export async function checkAndUnlockAchievements(dogId: string): Promise<AchievementCheckResult> {
    const newlyUnlocked: Achievement[] = [];

    try {
        // Get all achievements
        const { data: achievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*');

        if (achievementsError) throw achievementsError;

        // Get already unlocked achievements for this dog
        const { data: unlockedAchievements, error: unlockedError } = await supabase
            .from('dog_achievements')
            .select('achievement_id')
            .eq('dog_id', dogId);

        if (unlockedError) throw unlockedError;

        const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || []);

        // ==========================================
        // GATHER ALL STATS NEEDED FOR ACHIEVEMENTS
        // ==========================================

        // 1. Completed lessons count
        const { data: progress, error: progressError } = await supabase
            .from('progress')
            .select('lesson_id, completed_at')
            .eq('dog_id', dogId)
            .eq('status', 'Completed');

        if (progressError) throw progressError;

        const completedLessonsCount = progress?.length || 0;

        // 2. Walk stats
        const { data: walks, error: walksError } = await supabase
            .from('walks')
            .select('id, distance_meters')
            .eq('dog_id', dogId)
            .not('end_time', 'is', null);

        if (walksError) throw walksError;

        const completedWalksCount = walks?.length || 0;
        const totalDistanceMeters = walks?.reduce((sum, w) => sum + (w.distance_meters || 0), 0) || 0;

        // 3. Training streak
        const currentStreak = await calculateStreak(dogId);

        // 4. Difficulty completion counts
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('id, difficulty');

        if (lessonsError) throw lessonsError;

        const completedLessonIds = new Set(progress?.map(p => p.lesson_id) || []);

        const beginnerLessons = lessons?.filter(l => l.difficulty === 'Beginner') || [];
        const intermediateLessons = lessons?.filter(l => l.difficulty === 'Intermediate') || [];
        const advancedLessons = lessons?.filter(l => l.difficulty === 'Advanced') || [];

        const allBeginnerComplete = beginnerLessons.length > 0 &&
            beginnerLessons.every(l => completedLessonIds.has(l.id));
        const allIntermediateComplete = intermediateLessons.length > 0 &&
            intermediateLessons.every(l => completedLessonIds.has(l.id));
        const allAdvancedComplete = advancedLessons.length > 0 &&
            advancedLessons.every(l => completedLessonIds.has(l.id));

        // 5. Health records count
        const { data: healthRecords, error: healthError } = await supabase
            .from('health_records')
            .select('id')
            .eq('dog_id', dogId);

        if (healthError) throw healthError;

        const healthRecordsCount = healthRecords?.length || 0;

        // 6. Training sessions for early/late training
        const { data: sessions, error: sessionsError } = await supabase
            .from('training_sessions')
            .select('trained_at')
            .eq('dog_id', dogId);

        if (sessionsError) throw sessionsError;

        // Check for early training (before 8 AM)
        const hasEarlyTraining = sessions?.some(s => {
            const hour = new Date(s.trained_at).getHours();
            return hour < 8;
        }) || false;

        // Check for late training (after 9 PM = 21:00)
        const hasLateTraining = sessions?.some(s => {
            const hour = new Date(s.trained_at).getHours();
            return hour >= 21;
        }) || false;

        // 7. Photo count for photo_lover badge
        const { data: photosData, error: photosError } = await supabase
            .from('photos')
            .select('id')
            .eq('dog_id', dogId);

        if (photosError) {
            console.log('Photos table may not exist yet:', photosError.message);
        }

        const photoCount = photosData?.length || 0;

        // ==========================================
        // CHECK EACH ACHIEVEMENT
        // ==========================================

        for (const achievement of achievements || []) {
            // Skip if already unlocked
            if (unlockedIds.has(achievement.id)) continue;

            let shouldUnlock = false;

            switch (achievement.condition_type) {
                case 'lesson_count':
                    shouldUnlock = completedLessonsCount >= achievement.condition_value;
                    break;

                case 'walk_count':
                    shouldUnlock = completedWalksCount >= achievement.condition_value;
                    break;

                case 'total_distance':
                    shouldUnlock = totalDistanceMeters >= achievement.condition_value;
                    break;

                case 'streak_days':
                    shouldUnlock = currentStreak >= achievement.condition_value;
                    break;

                case 'difficulty_complete':
                    // condition_value: 1 = beginner, 2 = intermediate, 3 = advanced
                    if (achievement.condition_value === 1) {
                        shouldUnlock = allBeginnerComplete;
                    } else if (achievement.condition_value === 2) {
                        shouldUnlock = allIntermediateComplete;
                    } else if (achievement.condition_value === 3) {
                        shouldUnlock = allAdvancedComplete;
                    }
                    break;

                case 'health_count':
                    shouldUnlock = healthRecordsCount >= achievement.condition_value;
                    break;

                case 'early_training':
                    shouldUnlock = hasEarlyTraining;
                    break;

                case 'late_training':
                    shouldUnlock = hasLateTraining;
                    break;

                case 'photo_count':
                    // Skip for v1 - would need photos table
                    shouldUnlock = photoCount >= achievement.condition_value;
                    break;

                case 'specific_lesson':
                    // Check if a specific lesson ID was completed
                    shouldUnlock = completedLessonIds.has(String(achievement.condition_value));
                    break;
            }

            if (shouldUnlock) {
                // Unlock the achievement
                const { error: unlockError } = await supabase
                    .from('dog_achievements')
                    .insert({
                        dog_id: dogId,
                        achievement_id: achievement.id,
                    });

                if (!unlockError) {
                    newlyUnlocked.push(achievement);
                }
            }
        }
    } catch (error) {
        console.error('Error checking achievements:', error);
    }

    return { newlyUnlocked };
}
