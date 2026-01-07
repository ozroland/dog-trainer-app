import { View, Text, ScrollView, TouchableOpacity, Image, Alert, RefreshControl, Animated } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { Dog, Achievement, DogAchievement } from "../../../types";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { Skeleton } from "../../../components/ui/Skeleton";

export default function AchievementsScreen() {
    const { t, i18n } = useTranslation();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [dog, setDog] = useState<Dog | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [latestUnlocked, setLatestUnlocked] = useState<Achievement | null>(null);

    // Animation for hero card
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Subtle pulse animation for the hero card
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            // Fetch dog
            const { data: dogData, error: dogError } = await supabase
                .from("dogs")
                .select("*")
                .eq("id", id)
                .single();
            if (dogError) throw dogError;
            setDog(dogData);

            // Fetch all achievements
            const { data: allAchievements, error: achError } = await supabase
                .from("achievements")
                .select("*")
                .order("condition_value", { ascending: true });
            if (achError) throw achError;
            setAchievements(allAchievements || []);

            // Fetch unlocked achievements for this dog
            const { data: unlockedData, error: unlockedError } = await supabase
                .from("dog_achievements")
                .select("achievement_id, unlocked_at")
                .eq("dog_id", id)
                .order("unlocked_at", { ascending: false });
            if (unlockedError) throw unlockedError;

            const unlockedSet = new Set(unlockedData?.map(d => d.achievement_id));
            setUnlocked(unlockedSet);

            // Find the latest unlocked achievement
            if (unlockedData && unlockedData.length > 0 && allAchievements) {
                const latestId = unlockedData[0].achievement_id;
                const latest = allAchievements.find(a => a.id === latestId);
                setLatestUnlocked(latest || null);
            }

        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    const progressPercent = achievements.length > 0
        ? Math.round((unlocked.size / achievements.length) * 100)
        : 0;

    if (loading) {
        return (
            <View className="flex-1 bg-gray-900">
                <ScreenHeader title={t('achievements.title')} />
                <View className="flex-1 p-4">
                    {/* Hero card skeleton */}
                    <View className="rounded-3xl p-5 mb-6 border border-amber-500/20" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View>
                                <Skeleton width={100} height={32} className="mb-2" />
                                <Skeleton width={140} height={16} />
                            </View>
                            <Skeleton width={64} height={64} borderRadius={32} />
                        </View>
                        <Skeleton width="100%" height={12} borderRadius={6} />
                    </View>

                    {/* Achievements grid skeleton */}
                    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <View key={i} className="rounded-2xl p-4 border border-gray-700/30" style={{ width: '48%', backgroundColor: 'rgba(31, 41, 55, 0.5)' }}>
                                <Skeleton width={56} height={56} borderRadius={16} className="mb-3" />
                                <Skeleton width="80%" height={16} className="mb-2" />
                                <Skeleton width="60%" height={12} />
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Standardized Header */}
            <ScreenHeader
                title={t('achievements.title')}
                subtitle={dog?.name}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Hero Progress Card */}
                <Animated.View
                    className="mx-4 mb-6"
                    style={{ transform: [{ scale: pulseAnim }] }}
                >
                    <View
                        className="rounded-3xl p-5 border border-amber-500/20"
                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-1">
                                <Text className="text-white text-3xl font-bold">{unlocked.size}/{achievements.length}</Text>
                                <Text className="text-amber-300">{t('achievements.badges_unlocked')}</Text>
                            </View>
                            <View className="bg-amber-500/20 p-4 rounded-2xl">
                                <Text className="text-5xl">🏆</Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View className="h-3 bg-gray-700/50 rounded-full overflow-hidden mb-3">
                            <View
                                className="h-full rounded-full"
                                style={{ width: `${progressPercent}%`, backgroundColor: '#f59e0b' }}
                            />
                        </View>

                        {/* Latest Achievement */}
                        {latestUnlocked && (
                            <View className="flex-row items-center mt-2 pt-3 border-t border-amber-500/20">
                                <View className="bg-amber-500/20 p-2 rounded-xl mr-3">
                                    <Ionicons
                                        name={latestUnlocked.icon as any}
                                        size={20}
                                        color="#fbbf24"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs">{t('achievements.latest')}</Text>
                                    <Text className="text-white font-semibold" numberOfLines={1}>
                                        {i18n.language === 'hu' && latestUnlocked.title_hu ? latestUnlocked.title_hu : latestUnlocked.title}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Section Header */}
                <View className="flex-row items-center mx-4 mb-4">
                    <View className="w-1 h-5 rounded-full bg-amber-500 mr-3" />
                    <Text className="text-white font-bold text-lg">{t('achievements.all_badges')}</Text>
                </View>

                {/* Achievements Grid */}
                <View className="px-4 flex-row flex-wrap" style={{ gap: 12 }}>
                    {achievements.map((achievement) => {
                        const isUnlocked = unlocked.has(achievement.id);

                        return (
                            <View
                                key={achievement.id}
                                className={`rounded-2xl p-4 border ${isUnlocked
                                    ? "border-amber-500/30"
                                    : "border-gray-700/30"
                                    }`}
                                style={{
                                    width: '48%',
                                    backgroundColor: isUnlocked
                                        ? 'rgba(245, 158, 11, 0.1)'
                                        : 'rgba(31, 41, 55, 0.5)'
                                }}
                            >
                                {/* Icon */}
                                <View
                                    className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 ${isUnlocked ? '' : 'bg-gray-700/50'
                                        }`}
                                    style={isUnlocked ? { backgroundColor: 'rgba(251, 191, 36, 0.2)' } : {}}
                                >
                                    {isUnlocked ? (
                                        <Ionicons
                                            name={achievement.icon as any}
                                            size={28}
                                            color="#fbbf24"
                                        />
                                    ) : (
                                        <View className="items-center justify-center">
                                            <Ionicons
                                                name={achievement.icon as any}
                                                size={24}
                                                color="#4b5563"
                                            />
                                            <View className="absolute">
                                                <Ionicons name="lock-closed" size={14} color="#6b7280" />
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Title */}
                                <Text
                                    className={`font-bold mb-1 ${isUnlocked ? "text-white" : "text-gray-500"}`}
                                    numberOfLines={2}
                                >
                                    {i18n.language === 'hu' && achievement.title_hu ? achievement.title_hu : achievement.title}
                                </Text>

                                {/* Description */}
                                <Text
                                    className={`text-xs leading-4 ${isUnlocked ? "text-amber-200/70" : "text-gray-600"}`}
                                    numberOfLines={2}
                                >
                                    {i18n.language === 'hu' && achievement.description_hu ? achievement.description_hu : achievement.description}
                                </Text>

                                {/* Unlocked Badge */}
                                {isUnlocked && (
                                    <View className="absolute top-3 right-3 bg-amber-500 rounded-full w-5 h-5 items-center justify-center">
                                        <Ionicons name="checkmark" size={12} color="white" />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Empty State */}
                {achievements.length === 0 && (
                    <View className="items-center py-12 mx-4">
                        <View className="bg-gray-800/30 rounded-3xl p-8 items-center border border-gray-700/30">
                            <View className="bg-amber-500/20 p-4 rounded-full mb-4">
                                <Ionicons name="trophy-outline" size={48} color="#fbbf24" />
                            </View>
                            <Text className="text-white text-xl font-bold mb-2">
                                {t('achievements.no_achievements')}
                            </Text>
                            <Text className="text-gray-400 text-center">
                                {t('achievements.no_achievements_desc')}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
