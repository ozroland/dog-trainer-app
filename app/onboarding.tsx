import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingSlide {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    titleKey: string;
    descriptionKey: string;
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        icon: 'paw',
        iconColor: '#818cf8',
        iconBg: 'bg-indigo-500/20',
        titleKey: 'onboarding.slide1_title',
        descriptionKey: 'onboarding.slide1_description',
    },
    {
        id: '2',
        icon: 'school',
        iconColor: '#4ade80',
        iconBg: 'bg-green-500/20',
        titleKey: 'onboarding.slide2_title',
        descriptionKey: 'onboarding.slide2_description',
    },
    {
        id: '3',
        icon: 'walk',
        iconColor: '#fbbf24',
        iconBg: 'bg-yellow-500/20',
        titleKey: 'onboarding.slide3_title',
        descriptionKey: 'onboarding.slide3_description',
    },
    {
        id: '4',
        icon: 'trophy',
        iconColor: '#f472b6',
        iconBg: 'bg-pink-500/20',
        titleKey: 'onboarding.slide4_title',
        descriptionKey: 'onboarding.slide4_description',
    },
];

export default function OnboardingScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const completeOnboarding = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.replace('/auth');
    };

    const goToNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            completeOnboarding();
        }
    };

    const skip = () => {
        completeOnboarding();
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View style={{ width }} className="items-center justify-center px-8">
            {/* Icon */}
            <View className={`${item.iconBg} p-8 rounded-full mb-10`}>
                <Ionicons name={item.icon} size={80} color={item.iconColor} />
            </View>

            {/* Title */}
            <Text className="text-white text-3xl font-bold text-center mb-4">
                {t(item.titleKey)}
            </Text>

            {/* Description */}
            <Text className="text-gray-400 text-lg text-center leading-7">
                {t(item.descriptionKey)}
            </Text>
        </View>
    );

    const renderDots = () => (
        <View className="flex-row justify-center mb-8">
            {slides.map((_, index) => {
                const inputRange = [
                    (index - 1) * width,
                    index * width,
                    (index + 1) * width,
                ];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        className="h-2 bg-indigo-500 rounded-full mx-1"
                        style={{ width: dotWidth, opacity }}
                    />
                );
            })}
        </View>
    );

    return (
        <View className="flex-1 bg-gray-900" style={{ paddingTop: insets.top }}>
            {/* Skip Button */}
            <View className="flex-row justify-end px-6 py-4">
                <TouchableOpacity onPress={skip}>
                    <Text className="text-gray-400 text-base">{t('onboarding.skip')}</Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                scrollEventThrottle={16}
                className="flex-1"
            />

            {/* Bottom Section */}
            <View className="px-6 pb-8" style={{ paddingBottom: insets.bottom + 20 }}>
                {renderDots()}

                {/* Next/Get Started Button */}
                <TouchableOpacity
                    onPress={goToNext}
                    className="bg-indigo-600 py-4 rounded-2xl items-center"
                >
                    <Text className="text-white font-bold text-lg">
                        {currentIndex === slides.length - 1
                            ? t('onboarding.get_started')
                            : t('onboarding.next')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Helper to check if onboarding was completed
export async function hasCompletedOnboarding(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
}

// Helper to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
}
