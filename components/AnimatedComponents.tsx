import React from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

interface AnimatedRefreshProps {
    refreshing: boolean;
}

/**
 * Custom animated refresh indicator with a playful dog paw animation.
 */
export function AnimatedRefreshIndicator({ refreshing }: AnimatedRefreshProps) {
    const spinValue = useRef(new Animated.Value(0)).current;
    const bounceValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (refreshing) {
            // Spinning animation
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            // Bouncing animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceValue, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceValue, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            spinValue.setValue(0);
            bounceValue.setValue(0);
        }
    }, [refreshing]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const translateY = bounceValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
    });

    if (!refreshing) return null;

    return (
        <View className="items-center justify-center py-4">
            <Animated.View
                style={{
                    transform: [{ rotate: spin }, { translateY }],
                }}
            >
                <Text className="text-3xl">🐾</Text>
            </Animated.View>
            <Text className="text-gray-400 text-sm mt-2">Loading...</Text>
        </View>
    );
}

/**
 * Animated loading dots for button states
 */
export function LoadingDots() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, []);

    const getDotStyle = (dot: Animated.Value) => ({
        opacity: dot.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
        }),
        transform: [{
            scale: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
            }),
        }],
    });

    return (
        <View className="flex-row items-center gap-1">
            <Animated.View
                style={getDotStyle(dot1)}
                className="w-2 h-2 bg-white rounded-full"
            />
            <Animated.View
                style={getDotStyle(dot2)}
                className="w-2 h-2 bg-white rounded-full"
            />
            <Animated.View
                style={getDotStyle(dot3)}
                className="w-2 h-2 bg-white rounded-full"
            />
        </View>
    );
}

/**
 * Pulse animation wrapper for attention-grabbing elements
 */
export function PulseView({
    children,
    active = true,
    duration = 1500
}: {
    children: React.ReactNode;
    active?: boolean;
    duration?: number;
}) {
    const pulseValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (active) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseValue, {
                        toValue: 1.1,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseValue, {
                        toValue: 1,
                        duration: duration / 2,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [active]);

    return (
        <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
            {children}
        </Animated.View>
    );
}
