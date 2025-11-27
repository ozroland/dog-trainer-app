import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Dog, Lesson } from "../../types";
import { Button } from "../../components/ui/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDailyLesson, calculateStreak, getSmartGreeting } from "../../lib/trainingUtils";
import { DogSwitcher } from "../../components/DogSwitcher";
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';

export default function Home() {
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [activeDog, setActiveDog] = useState<Dog | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dailyLesson, setDailyLesson] = useState<Lesson | null>(null);
    const [streak, setStreak] = useState(0);
    const [greeting, setGreeting] = useState("Good Morning");
    const [switcherVisible, setSwitcherVisible] = useState(false);
    const [whistleSound, setWhistleSound] = useState<Audio.Sound | null>(null);
    const [isWhistling, setIsWhistling] = useState(false);

    const router = useRouter();
    const insets = useSafeAreaInsets();

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
                // Default to first dog if no active dog selected
                if (!activeDog) {
                    handleDogSelect(data[0]);
                } else {
                    // Refresh active dog data
                    const current = data.find(d => d.id === activeDog.id) || data[0];
                    handleDogSelect(current);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeDog]);

    const handleDogSelect = async (dog: Dog) => {
        setActiveDog(dog);
        setSwitcherVisible(false);

        // Update Streak
        const currentStreak = await calculateStreak(dog.id);
        setStreak(currentStreak);

        // Update Greeting
        setGreeting(getSmartGreeting(dog.name, currentStreak));
    };

    useEffect(() => {
        fetchDogs();
        loadDailyLesson();
    }, []);

    async function loadDailyLesson() {
        const lesson = await getDailyLesson();
        setDailyLesson(lesson);
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDogs();
        loadDailyLesson();
    }, [fetchDogs]);

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

                // Create a file object
                const fileExt = photo.uri.split('.').pop();
                const fileName = `${activeDog.id}_${Date.now()}.${fileExt}`;

                const formData = new FormData();
                formData.append('file', {
                    uri: photo.uri,
                    name: fileName,
                    type: photo.mimeType || 'image/jpeg',
                } as any);

                const { error: uploadError } = await supabase.storage
                    .from('dog_photos')
                    .upload(fileName, formData);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('dog_photos')
                    .getPublicUrl(fileName);

                const { error: updateError } = await supabase
                    .from('dogs')
                    .update({ photo_url: publicUrl })
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
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <Text className="text-white">Loading...</Text>
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
                {/* Top Bar */}
                <View
                    className="flex-row justify-between items-center px-6 mb-6"
                    style={{ paddingTop: insets.top + 20 }}
                >
                    <View>
                        <Text className="text-gray-400 text-sm font-medium">{greeting},</Text>
                        <Text className="text-white text-xl font-bold">Let's train!</Text>
                    </View>
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
                                        <Text className="text-orange-400 text-sm font-bold">{streak} Day Streak</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Start Walk Button */}
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: "/walk/active", params: { dogId: activeDog.id } })}
                            className="bg-indigo-600 p-4 rounded-3xl shadow-lg flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center">
                                <View className="bg-white/20 p-3 rounded-full mr-4">
                                    <Ionicons name="walk" size={24} color="white" />
                                </View>
                                <View>
                                    <Text className="text-white text-lg font-bold">Start Walk</Text>
                                    <Text className="text-indigo-200 text-sm">Track route & events</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="white" />
                        </TouchableOpacity>

                        {/* Today's Mission */}
                        <View>
                            <Text className="text-white text-lg font-bold mb-4">Today's Mission</Text>
                            {dailyLesson ? (
                                <View className="bg-gray-800 rounded-[32px] p-1 border border-gray-700 shadow-xl">
                                    <View className="bg-gray-900/50 rounded-[28px] p-3">
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-row items-center space-x-4">
                                                <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                                                    <Text className="text-indigo-300 text-xs font-bold tracking-wider">DAILY GOAL</Text>
                                                </View>
                                                <View className={`px-3 py-1 rounded-full ${dailyLesson.difficulty === 'Beginner' ? 'bg-green-500/20 border border-green-500/30' :
                                                    dailyLesson.difficulty === 'Intermediate' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                                                        'bg-red-500/20 border border-red-500/30'
                                                    }`}>
                                                    <Text className={`text-xs font-bold ${dailyLesson.difficulty === 'Beginner' ? 'text-green-400' :
                                                        dailyLesson.difficulty === 'Intermediate' ? 'text-yellow-400' :
                                                            'text-red-400'
                                                        }`}>{dailyLesson.difficulty}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <Text className="text-white text-lg font-bold mb-1 leading-tight">{dailyLesson.title}</Text>
                                        <Text className="text-gray-400 text-sm mb-3 leading-relaxed" numberOfLines={2}>
                                            {dailyLesson.description}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => router.push({ pathname: `/lessons/${dailyLesson.id}`, params: { dogId: activeDog.id } })}
                                            className="bg-indigo-600 w-full py-2 rounded-2xl items-center flex-row justify-center shadow-lg"
                                        >
                                            <Text className="text-white font-bold text-base mr-2">Start Training</Text>
                                            <Ionicons name="play" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View className="bg-gray-800 p-8 rounded-[32px] items-center border border-gray-700">
                                    <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                                    <Text className="text-white text-xl font-bold mt-4 mb-2">All Caught Up!</Text>
                                    <Text className="text-gray-400 text-center">Great job training {activeDog.name} today.</Text>
                                </View>
                            )}
                        </View>

                        {/* Quick Actions */}
                        <View>
                            <Text className="text-white text-lg font-bold mb-4">Quick Actions</Text>
                            <View className="flex-row flex-wrap justify-between">
                                <TouchableOpacity
                                    className="w-[48%] bg-gray-800 p-3 rounded-3xl border border-gray-700 items-center justify-center mb-4"
                                    onPress={() => router.push({ pathname: "/(tabs)/lessons", params: { dogId: activeDog.id } })}
                                >
                                    <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                                        <Ionicons name="library" size={24} color="#34d399" />
                                    </View>
                                    <Text className="text-white font-semibold text-sm">Lessons</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="w-[48%] bg-gray-800 p-3 rounded-3xl border border-gray-700 items-center justify-center mb-4"
                                    onPress={() => router.push(`/dog/${activeDog.id}/health`)}
                                >
                                    <View className="bg-red-500/20 p-3 rounded-full mb-3">
                                        <Ionicons name="medical" size={24} color="#f87171" />
                                    </View>
                                    <Text className="text-white font-semibold text-sm">Health</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="w-[48%] bg-gray-800 p-3 rounded-3xl border border-gray-700 items-center justify-center mb-4"
                                    onPress={() => router.push(`/dog/${activeDog.id}/stats`)}
                                >
                                    <View className="bg-indigo-500/20 p-3 rounded-full mb-3">
                                        <Ionicons name="stats-chart" size={24} color="#818cf8" />
                                    </View>
                                    <Text className="text-white font-semibold text-sm">Stats</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="w-[48%] bg-gray-800 p-3 rounded-3xl border border-gray-700 items-center justify-center mb-4"
                                    onPress={() => router.push(`/dog/${activeDog.id}/achievements`)}
                                >
                                    <View className="bg-yellow-500/20 p-3 rounded-full mb-3">
                                        <Ionicons name="trophy" size={24} color="#eab308" />
                                    </View>
                                    <Text className="text-white font-semibold text-sm">Badges</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Training Tools */}
                        <View>
                            <Text className="text-white text-lg font-bold mb-4">Training Tools</Text>
                            <View className="flex-row flex-wrap justify-between">
                                <TouchableOpacity
                                    className="w-[48%] bg-gray-800 p-4 rounded-3xl border border-gray-700 items-center justify-center mb-4 active:bg-gray-700"
                                    onPress={async () => {
                                        try {
                                            const { sound } = await Audio.Sound.createAsync(
                                                require('../../assets/sounds/dog-clicker.mp3')
                                            );
                                            await sound.playAsync();
                                        } catch (error) {
                                            console.error("Failed to play sound", error);
                                            Alert.alert("Error", "Could not play sound.");
                                        }
                                    }}
                                >
                                    <View className="bg-blue-500/20 p-4 rounded-full mb-3 border border-blue-500/30">
                                        <Ionicons name="radio-button-on" size={32} color="#60a5fa" />
                                    </View>
                                    <Text className="text-white font-bold text-lg">Clicker</Text>
                                    <Text className="text-gray-500 text-xs mt-1">Mark behavior</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`w-[48%] p-4 rounded-3xl border items-center justify-center mb-4 ${isWhistling ? 'bg-orange-500/20 border-orange-500' : 'bg-gray-800 border-gray-700'
                                        }`}
                                    onPress={toggleWhistle}
                                >
                                    <View className={`p-4 rounded-full mb-3 border ${isWhistling ? 'bg-orange-500 border-orange-400' : 'bg-orange-500/20 border-orange-500/30'
                                        }`}>
                                        <Ionicons name={isWhistling ? "stop" : "notifications"} size={32} color={isWhistling ? "white" : "#fb923c"} />
                                    </View>
                                    <Text className={`font-bold text-lg ${isWhistling ? 'text-orange-500' : 'text-white'}`}>
                                        {isWhistling ? 'Stop' : 'Whistle'}
                                    </Text>
                                    <Text className="text-gray-500 text-xs mt-1">Recall signal</Text>
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
                            <Text className="text-white text-xl font-bold mb-2">No Dogs Yet</Text>
                            <Text className="text-gray-400 text-center mb-8 leading-6">
                                Add your furry friend to start their personalized training journey.
                            </Text>
                            <Button
                                title="Add Your Dog"
                                onPress={() => router.push("/dog/create")}
                                className="w-full"
                            />
                        </View>
                    </View>
                )}
            </ScrollView>

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
        </View>
    );
}
