import React, { useEffect, useRef } from 'react';
import { View, Animated, DimensionValue } from 'react-native';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    className?: string;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = 8,
    className = ''
}: SkeletonProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            className={`bg-gray-700 ${className}`}
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
            ]}
        />
    );
}

// Pre-built skeleton layouts for common use cases
export function CardSkeleton() {
    return (
        <View className="bg-gray-800 p-4 rounded-2xl border border-gray-700 mb-4">
            <View className="flex-row items-center mb-3">
                <Skeleton width={48} height={48} borderRadius={24} />
                <View className="ml-4 flex-1">
                    <Skeleton width="60%" height={16} className="mb-2" />
                    <Skeleton width="40%" height={12} />
                </View>
            </View>
            <Skeleton width="100%" height={12} className="mb-2" />
            <Skeleton width="80%" height={12} />
        </View>
    );
}

export function LessonCardSkeleton() {
    return (
        <View className="bg-gray-800 p-5 rounded-2xl border border-gray-700 mb-4">
            <View className="flex-row items-center justify-between mb-3">
                <Skeleton width="50%" height={20} />
                <Skeleton width={80} height={24} borderRadius={12} />
            </View>
            <Skeleton width="100%" height={14} className="mb-2" />
            <Skeleton width="30%" height={12} />
        </View>
    );
}

export function DogCardSkeleton() {
    return (
        <View className="bg-gray-800 p-4 rounded-3xl border border-gray-700 flex-row items-center">
            <Skeleton width={80} height={80} borderRadius={40} />
            <View className="flex-1 ml-4">
                <Skeleton width="50%" height={24} className="mb-2" />
                <Skeleton width="30%" height={14} className="mb-2" />
                <Skeleton width="40%" height={12} />
            </View>
        </View>
    );
}

export function StatsSkeleton() {
    return (
        <View className="flex-row flex-wrap">
            {[1, 2, 3, 4].map((i) => (
                <View key={i} className="w-1/2 p-2">
                    <View className="bg-gray-800 p-5 rounded-2xl">
                        <Skeleton width={40} height={40} borderRadius={8} className="mb-2" />
                        <Skeleton width="60%" height={28} className="mb-2" />
                        <Skeleton width="80%" height={12} />
                    </View>
                </View>
            ))}
        </View>
    );
}
