import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";

export default function TermsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View
                className="bg-gray-800 border-b border-gray-700"
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center px-4 h-14">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-700"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold flex-1 text-center mr-14">
                        {t('settings.terms_of_service')}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-6">
                <Text className="text-gray-400 text-sm mb-4">
                    {t('legal.last_updated')}: December 8, 2024
                </Text>

                <Section title={t('legal.terms.acceptance_title')}>
                    {t('legal.terms.acceptance_text')}
                </Section>

                <Section title={t('legal.terms.use_title')}>
                    {t('legal.terms.use_text')}
                </Section>

                <Section title={t('legal.terms.account_title')}>
                    {t('legal.terms.account_text')}
                </Section>

                <Section title={t('legal.terms.content_title')}>
                    {t('legal.terms.content_text')}
                </Section>

                <Section title={t('legal.terms.disclaimer_title')}>
                    {t('legal.terms.disclaimer_text')}
                </Section>

                <Section title={t('legal.terms.changes_title')}>
                    {t('legal.terms.changes_text')}
                </Section>

                <View className="h-20" />
            </ScrollView>
        </View>
    );
}

function Section({ title, children }: { title: string; children: string }) {
    return (
        <View className="mb-6">
            <Text className="text-white text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-300 leading-6">{children}</Text>
        </View>
    );
}
