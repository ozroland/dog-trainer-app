import { View, Text, TouchableOpacity, Alert, ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [notifications, setNotifications] = useState(true);
    const { t, i18n } = useTranslation();
    const confirmPasswordRef = useRef<TextInput>(null);



    useEffect(() => {
        getUserEmail();
    }, []);

    async function getUserEmail() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setEmail(user.email || "");
        }
    }

    // Helper to translate Supabase errors
    function getTranslatedError(errorMessage: string): string {
        const msg = errorMessage.toLowerCase();
        if (msg.includes('same as') || msg.includes('different from') || msg.includes('should be different')) {
            return t('auth.error_password_same');
        }
        return errorMessage;
    }

    async function handleChangePassword() {
        if (!newPassword || !confirmPassword) return;

        if (newPassword.length < 6) {
            Alert.alert(t('common.error'), t('settings.password_length_error'));
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(t('common.error'), t('settings.password_mismatch'));
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            Alert.alert(t('common.success'), t('settings.password_updated'));
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            Alert.alert(t('common.error'), getTranslatedError(error.message));
        } finally {
            setLoading(false);
        }
    }



    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                        {t('settings.title')}
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-6">

                <View className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
                    <Text className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">{t('settings.security')}</Text>

                    <View className="mb-4">
                        <Text className="text-gray-300 mb-2 ml-1">{t('settings.new_password')}</Text>
                        <TextInput
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="******"
                            placeholderTextColor="#6b7280"
                            secureTextEntry
                            className="bg-gray-900 text-white p-4 rounded-xl border border-gray-700"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-300 mb-2 ml-1">{t('settings.confirm_password')}</Text>
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="******"
                            placeholderTextColor="#6b7280"
                            secureTextEntry
                            className="bg-gray-900 text-white p-4 rounded-xl border border-gray-700"
                        />
                    </View>

                    <Button
                        title={t('settings.change_password')}
                        onPress={handleChangePassword}
                        loading={loading}
                        className="mt-2"
                    />
                </View>

                <View className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
                    <Text className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">{t('settings.preferences')}</Text>

                    {/* Notifications */}
                    <View className="flex-row justify-between items-center py-2">
                        <Text className="text-gray-300 ml-1 text-base">{t('settings.daily_reminders')}</Text>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: "#374151", true: "#4f46e5" }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>

                <View className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
                    <Text className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">{t('settings.support')}</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/settings/privacy')}
                        className="flex-row items-center justify-between p-3 border-b border-gray-700"
                    >
                        <Text className="text-white text-base">{t('settings.privacy_policy')}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#4b5563" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/settings/terms')}
                        className="flex-row items-center justify-between p-3"
                    >
                        <Text className="text-white text-base">{t('settings.terms_of_service')}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#4b5563" />
                    </TouchableOpacity>
                </View>



                <Text className="text-gray-600 text-center mt-0 mb-6 text-xs">
                    Version 1.0.0 • Dog Trainer App
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
