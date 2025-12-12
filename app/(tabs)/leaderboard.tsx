import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../../lib/supabase';
import {
    getLeaderboard,
    getCategoryInfo,
    isProfilePublic,
    setPublicProfile,
    followDog,
    unfollowDog,
    LeaderboardEntry,
    LeaderboardCategory,
} from '../../lib/leaderboardService';
import haptics from '../../lib/haptics';
import { Skeleton } from '../../components/ui/Skeleton';

const CATEGORIES: LeaderboardCategory[] = ['walks', 'distance', 'streak', 'lessons'];
type TimeFilter = 'daily' | 'weekly' | 'alltime';

const categoryConfig: Record<LeaderboardCategory, { color: string; bgColor: string; icon: string }> = {
    walks: { color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.15)', icon: 'footsteps' },
    distance: { color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)', icon: 'map' },
    streak: { color: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.15)', icon: 'flame' },
    lessons: { color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)', icon: 'school' },
};

const breedIcons: Record<string, string> = {
    'labrador': '🐕',
    'golden': '🦮',
    'german shepherd': '🐕‍🦺',
    'bulldog': '🐶',
    'poodle': '🐩',
    'beagle': '🐕',
    'default': '🐾',
};

function getBreedIcon(dogName: string): string {
    const lowName = dogName.toLowerCase();
    for (const [breed, icon] of Object.entries(breedIcons)) {
        if (lowName.includes(breed)) return icon;
    }
    return breedIcons.default;
}

// Simple Sparkline component
function Sparkline({ data, color, width = 60, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <View style={{ width, height }}>
            <View className="absolute inset-0 opacity-20" style={{ backgroundColor: color, borderRadius: 4 }} />
            {/* Simple bar representation since SVG isn't available */}
            <View className="flex-row items-end justify-between h-full px-0.5">
                {data.map((value, index) => (
                    <View
                        key={index}
                        style={{
                            width: (width / data.length) - 2,
                            height: Math.max(4, ((value - min) / range) * height),
                            backgroundColor: color,
                            borderRadius: 2,
                            opacity: 0.8 + (index / data.length) * 0.2,
                        }}
                    />
                ))}
            </View>
        </View>
    );
}

// Celebration animation component
function CelebrationBadge({ visible }: { visible: boolean }) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(rotateAnim, {
                            toValue: 1,
                            duration: 300,
                            easing: Easing.ease,
                            useNativeDriver: true,
                        }),
                        Animated.timing(rotateAnim, {
                            toValue: -1,
                            duration: 600,
                            easing: Easing.ease,
                            useNativeDriver: true,
                        }),
                        Animated.timing(rotateAnim, {
                            toValue: 0,
                            duration: 300,
                            easing: Easing.ease,
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-10deg', '0deg', '10deg'],
    });

    return (
        <Animated.View
            style={{
                transform: [{ scale: scaleAnim }, { rotate }],
                position: 'absolute',
                top: -8,
                right: -8,
            }}
        >
            <View className="bg-amber-500 px-2 py-0.5 rounded-full flex-row items-center">
                <Text className="text-xs">🔥</Text>
                <Text className="text-white text-xs font-bold ml-0.5">NEW!</Text>
            </View>
        </Animated.View>
    );
}

export default function LeaderboardScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('walks');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('alltime');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [showOptInPrompt, setShowOptInPrompt] = useState(false);
    const [celebratingRankUp, setCelebratingRankUp] = useState(false);

    // Animation values
    const rankUpAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadInitialData();
    }, []);

    // Reload leaderboard when category, timeFilter, OR currentUserId changes
    useEffect(() => {
        // Only load if we've attempted to get user (currentUserId can be null for logged out users)
        loadLeaderboard();
    }, [selectedCategory, timeFilter, currentUserId]);

    const loadInitialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
            const publicStatus = await isProfilePublic();
            setIsPublic(publicStatus);
            if (!publicStatus) {
                setShowOptInPrompt(true);
            }
        } else {
            // Explicitly set to empty string to trigger leaderboard load for non-logged-in users
            setCurrentUserId('');
        }
    };

    const loadLeaderboard = async () => {
        // Don't load until we know the user status (null means still checking)
        if (currentUserId === null) return;

        setLoading(true);
        const data = await getLeaderboard(selectedCategory, 50, currentUserId || undefined);

        // Check for rank up celebration
        const userEntry = data.find(e => e.isCurrentUser);
        if (userEntry?.trend === 'up' && userEntry.trendValue && userEntry.trendValue > 0) {
            triggerCelebration();
        }

        setEntries(data);
        setLoading(false);
    };

    const triggerCelebration = () => {
        setCelebratingRankUp(true);
        haptics.success();

        Animated.sequence([
            Animated.timing(rankUpAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(rankUpAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setCelebratingRankUp(false));
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadLeaderboard();
        setRefreshing(false);
    }, [selectedCategory, timeFilter]);

    const handleFollow = async (dogId: string, isFollowed: boolean) => {
        haptics.medium();
        if (isFollowed) {
            await unfollowDog(dogId);
        } else {
            await followDog(dogId);
        }
        loadLeaderboard();
    };

    const handleOptIn = async () => {
        Alert.prompt(
            t('leaderboard.opt_in_title') || 'Join the Leaderboard!',
            t('leaderboard.opt_in_message') || 'Enter a display name to show on the leaderboard:',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.save'),
                    onPress: async (displayName?: string) => {
                        haptics.medium();
                        const success = await setPublicProfile(true, displayName || undefined);
                        if (success) {
                            setIsPublic(true);
                            setShowOptInPrompt(false);
                            loadLeaderboard();
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    const handleCategoryChange = (category: LeaderboardCategory) => {
        haptics.selection();
        setSelectedCategory(category);
    };

    const categoryInfo = getCategoryInfo(selectedCategory);
    const config = categoryConfig[selectedCategory];

    // Find current user's entry
    const currentUserEntry = useMemo(() => {
        return entries.find(e => e.isCurrentUser);
    }, [entries]);

    // Calculate distance to next rank for each entry
    const entriesWithGap = useMemo(() => {
        return entries.map((entry, index) => {
            const nextEntry = index > 0 ? entries[index - 1] : null;
            const gapToNext = nextEntry ? nextEntry.score - entry.score : 0;
            const nextName = nextEntry?.dogName || null;
            return { ...entry, gapToNext, nextName };
        });
    }, [entries]);

    // Get followed dogs
    const followedEntries = useMemo(() => {
        return entries.filter(e => e.isFollowed && !e.isCurrentUser);
    }, [entries]);

    // Get nearby rivals
    const nearbyRivals = useMemo(() => {
        if (!currentUserEntry) return [];
        const userRank = currentUserEntry.rank;
        return entries.filter(e => {
            if (e.isCurrentUser) return false;
            const diff = Math.abs(e.rank - userRank);
            return diff > 0 && diff <= 3;
        });
    }, [entries, currentUserEntry]);

    const formatGap = (gap: number, category: LeaderboardCategory): string => {
        switch (category) {
            case 'distance':
                if (gap >= 1000) return `${(gap / 1000).toFixed(1)}km`;
                return `${Math.round(gap)}m`;
            case 'walks':
                return `${gap} walk${gap !== 1 ? 's' : ''}`;
            case 'streak':
                return `${gap} day${gap !== 1 ? 's' : ''}`;
            case 'lessons':
                return `${gap} lesson${gap !== 1 ? 's' : ''}`;
            default:
                return `${gap}`;
        }
    };

    const topThree = entriesWithGap.slice(0, 3);
    const restEntries = entriesWithGap.slice(3);

    const renderTrendIndicator = (entry: LeaderboardEntry) => {
        if (!entry.trend || entry.trend === 'same') return null;

        const isUp = entry.trend === 'up';
        return (
            <View className={`flex-row items-center px-1.5 py-0.5 rounded-full ${isUp ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Ionicons
                    name={isUp ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={isUp ? '#22c55e' : '#ef4444'}
                />
                {entry.trendValue && entry.trendValue > 0 && (
                    <Text className={`text-xs font-bold ml-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.trendValue}
                    </Text>
                )}
            </View>
        );
    };

    const renderPodium = () => {
        if (topThree.length === 0) return null;

        const positions = [
            { entry: topThree[1], place: 2, height: 80, color: '#9ca3af', emoji: '🥈' },
            { entry: topThree[0], place: 1, height: 110, color: '#fbbf24', emoji: '🥇' },
            { entry: topThree[2], place: 3, height: 60, color: '#cd7f32', emoji: '🥉' },
        ];

        return (
            <View className="flex-row justify-center items-end mb-6 px-2">
                {positions.map(({ entry, place, height, color, emoji }, index) => {
                    if (!entry) return <View key={index} style={{ width: 105 }} />;
                    return (
                        <View key={index} className="items-center mx-1 relative" style={{ width: 105 }}>
                            <CelebrationBadge visible={entry.isNewRecord || false} />
                            <Text className="text-2xl mb-1">{emoji}</Text>
                            <View
                                className="w-14 h-14 rounded-full items-center justify-center mb-1 border-2"
                                style={{ borderColor: color, backgroundColor: 'rgba(31, 41, 55, 0.8)' }}
                            >
                                <Text className="text-2xl">{getBreedIcon(entry.dogName)}</Text>
                            </View>
                            <Text className="text-white font-bold text-center text-sm" numberOfLines={1}>
                                {entry.dogName}
                            </Text>
                            {entry.displayName && (
                                <Text className="text-gray-400 text-xs text-center" numberOfLines={1}>
                                    {entry.displayName}
                                </Text>
                            )}
                            {/* Trend indicator */}
                            <View className="my-1">
                                {renderTrendIndicator(entry)}
                            </View>
                            <View
                                className="w-full rounded-t-2xl items-center justify-center px-2"
                                style={{ height, backgroundColor: config.bgColor, borderTopWidth: 3, borderColor: color }}
                            >
                                <Text className="text-white font-bold text-sm text-center" numberOfLines={2}>
                                    {categoryInfo.formatScore(entry.score)}
                                </Text>
                                {/* Sparkline */}
                                {entry.weeklyActivity && entry.weeklyActivity.length >= 2 && (
                                    <View className="mt-1">
                                        <Sparkline data={entry.weeklyActivity} color={color} width={50} height={16} />
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderPinnedUserRow = () => {
        if (!currentUserEntry || currentUserEntry.rank <= 3) return null;

        const entryWithGap = entriesWithGap.find(e => e.isCurrentUser);
        if (!entryWithGap) return null;

        return (
            <View className="mx-4 mb-4">
                <View className="flex-row items-center mb-2">
                    <Ionicons name="pin" size={14} color="#818cf8" />
                    <Text className="text-indigo-400 font-semibold text-sm ml-1">Your Position</Text>
                    {renderTrendIndicator(entryWithGap)}
                </View>
                <View className="bg-indigo-500/15 border border-indigo-500/30 rounded-2xl p-4 relative">
                    <CelebrationBadge visible={entryWithGap.isNewRecord || false} />
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: config.bgColor }}>
                            <Text style={{ color: config.color }} className="font-bold text-xl">
                                {entryWithGap.rank}
                            </Text>
                        </View>
                        <Text className="text-2xl mr-3">{getBreedIcon(entryWithGap.dogName)}</Text>
                        <View className="flex-1">
                            <Text className="text-indigo-300 font-bold text-base">
                                {entryWithGap.dogName}
                            </Text>
                            <Text className="text-indigo-400/70 text-sm">
                                {categoryInfo.formatScore(entryWithGap.score)}
                            </Text>
                        </View>
                        {entryWithGap.gapToNext > 0 && entryWithGap.nextName && (
                            <View className="items-end">
                                <Text className="text-amber-400 font-semibold text-sm">
                                    {formatGap(entryWithGap.gapToNext, selectedCategory)}
                                </Text>
                                <Text className="text-gray-400 text-xs">
                                    to pass {entryWithGap.nextName}
                                </Text>
                            </View>
                        )}
                    </View>
                    {/* Sparkline for user */}
                    {entryWithGap.weeklyActivity && entryWithGap.weeklyActivity.length >= 2 && (
                        <View className="mt-3 pt-3 border-t border-indigo-500/20">
                            <Text className="text-indigo-400/70 text-xs mb-1">Last 4 weeks</Text>
                            <Sparkline data={entryWithGap.weeklyActivity} color="#818cf8" width={280} height={32} />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderFollowedDogs = () => {
        if (followedEntries.length === 0) return null;

        return (
            <View className="mx-4 mb-4">
                <View className="flex-row items-center mb-3">
                    <Ionicons name="heart" size={18} color="#f472b6" />
                    <Text className="text-pink-400 font-bold text-base ml-2">Rivals You're Tracking</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {followedEntries.map((entry) => (
                        <View
                            key={entry.dogId}
                            className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-3 mr-3"
                            style={{ width: 150 }}
                        >
                            <View className="flex-row items-center mb-2">
                                <Text className="text-xl mr-2">{getBreedIcon(entry.dogName)}</Text>
                                <View className="flex-1">
                                    <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                                        {entry.dogName}
                                    </Text>
                                    <Text className="text-gray-400 text-xs">#{entry.rank}</Text>
                                </View>
                                {renderTrendIndicator(entry)}
                            </View>
                            <Text className="text-white text-sm font-medium">
                                {categoryInfo.formatScore(entry.score)}
                            </Text>
                            {entry.weeklyActivity && entry.weeklyActivity.length >= 2 && (
                                <View className="mt-2">
                                    <Sparkline data={entry.weeklyActivity} color="#f472b6" width={120} height={20} />
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderNearbyRivals = () => {
        if (nearbyRivals.length === 0) return null;

        return (
            <View className="mx-4 mb-4">
                <View className="flex-row items-center mb-3">
                    <Ionicons name="people" size={18} color="#f59e0b" />
                    <Text className="text-amber-400 font-bold text-base ml-2">Nearby Rivals</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {nearbyRivals.map((rival) => {
                        const isAhead = rival.rank < (currentUserEntry?.rank || 0);
                        return (
                            <TouchableOpacity
                                key={rival.dogId}
                                onPress={() => handleFollow(rival.dogId, rival.isFollowed || false)}
                                className="bg-gray-800/50 rounded-2xl p-3 mr-3 border border-gray-700/30"
                                style={{ width: 150 }}
                            >
                                <View className="flex-row items-center mb-2">
                                    <Text className="text-xl mr-2">{getBreedIcon(rival.dogName)}</Text>
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                                            {rival.dogName}
                                        </Text>
                                        <Text className="text-gray-400 text-xs">#{rival.rank}</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-white text-sm font-medium">
                                        {categoryInfo.formatScore(rival.score)}
                                    </Text>
                                    <View className={`flex-row items-center px-2 py-0.5 rounded-full ${isAhead ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                        <Ionicons name={isAhead ? 'arrow-up' : 'arrow-down'} size={12} color={isAhead ? '#ef4444' : '#22c55e'} />
                                        <Text className={`text-xs font-bold ml-0.5 ${isAhead ? 'text-red-400' : 'text-green-400'}`}>
                                            {Math.abs(rival.rank - (currentUserEntry?.rank || 0))}
                                        </Text>
                                    </View>
                                </View>
                                {/* Follow button */}
                                <TouchableOpacity
                                    onPress={() => handleFollow(rival.dogId, rival.isFollowed || false)}
                                    className={`mt-2 py-1.5 rounded-lg items-center ${rival.isFollowed ? 'bg-pink-500/20' : 'bg-gray-700/50'}`}
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons
                                            name={rival.isFollowed ? 'heart' : 'heart-outline'}
                                            size={14}
                                            color={rival.isFollowed ? '#f472b6' : '#9ca3af'}
                                        />
                                        <Text className={`text-xs font-semibold ml-1 ${rival.isFollowed ? 'text-pink-400' : 'text-gray-400'}`}>
                                            {rival.isFollowed ? 'Tracking' : 'Track'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderEntry = (entry: typeof entriesWithGap[0], index: number) => {
        return (
            <View
                key={`${entry.dogId}-${index}`}
                className={`flex-row items-center p-4 mb-3 rounded-2xl border relative ${entry.isCurrentUser
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : entry.isFollowed
                        ? 'bg-pink-500/5 border-pink-500/20'
                        : 'bg-gray-800/50 border-gray-700/30'
                    }`}
            >
                {entry.isNewRecord && <CelebrationBadge visible={true} />}

                {/* Rank */}
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: config.bgColor }}>
                    <Text style={{ color: config.color }} className="font-bold text-lg">
                        {entry.rank}
                    </Text>
                </View>

                {/* Breed Icon */}
                <Text className="text-xl mr-3">{getBreedIcon(entry.dogName)}</Text>

                {/* Info */}
                <View className="flex-1">
                    <View className="flex-row items-center">
                        <Text className={`font-bold text-base ${entry.isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                            {entry.dogName}
                        </Text>
                        {entry.isFollowed && !entry.isCurrentUser && (
                            <Ionicons name="heart" size={12} color="#f472b6" style={{ marginLeft: 4 }} />
                        )}
                    </View>
                    {entry.displayName && (
                        <Text className="text-gray-400 text-sm">
                            {entry.displayName}
                        </Text>
                    )}
                    {/* Trend */}
                    <View className="flex-row items-center mt-1">
                        {renderTrendIndicator(entry)}
                    </View>
                </View>

                {/* Sparkline & Score */}
                <View className="items-end">
                    {entry.weeklyActivity && entry.weeklyActivity.length >= 2 && (
                        <Sparkline data={entry.weeklyActivity} color={config.color} width={50} height={16} />
                    )}
                    <Text className={`font-bold text-base mt-1 ${entry.isCurrentUser ? 'text-indigo-300' : 'text-white'}`}>
                        {categoryInfo.formatScore(entry.score)}
                    </Text>
                    {entry.gapToNext > 0 && entry.nextName && !entry.isCurrentUser && entry.rank > 3 && (
                        <Text className="text-gray-500 text-xs">
                            +{formatGap(entry.gapToNext, selectedCategory)}
                        </Text>
                    )}
                </View>

                {/* Follow button for non-current users */}
                {!entry.isCurrentUser && (
                    <TouchableOpacity
                        onPress={() => handleFollow(entry.dogId, entry.isFollowed || false)}
                        className="ml-2 p-2"
                    >
                        <Ionicons
                            name={entry.isFollowed ? 'heart' : 'heart-outline'}
                            size={20}
                            color={entry.isFollowed ? '#f472b6' : '#6b7280'}
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Celebration overlay
    const renderCelebrationOverlay = () => {
        if (!celebratingRankUp) return null;

        const scale = rankUpAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
        });

        const opacity = rankUpAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 1],
        });

        return (
            <Animated.View
                style={{
                    position: 'absolute',
                    top: insets.top + 100,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                    opacity,
                    transform: [{ scale }],
                    zIndex: 1000,
                }}
            >
                <View className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 rounded-2xl" style={{ backgroundColor: '#f59e0b' }}>
                    <View className="flex-row items-center">
                        <Text className="text-3xl mr-2">🎉</Text>
                        <View>
                            <Text className="text-white font-bold text-lg">Rank Up!</Text>
                            <Text className="text-amber-100 text-sm">You climbed {currentUserEntry?.trendValue} position{(currentUserEntry?.trendValue || 0) > 1 ? 's' : ''}!</Text>
                        </View>
                        <Text className="text-3xl ml-2">🚀</Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View className="flex-1 bg-gray-900">
            {renderCelebrationOverlay()}

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Header */}
                <View className="px-4" style={{ paddingTop: insets.top + 16 }}>
                    <View className="flex-row items-center mb-1">
                        <Ionicons name="trophy" size={28} color="#fbbf24" />
                        <Text className="text-white text-2xl font-bold ml-2">
                            {t('leaderboard.title') || 'Leaderboard'}
                        </Text>
                    </View>
                    <Text className="text-gray-400 mb-4">
                        {t('leaderboard.subtitle') || 'See how you rank against other trainers'}
                    </Text>
                </View>

                {/* Time Filter */}
                <View className="flex-row mx-4 mb-4 bg-gray-800/30 rounded-xl p-1">
                    {(['daily', 'weekly', 'alltime'] as TimeFilter[]).map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => {
                                haptics.selection();
                                setTimeFilter(filter);
                            }}
                            className={`flex-1 py-2.5 rounded-lg items-center ${timeFilter === filter ? 'bg-indigo-500' : ''}`}
                        >
                            <Text className={`font-semibold text-sm ${timeFilter === filter ? 'text-white' : 'text-gray-400'}`}>
                                {filter === 'daily' ? 'Today' : filter === 'weekly' ? 'This Week' : 'All Time'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Opt-in Prompt */}
                {showOptInPrompt && !isPublic && (
                    <TouchableOpacity
                        onPress={handleOptIn}
                        className="mx-4 mb-4 rounded-2xl p-4 border border-indigo-500/30"
                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
                    >
                        <View className="flex-row items-center">
                            <View className="bg-indigo-500/20 p-3 rounded-xl mr-4">
                                <Ionicons name="person-add" size={24} color="#818cf8" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-base">
                                    {t('leaderboard.opt_in_title') || 'Join the Leaderboard!'}
                                </Text>
                                <Text className="text-gray-400 text-sm">
                                    {t('leaderboard.opt_in_prompt') || 'Make your profile public to compete'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="#818cf8" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Category Tabs */}
                <View className="mx-4 mb-4 bg-gray-800/50 rounded-2xl p-1.5 flex-row">
                    {CATEGORIES.map((category) => {
                        const catConfig = categoryConfig[category];
                        const isSelected = selectedCategory === category;

                        return (
                            <TouchableOpacity
                                key={category}
                                onPress={() => handleCategoryChange(category)}
                                className="flex-1 py-3 rounded-xl items-center"
                                style={isSelected ? { backgroundColor: catConfig.bgColor } : {}}
                            >
                                <Ionicons
                                    name={catConfig.icon as any}
                                    size={20}
                                    color={isSelected ? catConfig.color : '#6b7280'}
                                />
                                <Text
                                    className={`text-xs mt-1 font-semibold ${isSelected ? '' : 'text-gray-500'}`}
                                    style={isSelected ? { color: catConfig.color } : {}}
                                >
                                    {t(`leaderboard.${category}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Content */}
                {loading ? (
                    <View className="px-4">
                        <View className="flex-row justify-center items-end mb-8">
                            {[80, 110, 60].map((height, i) => (
                                <View key={i} className="items-center mx-2" style={{ width: 100 }}>
                                    <Skeleton width={56} height={56} borderRadius={28} className="mb-2" />
                                    <Skeleton width={80} height={16} className="mb-1" />
                                    <View className="w-full rounded-t-2xl" style={{ height, backgroundColor: 'rgba(31, 41, 55, 0.5)' }} />
                                </View>
                            ))}
                        </View>
                        {[...Array(3)].map((_, i) => (
                            <View key={i} className="flex-row items-center p-4 mb-3 bg-gray-800/50 rounded-2xl">
                                <Skeleton width={40} height={40} borderRadius={12} />
                                <View className="flex-1 ml-3">
                                    <Skeleton width="60%" height={16} className="mb-2" />
                                    <Skeleton width="40%" height={12} />
                                </View>
                                <Skeleton width={60} height={20} />
                            </View>
                        ))}
                    </View>
                ) : entries.length === 0 ? (
                    <View className="items-center py-12 px-6">
                        <View className="bg-gray-800/30 rounded-3xl p-8 items-center border border-gray-700/30">
                            <View className="bg-amber-500/20 p-4 rounded-full mb-4">
                                <Ionicons name="trophy-outline" size={48} color="#f59e0b" />
                            </View>
                            <Text className="text-white text-xl font-bold mb-2">
                                {t('leaderboard.empty_title') || 'No entries yet'}
                            </Text>
                            <Text className="text-gray-400 text-center">
                                {t('leaderboard.empty_message') || 'Be the first to join!'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View>
                        {/* Pinned User Row */}
                        {renderPinnedUserRow()}

                        {/* Followed Dogs */}
                        {renderFollowedDogs()}

                        {/* Nearby Rivals */}
                        {renderNearbyRivals()}

                        {/* Podium for Top 3 */}
                        <View className="px-4">
                            {renderPodium()}
                        </View>

                        {/* Rest of the list */}
                        {restEntries.length > 0 && (
                            <View className="px-4">
                                <View className="flex-row items-center mb-4">
                                    <View className="w-1 h-5 rounded-full mr-3" style={{ backgroundColor: config.color }} />
                                    <Text className="text-white font-bold text-lg">Rankings</Text>
                                </View>
                                {restEntries.map(renderEntry)}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
