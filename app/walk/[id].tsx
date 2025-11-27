import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Walk, WalkEvent } from "../../types";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";

const EVENT_TYPES = [
    { type: 'poop', icon: '💩', label: 'Poop', color: 'bg-amber-700' },
    { type: 'pee', icon: '💧', label: 'Pee', color: 'bg-blue-500' },
    { type: 'reaction', icon: '🐕', label: 'Reaction', color: 'bg-red-500' },
    { type: 'sniff', icon: '👃', label: 'Sniff', color: 'bg-green-500' },
];

export default function WalkSummaryScreen() {
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
        return `${mins}m ${secs}s`;
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
                                {format(new Date(walk.start_time), 'EEEE, MMM d')}
                            </Text>
                            <Text className="text-white text-3xl font-bold">Walk Summary</Text>
                        </View>
                        <View className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                            <Text className="text-indigo-300 font-bold text-xs">COMPLETED</Text>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row gap-4 mb-8">
                        <View className="flex-1 bg-gray-800 p-4 rounded-2xl border border-gray-700">
                            <View className="bg-blue-500/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                                <Ionicons name="time" size={20} color="#60a5fa" />
                            </View>
                            <Text className="text-gray-400 text-xs font-medium uppercase">Duration</Text>
                            <Text className="text-white text-xl font-bold">{formatDuration(walk.duration_seconds)}</Text>
                        </View>
                        <View className="flex-1 bg-gray-800 p-4 rounded-2xl border border-gray-700">
                            <View className="bg-emerald-500/20 w-10 h-10 rounded-full items-center justify-center mb-3">
                                <Ionicons name="footsteps" size={20} color="#34d399" />
                            </View>
                            <Text className="text-gray-400 text-xs font-medium uppercase">Distance</Text>
                            <Text className="text-white text-xl font-bold">{(walk.distance_meters / 1000).toFixed(2)} km</Text>
                        </View>
                    </View>

                    {/* Events Log */}
                    <Text className="text-white text-lg font-bold mb-4">Activity Log</Text>
                    {events.length === 0 ? (
                        <View className="bg-gray-800 p-6 rounded-2xl border border-gray-700 items-center">
                            <Text className="text-gray-500">No events logged during this walk.</Text>
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
                                            <Text className="text-white font-bold text-base">{typeInfo?.label}</Text>
                                            <Text className="text-gray-400 text-xs">
                                                {format(new Date(event.timestamp), 'h:mm a')}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
