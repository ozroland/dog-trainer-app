import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ChatScreen() {
    return (
        <SafeAreaView className="flex-1 bg-gray-900 items-center justify-center p-6">
            <View className="bg-gray-800 p-6 rounded-full mb-6">
                <Ionicons name="chatbubbles" size={64} color="#818cf8" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2">AI Coach</Text>
            <Text className="text-gray-400 text-center text-lg">
                Coming soon! Chat with our AI to get personalized training advice for your dog.
            </Text>
        </SafeAreaView>
    );
}
