import { supabase } from './supabase';
import { TrainingSession, Lesson, ProgressWithLesson } from '../types';

/**
 * Calculate current training streak for a dog.
 * 
 * A streak counts consecutive days where at least one training session occurred.
 * Multiple sessions on the same day count as 1 day toward the streak.
 */
export async function calculateStreak(dogId: string): Promise<number> {
    try {
        const { data: sessions, error } = await supabase
            .from('training_sessions')
            .select('trained_at')
            .eq('dog_id', dogId)
            .order('trained_at', { ascending: false });

        if (error || !sessions || sessions.length === 0) return 0;

        // Deduplicate sessions by date (YYYY-MM-DD format)
        const uniqueDateStrings = [...new Set(
            sessions.map(s => {
                const d = new Date(s.trained_at);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            })
        )].sort().reverse(); // Most recent first

        if (uniqueDateStrings.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < uniqueDateStrings.length; i++) {
            const [year, month, day] = uniqueDateStrings[i].split('-').map(Number);
            const sessionDate = new Date(year, month - 1, day);

            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            expectedDate.setHours(0, 0, 0, 0);

            if (sessionDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    } catch (error) {
        console.error('Error calculating streak:', error);
        return 0;
    }
}

/**
 * Get a random "daily" lesson (same lesson for the same day)
 * Only returns lessons that are unlocked for the given dog
 */
export async function getDailyLesson(dogId?: string): Promise<Lesson | null> {
    try {
        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('*');

        if (error || !lessons || lessons.length === 0) return null;

        let unlockedLessons = lessons;

        // If we have a dogId, filter to only unlocked lessons
        if (dogId) {
            // Get completed lessons for this dog
            const { data: progressData } = await supabase
                .from('progress')
                .select('lesson_id, lessons(difficulty)')
                .eq('dog_id', dogId)
                .eq('status', 'Completed');

            const completedLessons = progressData || [];

            // Count completed by difficulty
            const beginnerCount = completedLessons.filter(
                (p: any) => p.lessons?.difficulty === 'Beginner'
            ).length;
            const intermediateCount = completedLessons.filter(
                (p: any) => p.lessons?.difficulty === 'Intermediate'
            ).length;

            // Filter to only unlocked lessons
            unlockedLessons = lessons.filter(lesson => {
                if (lesson.difficulty === 'Beginner') {
                    return true; // Always unlocked
                }
                if (lesson.difficulty === 'Intermediate') {
                    return beginnerCount >= 3; // Need 3 beginner lessons
                }
                if (lesson.difficulty === 'Advanced') {
                    return intermediateCount >= 3; // Need 3 intermediate lessons
                }
                return true;
            });

            // If no unlocked lessons, fall back to beginner only
            if (unlockedLessons.length === 0) {
                unlockedLessons = lessons.filter(l => l.difficulty === 'Beginner');
            }
        }

        if (unlockedLessons.length === 0) return null;

        // Use date as seed for consistent daily lesson
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const index = seed % unlockedLessons.length;

        return unlockedLessons[index];
    } catch (error) {
        console.error('Error getting daily lesson:', error);
        return null;
    }
}

/**
 * Get training stats for a dog
 */
export async function getDogStats(dogId: string) {
    try {
        // Get completed lessons count
        const { data: progress, error: progressError } = await supabase
            .from('progress')
            .select('*, lessons(duration_minutes)')
            .eq('dog_id', dogId)
            .eq('status', 'Completed');

        if (progressError) throw progressError;

        const completedLessons = progress?.length || 0;
        const totalMinutes = (progress as ProgressWithLesson[] | null)?.reduce((sum, p) =>
            sum + (p.lessons?.duration_minutes || 0), 0) || 0;

        // Get current streak
        const streak = await calculateStreak(dogId);

        // Get training sessions for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: sessions, error: sessionsError } = await supabase
            .from('training_sessions')
            .select('trained_at')
            .eq('dog_id', dogId)
            .gte('trained_at', sevenDaysAgo.toISOString().split('T')[0]);

        if (sessionsError) throw sessionsError;

        return {
            completedLessons,
            totalMinutes,
            streak,
            recentSessions: sessions || [],
        };
    } catch (error) {
        console.error('Error getting dog stats:', error);
        return {
            completedLessons: 0,
            totalMinutes: 0,
            streak: 0,
            recentSessions: [],
        };
    }
}

export function getSmartGreeting(streak: number): string {
    const hour = new Date().getHours();

    if (streak > 3 && Math.random() > 0.7) {
        return 'greeting.on_fire';
    }

    if (hour < 5) return 'greeting.early_bird';
    if (hour < 12) return 'greeting.morning';
    if (hour < 17) return 'greeting.afternoon';
    if (hour < 21) return 'greeting.evening';
    return 'greeting.night';
}
