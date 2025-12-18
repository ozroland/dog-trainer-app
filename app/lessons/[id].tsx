import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Lesson, Achievement } from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import Markdown from 'react-native-markdown-display';
import { useTranslation } from "react-i18next";
import { Confetti } from "../../components/Confetti";
import { AchievementModal } from "../../components/AchievementModal";
import { checkAndUnlockAchievements } from "../../lib/achievements";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

const difficultyConfig: Record<DifficultyLevel, {
    color: string;
    bgColor: string;
    gradientColors: [string, string];
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
}> = {
    Beginner: {
        color: '#60a5fa',
        bgColor: 'rgba(96, 165, 250, 0.15)',
        gradientColors: ['#1e40af', '#1e3a8a'],
        icon: 'leaf',
        label: 'Beginner'
    },
    Intermediate: {
        color: '#fbbf24',
        bgColor: 'rgba(251, 191, 36, 0.15)',
        gradientColors: ['#92400e', '#78350f'],
        icon: 'flash',
        label: 'Intermediate'
    },
    Advanced: {
        color: '#f87171',
        bgColor: 'rgba(248, 113, 113, 0.15)',
        gradientColors: ['#991b1b', '#7f1d1d'],
        icon: 'flame',
        label: 'Advanced'
    },
};

export default function LessonDetailScreen() {
    const { t, i18n } = useTranslation();
    const { id, dogId } = useLocalSearchParams();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Animations
    const iconScale = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        fetchLesson();
    }, [id]);

    useEffect(() => {
        if (lesson) {
            // Animate icon
            Animated.spring(iconScale, {
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
    }, [lesson]);

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
            Alert.alert(t('common.error'), t('lessons.load_error'));
        } finally {
            setLoading(false);
        }
    }

    async function handleComplete() {
        if (!dogId) return;
        try {
            setCompleting(true);

            const { error } = await supabase
                .from('progress')
                .insert({
                    dog_id: dogId,
                    lesson_id: id,
                    status: 'Completed',
                    completed_at: new Date().toISOString(),
                });

            if (error) {
                if (error.code === '23505') {
                    setIsCompleted(true);
                    return;
                }
                throw error;
            }

            setIsCompleted(true);
            setShowConfetti(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (dogId) {
                const { newlyUnlocked } = await checkAndUnlockAchievements(dogId as string);
                if (newlyUnlocked.length > 0) {
                    setUnlockedAchievement(newlyUnlocked[0]);
                    setShowAchievementModal(true);
                    return;
                }
            }

            Alert.alert(t('lessons.complete_success_title'), t('lessons.complete_success_message'));
            setTimeout(() => {
                setShowConfetti(false);
                router.back();
            }, 2000);

        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('lessons.complete_error'));
        } finally {
            setCompleting(false);
        }
    }

    if (loading || !lesson) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator color="#818cf8" size="large" />
            </View>
        );
    }

    const config = difficultyConfig[lesson.difficulty as DifficultyLevel] || difficultyConfig.Beginner;
    const lessonTitle = i18n.language === 'hu' && lesson.title_hu ? lesson.title_hu : lesson.title;
    const lessonDescription = i18n.language === 'hu' && lesson.description_hu ? lesson.description_hu : lesson.description;
    const lessonContent = i18n.language === 'hu' && lesson.content_markdown_hu ? lesson.content_markdown_hu : lesson.content_markdown;

    return (
        <View className="flex-1 bg-gray-900">
            <Confetti visible={showConfetti} />
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Hero Header */}
                <LinearGradient
                    colors={config.gradientColors}
                    className="pt-0 pb-8 px-4"
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
                    </View>

                    {/* Lesson Icon */}
                    <View className="items-center mt-4 mb-6">
                        <Animated.View
                            className="w-24 h-24 rounded-3xl items-center justify-center"
                            style={[
                                { backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ scale: iconScale }] }
                            ]}
                        >
                            <Ionicons name={config.icon} size={48} color="white" />
                        </Animated.View>
                    </View>

                    {/* Title & Meta */}
                    <View className="items-center">
                        <Text className="text-white text-2xl font-bold text-center mb-3" numberOfLines={2}>
                            {lessonTitle}
                        </Text>
                        <View className="flex-row items-center">
                            <View
                                className="px-3 py-1.5 rounded-full mr-3"
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                                <Text className="text-white text-sm font-semibold">
                                    {t(`lessons.${lesson.difficulty.toLowerCase()}`)}
                                </Text>
                            </View>
                            <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                <Ionicons name="time-outline" size={16} color="white" />
                                <Text className="text-white text-sm font-semibold ml-1.5">
                                    {lesson.duration_minutes} {t('common.min')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Completed Badge */}
                    {isCompleted && (
                        <View className="mt-4 items-center">
                            <View className="flex-row items-center bg-green-500/30 px-4 py-2 rounded-full">
                                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                                <Text className="text-green-400 font-bold ml-2">{t('lessons.completed')}</Text>
                            </View>
                        </View>
                    )}
                </LinearGradient>

                {/* Content Section */}
                <Animated.View
                    className="px-4 mt-4"
                    style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                >
                    {/* Description Card */}
                    <View className="bg-gray-800/80 rounded-3xl p-5 mb-4 border border-gray-700/50">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: config.bgColor }}>
                                <Ionicons name="document-text" size={16} color={config.color} />
                            </View>
                            <Text className="text-white font-bold text-lg">{t('lessons.overview') || 'Overview'}</Text>
                        </View>
                        <Text className="text-gray-300 text-base leading-relaxed">
                            {lessonDescription}
                        </Text>
                    </View>

                    {/* Instructions Card */}
                    <View className="bg-gray-800/80 rounded-3xl p-5 border border-gray-700/50">
                        <View className="flex-row items-center mb-4">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: config.bgColor }}>
                                <Ionicons name="list" size={16} color={config.color} />
                            </View>
                            <Text className="text-white font-bold text-lg">{t('lessons.instructions') || 'Instructions'}</Text>
                        </View>

                        <Markdown
                            style={{
                                body: { color: '#e5e7eb', fontSize: 16, lineHeight: 26 },
                                heading1: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 12, marginTop: 16 },
                                heading2: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 14 },
                                heading3: { color: '#d1d5db', fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
                                paragraph: { marginBottom: 12 },
                                listItem: { color: '#e5e7eb', marginBottom: 6 },
                                listUnorderedItemIcon: { color: config.color, fontSize: 8, lineHeight: 26 },
                                listOrderedItemIcon: { color: config.color, fontWeight: 'bold' },
                                strong: { color: 'white', fontWeight: 'bold' },
                                em: { color: '#d1d5db', fontStyle: 'italic' },
                                blockquote: {
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    borderLeftColor: '#818cf8',
                                    borderLeftWidth: 4,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    marginVertical: 8,
                                    borderRadius: 8,
                                },
                                code_inline: {
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: config.color,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                },
                                fence: {
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: 12,
                                    padding: 12,
                                    marginVertical: 8,
                                },
                                code_block: { color: '#e5e7eb', fontSize: 14 },
                            }}
                        >
                            {lessonContent}
                        </Markdown>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Sticky Complete Button */}
            {!isCompleted && dogId && (
                <View
                    className="absolute bottom-0 left-0 right-0 px-4"
                    style={{ paddingBottom: insets.bottom + 16 }}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(17, 24, 39, 0.95)', '#111827']}
                        className="absolute inset-0 -top-8"
                    />
                    <TouchableOpacity
                        onPress={handleComplete}
                        disabled={completing}
                        className="w-full py-4 rounded-2xl items-center flex-row justify-center"
                        style={{ backgroundColor: config.color }}
                    >
                        {completing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="white" />
                                <Text className="text-white font-bold text-lg ml-2">{t('lessons.complete_button')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Achievement Modal */}
            {unlockedAchievement && (
                <AchievementModal
                    visible={showAchievementModal}
                    achievement={unlockedAchievement}
                    onClose={() => {
                        setShowAchievementModal(false);
                        setShowConfetti(false);
                        router.back();
                    }}
                />
            )}
        </View>
    );
}
