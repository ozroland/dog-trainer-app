import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Lesson } from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Skeleton } from "../../components/ui/Skeleton";
import { useTranslation } from "react-i18next";
import { TabHeader } from "../../components/ScreenHeader";
import haptics from "../../lib/haptics";

type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

const difficultyConfig: Record<DifficultyLevel, { color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
    Beginner: { color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.15)', icon: 'leaf', label: 'Beginner' },
    Intermediate: { color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)', icon: 'flash', label: 'Intermediate' },
    Advanced: { color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.15)', icon: 'flame', label: 'Advanced' },
};

export default function LessonsScreen() {
    const { t, i18n } = useTranslation();
    const { dogId } = useLocalSearchParams();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'All' | DifficultyLevel>('All');
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeDogId, setActiveDogId] = useState<string | null>(dogId as string);
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

    useFocusEffect(
        useCallback(() => {
            if (dogId) {
                setActiveDogId(dogId as string);
                fetchLessons(dogId as string);
            } else {
                fetchDefaultDog();
            }
        }, [dogId])
    );

    async function fetchDefaultDog() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('dogs')
                .select('id')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setActiveDogId(data.id);
                fetchLessons(data.id);
            } else {
                fetchLessons(null);
            }
        } catch (error) {
            console.error('Error fetching default dog:', error);
            fetchLessons(null);
        }
    }

    async function fetchLessons(currentDogId: string | null) {
        try {
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*');

            if (lessonsError) throw lessonsError;

            const difficultyOrder = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
            const sortedLessons = (lessonsData || []).sort((a, b) => {
                const diffA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ?? 99;
                const diffB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] ?? 99;
                return diffA - diffB;
            });

            setLessons(sortedLessons);

            if (currentDogId) {
                const { data: progressData, error: progressError } = await supabase
                    .from('progress')
                    .select('lesson_id')
                    .eq('dog_id', currentDogId)
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

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchLessons(activeDogId);
        setRefreshing(false);
    }, [activeDogId]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = lessons.length;
        const completed = completedLessonIds.size;
        const byLevel = {
            Beginner: { total: lessons.filter(l => l.difficulty === 'Beginner').length, completed: lessons.filter(l => l.difficulty === 'Beginner' && completedLessonIds.has(l.id)).length },
            Intermediate: { total: lessons.filter(l => l.difficulty === 'Intermediate').length, completed: lessons.filter(l => l.difficulty === 'Intermediate' && completedLessonIds.has(l.id)).length },
            Advanced: { total: lessons.filter(l => l.difficulty === 'Advanced').length, completed: lessons.filter(l => l.difficulty === 'Advanced' && completedLessonIds.has(l.id)).length },
        };
        return { total, completed, byLevel };
    }, [lessons, completedLessonIds]);

    const filteredLessons = filter === 'All'
        ? lessons
        : lessons.filter(l => l.difficulty === filter);

    // Find next lesson to continue
    const nextLesson = useMemo(() => {
        return lessons.find(l => !completedLessonIds.has(l.id) && !isLessonLocked(l));
    }, [lessons, completedLessonIds]);

    function isLessonLocked(lesson: Lesson): boolean {
        const beginnerCount = stats.byLevel.Beginner.completed;
        const intermediateCount = stats.byLevel.Intermediate.completed;

        if (lesson.difficulty === 'Intermediate' && beginnerCount < 3) return true;
        if (lesson.difficulty === 'Advanced' && intermediateCount < 3) return true;
        return false;
    }

    function getLockReason(lesson: Lesson): string {
        const beginnerCount = stats.byLevel.Beginner.completed;
        const intermediateCount = stats.byLevel.Intermediate.completed;

        if (lesson.difficulty === 'Intermediate') {
            return t('lessons.unlock_beginner', { count: 3 - beginnerCount });
        }
        if (lesson.difficulty === 'Advanced') {
            return t('lessons.unlock_intermediate', { count: 3 - intermediateCount });
        }
        return '';
    }

    const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <View className="flex-1 bg-gray-900">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Header */}
                <TabHeader
                    title={t('lessons.title')}
                    icon="school"
                    iconColor="#818cf8"
                    subtitle={t('lessons.subtitle')}
                />

                {/* Progress Card */}
                <View className="mx-4 mb-6 bg-gradient-to-br rounded-3xl p-5 border border-indigo-500/20" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-white text-2xl font-bold">{progressPercent}%</Text>
                            <Text className="text-indigo-300">{t('lessons.complete') || 'Complete'}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-white text-lg font-bold">{stats.completed}/{stats.total}</Text>
                            <Text className="text-indigo-300">{t('lessons.lessons_done') || 'Lessons done'}</Text>
                        </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                        <View
                            className="h-full rounded-full"
                            style={{ width: `${progressPercent}%`, backgroundColor: '#818cf8' }}
                        />
                    </View>

                    {/* Continue Button */}
                    {nextLesson && (
                        <TouchableOpacity
                            onPress={() => {
                                haptics.medium();
                                router.push({ pathname: `/lessons/${nextLesson.id}`, params: { dogId: activeDogId } });
                            }}
                            className="mt-4 bg-indigo-500 rounded-2xl py-3 flex-row items-center justify-center"
                        >
                            <Ionicons name="play" size={20} color="white" />
                            <Text className="text-white font-bold ml-2">
                                {t('lessons.continue') || 'Continue Learning'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Level Stats */}
                <View className="flex-row px-4 mb-6" style={{ gap: 12 }}>
                    {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((level) => {
                        const config = difficultyConfig[level];
                        const levelStats = stats.byLevel[level];
                        const percent = levelStats.total > 0 ? Math.round((levelStats.completed / levelStats.total) * 100) : 0;
                        const isSelected = filter === level;

                        return (
                            <TouchableOpacity
                                key={level}
                                onPress={() => {
                                    haptics.selection();
                                    setFilter(filter === level ? 'All' : level);
                                }}
                                className={`flex-1 rounded-2xl p-2 border ${isSelected ? 'border-white/30' : 'border-transparent'}`}
                                style={{ backgroundColor: config.bgColor }}
                            >
                                <View className="flex-row items-center mb-2">
                                    <Ionicons name={config.icon} size={18} color={config.color} />
                                    <Text className="text-white text-xs font-semibold ml-1" numberOfLines={1}>
                                        {t(`lessons.${level.toLowerCase()}`)}
                                    </Text>
                                </View>
                                <Text className="text-white font-bold text-lg">{levelStats.completed}/{levelStats.total}</Text>
                                <View className="h-1 bg-gray-700/50 rounded-full mt-2 overflow-hidden">
                                    <View
                                        className="h-full rounded-full"
                                        style={{ width: `${percent}%`, backgroundColor: config.color }}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Filter Indicator */}
                {filter !== 'All' && (
                    <View className="flex-row items-center justify-between mx-4 mb-4">
                        <View className="flex-row items-center">
                            <View className="w-1 h-5 rounded-full mr-3" style={{ backgroundColor: difficultyConfig[filter].color }} />
                            <Text className="text-white font-bold text-lg">
                                {t(`lessons.${filter.toLowerCase()}`)} {t('lessons.title')}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setFilter('All')} className="bg-gray-800 px-3 py-1.5 rounded-full">
                            <Text className="text-gray-400 text-sm">{t('common.clear') || 'Clear'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Lessons List */}
                <View className="px-4">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <View key={i} className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/30">
                                <View className="flex-row items-center">
                                    <Skeleton width={48} height={48} borderRadius={12} />
                                    <View className="flex-1 ml-4">
                                        <Skeleton width="70%" height={18} className="mb-2" />
                                        <Skeleton width="50%" height={14} />
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : filteredLessons.length === 0 ? (
                        <View className="items-center py-12">
                            <View className="bg-gray-800/30 rounded-3xl p-8 items-center border border-gray-700/30">
                                <View className="bg-indigo-500/20 p-4 rounded-full mb-4">
                                    <Ionicons name="school-outline" size={48} color="#818cf8" />
                                </View>
                                <Text className="text-white text-xl font-bold mb-2">
                                    {t('lessons.no_lessons') || 'No lessons found'}
                                </Text>
                                <Text className="text-gray-400 text-center">
                                    {t('lessons.no_lessons_desc') || 'Check back later for new lessons'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        filteredLessons.map((lesson, index) => {
                            const isCompleted = completedLessonIds.has(lesson.id);
                            const isLocked = isLessonLocked(lesson);
                            const lockReason = isLocked ? getLockReason(lesson) : '';
                            const config = difficultyConfig[lesson.difficulty as DifficultyLevel];
                            const isNext = nextLesson?.id === lesson.id;

                            return (
                                <TouchableOpacity
                                    key={lesson.id}
                                    disabled={isLocked}
                                    onPress={() => {
                                        haptics.light();
                                        router.push({ pathname: `/lessons/${lesson.id}`, params: { dogId: activeDogId } });
                                    }}
                                    className={`mb-3 rounded-2xl border overflow-hidden ${isLocked
                                        ? 'bg-gray-800/20 border-gray-800/50'
                                        : isNext
                                            ? 'bg-indigo-500/10 border-indigo-500/30'
                                            : isCompleted
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : 'bg-gray-800/50 border-gray-700/30'
                                        }`}
                                >
                                    <View className="flex-row items-center p-4">
                                        {/* Icon with checkmark badge for completed */}
                                        <View className="relative mr-4">
                                            <View
                                                className={`w-12 h-12 rounded-xl items-center justify-center ${isLocked ? 'bg-gray-700/50' : ''}`}
                                                style={!isLocked ? { backgroundColor: isCompleted ? 'rgba(74, 222, 128, 0.2)' : config.bgColor } : {}}
                                            >
                                                {isLocked ? (
                                                    <Ionicons name="lock-closed" size={22} color="#6b7280" />
                                                ) : (
                                                    <Ionicons name={config.icon} size={22} color={isCompleted ? '#4ade80' : config.color} />
                                                )}
                                            </View>
                                            {/* Checkmark badge for completed */}
                                            {isCompleted && !isLocked && (
                                                <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 items-center justify-center border-2 border-gray-900">
                                                    <Ionicons name="checkmark" size={12} color="white" />
                                                </View>
                                            )}
                                        </View>

                                        {/* Content */}
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                {isNext && (
                                                    <View className="bg-indigo-500 px-2 py-0.5 rounded mr-2">
                                                        <Text className="text-white text-xs font-bold">{t('lessons.next') || 'NEXT'}</Text>
                                                    </View>
                                                )}
                                                <Text
                                                    className={`font-bold text-base flex-1 ${isLocked ? 'text-gray-500' : isCompleted ? 'text-gray-300' : 'text-white'
                                                        }`}
                                                    numberOfLines={1}
                                                >
                                                    {i18n.language === 'hu' && lesson.title_hu ? lesson.title_hu : lesson.title}
                                                </Text>
                                            </View>

                                            {isLocked ? (
                                                <View className="flex-row items-center">
                                                    <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
                                                    <Text className="text-gray-500 text-sm ml-1">{lockReason}</Text>
                                                </View>
                                            ) : (
                                                <View className="flex-row items-center">
                                                    <View
                                                        className="px-2 py-0.5 rounded-full mr-2"
                                                        style={{ backgroundColor: config.bgColor }}
                                                    >
                                                        <Text style={{ color: config.color }} className="text-xs font-semibold">
                                                            {t(`lessons.${lesson.difficulty.toLowerCase()}`)}
                                                        </Text>
                                                    </View>
                                                    <Ionicons name="time-outline" size={14} color="#9ca3af" />
                                                    <Text className="text-gray-400 text-sm ml-1">
                                                        {lesson.duration_minutes} {t('lessons.min') || 'min'}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Chevron */}
                                        {!isLocked && (
                                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
