import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Bone-shaped skeleton for dog-related loading states.
 * More playful than generic rectangles!
 */
export function BoneSkeleton({
    width = 80,
    height = 24,
    animated = true
}: {
    width?: number;
    height?: number;
    animated?: boolean;
}) {
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated) {
            Animated.loop(
                Animated.timing(shimmerValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [animated]);

    const translateX = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    const boneEndSize = height * 1.3;

    return (
        <View style={[styles.boneContainer, { width, height }]}>
            {/* Left bone end */}
            <View style={[
                styles.boneEnd,
                {
                    width: boneEndSize,
                    height: boneEndSize,
                    left: -boneEndSize / 3,
                    backgroundColor: '#374151',
                }
            ]} />

            {/* Bone shaft */}
            <View style={[styles.boneShaft, { height, backgroundColor: '#374151' }]} />

            {/* Right bone end */}
            <View style={[
                styles.boneEnd,
                {
                    width: boneEndSize,
                    height: boneEndSize,
                    right: -boneEndSize / 3,
                    backgroundColor: '#374151',
                }
            ]} />

            {/* Shimmer overlay */}
            {animated && (
                <Animated.View
                    style={[
                        styles.shimmer,
                        { transform: [{ translateX }] }
                    ]}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>
            )}
        </View>
    );
}

/**
 * Dog card skeleton with bone-shaped elements.
 */
export function DogCardSkeletonBone() {
    return (
        <View className="bg-gray-800 p-4 rounded-3xl border border-gray-700 flex-row items-center">
            {/* Circular photo */}
            <PulsingCircle size={80} />

            <View className="flex-1 ml-4">
                {/* Dog name bone */}
                <BoneSkeleton width={120} height={20} />
                <View style={{ height: 8 }} />
                {/* Breed bone */}
                <BoneSkeleton width={80} height={14} />
            </View>
        </View>
    );
}

/**
 * Pulsing circle skeleton for avatars.
 */
export function PulsingCircle({ size = 48 }: { size?: number }) {
    const pulseValue = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 0.7,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(pulseValue, {
                    toValue: 0.4,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: pulseValue.interpolate({
                    inputRange: [0.4, 0.7],
                    outputRange: ['#374151', '#4b5563'],
                }),
            }}
        />
    );
}

/**
 * Ripple effect button wrapper for clicker/whistle.
 */
export function RippleButton({
    onPress,
    color = '#818cf8',
    children
}: {
    onPress: () => void;
    color?: string;
    children: React.ReactNode;
}) {
    const rippleScale = useRef(new Animated.Value(0)).current;
    const rippleOpacity = useRef(new Animated.Value(0.4)).current;

    const handlePress = () => {
        // Reset
        rippleScale.setValue(0);
        rippleOpacity.setValue(0.4);

        // Animate ripple
        Animated.parallel([
            Animated.timing(rippleScale, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();

        onPress();
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
            <View style={styles.rippleContainer}>
                {/* Ripple circle */}
                <Animated.View
                    style={[
                        styles.ripple,
                        {
                            backgroundColor: color,
                            opacity: rippleOpacity,
                            transform: [{
                                scale: rippleScale.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 2],
                                })
                            }],
                        },
                    ]}
                />
                {children}
            </View>
        </TouchableOpacity>
    );
}

/**
 * Animated flame for streak display.
 */
export function AnimatedFlame({ size = 24, active = true }: { size?: number; active?: boolean }) {
    const flickerValue = useRef(new Animated.Value(1)).current;
    const rotateValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (active) {
            // Flicker animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flickerValue, {
                        toValue: 1.15,
                        duration: 150,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flickerValue, {
                        toValue: 0.95,
                        duration: 150,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flickerValue, {
                        toValue: 1.1,
                        duration: 100,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flickerValue, {
                        toValue: 1,
                        duration: 100,
                        easing: Easing.ease,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Subtle rotation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateValue, {
                        toValue: 1,
                        duration: 300,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateValue, {
                        toValue: -1,
                        duration: 300,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [active]);

    const rotate = rotateValue.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-3deg', '3deg'],
    });

    return (
        <Animated.Text
            style={{
                fontSize: size,
                transform: [
                    { scale: flickerValue },
                    { rotate: rotate },
                ],
            }}
        >
            🔥
        </Animated.Text>
    );
}

/**
 * Pressable card with elevation animation.
 */
export function PressableCard({
    children,
    onPress,
    className = '',
}: {
    children: React.ReactNode;
    onPress?: () => void;
    className?: string;
}) {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const shadowValue = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 0.98,
                useNativeDriver: true,
            }),
            Animated.timing(shadowValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(shadowValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View
                style={{
                    transform: [{ scale: scaleValue }],
                    shadowColor: '#818cf8',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: shadowValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.3],
                    }),
                    shadowRadius: shadowValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 8],
                    }),
                    elevation: shadowValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 8],
                    }),
                }}
                className={className}
            >
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    boneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    boneEnd: {
        position: 'absolute',
        borderRadius: 50,
    },
    boneShaft: {
        flex: 1,
        borderRadius: 4,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: '50%',
    },
    rippleContainer: {
        position: 'relative',
        overflow: 'visible',
    },
    ripple: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
});
