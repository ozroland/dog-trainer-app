import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Achievement } from '../types';

interface AchievementModalProps {
    visible: boolean;
    achievement: Achievement | null;
    onClose: () => void;
}

export function AchievementModal({ visible, achievement, onClose }: AchievementModalProps) {
    if (!achievement) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center p-6">
                <BlurView
                    intensity={40}
                    tint="dark"
                    className="absolute top-0 left-0 right-0 bottom-0"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={onClose}
                        className="flex-1 bg-black/60"
                    />
                </BlurView>

                <View className="bg-gray-900 w-full rounded-[32px] p-8 items-center border-2 border-yellow-500/50 shadow-2xl shadow-yellow-900/20 relative">
                    {/* Glow Effect (Static) */}
                    <View className="absolute top-0 w-full h-full bg-yellow-500/5 rounded-[32px]" />

                    {/* Icon */}
                    <View className="w-24 h-24 bg-yellow-500/20 rounded-full items-center justify-center mb-6 border-4 border-yellow-500/30">
                        <Text className="text-5xl">{achievement.icon}</Text>
                    </View>

                    {/* Header */}
                    <Text className="text-yellow-400 font-bold tracking-widest text-sm mb-2 uppercase shadow-black shadow-sm">
                        Achievement Unlocked
                    </Text>

                    {/* Title */}
                    <Text className="text-white text-3xl font-bold text-center mb-3 leading-tight">
                        {achievement.title}
                    </Text>

                    {/* Description */}
                    <Text className="text-gray-400 text-center text-base mb-8 leading-relaxed">
                        {achievement.description}
                    </Text>

                    {/* Button */}
                    <TouchableOpacity
                        onPress={onClose}
                        className="bg-yellow-500 w-full py-4 rounded-2xl items-center shadow-lg shadow-yellow-500/20 active:bg-yellow-600"
                    >
                        <Text className="text-gray-900 font-bold text-lg">Awesome!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
