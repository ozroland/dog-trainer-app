import { View, Text, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
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
                .select("achievement_id")
                .eq("dog_id", id);
            if (unlockedError) throw unlockedError;

            const unlockedSet = new Set(unlockedData?.map(d => d.achievement_id));
            setUnlocked(unlockedSet);

        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View className="flex-1 bg-gray-900">
                <ScreenHeader title={t('achievements.title')} />
                <View className="flex-1 p-6">
                    {/* Header skeleton */}
                    <View className="bg-gray-800 p-6 rounded-3xl mb-8 items-center">
                        <Skeleton width={64} height={64} borderRadius={32} className="mb-2" />
                        <Skeleton width={150} height={24} className="mb-2" />
                        <Skeleton width={100} height={16} />
                    </View>
                    {/* Achievements grid skeleton */}
                    <View className="flex-row flex-wrap justify-between">
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} className="w-[48%] mb-4 p-4 rounded-2xl bg-gray-800 border border-gray-700">
                                <Skeleton width={48} height={48} borderRadius={24} className="mb-3" />
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
            <ScreenHeader title={t('achievements.title')} />

            <ScrollView
                className="flex-1 p-6"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Header Card */}
                <View className="bg-indigo-600 p-6 rounded-3xl mb-8 items-center">
                    <Text className="text-5xl mb-2">🏆</Text>
                    <Text className="text-white text-2xl font-bold mb-1">{t('achievements.hall_of_fame')}</Text>
                    <Text className="text-indigo-200 text-center">
                        {unlocked.size} / {achievements.length} {t('achievements.badges_unlocked')}
                    </Text>
                </View>

                {/* Achievements Grid */}
                <View className="flex-row flex-wrap justify-between">
                    {achievements.map((achievement) => {
                        const isUnlocked = unlocked.has(achievement.id);
                        return (
                            <View
                                key={achievement.id}
                                className={`w-[48%] mb-4 p-4 rounded-2xl border ${isUnlocked
                                    ? "bg-gray-800 border-indigo-500/50"
                                    : "bg-gray-800/50 border-gray-800"
                                    }`}
                            >
                                <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${isUnlocked ? "bg-indigo-500/20" : "bg-gray-700"
                                    }`}>
                                    <Ionicons
                                        name={achievement.icon as any}
                                        size={32}
                                        color="white"
                                        style={{ opacity: isUnlocked ? 1 : 0.6 }}
                                    />
                                </View>
                                <Text className={`font-bold mb-1 ${isUnlocked ? "text-white" : "text-gray-500"}`}>
                                    {i18n.language === 'hu' && achievement.title_hu ? achievement.title_hu : achievement.title}
                                </Text>
                                <Text className="text-xs text-gray-400 leading-4">
                                    {i18n.language === 'hu' && achievement.description_hu ? achievement.description_hu : achievement.description}
                                </Text>
                                {isUnlocked && (
                                    <View className="absolute top-3 right-3">
                                        <Ionicons name="checkmark-circle" size={16} color="#4f46e5" />
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}
