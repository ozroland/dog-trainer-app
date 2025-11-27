import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Lesson } from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import Markdown from 'react-native-markdown-display';

export default function LessonDetailScreen() {
    const { id, dogId } = useLocalSearchParams();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchLesson();
    }, [id]);

    async function fetchLesson() {
        try {
            const { data, error } = await supabase
                .from('lessons')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setLesson(data);

            if (dogId) {
                const { data: progress, error: progressError } = await supabase
                    .from('progress')
                    .select('*')
                    .eq('lesson_id', id)
                    .eq('dog_id', dogId)
                    .eq('status', 'Completed')
                    .single();

                if (!progressError && progress) {
                    setIsCompleted(true);
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load lesson');
        } finally {
            setLoading(false);
        }
    }

    async function handleComplete() {
        if (!dogId) return;
        try {
            setCompleting(true);

            // 1. Insert progress
            const { error } = await supabase
                .from('progress')
                .insert({
                    dog_id: dogId,
                    lesson_id: id,
                    status: 'Completed',
                    completed_at: new Date().toISOString(),
                });

            if (error) {
                if (error.code === '23505') { // Unique violation (already completed)
                    setIsCompleted(true);
                    return;
                }
                throw error;
            }

            setIsCompleted(true);

            // 2. Check for achievements (simplified, usually handled by DB triggers or separate logic)
            // For now, just show success
            Alert.alert("Great Job!", "Lesson completed successfully!");

            // 3. Go back
            router.back();

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to complete lesson');
        } finally {
            setCompleting(false);
        }
    }

    if (loading || !lesson) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator color="#4f46e5" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
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
                    <Text className="text-white text-lg font-semibold flex-1 text-center mr-14" numberOfLines={1}>
                        {lesson.title}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
                <View className="flex-row justify-between items-start mb-6">
                    <View className={`px-3 py-1 rounded-full ${lesson.difficulty === 'Beginner' ? 'bg-green-500/20' :
                            lesson.difficulty === 'Intermediate' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                        }`}>
                        <Text className={`text-xs font-bold ${lesson.difficulty === 'Beginner' ? 'text-green-400' :
                                lesson.difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400'
                            }`}>{lesson.difficulty}</Text>
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#9ca3af" />
                        <Text className="text-gray-400 ml-1">{lesson.duration_minutes} min</Text>
                    </View>
                </View>

                <Text className="text-gray-300 text-lg mb-8 leading-relaxed">
                    {lesson.description}
                </Text>

                <View className="bg-gray-800 p-4 rounded-2xl mb-8">
                    <Markdown
                        style={{
                            body: { color: '#e5e7eb', fontSize: 16, lineHeight: 24 },
                            heading1: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
                            heading2: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 16 },
                            listItem: { color: '#e5e7eb' },
                            strong: { color: 'white', fontWeight: 'bold' },
                        }}
                    >
                        {lesson.content_markdown}
                    </Markdown>
                </View>

                {/* Complete Button */}
                {!isCompleted && dogId && (
                    <TouchableOpacity
                        onPress={handleComplete}
                        disabled={completing}
                        className={`w-full py-4 rounded-2xl items-center mb-10 ${completing ? 'bg-indigo-700' : 'bg-indigo-600'
                            }`}
                    >
                        {completing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Complete Lesson</Text>
                        )}
                    </TouchableOpacity>
                )}

                {isCompleted && (
                    <View className="w-full py-4 rounded-2xl items-center mb-10 bg-green-500/20 border border-green-500/30">
                        <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                            <Text className="text-green-400 font-bold text-lg ml-2">Lesson Completed</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
