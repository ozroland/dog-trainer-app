import { View, Text, TouchableOpacity, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from "../../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Walk, WalkEvent } from "../../types";

const EVENT_TYPES = [
    { type: 'poop', icon: '💩', label: 'Poop', color: 'bg-amber-700' },
    { type: 'pee', icon: '💧', label: 'Pee', color: 'bg-blue-500' },
    { type: 'reaction', icon: '🐕', label: 'Reaction', color: 'bg-red-500' },
    { type: 'sniff', icon: '👃', label: 'Sniff', color: 'bg-green-500' },
];

export default function ActiveWalkScreen() {
    const { dogId } = useLocalSearchParams<{ dogId: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [walkId, setWalkId] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [distance, setDistance] = useState(0);
    const [events, setEvents] = useState<WalkEvent[]>([]);
    const [isPaused, setIsPaused] = useState(false);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (walkId && !isPaused) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [walkId, isPaused]);

    // Initial Setup
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied. Walk tracking requires location access.');
                setLocationPermission(false);
                router.back();
                return;
            }
            setLocationPermission(true);
            startWalk();
        })();
    }, []);

    // Location Tracking
    useEffect(() => {
        let subscription: Location.LocationSubscription;

        const startTracking = async () => {
            if (!locationPermission || !walkId || isPaused) return;

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 5, // Update every 5 meters
                    timeInterval: 2000, // Or every 2 seconds
                },
                (location) => {
                    const { latitude, longitude } = location.coords;
                    const newCoord = { latitude, longitude };

                    setCurrentLocation(location);
                    setRouteCoordinates(prev => {
                        const newRoute = [...prev, newCoord];
                        // Calculate distance added
                        if (prev.length > 0) {
                            const last = prev[prev.length - 1];
                            const dist = getDistanceFromLatLonInKm(last.latitude, last.longitude, latitude, longitude);
                            setDistance(d => d + (dist * 1000)); // Convert to meters
                        }
                        return newRoute;
                    });

                    // Center map on new location
                    mapRef.current?.animateToRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }, 500);
                }
            );
        };

        startTracking();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [locationPermission, walkId, isPaused]);

    // Helper: Distance Calc
    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    async function startWalk() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !dogId) return;

            const { data, error } = await supabase
                .from('walks')
                .insert({
                    user_id: user.id,
                    dog_id: dogId,
                    start_time: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            setWalkId(data.id);
        } catch (error) {
            console.error('Error starting walk:', error);
            Alert.alert('Error', 'Failed to start walk session.');
            router.back();
        }
    }

    async function handleEvent(type: string) {
        if (!walkId || !currentLocation) return;

        try {
            const { latitude, longitude } = currentLocation.coords;
            const { data, error } = await supabase
                .from('walk_events')
                .insert({
                    walk_id: walkId,
                    event_type: type,
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            setEvents(prev => [...prev, data]);
        } catch (error) {
            console.error('Error logging event:', error);
        }
    }

    async function endWalk() {
        if (!walkId) return;

        Alert.alert(
            "End Walk",
            "Are you sure you want to finish this walk?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Finish",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('walks')
                                .update({
                                    end_time: new Date().toISOString(),
                                    duration_seconds: duration,
                                    distance_meters: distance,
                                    route_coordinates: routeCoordinates,
                                })
                                .eq('id', walkId);

                            if (error) throw error;

                            // Navigate to summary
                            router.replace(`/walk/${walkId}`);

                        } catch (error) {
                            console.error('Error ending walk:', error);
                            Alert.alert('Error', 'Failed to save walk.');
                        }
                    }
                }
            ]
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!locationPermission || !walkId) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-white mt-4">Starting Walk...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            {/* Map Background */}
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                showsUserLocation
                followsUserLocation
                showsMyLocationButton={false}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
            >
                <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#4f46e5"
                    strokeWidth={4}
                />
                {events.map(event => (
                    <Marker
                        key={event.id}
                        coordinate={{ latitude: event.latitude, longitude: event.longitude }}
                        title={EVENT_TYPES.find(e => e.type === event.event_type)?.label}
                    >
                        <View className="bg-white rounded-full p-1 border border-gray-200">
                            <Text>{EVENT_TYPES.find(e => e.type === event.event_type)?.icon}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* HUD Overlay */}
            <View
                className="absolute top-0 left-0 right-0 p-6 flex-row justify-between items-start"
                style={{ paddingTop: insets.top + 20 }}
            >
                <View className="bg-gray-900/80 p-4 rounded-2xl backdrop-blur-md border border-gray-700">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Duration</Text>
                    <Text className="text-white text-3xl font-bold font-mono">{formatTime(duration)}</Text>
                </View>
                <View className="bg-gray-900/80 p-4 rounded-2xl backdrop-blur-md border border-gray-700 items-end">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Distance</Text>
                    <Text className="text-white text-3xl font-bold font-mono">{(distance / 1000).toFixed(2)} <Text className="text-lg text-gray-400">km</Text></Text>
                </View>
            </View>

            {/* Controls Overlay */}
            <View className="absolute bottom-0 left-0 right-0 bg-gray-900/90 rounded-t-[32px] p-6 pb-10 border-t border-gray-800">
                <Text className="text-white text-center font-bold mb-6 text-lg">Log Event</Text>

                <View className="flex-row justify-between mb-8 px-2">
                    {EVENT_TYPES.map((item) => (
                        <TouchableOpacity
                            key={item.type}
                            onPress={() => handleEvent(item.type)}
                            className="items-center"
                        >
                            <View className={`${item.color} w-16 h-16 rounded-full items-center justify-center shadow-lg mb-2`}>
                                <Text className="text-2xl">{item.icon}</Text>
                            </View>
                            <Text className="text-gray-300 text-xs font-medium">{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={endWalk}
                    className="bg-red-500/20 border border-red-500/50 w-full py-4 rounded-2xl items-center flex-row justify-center"
                >
                    <Ionicons name="stop" size={24} color="#ef4444" />
                    <Text className="text-red-400 font-bold text-lg ml-2">End Walk</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
