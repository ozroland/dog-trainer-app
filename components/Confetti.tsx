import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
    '#4f46e5', // indigo
    '#818cf8', // indigo light
    '#fbbf24', // amber
    '#4ade80', // green
    '#f472b6', // pink
    '#60a5fa', // blue
    '#fb923c', // orange
];

interface ConfettiPieceProps {
    delay: number;
    color: string;
    startX: number;
}

function ConfettiPiece({ delay, color, startX }: ConfettiPieceProps) {
    const translateY = useRef(new Animated.Value(-20)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT + 50,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: (Math.random() - 0.5) * 150,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: Math.random() * 10,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(1800),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ]);
        animation.start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 10],
        outputRange: ['0deg', '3600deg'],
    });

    return (
        <Animated.View
            style={[
                styles.confettiPiece,
                {
                    backgroundColor: color,
                    left: startX,
                    transform: [
                        { translateY },
                        { translateX },
                        { rotate: spin },
                    ],
                    opacity,
                },
            ]}
        />
    );
}

interface ConfettiProps {
    visible: boolean;
    count?: number;
}

export function Confetti({ visible, count = 50 }: ConfettiProps) {
    if (!visible) return null;

    const pieces = Array.from({ length: count }, (_, i) => ({
        id: i,
        delay: Math.random() * 500,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        startX: Math.random() * SCREEN_WIDTH,
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            {pieces.map((piece) => (
                <ConfettiPiece
                    key={piece.id}
                    delay={piece.delay}
                    color={piece.color}
                    startX={piece.startX}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    confettiPiece: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
    },
});
