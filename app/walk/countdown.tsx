import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from "react-i18next";
import * as Haptics from 'expo-haptics';
import { LinearGradient } from "expo-linear-gradient";

export default function WalkCountdownScreen() {
    const { t } = useTranslation();
    const { dogId } = useLocalSearchParams<{ dogId: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [countdown, setCountdown] = useState(3);
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [countdown]);

    useEffect(() => {
        if (countdown <= 0) {
            // Strong haptic when walk starts
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Navigate to active walk
            router.replace({
                pathname: "/walk/active",
                params: { dogId }
            });
            return;
        }

        const timer = setTimeout(() => {
            // Reset animation for next number
            scaleAnim.setValue(0.5);
            opacityAnim.setValue(0);
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleSkip = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace({
            pathname: "/walk/active",
            params: { dogId }
        });
    };

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background gradient */}
            <LinearGradient
                colors={['#4f46e5', '#111827']}
                className="absolute top-0 left-0 right-0 h-1/2 opacity-30"
            />

            {/* Cancel button */}
            <View
                className="absolute left-4 z-10"
                style={{ top: insets.top + 10 }}
            >
                <TouchableOpacity
                    onPress={handleCancel}
                    className="w-12 h-12 bg-gray-800/80 rounded-full items-center justify-center border border-gray-700"
                >
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Main content */}
            <View className="flex-1 items-center justify-center">
                {/* Title */}
                <Text className="text-gray-400 text-lg mb-4 uppercase tracking-widest">
                    {t('walk.get_ready')}
                </Text>

                {/* Countdown number */}
                <Animated.View
                    style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    }}
                >
                    <View className="w-48 h-48 rounded-full bg-indigo-600/20 border-4 border-indigo-500 items-center justify-center">
                        <Text className="text-8xl font-black text-white">
                            {countdown}
                        </Text>
                    </View>
                </Animated.View>

                {/* Paw icon */}
                <View className="mt-8 flex-row items-center">
                    <Ionicons name="paw" size={24} color="#818cf8" />
                    <Text className="text-indigo-400 text-lg font-semibold ml-2">
                        {t('walk.starting_walk')}
                    </Text>
                </View>
            </View>

            {/* Skip button */}
            <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
                <TouchableOpacity
                    onPress={handleSkip}
                    className="bg-gray-800 border border-gray-700 p-4 rounded-2xl items-center"
                >
                    <Text className="text-gray-300 font-semibold">
                        {t('walk.skip_countdown')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
