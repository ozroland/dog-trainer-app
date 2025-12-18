import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Animated } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../../lib/supabase";
import { Dog } from "../../../types";
import { getDogStats } from "../../../lib/trainingUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Skeleton, StatsSkeleton } from "../../../components/ui/Skeleton";
import { NoWalksEmptyState } from "../../../components/EmptyState";
import { LinearGradient } from 'expo-linear-gradient';

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
    const [refreshing, setRefreshing] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const avatarScale = useRef(new Animated.Value(0)).current;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDogAndStats();
        setRefreshing(false);
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchDogAndStats();
        }, [id])
    );

    useEffect(() => {
        if (dog) {
            // Animate avatar
            Animated.spring(avatarScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();

            // Fade in content
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [dog]);

    async function fetchDogAndStats() {
        try {
            const { data: dogData, error: dogError } = await supabase
                .from('dogs')
                .select('*')
                .eq('id', id)
                .single();

            if (dogError) throw dogError;
            setDog(dogData);

            const dogStats = await getDogStats(id as string);
            setStats(dogStats);

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

    // Calculate total distance from walks
    const totalDistance = walks.reduce((sum, walk) => sum + (walk.distance_meters || 0), 0);

    if (loading || !dog) {
        return (
            <View className="flex-1 bg-gray-900">
                <View className="px-6" style={{ paddingTop: insets.top + 60 }}>
                    <View className="bg-gray-800 p-4 rounded-3xl border border-gray-700 flex-row items-center mb-6">
                        <Skeleton width={80} height={80} borderRadius={40} />
                        <View className="flex-1 ml-4">
                            <Skeleton width="50%" height={24} className="mb-2" />
                            <Skeleton width="70%" height={14} />
                        </View>
                    </View>
                    <StatsSkeleton />
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

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Hero Header */}
                <LinearGradient
                    colors={['#4f46e5', '#3730a3']}
                    className="pb-8 px-4"
                    style={{ paddingTop: insets.top }}
                >
                    {/* Back Button */}
                    <View className="flex-row items-center h-14">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center rounded-full bg-black/20"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white/80 ml-4 font-semibold">{t('stats.title_short')}</Text>
                    </View>

                    {/* Dog Avatar & Info */}
                    <View className="items-center mt-4 mb-2">
                        <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
                            {dog.photo_url ? (
                                <Image
                                    source={{ uri: dog.photo_url }}
                                    className="w-28 h-28 rounded-full mb-4 border-4 border-white/30"
                                />
                            ) : (
                                <View className="w-28 h-28 bg-white/20 rounded-full items-center justify-center mb-4 border-4 border-white/30">
                                    <Text className="text-white text-5xl font-bold">{dog.name[0]}</Text>
                                </View>
                            )}
                        </Animated.View>
                        <Text className="text-white text-3xl font-bold">{dog.name}</Text>
                        <Text className="text-indigo-200 text-lg">{dog.breed}</Text>
                        <View className="flex-row items-center mt-2">
                            <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                                <Text className="text-white text-sm font-medium">
                                    {dog.age === 1 ? t('stats.month', { count: dog.age }) : t('stats.months', { count: dog.age })}
                                </Text>
                            </View>
                            <View className="bg-white/20 px-3 py-1 rounded-full">
                                <Text className="text-white text-sm font-medium">
                                    {dog.gender === 'Male' ? t('dog.male') : t('dog.female')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Hero Stats Row */}
                    <View className="flex-row justify-around mt-6 bg-white/10 rounded-2xl p-4">
                        <View className="items-center">
                            <Text className="text-white text-2xl font-bold">{stats.streak}</Text>
                            <Text className="text-indigo-200 text-xs">{t('stats.day_streak')}</Text>
                        </View>
                        <View className="w-px bg-white/20 h-full" />
                        <View className="items-center">
                            <Text className="text-white text-2xl font-bold">{stats.completedLessons}</Text>
                            <Text className="text-indigo-200 text-xs">{t('stats.lessons_short')}</Text>
                        </View>
                        <View className="w-px bg-white/20 h-full" />
                        <View className="items-center">
                            <Text className="text-white text-2xl font-bold">{walks.length}</Text>
                            <Text className="text-indigo-200 text-xs">{t('stats.walks')}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Content Section */}
                <Animated.View
                    className="px-4 mt-6"
                    style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                >
                    {/* Training Stats Cards */}
                    <View className="flex-row items-center mb-4">
                        <View className="w-1 h-5 rounded-full bg-indigo-500 mr-3" />
                        <Text className="text-white font-bold text-lg">{t('stats.training_stats')}</Text>
                    </View>

                    <View className="flex-row mb-6">
                        <View className="flex-1 mr-2">
                            <View className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/50">
                                <View className="flex-row items-center mb-2">
                                    <View className="bg-amber-500/20 w-10 h-10 rounded-xl items-center justify-center">
                                        <Ionicons name="time" size={20} color="#fbbf24" />
                                    </View>
                                </View>
                                <Text className="text-white text-2xl font-bold">{stats.totalMinutes}</Text>
                                <Text className="text-gray-400 text-sm">{t('stats.training_minutes')}</Text>
                            </View>
                        </View>
                        <View className="flex-1 ml-2">
                            <View className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/50">
                                <View className="flex-row items-center mb-2">
                                    <View className="bg-green-500/20 w-10 h-10 rounded-xl items-center justify-center">
                                        <Ionicons name="map" size={20} color="#4ade80" />
                                    </View>
                                </View>
                                <Text className="text-white text-2xl font-bold">
                                    {(totalDistance / 1000).toFixed(1)}
                                </Text>
                                <Text className="text-gray-400 text-sm">{t('stats.total_km')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Recent Training Activity */}
                    {stats.recentSessions.length > 0 && (
                        <View className="bg-gray-800/80 p-5 rounded-2xl mb-6 border border-gray-700/50">
                            <View className="flex-row items-center mb-4">
                                <View className="bg-indigo-500/20 w-8 h-8 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="calendar" size={16} color="#818cf8" />
                                </View>
                                <Text className="text-white font-bold">{t('stats.recent_training_days')}</Text>
                            </View>
                            <View className="flex-row flex-wrap">
                                {stats.recentSessions.map((session, index) => (
                                    <View
                                        key={index}
                                        className="bg-indigo-500/20 px-3 py-2 rounded-full mr-2 mb-2 border border-indigo-500/30"
                                    >
                                        <Text className="text-indigo-300 text-sm font-semibold">
                                            {new Date(session.trained_at).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Recent Walks */}
                    <View className="flex-row items-center mb-4">
                        <View className="w-1 h-5 rounded-full bg-green-500 mr-3" />
                        <Text className="text-white font-bold text-lg">{t('stats.recent_walks')}</Text>
                    </View>

                    {walks.length === 0 ? (
                        <NoWalksEmptyState />
                    ) : (
                        <View className="gap-3">
                            {walks.map((walk) => (
                                <TouchableOpacity
                                    key={walk.id}
                                    onPress={() => router.push(`/walk/${walk.id}`)}
                                    className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/50 flex-row items-center"
                                    activeOpacity={0.7}
                                >
                                    <View className="bg-green-500/20 w-12 h-12 rounded-xl items-center justify-center mr-4">
                                        <Ionicons name="walk" size={24} color="#4ade80" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-bold text-base">
                                            {new Date(walk.start_time).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </Text>
                                        <Text className="text-gray-400 text-sm">
                                            {new Date(walk.start_time).toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-white font-bold text-base">{(walk.distance_meters / 1000).toFixed(2)} {t('common.km')}</Text>
                                        <Text className="text-gray-400 text-sm">{Math.floor(walk.duration_seconds / 60)} {t('common.min')}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#6b7280" className="ml-2" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}
