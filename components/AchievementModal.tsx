import { View, Text, Modal, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../types';
import { Confetti } from './Confetti';
import { useEffect, useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { playAchievementSound } from '../lib/sounds';
import { LinearGradient } from 'expo-linear-gradient';

interface AchievementModalProps {
    visible: boolean;
    achievement: Achievement | null;
    onClose: () => void;
}

export function AchievementModal({ visible, achievement, onClose }: AchievementModalProps) {
    const { t, i18n } = useTranslation();
    const [showContent, setShowContent] = useState(false);

    // Animations
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const shineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && achievement) {
            setShowContent(true);
            playAchievementSound();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Reset animations
            scaleAnim.setValue(0.5);
            opacityAnim.setValue(0);
            rotateAnim.setValue(0);
            shineAnim.setValue(0);

            // Sequence: Fade In -> Scale Up -> Loop Shine
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.loop(
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 10000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    })
                )
            ]).start();
        } else {
            setShowContent(false);
        }
    }, [visible, achievement]);

    if (!achievement) return null;

    const title = i18n.language === 'hu' && achievement.title_hu ? achievement.title_hu : achievement.title;
    const description = i18n.language === 'hu' && achievement.description_hu ? achievement.description_hu : achievement.description;

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center">
                <BlurView
                    intensity={80}
                    tint="dark"
                    className="absolute top-0 left-0 right-0 bottom-0"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={onClose}
                        className="flex-1 bg-black/40"
                    />
                </BlurView>

                {showContent && (
                    <Animated.View
                        style={{
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }],
                            width: '85%',
                            maxWidth: 360
                        }}
                    >
                        <Confetti visible={true} count={50} />

                        {/* Main Card */}
                        <View className="rounded-[40px] overflow-hidden shadow-2xl shadow-amber-500/30">
                            <LinearGradient
                                colors={['#1e1b4b', '#312e81', '#1e1b4b']}
                                className="p-8 items-center"
                            >
                                {/* Decorative Sparkles Background */}
                                {/* Top Right */}
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        top: 30,
                                        right: 40,
                                        opacity: rotateAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [0.3, 1, 0.3]
                                        }),
                                        transform: [{
                                            scale: rotateAnim.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [0.8, 1.2, 0.8]
                                            })
                                        }]
                                    }}
                                >
                                    <Ionicons name="sparkles" size={24} color="#fbbf24" />
                                </Animated.View>

                                {/* Bottom Left */}
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        bottom: 100,
                                        left: 30,
                                        opacity: rotateAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [1, 0.3, 1]
                                        }),
                                        transform: [{
                                            scale: rotateAnim.interpolate({
                                                inputRange: [0, 0.5, 1],
                                                outputRange: [1.2, 0.8, 1.2]
                                            })
                                        }]
                                    }}
                                >
                                    <Ionicons name="star" size={20} color="#f59e0b" />
                                </Animated.View>

                                {/* Top Left (Small) */}
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        top: 50,
                                        left: 50,
                                        opacity: rotateAnim.interpolate({
                                            inputRange: [0, 0.25, 0.75, 1],
                                            outputRange: [0, 1, 0.5, 0]
                                        })
                                    }}
                                >
                                    <Ionicons name="star" size={14} color="#fcd34d" />
                                </Animated.View>

                                {/* Icon Container */}
                                <View className="mb-8 relative">
                                    {/* Outer Glow Ring */}
                                    <View className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl" />

                                    <LinearGradient
                                        colors={['#f59e0b', '#d97706']}
                                        className="w-28 h-28 rounded-full items-center justify-center border-4 border-amber-300 shadow-xl shadow-amber-500/40"
                                    >
                                        <Ionicons name={achievement.icon as any} size={56} color="#fff" />
                                    </LinearGradient>

                                    {/* Star Badge */}
                                    <View className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                                        <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
                                    </View>
                                </View>

                                {/* Text Content */}
                                <View className="items-center mb-8">
                                    <Text className="text-amber-400 font-bold tracking-[4px] text-xs mb-3 uppercase">
                                        {t('achievements.unlocked')}
                                    </Text>
                                    <Text className="text-white text-3xl font-extrabold text-center mb-3 leading-9">
                                        {title}
                                    </Text>
                                    <Text className="text-indigo-200 text-center text-base leading-6 px-2">
                                        {description}
                                    </Text>
                                </View>

                                {/* Action Button */}
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="w-full active:opacity-90"
                                >
                                    <LinearGradient
                                        colors={['#fbbf24', '#d97706']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        className="py-4 rounded-2xl items-center shadow-lg shadow-amber-500/20"
                                    >
                                        <Text className="text-white font-bold text-lg tracking-wide uppercase">
                                            {t('achievements.awesome')}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </Animated.View>
                )}
            </View>
        </Modal>
    );
}

