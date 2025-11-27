import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Dog } from "../../../types";
import { getDogStats } from "../../../lib/trainingUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';

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

    const [walks, setWalks] = useState<any[]>([]);

    useEffect(() => {
        fetchDogAndStats();
    }, [id]);

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
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <Text className="text-white">Loading...</Text>
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
                        {dog.name}'s Stats
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
                    <Text className="text-white/60 text-sm mt-1">{dog.age} months • {dog.gender}</Text>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap mb-6">
                    <View className="w-1/2 pr-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">🎓</Text>
                            <Text className="text-white text-3xl font-bold">{stats.completedLessons}</Text>
                            <Text className="text-gray-400 text-sm">Lessons Completed</Text>
                        </View>
                    </View>

                    <View className="w-1/2 pl-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">🔥</Text>
                            <Text className="text-white text-3xl font-bold">{stats.streak}</Text>
                            <Text className="text-gray-400 text-sm">Day Streak</Text>
                        </View>
                    </View>

                    <View className="w-1/2 pr-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">⏱️</Text>
                            <Text className="text-white text-3xl font-bold">{stats.totalMinutes}</Text>
                            <Text className="text-gray-400 text-sm">Training Minutes</Text>
                        </View>
                    </View>

                    <View className="w-1/2 pl-2 mb-4">
                        <View className="bg-gray-800 p-5 rounded-2xl">
                            <Text className="text-4xl mb-2">📅</Text>
                            <Text className="text-white text-3xl font-bold">{stats.recentSessions.length}</Text>
                            <Text className="text-gray-400 text-sm">Last 7 Days</Text>
                        </View>
                    </View>
                </View>

                {/* Recent Activity */}
                {stats.recentSessions.length > 0 && (
                    <View className="bg-gray-800 p-5 rounded-2xl mb-6">
                        <Text className="text-white text-lg font-bold mb-4">Recent Training Days</Text>
                        <View className="flex-row flex-wrap">
                            {stats.recentSessions.map((session, index) => (
                                <View
                                    key={index}
                                    className="bg-indigo-600 px-3 py-2 rounded-full mr-2 mb-2"
                                >
                                    <Text className="text-white text-sm font-semibold">
                                        {new Date(session.trained_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}



                {/* Recent Walks */}
                <View className="mb-8">
                    <Text className="text-white text-lg font-bold mb-4">Recent Walks</Text>
                    {walks.length === 0 ? (
                        <View className="bg-gray-800 p-6 rounded-2xl items-center border border-gray-700">
                            <Text className="text-gray-500">No walks recorded yet.</Text>
                        </View>
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
                                                {new Date(walk.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </Text>
                                            <Text className="text-gray-400 text-sm">
                                                {new Date(walk.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-white font-bold text-base">{(walk.distance_meters / 1000).toFixed(2)} km</Text>
                                        <Text className="text-gray-400 text-sm">{Math.floor(walk.duration_seconds / 60)} min</Text>
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
