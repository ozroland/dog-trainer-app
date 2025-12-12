import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { Confetti } from './Confetti';
import haptics from '../lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Milestone celebration overlay.
 * Shows when streak hits 7, 30, 100 days.
 */
interface MilestoneProps {
    streak: number;
    previousStreak: number;
    visible: boolean;
    onDismiss: () => void;
}

export function MilestoneCelebration({ streak, previousStreak, visible, onDismiss }: MilestoneProps) {
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;
    const [showConfetti, setShowConfetti] = useState(false);

    const milestones = [7, 30, 100, 365];
    const hitMilestone = milestones.find(m => streak >= m && previousStreak < m);

    useEffect(() => {
        if (visible && hitMilestone) {
            haptics.success();
            setShowConfetti(true);

            // Animate in
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss after 3s
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(scaleValue, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityValue, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setShowConfetti(false);
                    onDismiss();
                });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible, hitMilestone]);

    if (!visible || !hitMilestone) return null;

    const getMilestoneText = () => {
        switch (hitMilestone) {
            case 7: return { emoji: '🎉', title: '1 Week Streak!', subtitle: "You're building great habits!" };
            case 30: return { emoji: '🏆', title: '1 Month Streak!', subtitle: 'Incredible dedication!' };
            case 100: return { emoji: '💎', title: '100 Day Streak!', subtitle: "You're a legend!" };
            case 365: return { emoji: '👑', title: '1 Year Streak!', subtitle: 'Absolutely amazing!' };
            default: return { emoji: '🔥', title: `${hitMilestone} Day Streak!`, subtitle: 'Keep going!' };
        }
    };

    const { emoji, title, subtitle } = getMilestoneText();

    return (
        <View style={styles.overlay}>
            <Confetti visible={showConfetti} count={100} />
            <Animated.View
                style={[
                    styles.milestoneCard,
                    {
                        transform: [{ scale: scaleValue }],
                        opacity: opacityValue,
                    },
                ]}
            >
                <Text style={styles.milestoneEmoji}>{emoji}</Text>
                <Text style={styles.milestoneTitle}>{title}</Text>
                <Text style={styles.milestoneSubtitle}>{subtitle}</Text>
            </Animated.View>
        </View>
    );
}

/**
 * Lesson completion celebration overlay.
 */
export function LessonCompletionOverlay({
    visible,
    lessonName,
    onDismiss
}: {
    visible: boolean;
    lessonName: string;
    onDismiss: () => void;
}) {
    const scaleValue = useRef(new Animated.Value(0)).current;
    const rotateValue = useRef(new Animated.Value(0)).current;
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (visible) {
            haptics.success();
            setShowConfetti(true);

            // Star spin animation
            Animated.loop(
                Animated.timing(rotateValue, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();

            // Scale in
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }).start();

            const timer = setTimeout(() => {
                Animated.timing(scaleValue, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => {
                    setShowConfetti(false);
                    onDismiss();
                });
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const spin = rotateValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.overlay}>
            <Confetti visible={showConfetti} count={60} />
            <Animated.View
                style={[
                    styles.completionCard,
                    { transform: [{ scale: scaleValue }] },
                ]}
            >
                <Animated.Text
                    style={[styles.completionStar, { transform: [{ rotate: spin }] }]}
                >
                    ⭐
                </Animated.Text>
                <Text style={styles.completionTitle}>Great Job!</Text>
                <Text style={styles.completionLesson}>"{lessonName}" completed</Text>
            </Animated.View>
        </View>
    );
}

/**
 * Motivational quotes for walk start.
 */
const WALK_QUOTES = [
    { quote: "Every walk with your dog is a chance to build trust.", emoji: "🐕" },
    { quote: "A tired dog is a happy dog!", emoji: "😊" },
    { quote: "Adventure awaits around every corner.", emoji: "🌳" },
    { quote: "The best therapist has fur and four legs.", emoji: "❤️" },
    { quote: "Let's make some paw prints today!", emoji: "🐾" },
    { quote: "Time to sniff the world!", emoji: "👃" },
    { quote: "Fresh air and wagging tails ahead!", emoji: "💨" },
    { quote: "Your dog doesn't care where you go, just that you go together.", emoji: "🤝" },
];

export function MotivationalQuote({ animated = true }: { animated?: boolean }) {
    const [quote] = useState(() =>
        WALK_QUOTES[Math.floor(Math.random() * WALK_QUOTES.length)]
    );
    const fadeValue = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (animated) {
            Animated.parallel([
                Animated.timing(fadeValue, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeValue.setValue(1);
            translateY.setValue(0);
        }
    }, [animated]);

    return (
        <Animated.View
            style={{
                opacity: fadeValue,
                transform: [{ translateY }],
            }}
            className="bg-indigo-500/20 p-4 rounded-2xl border border-indigo-500/30"
        >
            <Text className="text-2xl text-center mb-2">{quote.emoji}</Text>
            <Text className="text-white text-center italic font-medium leading-relaxed">
                "{quote.quote}"
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
    },
    milestoneCard: {
        backgroundColor: '#1f2937',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#eab308',
        shadowColor: '#eab308',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    milestoneEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    milestoneTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    milestoneSubtitle: {
        color: '#9ca3af',
        fontSize: 16,
    },
    completionCard: {
        backgroundColor: '#1f2937',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#10b981',
    },
    completionStar: {
        fontSize: 56,
        marginBottom: 16,
    },
    completionTitle: {
        color: '#10b981',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    completionLesson: {
        color: '#9ca3af',
        fontSize: 14,
    },
});
