import { View, Text, TouchableOpacity, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from "../../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { Achievement } from "../../types";
import { useTranslation } from "react-i18next";
import { AchievementModal } from "../../components/AchievementModal";
import { checkAndUnlockAchievements } from "../../lib/achievements";
import {
    LocalWalk,
    LocalWalkEvent,
    Coordinate,
    generateLocalId,
    saveActiveWalk,
    getActiveWalk,
    clearActiveWalk
} from "../../lib/walkStorage";
import { completeWalk } from "../../lib/syncService";
import { Logger } from "../../lib/logger";

const EVENT_TYPES = [
    { type: 'poop' as const, icon: '💩', label: 'walk.poop', color: 'bg-amber-700' },
    { type: 'pee' as const, icon: '💧', label: 'walk.pee', color: 'bg-blue-500' },
    { type: 'reaction' as const, icon: '🐕', label: 'walk.reaction', color: 'bg-red-500' },
    { type: 'sniff' as const, icon: '👃', label: 'walk.sniff', color: 'bg-green-500' },
];

const AUTO_SAVE_INTERVAL_MS = 30000; // 30 seconds

export default function ActiveWalkScreen() {
    const { t } = useTranslation();
    const { dogId, recovered } = useLocalSearchParams<{ dogId: string; recovered?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);

    const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
    const [localWalk, setLocalWalk] = useState<LocalWalk | null>(null);
    const [duration, setDuration] = useState(0);
    const [distance, setDistance] = useState(0);
    const [events, setEvents] = useState<LocalWalkEvent[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [isRecoveredWalk, setIsRecoveredWalk] = useState(false);

    // Refs for auto-save access to latest state
    const stateRef = useRef({ routeCoordinates, events, duration, distance });
    useEffect(() => {
        stateRef.current = { routeCoordinates, events, duration, distance };
    }, [routeCoordinates, events, duration, distance]);

    // Network monitoring
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? true);
        });
        return () => unsubscribe();
    }, []);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (localWalk && !isPaused) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [localWalk, isPaused]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!localWalk) return;

        const interval = setInterval(async () => {
            const { routeCoordinates, events, duration, distance } = stateRef.current;
            await saveActiveWalk({
                ...localWalk,
                routeCoordinates,
                events,
                durationSeconds: duration,
                distanceMeters: distance,
            });
            Logger.debug('ActiveWalk', 'Auto-saved walk state');
        }, AUTO_SAVE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [localWalk]);

    // Initial Setup - Check for recovered walk or start new
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('walk.permission_denied'), t('walk.permission_denied_message'));
                setLocationPermission(false);
                router.back();
                return;
            }
            setLocationPermission(true);

            // Check for recovered walk from crash
            if (recovered === 'true') {
                const savedWalk = await getActiveWalk();
                if (savedWalk) {
                    setLocalWalk(savedWalk);
                    setRouteCoordinates(savedWalk.routeCoordinates);
                    setEvents(savedWalk.events);
                    setDuration(savedWalk.durationSeconds);
                    setDistance(savedWalk.distanceMeters);
                    setIsRecoveredWalk(true);
                    Logger.debug('ActiveWalk', 'Recovered walk from crash');
                    return;
                }
            }

            // Start new walk
            await startWalk();
        })();
    }, []);

    // Location Tracking
    useEffect(() => {
        let subscription: Location.LocationSubscription;

        const startTracking = async () => {
            if (!locationPermission || !localWalk || isPaused) return;

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 5,
                    timeInterval: 2000,
                },
                (location) => {
                    const { latitude, longitude } = location.coords;
                    const newCoord = { latitude, longitude };

                    setCurrentLocation(location);
                    setRouteCoordinates(prev => {
                        const newRoute = [...prev, newCoord];
                        if (prev.length > 0) {
                            const last = prev[prev.length - 1];
                            const dist = getDistanceFromLatLonInKm(last.latitude, last.longitude, latitude, longitude);
                            setDistance(d => d + (dist * 1000));
                        }
                        return newRoute;
                    });

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
    }, [locationPermission, localWalk, isPaused]);

    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }

    async function startWalk() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !dogId) {
                Alert.alert(t('common.error'), t('walk.start_error'));
                router.back();
                return;
            }

            const walk: LocalWalk = {
                localId: generateLocalId(),
                dogId,
                userId: user.id,
                startTime: new Date().toISOString(),
                routeCoordinates: [],
                events: [],
                durationSeconds: 0,
                distanceMeters: 0,
                syncStatus: 'pending',
                lastSavedAt: new Date().toISOString(),
            };

            setLocalWalk(walk);
            await saveActiveWalk(walk);
            Logger.debug('ActiveWalk', 'Started new walk:', walk.localId);

        } catch (error) {
            Logger.error('ActiveWalk', 'Error starting walk:', error);
            Alert.alert(t('common.error'), t('walk.start_error'));
            router.back();
        }
    }

    function handleEvent(type: 'poop' | 'pee' | 'reaction' | 'sniff' | 'water') {
        if (!localWalk || !currentLocation) return;

        const { latitude, longitude } = currentLocation.coords;
        const newEvent: LocalWalkEvent = {
            id: generateLocalId(),
            event_type: type,
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
        };

        setEvents(prev => [...prev, newEvent]);
    }

    async function endWalk() {
        if (!localWalk) return;

        Alert.alert(
            t('walk.end_walk'),
            t('walk.end_walk_confirm'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('walk.finish'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const completedWalk: LocalWalk = {
                                ...localWalk,
                                endTime: new Date().toISOString(),
                                routeCoordinates,
                                events,
                                durationSeconds: duration,
                                distanceMeters: distance,
                            };

                            // Complete walk: syncs immediately if online, otherwise queues
                            const remoteId = await completeWalk(completedWalk);

                            // Check for achievements
                            if (dogId) {
                                const { newlyUnlocked } = await checkAndUnlockAchievements(dogId);
                                if (newlyUnlocked.length > 0) {
                                    setUnlockedAchievement(newlyUnlocked[0]);
                                    setShowAchievementModal(true);
                                    return;
                                }
                            }

                            // Navigate to summary (use remote ID if synced, otherwise local)
                            if (remoteId) {
                                router.replace(`/walk/${remoteId}`);
                            } else {
                                // Offline - go back to home with a message
                                Alert.alert(
                                    t('common.success'),
                                    t('walk.saved_offline') || 'Walk saved! Will sync when online.',
                                    [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                                );
                            }

                        } catch (error) {
                            Logger.error('ActiveWalk', 'Error ending walk:', error);
                            Alert.alert(t('common.error'), t('walk.save_error'));
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

    if (!locationPermission || !localWalk) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="text-white mt-4">{t('walk.starting')}</Text>
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
                        title={t(EVENT_TYPES.find(e => e.type === event.event_type)?.label || '')}
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
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('walk.duration')}</Text>
                    <Text className="text-white text-3xl font-bold font-mono">{formatTime(duration)}</Text>
                </View>
                <View className="bg-gray-900/80 p-4 rounded-2xl backdrop-blur-md border border-gray-700 items-end">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('walk.distance')}</Text>
                    <Text className="text-white text-3xl font-bold font-mono">{(distance / 1000).toFixed(2)} <Text className="text-lg text-gray-400">km</Text></Text>
                </View>
            </View>

            {/* Offline Indicator */}
            {!isOnline && (
                <View className="absolute top-0 left-0 right-0 bg-amber-500 py-2 px-4" style={{ paddingTop: insets.top }}>
                    <Text className="text-white text-center font-medium text-sm">
                        📡 Offline - Walk will sync when connected
                    </Text>
                </View>
            )}

            {/* Recovered Walk Banner */}
            {isRecoveredWalk && (
                <View className="absolute top-20 left-4 right-4 bg-green-600 py-2 px-4 rounded-xl" style={{ top: insets.top + 90 }}>
                    <Text className="text-white text-center font-medium text-sm">
                        ✅ Walk recovered from previous session
                    </Text>
                </View>
            )}

            {/* Controls Overlay */}
            <View className="absolute bottom-0 left-0 right-0 bg-gray-900/90 rounded-t-[32px] p-6 pb-10 border-t border-gray-800">
                <Text className="text-white text-center font-bold mb-6 text-lg">{t('walk.log_event')}</Text>

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
                            <Text className="text-gray-300 text-xs font-medium">{t(item.label)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={endWalk}
                    className="bg-red-500/20 border border-red-500/50 w-full py-4 rounded-2xl items-center flex-row justify-center"
                >
                    <Ionicons name="stop" size={24} color="#ef4444" />
                    <Text className="text-red-400 font-bold text-lg ml-2">{t('walk.end_walk')}</Text>
                </TouchableOpacity>
            </View>

            {/* Achievement Modal */}
            {unlockedAchievement && (
                <AchievementModal
                    visible={showAchievementModal}
                    achievement={unlockedAchievement}
                    onClose={() => {
                        setShowAchievementModal(false);
                        router.replace('/(tabs)');
                    }}
                />
            )}
        </View>
    );
}
