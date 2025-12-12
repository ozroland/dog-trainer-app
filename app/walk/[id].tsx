import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Walk, WalkEvent } from "../../types";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { hu, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const EVENT_TYPES = [
    { type: 'poop', icon: '💩', label: 'walk.poop', color: 'bg-amber-700' },
    { type: 'pee', icon: '💧', label: 'walk.pee', color: 'bg-blue-500' },
    { type: 'reaction', icon: '🐕', label: 'walk.reaction', color: 'bg-red-500' },
    { type: 'sniff', icon: '👃', label: 'walk.sniff', color: 'bg-green-500' },
];

export default function WalkSummaryScreen() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'hu' ? hu : enUS;
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [walk, setWalk] = useState<Walk | null>(null);
    const [events, setEvents] = useState<WalkEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWalkData();
    }, [id]);

    async function fetchWalkData() {
        try {
            const { data: walkData, error: walkError } = await supabase
                .from('walks')
                .select('*')
                .eq('id', id)
                .single();

            if (walkError) throw walkError;
            setWalk(walkData);

            const { data: eventsData, error: eventsError } = await supabase
                .from('walk_events')
                .select('*')
                .eq('walk_id', id)
                .order('timestamp', { ascending: true });

            if (eventsError) throw eventsError;
            setEvents(eventsData || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}${t('common.min')} ${secs}${t('common.sec')}`;
    };

    if (loading || !walk) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator color="#4f46e5" />
            </View>
        );
    }

    const initialRegion = walk.route_coordinates && walk.route_coordinates.length > 0 ? {
        latitude: walk.route_coordinates[0].latitude,
        longitude: walk.route_coordinates[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    } : undefined;

    return (
        <View className="flex-1 bg-gray-900">
            <ScrollView className="flex-1">
                {/* Map Header */}
                <View className="h-80 w-full relative">
                    <MapView
                        style={{ flex: 1 }}
                        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                        initialRegion={initialRegion}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        {walk.route_coordinates && (
                            <Polyline
                                coordinates={walk.route_coordinates}
                                strokeColor="#4f46e5"
                                strokeWidth={4}
                            />
                        )}
                        {events.map(event => (
                            <Marker
                                key={event.id}
                                coordinate={{ latitude: event.latitude, longitude: event.longitude }}
                            >
                                <View className="bg-white rounded-full p-1 border border-gray-200">
                                    <Text className="text-xs">{EVENT_TYPES.find(e => e.type === event.event_type)?.icon}</Text>
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Back Button Overlay */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-4 left-4 bg-gray-900/50 p-2 rounded-full backdrop-blur-sm"
                        style={{ marginTop: insets.top }}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent" />
                </View>

                <View className="px-6 mt-2">
                    <View className="flex-row justify-between items-end mb-6">
                        <View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">
                                {format(new Date(walk.start_time), 'EEEE, MMM d', { locale: dateLocale })}
                            </Text>
                            <Text className="text-white text-3xl font-bold">{t('walk.summary_title')}</Text>
                        </View>
                        <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                            <Text className="text-indigo-300 font-bold text-xs">{t('walk.completed')}</Text>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row gap-4 mb-8">
                        <View className="flex-1 bg-gray-800 p-4 rounded-2xl border border-gray-700">
                            <View className="bg-blue-500/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                                <Ionicons name="time" size={20} color="#60a5fa" />
                            </View>
                            <Text className="text-gray-400 text-xs font-medium uppercase">{t('walk.duration')}</Text>
                            <Text className="text-white text-xl font-bold">{formatDuration(walk.duration_seconds)}</Text>
                        </View>
                        <View className="flex-1 bg-gray-800 p-4 rounded-2xl border border-gray-700">
                            <View className="bg-emerald-500/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                                <Ionicons name="footsteps" size={20} color="#34d399" />
                            </View>
                            <Text className="text-gray-400 text-xs font-medium uppercase">{t('walk.distance')}</Text>
                            <Text className="text-white text-xl font-bold">{(walk.distance_meters / 1000).toFixed(2)} {t('common.km')}</Text>
                        </View>
                    </View>

                    {/* Events Log */}
                    <Text className="text-white text-lg font-bold mb-4">{t('walk.activity_log')}</Text>
                    {events.length === 0 ? (
                        <View className="bg-gray-800 p-6 rounded-2xl border border-gray-700 items-center">
                            <Text className="text-gray-500">{t('walk.no_events')}</Text>
                        </View>
                    ) : (
                        <View className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                            {events.map((event, index) => {
                                const typeInfo = EVENT_TYPES.find(e => e.type === event.event_type);
                                return (
                                    <View
                                        key={event.id}
                                        className={`flex-row items-center p-4 ${index !== events.length - 1 ? 'border-b border-gray-700' : ''}`}
                                    >
                                        <View className={`${typeInfo?.color || 'bg-gray-600'} w-10 h-10 rounded-full items-center justify-center mr-4`}>
                                            <Text className="text-lg">{typeInfo?.icon}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white font-bold text-base">{t(typeInfo?.label || '')}</Text>
                                            <Text className="text-gray-400 text-xs">
                                                {format(new Date(event.timestamp), 'h:mm a')}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Delete Walk */}
                    <View className="mt-8 pt-4 border-t border-gray-800">
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    t('walk.delete_walk'),
                                    t('walk.delete_walk_confirm'),
                                    [
                                        { text: t('common.cancel'), style: 'cancel' },
                                        {
                                            text: t('common.delete'),
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    // Delete walk events first
                                                    await supabase
                                                        .from('walk_events')
                                                        .delete()
                                                        .eq('walk_id', id);

                                                    // Delete the walk
                                                    const { error } = await supabase
                                                        .from('walks')
                                                        .delete()
                                                        .eq('id', id);

                                                    if (error) throw error;
                                                    router.back();
                                                } catch (error: any) {
                                                    Alert.alert(t('common.error'), error.message);
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                            className="flex-row items-center justify-center p-4 rounded-xl border border-red-500/30 bg-red-500/10"
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            <Text className="text-red-400 font-semibold ml-2">{t('walk.delete_walk')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
