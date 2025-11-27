import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dog } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeroHeaderProps {
    dog: Dog;
    streak: number;
    onUploadPhoto: () => void;
    greeting: string;
}

export function HeroHeader({ dog, streak, onUploadPhoto, greeting }: HeroHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View className="relative h-[45vh] w-full">
            {dog.photo_url ? (
                <Image
                    source={{ uri: dog.photo_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            ) : (
                <LinearGradient
                    colors={['#4f46e5', '#818cf8']}
                    className="w-full h-full items-center justify-center"
                >
                    <Ionicons name="paw" size={80} color="white" style={{ opacity: 0.5 }} />
                </LinearGradient>
            )}

            {/* Gradient Overlay for Text Readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                className="absolute bottom-0 left-0 right-0 h-64 justify-end pb-20 px-6"
            >
                <View className="flex-row justify-between items-end">
                    <View>
                        <Text className="text-white/90 text-lg font-medium mb-1 shadow-sm">{greeting}</Text>
                        <Text className="text-white text-4xl font-bold shadow-md">{dog.name}</Text>
                    </View>

                    <View className="items-end">
                        {streak > 0 && (
                            <View className="bg-orange-500 px-3 py-1 rounded-full flex-row items-center mb-3 shadow-sm">
                                <Text className="text-white font-bold text-xs">🔥 {streak} Day Streak</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={onUploadPhoto}
                            className="bg-white/20 p-2.5 rounded-full backdrop-blur-md border border-white/10"
                        >
                            <Ionicons name="camera" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}
