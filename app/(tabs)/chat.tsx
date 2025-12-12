import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from "react-i18next";
import { TabHeader } from "../../components/ScreenHeader";

export default function ChatScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const features = [
        { icon: 'paw', text: t('chat.feature_1'), color: '#4ade80' },
        { icon: 'bulb', text: t('chat.feature_2'), color: '#fbbf24' },
        { icon: 'heart', text: t('chat.feature_3'), color: '#f472b6' },
    ];

    return (
        <View className="flex-1 bg-gray-900">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <TabHeader
                    title={t('chat.title')}
                    icon="chatbubbles"
                    iconColor="#818cf8"
                    subtitle={t('chat.subtitle')}
                />

                {/* Coming Soon Card */}
                <View className="mx-4 mb-6">
                    <View className="bg-gradient-to-br rounded-3xl p-6 border border-indigo-500/20 items-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <View className="bg-indigo-500/20 p-5 rounded-full mb-4">
                            <Ionicons name="sparkles" size={48} color="#818cf8" />
                        </View>

                        <Text className="text-white text-2xl font-bold text-center mb-2">
                            {t('chat.coming_soon_title')}
                        </Text>

                        <Text className="text-indigo-300 text-center mb-6 leading-6">
                            {t('chat.coming_soon_message')}
                        </Text>

                        {/* Progress Indicator */}
                        <View className="flex-row items-center bg-gray-800/50 px-4 py-2 rounded-full">
                            <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                            <Text className="text-amber-400 font-semibold text-sm">
                                {t('chat.in_development') || 'In Development'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Features Preview */}
                <View className="mx-4">
                    <View className="flex-row items-center mb-4">
                        <View className="w-1 h-5 rounded-full bg-indigo-500 mr-3" />
                        <Text className="text-white font-bold text-lg">
                            {t('chat.features_preview') || 'Coming Features'}
                        </Text>
                    </View>

                    {features.map((feature, index) => (
                        <View
                            key={index}
                            className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/30 flex-row items-center"
                        >
                            <View
                                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                                style={{ backgroundColor: `${feature.color}20` }}
                            >
                                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                            </View>
                            <Text className="text-gray-300 flex-1 text-base">{feature.text}</Text>
                            <View className="bg-gray-700/50 px-2 py-1 rounded-full">
                                <Text className="text-gray-500 text-xs">{t('common.soon') || 'Soon'}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Sample Chat Preview */}
                <View className="mx-4 mt-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-1 h-5 rounded-full bg-gray-500 mr-3" />
                        <Text className="text-white font-bold text-lg">
                            {t('chat.preview') || 'Preview'}
                        </Text>
                    </View>

                    <View className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/30">
                        {/* Sample AI Message */}
                        <View className="flex-row mb-4">
                            <View className="w-8 h-8 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
                                <Ionicons name="sparkles" size={16} color="#818cf8" />
                            </View>
                            <View className="flex-1 bg-gray-700/50 rounded-2xl rounded-tl-sm p-3">
                                <Text className="text-gray-300 text-sm">
                                    {t('chat.sample_ai') || "Hi! I'm your AI dog training assistant. How can I help you today?"}
                                </Text>
                            </View>
                        </View>

                        {/* Sample User Message */}
                        <View className="flex-row justify-end mb-4">
                            <View className="bg-indigo-500/20 rounded-2xl rounded-tr-sm p-3 max-w-[80%]">
                                <Text className="text-indigo-200 text-sm">
                                    {t('chat.sample_user') || "My dog keeps barking at the doorbell..."}
                                </Text>
                            </View>
                        </View>

                        {/* Typing indicator */}
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
                                <Ionicons name="sparkles" size={16} color="#818cf8" />
                            </View>
                            <View className="bg-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex-row">
                                <View className="w-2 h-2 rounded-full bg-gray-500 mr-1 opacity-60" />
                                <View className="w-2 h-2 rounded-full bg-gray-500 mr-1 opacity-80" />
                                <View className="w-2 h-2 rounded-full bg-gray-500 opacity-100" />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
