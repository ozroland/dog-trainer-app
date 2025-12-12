import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Lesson } from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTranslation } from "react-i18next";

export default function LessonsScreen() {
    const { t, i18n } = useTranslation();
    const { dogId } = useLocalSearchParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            fetchLessons();
        }, [dogId])
    );

    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

    async function fetchLessons() {
        try {
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .select('*');

            if (lessonsError) throw lessonsError;

            // Custom sort by difficulty
            const difficultyOrder = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
            const sortedLessons = (lessonsData || []).sort((a, b) => {
                const diffA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 99;
                const diffB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 99;
                return diffA - diffB;
            });

            setLessons(sortedLessons);

            if (dogId) {
                const { data: progressData, error: progressError } = await supabase
                    .from('progress')
                    .select('lesson_id')
                    .eq('dog_id', dogId)
                    .eq('status', 'Completed');

                if (progressError) throw progressError;
                const completedIds = new Set(progressData?.map(p => p.lesson_id) || []);
                setCompletedLessonIds(completedIds);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const filteredLessons = filter === 'All'
        ? lessons
        : lessons.filter(l => l.difficulty === filter);

    const difficultyColors = {
        Beginner: 'bg-green-500',
        Intermediate: 'bg-yellow-500',
        Advanced: 'bg-red-500',
    };

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
                        {t('lessons.title')}
                    </Text>
                </View>
            </View>

            <View className="px-6 py-4">
                <Text className="text-gray-400 mb-6">{t('lessons.subtitle')}</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => setFilter(level)}
                            className={`mr-3 px-4 py-2 rounded-full ${filter === level ? 'bg-indigo-600' : 'bg-gray-800'}`}
                        >
                            <Text className={`font-semibold ${filter === level ? 'text-white' : 'text-gray-400'}`}>
                                {t(`lessons.${level.toLowerCase()}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView className="flex-1 px-6">
                {loading ? (
                    <Text className="text-white">{t('common.loading')}</Text>
                ) : (
                    filteredLessons.map((lesson) => {
                        const isCompleted = completedLessonIds.has(lesson.id);

                        // Locking Logic
                        let isLocked = false;
                        let lockReason = "";

                        // Calculate counts
                        const beginnerCount = lessons.filter(l => l.difficulty === 'Beginner' && completedLessonIds.has(l.id)).length;
                        const intermediateCount = lessons.filter(l => l.difficulty === 'Intermediate' && completedLessonIds.has(l.id)).length;

                        if (lesson.difficulty === 'Intermediate') {
                            if (beginnerCount < 3) {
                                isLocked = true;
                                lockReason = t('lessons.unlock_beginner', { count: 3 - beginnerCount });
                            }
                        } else if (lesson.difficulty === 'Advanced') {
                            if (intermediateCount < 3) {
                                isLocked = true;
                                lockReason = t('lessons.unlock_intermediate', { count: 3 - intermediateCount });
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={lesson.id}
                                disabled={isLocked}
                                className={`p-5 rounded-2xl mb-4 border ${isLocked
                                    ? 'bg-gray-800/30 border-gray-800 opacity-70'
                                    : isCompleted
                                        ? 'bg-gray-800/50 border-green-500/30'
                                        : 'bg-gray-800 border-gray-700'
                                    }`}
                                onPress={() => router.push({ pathname: `/lessons/${lesson.id}`, params: { dogId } })}
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-1 mr-2">
                                        <Text className={`text-lg font-bold ${isLocked ? 'text-gray-500' : isCompleted ? 'text-green-400' : 'text-white'
                                            }`}>
                                            {i18n.language === 'hu' ? (lesson.title_hu || lesson.title) : lesson.title}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        {isLocked ? (
                                            <View className="bg-gray-700 px-2 py-1 rounded-full">
                                                <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                                            </View>
                                        ) : isCompleted && (
                                            <View className="bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                                                <Ionicons name="checkmark" size={12} color="#4ade80" />
                                            </View>
                                        )}
                                        <View className={`px-3 py-1 rounded-full ${isLocked ? 'bg-gray-700' : difficultyColors[lesson.difficulty]
                                            }`}>
                                            <Text className={`text-xs font-bold ${isLocked ? 'text-gray-400' : 'text-white'}`}>
                                                {t(`lessons.${lesson.difficulty.toLowerCase()}`)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {isLocked ? (
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
                                        <Text className="text-gray-500 text-xs ml-1 italic">{lockReason}</Text>
                                    </View>
                                ) : (
                                    <>
                                        <Text className="text-gray-400 mb-3">{i18n.language === 'hu' ? (lesson.description_hu || lesson.description) : lesson.description}</Text>
                                        <Text className="text-gray-500 text-sm">⏱️ {t('lessons.minutes', { count: lesson.duration_minutes })}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}
