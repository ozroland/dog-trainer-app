import { supabase } from './supabase';

export type LeaderboardCategory = 'walks' | 'distance' | 'streak' | 'lessons';
export type LeaderboardTimeframe = 'daily' | 'weekly' | 'alltime';

export interface LeaderboardEntry {
    rank: number;
    dogName: string;
    displayName: string | null;
    score: number;
    userId: string;
    dogId: string;
    isCurrentUser: boolean;
    isFollowed?: boolean;
    trend?: 'up' | 'down' | 'same' | null;
    trendValue?: number;
    weeklyActivity?: number[]; // Last 4 weeks of activity for sparkline
    isNewRecord?: boolean;
}

export interface PersonalBest {
    category: LeaderboardCategory;
    bestScore: number;
    previousBest: number | null;
    achievedAt: string;
    isNew: boolean;
}

export interface FollowedDog {
    dogId: string;
    dogName: string;
    ownerName: string | null;
    currentRank: number;
    score: number;
}

/**
 * Get leaderboard entries for a specific category.
 * Only returns public profiles.
 */
export async function getLeaderboard(
    category: LeaderboardCategory,
    limit: number = 20,
    currentUserId?: string
): Promise<LeaderboardEntry[]> {
    try {
        const columnMap: Record<LeaderboardCategory, string> = {
            walks: 'total_walks',
            distance: 'total_distance_meters',
            streak: 'best_streak',
            lessons: 'total_lessons',
        };

        const orderColumn = columnMap[category];

        // Get main leaderboard data
        const { data, error } = await supabase
            .from('leaderboard_stats')
            .select(`
                user_id,
                dog_id,
                dog_name,
                total_walks,
                total_distance_meters,
                best_streak,
                total_lessons,
                profiles!inner(display_name, is_public)
            `)
            .eq('profiles.is_public', true)
            .order(orderColumn, { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Leaderboard] Error fetching:', error);
            return [];
        }

        // Get user's followed dogs if logged in
        let followedDogIds: string[] = [];
        if (currentUserId) {
            const { data: follows } = await supabase
                .from('dog_follows')
                .select('followed_dog_id')
                .eq('follower_user_id', currentUserId);
            followedDogIds = (follows || []).map(f => f.followed_dog_id);
        }

        // Get trend data (compare to 7 days ago)
        const dogIds = (data || []).map((d: any) => d.dog_id);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const { data: historyData } = await supabase
            .from('leaderboard_history')
            .select('dog_id, rank_walks, rank_distance, rank_streak, rank_lessons')
            .in('dog_id', dogIds)
            .eq('snapshot_date', weekAgoStr);

        const historyMap = new Map((historyData || []).map(h => [h.dog_id, h]));

        // Get weekly activity for sparklines
        const { data: weeklyData } = await supabase
            .from('weekly_activity')
            .select('dog_id, week_start, walks_count, total_distance, lessons_completed')
            .in('dog_id', dogIds)
            .order('week_start', { ascending: false })
            .limit(dogIds.length * 4);

        const weeklyMap = new Map<string, number[]>();
        (weeklyData || []).forEach((w: any) => {
            if (!weeklyMap.has(w.dog_id)) weeklyMap.set(w.dog_id, []);
            const arr = weeklyMap.get(w.dog_id)!;
            if (arr.length < 4) {
                const value = category === 'distance' ? w.total_distance :
                    category === 'lessons' ? w.lessons_completed : w.walks_count;
                arr.push(value);
            }
        });

        // Get personal bests to mark new records
        let personalBestsMap = new Map<string, boolean>();
        if (currentUserId) {
            const { data: pbData } = await supabase
                .from('personal_bests')
                .select('dog_id, category, achieved_at')
                .eq('category', category);

            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            (pbData || []).forEach((pb: any) => {
                const achievedAt = new Date(pb.achieved_at);
                if (achievedAt > oneDayAgo) {
                    personalBestsMap.set(pb.dog_id, true);
                }
            });
        }

        const rankColumn = `rank_${category}` as keyof typeof historyMap extends never ? string : string;

        // Transform and rank
        return (data || []).map((entry: any, index: number) => {
            const currentRank = index + 1;
            const history = historyMap.get(entry.dog_id);
            let trend: 'up' | 'down' | 'same' | null = null;
            let trendValue = 0;

            if (history) {
                const oldRank = (history as any)[`rank_${category}`];
                if (oldRank) {
                    if (oldRank > currentRank) {
                        trend = 'up';
                        trendValue = oldRank - currentRank;
                    } else if (oldRank < currentRank) {
                        trend = 'down';
                        trendValue = currentRank - oldRank;
                    } else {
                        trend = 'same';
                    }
                }
            }

            return {
                rank: currentRank,
                dogName: entry.dog_name,
                displayName: entry.profiles?.display_name || null,
                score: entry[orderColumn],
                userId: entry.user_id,
                dogId: entry.dog_id,
                isCurrentUser: currentUserId === entry.user_id,
                isFollowed: followedDogIds.includes(entry.dog_id),
                trend,
                trendValue,
                weeklyActivity: weeklyMap.get(entry.dog_id)?.reverse() || [],
                isNewRecord: personalBestsMap.get(entry.dog_id) || false,
            };
        });

    } catch (error) {
        console.error('[Leaderboard] Exception:', error);
        return [];
    }
}

/**
 * Follow a dog
 */
export async function followDog(dogId: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('dog_follows')
            .insert({
                follower_user_id: user.id,
                followed_dog_id: dogId
            });

        return !error;
    } catch (error) {
        console.error('[Leaderboard] Error following dog:', error);
        return false;
    }
}

/**
 * Unfollow a dog
 */
export async function unfollowDog(dogId: string): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('dog_follows')
            .delete()
            .eq('follower_user_id', user.id)
            .eq('followed_dog_id', dogId);

        return !error;
    } catch (error) {
        console.error('[Leaderboard] Error unfollowing dog:', error);
        return false;
    }
}

/**
 * Get list of followed dogs with their current rankings
 */
export async function getFollowedDogs(category: LeaderboardCategory): Promise<FollowedDog[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const columnMap: Record<LeaderboardCategory, string> = {
            walks: 'total_walks',
            distance: 'total_distance_meters',
            streak: 'best_streak',
            lessons: 'total_lessons',
        };

        const { data: follows, error } = await supabase
            .from('dog_follows')
            .select(`
                followed_dog_id,
                dogs:followed_dog_id(name),
                leaderboard_stats:followed_dog_id(
                    total_walks,
                    total_distance_meters,
                    best_streak,
                    total_lessons,
                    profiles(display_name)
                )
            `)
            .eq('follower_user_id', user.id);

        if (error || !follows) return [];

        // Get all entries to calculate rank
        const allEntries = await getLeaderboard(category, 100);

        return follows.map((f: any) => {
            const dogId = f.followed_dog_id;
            const entry = allEntries.find(e => e.dogId === dogId);
            return {
                dogId,
                dogName: f.dogs?.name || 'Unknown',
                ownerName: f.leaderboard_stats?.profiles?.display_name || null,
                currentRank: entry?.rank || 0,
                score: entry?.score || 0,
            };
        });
    } catch (error) {
        console.error('[Leaderboard] Error getting followed dogs:', error);
        return [];
    }
}

/**
 * Get personal bests for a dog
 */
export async function getPersonalBests(dogId: string): Promise<PersonalBest[]> {
    try {
        const { data, error } = await supabase
            .from('personal_bests')
            .select('category, best_score, previous_best, achieved_at')
            .eq('dog_id', dogId);

        if (error || !data) return [];

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        return data.map((pb: any) => ({
            category: pb.category as LeaderboardCategory,
            bestScore: pb.best_score,
            previousBest: pb.previous_best,
            achievedAt: pb.achieved_at,
            isNew: new Date(pb.achieved_at) > oneDayAgo,
        }));
    } catch (error) {
        console.error('[Leaderboard] Error getting personal bests:', error);
        return [];
    }
}

/**
 * Get current user's rank in a category.
 */
export async function getCurrentUserRank(
    category: LeaderboardCategory,
    userId: string,
    dogId: string
): Promise<number | null> {
    try {
        const columnMap: Record<LeaderboardCategory, string> = {
            walks: 'total_walks',
            distance: 'total_distance_meters',
            streak: 'best_streak',
            lessons: 'total_lessons',
        };

        const orderColumn = columnMap[category];

        const { data: userStats, error: userError } = await supabase
            .from('leaderboard_stats')
            .select(orderColumn)
            .eq('dog_id', dogId)
            .single();

        if (userError || !userStats) return null;

        const statsRecord = userStats as unknown as Record<string, number>;
        const userScore = statsRecord[orderColumn] || 0;

        const { count, error: countError } = await supabase
            .from('leaderboard_stats')
            .select('*', { count: 'exact', head: true })
            .gt(orderColumn, userScore);

        if (countError) return null;

        return (count || 0) + 1;

    } catch (error) {
        console.error('[Leaderboard] Error getting rank:', error);
        return null;
    }
}

/**
 * Update current user's leaderboard stats.
 */
export async function updateUserStats(dogId: string): Promise<void> {
    try {
        const { error } = await supabase.rpc('update_leaderboard_stats', {
            p_dog_id: dogId
        });

        if (error) {
            console.error('[Leaderboard] Error updating stats:', error);
        }
    } catch (error) {
        console.error('[Leaderboard] Exception updating stats:', error);
    }
}

/**
 * Opt in/out of public leaderboard.
 */
export async function setPublicProfile(
    isPublic: boolean,
    displayName?: string
): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const updateData: { is_public: boolean; display_name?: string } = {
            is_public: isPublic,
        };

        if (displayName !== undefined) {
            updateData.display_name = displayName;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error('[Leaderboard] Error setting public profile:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[Leaderboard] Exception:', error);
        return false;
    }
}

/**
 * Check if user has opted into public leaderboard.
 */
export async function isProfilePublic(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('profiles')
            .select('is_public')
            .eq('id', user.id)
            .single();

        if (error) return false;
        return data?.is_public || false;
    } catch {
        return false;
    }
}

/**
 * Get category display info.
 */
export function getCategoryInfo(category: LeaderboardCategory): {
    title: string;
    icon: string;
    unit: string;
    formatScore: (score: number) => string;
} {
    switch (category) {
        case 'walks':
            return {
                title: 'Most Walks',
                icon: 'walk',
                unit: 'walks',
                formatScore: (s) => `${s} walk${s !== 1 ? 's' : ''}`,
            };
        case 'distance':
            return {
                title: 'Longest Distance',
                icon: 'map',
                unit: 'km',
                formatScore: (s) => {
                    if (s >= 1000) return `${(s / 1000).toFixed(1)} km`;
                    return `${s} m`;
                },
            };
        case 'streak':
            return {
                title: 'Best Streak',
                icon: 'flame',
                unit: 'days',
                formatScore: (s) => `${s}-day streak`,
            };
        case 'lessons':
            return {
                title: 'Most Lessons',
                icon: 'book',
                unit: 'lessons',
                formatScore: (s) => `${s} lesson${s !== 1 ? 's' : ''}`,
            };
    }
}
