import { View, Text, TouchableOpacity, ScrollView, Image, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dog } from '../../types';
import { TabHeader } from "../../components/ScreenHeader";
import { Skeleton } from "../../components/ui/Skeleton";

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        fetchUser();
        fetchDogs();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUser();
        fetchDogs();
    }, []);

    async function fetchUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setEmail(user.email || "");
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    }

    async function fetchDogs() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('dogs')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDogs(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSignOut() {
        Alert.alert(
            t('settings.logout_confirm_title'),
            t('settings.logout_confirm_message'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('settings.logout'),
                    style: "destructive",
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace("/auth");
                    }
                }
            ]
        );
    }

    async function handleDeleteAccount() {
        Alert.alert(
            t('profile.delete_confirm_title'),
            t('profile.delete_confirm_message'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const { error } = await supabase.rpc('delete_user');
                            if (error) throw error;

                            await supabase.auth.signOut();
                            router.replace("/auth");
                            Alert.alert(t('profile.account_deleted'), t('profile.account_deleted_message'));
                        } catch (error: any) {
                            Alert.alert(t('common.error'), "Failed to delete account: " + error.message);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }

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
                    title={t('profile.title')}
                    icon="person"
                    iconColor="#818cf8"
                    subtitle={email || t('profile.your_account')}
                />



                {/* My Dogs Section */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-1 h-5 rounded-full bg-amber-500 mr-3" />
                        <Text className="text-white font-bold text-lg flex-1">{t('profile.my_dogs')}</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/dog/create')}
                            className="bg-indigo-500/20 px-3 py-1.5 rounded-full flex-row items-center"
                        >
                            <Ionicons name="add" size={16} color="#818cf8" />
                            <Text className="text-indigo-400 text-sm font-semibold ml-1">{t('dog.add_new') || 'Add'}</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        [...Array(2)].map((_, i) => (
                            <View key={i} className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/30 flex-row items-center">
                                <Skeleton width={48} height={48} borderRadius={24} />
                                <View className="flex-1 ml-4">
                                    <Skeleton width="60%" height={18} className="mb-2" />
                                    <Skeleton width="40%" height={14} />
                                </View>
                            </View>
                        ))
                    ) : dogs.length === 0 ? (
                        <View className="bg-gray-800/30 rounded-2xl p-8 border border-dashed border-gray-600 items-center">
                            <View className="bg-gray-700/30 p-4 rounded-full mb-4">
                                <Ionicons name="paw" size={40} color="#6b7280" />
                            </View>
                            <Text className="text-gray-400 text-center mb-4">{t('home.no_dogs')}</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/dog/create')}
                                className="bg-indigo-500 px-6 py-3 rounded-2xl flex-row items-center"
                            >
                                <Ionicons name="add" size={20} color="white" />
                                <Text className="text-white font-bold ml-2">{t('home.add_dog_button')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        dogs.map((dog) => (
                            <TouchableOpacity
                                key={dog.id}
                                onPress={() => router.push(`/dog/${dog.id}/stats`)}
                                className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/30 flex-row items-center"
                            >
                                {dog.photo_url ? (
                                    <Image
                                        source={{ uri: dog.photo_url }}
                                        className="w-14 h-14 rounded-full bg-gray-700"
                                    />
                                ) : (
                                    <View className="w-14 h-14 rounded-full bg-amber-500/20 items-center justify-center">
                                        <Ionicons name="paw" size={24} color="#fbbf24" />
                                    </View>
                                )}
                                <View className="flex-1 ml-4">
                                    <Text className="text-white text-lg font-bold">{dog.name}</Text>
                                    <Text className="text-gray-400 text-sm">{dog.breed || t('dog.unknown_breed')}</Text>
                                </View>
                                <View className="bg-gray-700/50 p-2 rounded-full">
                                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* App Settings Section */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-1 h-5 rounded-full bg-blue-500 mr-3" />
                        <Text className="text-white font-bold text-lg">{t('profile.app_section')}</Text>
                    </View>

                    <View className="bg-gray-800/50 rounded-2xl border border-gray-700/30 overflow-hidden">
                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            className="flex-row items-center p-4 border-b border-gray-700/30"
                        >
                            <View className="bg-gray-700/50 p-2.5 rounded-xl mr-4">
                                <Ionicons name="settings-outline" size={22} color="#9ca3af" />
                            </View>
                            <Text className="text-white text-base flex-1 font-medium">{t('profile.settings')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-4"
                        >
                            <View className="bg-gray-700/50 p-2.5 rounded-xl mr-4">
                                <Ionicons name="star" size={22} color="#9ca3af" />
                            </View>
                            <Text className="text-white text-base flex-1 font-medium">{t('profile.rate_app')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Section */}
                <View className="px-4 mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-1 h-5 rounded-full bg-red-500 mr-3" />
                        <Text className="text-white font-bold text-lg">{t('profile.account_section')}</Text>
                    </View>

                    <View className="bg-gray-800/50 rounded-2xl border border-gray-700/30 overflow-hidden">
                        <TouchableOpacity
                            onPress={handleSignOut}
                            className="flex-row items-center p-4 border-b border-gray-700/30"
                        >
                            <View className="bg-red-500/20 p-2.5 rounded-xl mr-4">
                                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                            </View>
                            <Text className="text-red-400 text-base flex-1 font-medium">{t('settings.logout')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            className="flex-row items-center p-4"
                        >
                            <View className="bg-red-500/20 p-2.5 rounded-xl mr-4">
                                <Ionicons name="trash-outline" size={22} color="#ef4444" />
                            </View>
                            <Text className="text-red-400 text-base flex-1 font-medium">{t('profile.delete_account')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
