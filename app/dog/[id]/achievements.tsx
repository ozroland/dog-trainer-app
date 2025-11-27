import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Dog, Achievement, DogAchievement } from "../../../types";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AchievementsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [dog, setDog] = useState<Dog | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

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
        return <View className="flex-1 bg-gray-900 items-center justify-center"><Text className="text-white">Loading...</Text></View>;
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-gray-800 border-b border-gray-700" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-4 h-14">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-700">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold flex-1 text-center mr-14">Achievements</Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-6">
                {/* Header Card */}
                <View className="bg-indigo-600 p-6 rounded-3xl mb-8 items-center">
                    <Text className="text-5xl mb-2">🏆</Text>
                    <Text className="text-white text-2xl font-bold mb-1">Hall of Fame</Text>
                    <Text className="text-indigo-200 text-center">
                        {unlocked.size} / {achievements.length} Badges Unlocked
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
                                    {achievement.title}
                                </Text>
                                <Text className="text-xs text-gray-400 leading-4">
                                    {achievement.description}
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
