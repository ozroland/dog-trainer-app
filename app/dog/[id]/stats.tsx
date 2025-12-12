import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../lib/supabase";
import { Dog } from "../../../types";
import { getDogStats } from "../../../lib/trainingUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Skeleton, StatsSkeleton } from "../../../components/ui/Skeleton";
import { NoWalksEmptyState } from "../../../components/EmptyState";

export default function DogStatsScreen() {
    const { id } = useLocalSearchParams();
    const [dog, setDog] = useState<Dog | null>(null);
    const [stats, setStats] = useState({
        completedLessons: 0,
        totalMinutes: 0,
        streak: 0,
        recentSessions: [] as any[],
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'hu' ? 'hu-HU' : 'en-US';

    const [walks, setWalks] = useState<any[]>([]);

    // Refetch data when screen comes into focus (e.g., after deleting a walk)
    useFocusEffect(
        useCallback(() => {
            fetchDogAndStats();
        }, [id])
    );

    async function fetchDogAndStats() {
        try {
            // Fetch dog info
            const { data: dogData, error: dogError } = await supabase
                .from('dogs')
                .select('*')
                .eq('id', id)
                .single();

            if (dogError) throw dogError;
            setDog(dogData);

            // Fetch stats
            const dogStats = await getDogStats(id as string);
            setStats(dogStats);

            // Fetch recent walks
            const { data: walksData, error: walksError } = await supabase
                .from('walks')
                .select('*')
                .eq('dog_id', id)
                .order('start_time', { ascending: false })
                .limit(5);

            if (!walksError) {
                setWalks(walksData || []);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }



    if (loading || !dog) {
        return (
            <View className="flex-1 bg-gray-900">
                <View className="px-6" style={{ paddingTop: insets.top + 60 }}>
                    {/* Dog card skeleton */}
                    <View className="bg-gray-800 p-4 rounded-3xl border border-gray-700 flex-row items-center mb-6">
                        <Skeleton width={80} height={80} borderRadius={40} />
                        <View className="flex-1 ml-4">
                            <Skeleton width="50%" height={24} className="mb-2" />
                            <Skeleton width="70%" height={14} />
                        </View>
                    </View>

                    {/* Stats skeleton */}
                    <StatsSkeleton />

                    {/* Recent section skeleton */}
                    <Skeleton width="40%" height={20} className="mt-6 mb-4" />
                    <View className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                        <Skeleton width="100%" height={60} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View
                className="bg-gray-800 border-b border-gray-700"
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center px-4 h-14">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-700"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold flex-1 text-center mr-14">
                        {t('stats.title', { name: dog.name })}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
                {/* Dog Card */}
                <View className="bg-indigo-600 p-6 rounded-3xl mb-6 items-center shadow-lg">
                    {dog.photo_url ? (
                        <Image
                            source={{ uri: dog.photo_url }}
                            className="w-24 h-24 rounded-full mb-4 border-4 border-white/20"
                        />
                    ) : (
                        <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4">
                            <Text className="text-white text-4xl font-bold">{dog.name[0]}</Text>
                        </View>
                    )}
                    <Text className="text-white text-2xl font-bold">{dog.name}</Text>
                    <Text className="text-white/80 text-lg">{dog.breed}</Text>
                    <Text className="text-white/60 text-sm mt-1">{dog.age === 1 ? t('stats.month', { count: dog.age }) : t('stats.months', { count: dog.age })} • {dog.gender === 'Male' ? t('dog.male') : t('dog.female')}</Text>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap mb-6">
                    <View className="w-1/2 pr-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">🎓</Text>
                            <Text className="text-white text-3xl font-bold">{stats.completedLessons}</Text>
                            <Text className="text-gray-400 text-sm">{t('stats.lessons_completed')}</Text>
                        </View>
                    </View>

                    <View className="w-1/2 pl-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">🔥</Text>
                            <Text className="text-white text-3xl font-bold">{stats.streak}</Text>
                            <Text className="text-gray-400 text-sm">{t('stats.day_streak')}</Text>
                        </View>
                    </View>

                    <View className="w-1/2 pr-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">⏱️</Text>
                            <Text className="text-white text-3xl font-bold">{stats.totalMinutes}</Text>
                            <Text className="text-gray-400 text-sm">{t('stats.training_minutes')}</Text>
                        </View>
                    </View>

                    <View className="w-1/2 pl-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">📅</Text>
                            <Text className="text-white text-3xl font-bold">{stats.recentSessions.length}</Text>
                            <Text className="text-gray-400 text-sm">{t('stats.last_7_days')}</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                {stats.recentSessions.length > 0 && (
                    <View className="bg-gray-800 p-5 rounded-2xl mb-6">
                        <Text className="text-white text-lg font-bold mb-4">{t('stats.recent_training_days')}</Text>
                        <View className="flex-row flex-wrap">
                            {stats.recentSessions.map((session, index) => (
                                <View
                                    key={index}
                                    className="bg-indigo-600 px-3 py-2 rounded-full mr-2 mb-2"
                                >
                                    <Text className="text-white text-sm font-semibold">
                                        {new Date(session.trained_at).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}



                {/* Recent Walks */}
                <View className="mb-8">
                    <Text className="text-white text-lg font-bold mb-4">{t('stats.recent_walks')}</Text>
                    {walks.length === 0 ? (
                        <NoWalksEmptyState />
                    ) : (
                        <View className="gap-3">
                            {walks.map((walk) => (
                                <TouchableOpacity
                                    key={walk.id}
                                    onPress={() => router.push(`/walk/${walk.id}`)}
                                    className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <View className="bg-indigo-500/20 w-12 h-12 rounded-full items-center justify-center mr-4">
                                            <Ionicons name="walk" size={24} color="#818cf8" />
                                        </View>
                                        <View>
                                            <Text className="text-white font-bold text-base">
                                                {new Date(walk.start_time).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </Text>
                                            <Text className="text-gray-400 text-sm">
                                                {new Date(walk.start_time).toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-white font-bold text-base">{(walk.distance_meters / 1000).toFixed(2)} {t('common.km')}</Text>
                                        <Text className="text-gray-400 text-sm">{Math.floor(walk.duration_seconds / 60)} {t('common.min')}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView >
        </View >
    );
}
