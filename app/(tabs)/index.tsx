import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Image } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Dog, Lesson } from "../../types";
import { Button } from "../../components/ui/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDailyLesson, calculateStreak, getSmartGreeting } from "../../lib/trainingUtils";
import { DogSwitcher } from "../../components/DogSwitcher";
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { DogCardSkeleton, LessonCardSkeleton, Skeleton } from "../../components/ui/Skeleton";
import { uploadImageToSupabase } from "../../lib/imageUpload";

import { useTranslation } from "react-i18next";

export default function Home() {
    const { t, i18n } = useTranslation();
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [activeDog, setActiveDog] = useState<Dog | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dailyLesson, setDailyLesson] = useState<Lesson | null>(null);
    const [streak, setStreak] = useState(0);
    const [greeting, setGreeting] = useState("greeting.morning");
    const [switcherVisible, setSwitcherVisible] = useState(false);
    const [whistleSound, setWhistleSound] = useState<Audio.Sound | null>(null);
    const [isWhistling, setIsWhistling] = useState(false);
    const [photoCount, setPhotoCount] = useState(0);

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const activeDogRef = useRef(activeDog);

    useEffect(() => {
        activeDogRef.current = activeDog;
    }, [activeDog]);

    // Cleanup whistle sound on unmount
    useEffect(() => {
        return () => {
            if (whistleSound) {
                whistleSound.unloadAsync();
            }
        };
    }, [whistleSound]);

    const fetchDogs = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Redirect if no user
                router.replace("/auth");
                return;
            }

            const { data, error } = await supabase
                .from('dogs')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDogs(data || []);

            if (data && data.length > 0) {
                const currentActive = activeDogRef.current;
                // Default to first dog if no active dog selected
                if (!currentActive) {
                    setActiveDog(data[0]);
                    updateDogStats(data[0]);
                } else {
                    // Refresh active dog data
                    const current = data.find(d => d.id === currentActive.id) || data[0];
                    setActiveDog(current);
                    updateDogStats(current);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const updateDogStats = async (dog: Dog) => {
        // Update Streak
        const currentStreak = await calculateStreak(dog.id);
        setStreak(currentStreak);

        // Update Greeting
        setGreeting(getSmartGreeting(currentStreak));

        // Fetch photo count
        try {
            const { count } = await supabase
                .from('photos')
                .select('*', { count: 'exact', head: true })
                .eq('dog_id', dog.id);
            setPhotoCount(count || 0);
        } catch (e) {
            setPhotoCount(0);
        }
    };

    const handleDogSelect = async (dog: Dog) => {
        setActiveDog(dog);
        setSwitcherVisible(false);
        await updateDogStats(dog);
    };

    useFocusEffect(
        useCallback(() => {
            fetchDogs();
        }, [fetchDogs])
    );

    // Load daily lesson when activeDog changes
    useEffect(() => {
        async function loadDailyLesson() {
            if (activeDog) {
                const lesson = await getDailyLesson(activeDog.id);
                setDailyLesson(lesson);
            } else {
                const lesson = await getDailyLesson();
                setDailyLesson(lesson);
            }
        }
        loadDailyLesson();
    }, [activeDog?.id]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDogs();
        if (activeDog) {
            const lesson = await getDailyLesson(activeDog.id);
            setDailyLesson(lesson);
        }
    }, [fetchDogs, activeDog?.id]);

    const handleUploadPhoto = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && activeDog) {
                const photo = result.assets[0];
                const fileExt = photo.uri.split('.').pop() || 'jpg';
                const fileName = `${activeDog.id}_${Date.now()}.${fileExt}`;

                const { url, error } = await uploadImageToSupabase(
                    supabase,
                    'dog_photos',
                    photo.uri,
                    fileName,
                    photo.mimeType
                );

                if (error || !url) {
                    throw new Error(error || 'Upload failed');
                }

                const { error: updateError } = await supabase
                    .from('dogs')
                    .update({ photo_url: url })
                    .eq('id', activeDog.id);

                if (updateError) throw updateError;

                // Refresh to get new photo
                fetchDogs();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to upload photo. Please try again.');
            console.error(error);
        }
    };

    const toggleWhistle = async () => {
        try {
            if (isWhistling && whistleSound) {
                await whistleSound.stopAsync();
                setIsWhistling(false);
            } else {
                // Haptic feedback when starting whistle
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                // Unload previous if exists
                if (whistleSound) {
                    await whistleSound.unloadAsync();
                }

                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/sounds/dog-whistle.mp3'),
                    { isLooping: true }
                );
                setWhistleSound(sound);
                setIsWhistling(true);
                await sound.playAsync();
            }
        } catch (error) {
            console.error("Failed to toggle whistle", error);
            Alert.alert("Error", "Could not play whistle.");
            setIsWhistling(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-900">
                <View className="px-6" style={{ paddingTop: insets.top + 20 }}>
                    {/* Header skeleton */}
                    <Skeleton width="40%" height={14} className="mb-2" />
                    <Skeleton width="50%" height={24} className="mb-8" />

                    {/* Dog card skeleton */}
                    <DogCardSkeleton />

                    {/* Mission skeleton */}
                    <Skeleton width="40%" height={20} className="mt-6 mb-4" />
                    <LessonCardSkeleton />

                    {/* Quick actions skeleton */}
                    <Skeleton width="40%" height={20} className="mt-4 mb-4" />
                    <View className="flex-row flex-wrap justify-between">
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} className="w-[48%] bg-gray-800 p-3 rounded-3xl border border-gray-700 items-center mb-4">
                                <Skeleton width={48} height={48} borderRadius={24} className="mb-3" />
                                <Skeleton width="60%" height={14} />
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* Header */}
                <View className="px-4 mb-6" style={{ paddingTop: insets.top + 16 }}>
                    <View className="flex-row items-center mb-1">
                        <Ionicons name="home" size={28} color="#818cf8" />
                        <Text className="text-white text-2xl font-bold ml-2">{t('tabs.home')}</Text>
                    </View>
                    <Text className="text-gray-400">
                        {activeDog ? t(greeting, { name: activeDog.name }) : t('home.welcome')}
                    </Text>
                </View>

                {activeDog ? (
                    <View className="px-6 gap-6">
                        {/* Dog Profile Card */}
                        <TouchableOpacity
                            onPress={() => setSwitcherVisible(true)}
                            activeOpacity={0.9}
                            className="bg-gray-800 p-4 rounded-3xl border border-gray-700 flex-row items-center"
                        >
                            <TouchableOpacity onPress={handleUploadPhoto} className="relative">
                                {activeDog.photo_url ? (
                                    <Image
                                        source={{ uri: activeDog.photo_url }}
                                        className="w-20 h-20 rounded-full bg-gray-700"
                                    />
                                ) : (
                                    <View className="w-20 h-20 rounded-full bg-gray-700 items-center justify-center">
                                        <Ionicons name="paw" size={32} color="#6b7280" />
                                    </View>
                                )}
                                <View className="absolute bottom-0 right-0 bg-indigo-500 p-1.5 rounded-full border-2 border-gray-800">
                                    <Ionicons name="camera" size={12} color="white" />
                                </View>
                            </TouchableOpacity>

                            <View className="flex-1 ml-4">
                                <View className="flex-row justify-between items-start">
                                    <View>
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-white text-2xl font-bold">{activeDog.name}</Text>
                                            <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                                        </View>
                                        <Text className="text-gray-400 text-sm">{activeDog.breed || 'Best Friend'}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => router.push(`/dog/${activeDog.id}/edit`)}
                                        className="bg-gray-700 p-2 rounded-full"
                                    >
                                        <Ionicons name="pencil" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {streak > 0 && (
                                    <View className="flex-row items-center mt-2">
                                        <Text className="text-orange-500 text-sm mr-1">🔥</Text>
                                        <Text className="text-orange-400 text-sm font-bold">{streak} {t('home.streak')}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>


                        {/* Today's Mission */}
                        <View>
                            <View className="flex-row items-center mb-4">
                                <View className="w-1 h-5 rounded-full bg-indigo-500 mr-3" />
                                <Text className="text-white font-bold text-lg">{t('home.todays_mission')}</Text>
                            </View>
                            {dailyLesson ? (
                                <View className="bg-gray-800 rounded-[32px] p-1 border border-gray-700 shadow-xl">
                                    <View className="bg-gray-900/50 rounded-[28px] p-3">
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-row items-center space-x-4">
                                                <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                                                    <Text className="text-indigo-300 text-xs font-bold tracking-wider">{t('home.daily_goal')}</Text>
                                                </View>
                                                <View className={`px-3 py-1 rounded-full ${dailyLesson.difficulty === 'Beginner' ? 'bg-green-500/20 border border-green-500/30' :
                                                    dailyLesson.difficulty === 'Intermediate' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                                        'bg-red-500/20 border border-red-500/30'
                                                    }`}>
                                                    <Text className={`text-xs font-bold ${dailyLesson.difficulty === 'Beginner' ? 'text-green-400' :
                                                        dailyLesson.difficulty === 'Intermediate' ? 'text-yellow-400' :
                                                            'text-red-400'
                                                        }`}>{t(`lessons.${dailyLesson.difficulty.toLowerCase()}`)}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <Text className="text-white text-lg font-bold mb-1 leading-tight">
                                            {i18n.language === 'hu' && dailyLesson.title_hu ? dailyLesson.title_hu : dailyLesson.title}
                                        </Text>
                                        <Text className="text-gray-400 text-sm mb-3 leading-relaxed" numberOfLines={2}>
                                            {i18n.language === 'hu' && dailyLesson.description_hu ? dailyLesson.description_hu : dailyLesson.description}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => router.push({ pathname: `/lessons/${dailyLesson.id}`, params: { dogId: activeDog.id } })}
                                            className="bg-indigo-600 w-full py-2 rounded-2xl items-center flex-row justify-center shadow-lg"
                                        >
                                            <Text className="text-white font-bold text-base mr-2">{t('home.start_training')}</Text>
                                            <Ionicons name="play" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View className="bg-gray-800 p-8 rounded-[32px] items-center border border-gray-700">
                                    <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                                    <Text className="text-white text-xl font-bold mt-4 mb-2">{t('home.all_caught_up')}</Text>
                                    <Text className="text-gray-400 text-center">{t('home.great_job', { name: activeDog.name })}</Text>
                                </View>
                            )}
                        </View>

                        {/* Quick Actions */}
                        <View>
                            <View className="flex-row items-center mb-4">
                                <View className="w-1 h-5 rounded-full bg-purple-500 mr-3" />
                                <Text className="text-white font-bold text-lg">{t('home.quick_actions')}</Text>
                            </View>
                            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                                <TouchableOpacity
                                    className="bg-gray-800/50 rounded-2xl border border-gray-700/30 items-center justify-center p-4"
                                    style={{ width: '48%' }}
                                    onPress={() => router.push(`/dog/${activeDog.id}/calendar`)}
                                >
                                    <View className="bg-purple-500/20 p-3 rounded-xl mb-3">
                                        <Ionicons name="calendar" size={24} color="#a855f7" />
                                    </View>
                                    <Text className="text-white font-semibold text-sm text-center">{t('calendar.calendar_health_title')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="bg-gray-800/50 rounded-2xl border border-gray-700/30 items-center justify-center p-4"
                                    style={{ width: '48%' }}
                                    onPress={() => router.push({ pathname: "/walk/countdown", params: { dogId: activeDog.id } })}
                                >
                                    <View className="bg-indigo-500/20 p-3 rounded-xl mb-3">
                                        <Ionicons name="walk" size={24} color="#818cf8" />
                                    </View>
                                    <Text className="text-white font-semibold text-sm">{t('home.start_walk')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="bg-gray-800/50 rounded-2xl border border-gray-700/30 items-center justify-center p-4"
                                    style={{ width: '48%' }}
                                    onPress={() => router.push(`/dog/${activeDog.id}/achievements`)}
                                >
                                    <View className="bg-yellow-500/20 p-3 rounded-xl mb-3">
                                        <Ionicons name="trophy" size={24} color="#eab308" />
                                    </View>
                                    <Text className="text-white font-semibold text-sm">{t('home.badges')}</Text>
                                </TouchableOpacity>

                                {/* Park Meetup Card */}
                                <View
                                    className="bg-gray-800/30 rounded-2xl border border-dashed border-gray-600 items-center justify-center p-4"
                                    style={{ width: '48%' }}
                                >
                                    <View className="bg-green-500/20 p-3 rounded-xl mb-3">
                                        <Ionicons name="people" size={24} color="#4ade80" />
                                    </View>
                                    <Text className="text-gray-400 font-semibold text-sm">{t('home.park_meetup')}</Text>
                                    <Text className="text-gray-600 text-[10px] mt-1">{t('common.soon')}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Training Tools */}
                        <View className="mt-2">
                            <View className="flex-row items-center mb-4">
                                <View className="w-1 h-5 rounded-full bg-blue-500 mr-3" />
                                <Text className="text-white font-bold text-lg">{t('home.training_tools')}</Text>
                            </View>
                            <View className="flex-row" style={{ gap: 12 }}>
                                <TouchableOpacity
                                    className="flex-1 bg-gray-800/50 p-4 rounded-2xl border border-gray-700/30 items-center justify-center"
                                    onPress={async () => {
                                        try {
                                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                            const { sound } = await Audio.Sound.createAsync(
                                                require('../../assets/sounds/dog-clicker.mp3')
                                            );
                                            await sound.playAsync();
                                        } catch (error) {
                                            console.error("Failed to play sound", error);
                                            Alert.alert(t('common.error'), "Could not play sound.");
                                        }
                                    }}
                                >
                                    <View className="bg-blue-500/20 p-3 rounded-xl mb-2">
                                        <Ionicons name="radio-button-on" size={28} color="#60a5fa" />
                                    </View>
                                    <Text className="text-white font-bold text-base">{t('home.clicker')}</Text>
                                    <Text className="text-gray-500 text-xs mt-1">{t('home.mark_behavior')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`flex-1 p-4 rounded-2xl border items-center justify-center ${isWhistling ? 'bg-orange-500/20 border-orange-500/50' : 'bg-gray-800/50 border-gray-700/30'}`}
                                    onPress={toggleWhistle}
                                >
                                    <View className={`p-3 rounded-xl mb-2 ${isWhistling ? 'bg-orange-500' : 'bg-orange-500/20'}`}>
                                        <Ionicons name={isWhistling ? "stop" : "notifications"} size={28} color={isWhistling ? "white" : "#fb923c"} />
                                    </View>
                                    <Text className={`font-bold text-base ${isWhistling ? 'text-orange-400' : 'text-white'}`}>
                                        {isWhistling ? t('home.stop') : t('home.whistle')}
                                    </Text>
                                    <Text className="text-gray-500 text-xs mt-1">{t('home.recall_signal')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="px-6 pt-10">
                        <View className="bg-gray-800 p-8 rounded-3xl items-center border border-gray-700">
                            <View className="bg-gray-700 p-4 rounded-full mb-4">
                                <Ionicons name="paw" size={40} color="#9ca3af" />
                            </View>
                            <Text className="text-white text-xl font-bold mb-2">{t('home.no_dogs')}</Text>
                            <Text className="text-gray-400 text-center mb-8 leading-6">
                                {t('home.add_dog_message')}
                            </Text>
                            <Button
                                title={t('home.add_dog_button')}
                                onPress={() => router.push("/dog/create")}
                                className="w-full"
                            />
                        </View>
                    </View>
                )
                }
            </ScrollView >

            <DogSwitcher
                visible={switcherVisible}
                dogs={dogs}
                activeDogId={activeDog?.id || ''}
                onSelect={handleDogSelect}
                onClose={() => setSwitcherVisible(false)}
                onAddDog={() => {
                    setSwitcherVisible(false);
                    router.push("/dog/create");
                }}
            />
        </View >
    );
}
