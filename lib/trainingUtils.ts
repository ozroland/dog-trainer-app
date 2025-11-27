import { supabase } from './supabase';
import { TrainingSession, Lesson } from '../types';

/**
 * Calculate current training streak for a dog
 */
export async function calculateStreak(dogId: string): Promise<number> {
    try {
        const { data: sessions, error } = await supabase
            .from('training_sessions')
            .select('trained_at')
            .eq('dog_id', dogId)
            .order('trained_at', { ascending: false });

        if (error || !sessions || sessions.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sessions.length; i++) {
            const sessionDate = new Date(sessions[i].trained_at);
            sessionDate.setHours(0, 0, 0, 0);

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
 */
export async function getDailyLesson(): Promise<Lesson | null> {
    try {
        const { data: lessons, error } = await supabase
            .from('lessons')
            .select('*');

        if (error || !lessons || lessons.length === 0) return null;

        // Use date as seed for consistent daily lesson
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const index = seed % lessons.length;

        return lessons[index];
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
        const totalMinutes = progress?.reduce((sum, p: any) =>
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

export function getSmartGreeting(dogName: string, streak: number): string {
    const hour = new Date().getHours();

    if (streak > 3 && Math.random() > 0.7) {
        return `${dogName} is on fire! 🔥`;
    }

    if (hour < 5) return `Early bird training for ${dogName}?`;
    if (hour < 12) return `Good morning, ${dogName}!`;
    if (hour < 17) return `Time for a walk, ${dogName}?`;
    if (hour < 21) return `Evening training for ${dogName}`;
    return `Sweet dreams, ${dogName} 🌙`;
}
