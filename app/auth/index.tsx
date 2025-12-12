import { useState, useRef } from "react";
import { View, Text, Alert, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LinearGradient } from "expo-linear-gradient";

export default function AuthScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const passwordRef = useRef<TextInput>(null);

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
    };

    // Helper to translate Supabase errors
    function getTranslatedError(errorMessage: string): string {
        const msg = errorMessage.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
            return t('auth.error_invalid_credentials');
        }
        if (msg.includes('email not confirmed')) {
            return t('auth.error_email_not_confirmed');
        }
        if (msg.includes('user not found')) {
            return t('auth.error_user_not_found');
        }
        if (msg.includes('already registered') || msg.includes('already exists')) {
            return t('auth.error_email_taken');
        }
        if (msg.includes('same as') || msg.includes('different from')) {
            return t('auth.error_password_same');
        }
        return errorMessage; // Fallback to original
    }

    async function handleAuth() {
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert(t('common.success'), t('auth.signup_success'));
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // Explicitly redirect to ensure fast response
                router.replace("/");
            }
        } catch (error: any) {
            Alert.alert(t('common.error'), getTranslatedError(error.message));
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background Gradient */}
            <LinearGradient
                colors={['#4f46e5', '#111827']}
                className="absolute top-0 left-0 right-0 h-1/2 opacity-20"
            />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 80 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                className="px-8"
            >
                {/* Language Selector */}
                <View className="absolute top-12 right-0 flex-row space-x-2 z-10">
                    <TouchableOpacity
                        onPress={() => changeLanguage('en')}
                        className={`px-3 py-1 rounded-full ${i18n.language === 'en' ? 'bg-indigo-600' : 'bg-gray-800'}`}
                    >
                        <Text className={`text-xs font-bold ${i18n.language === 'en' ? 'text-white' : 'text-gray-400'}`}>EN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => changeLanguage('hu')}
                        className={`px-3 py-1 rounded-full ${i18n.language === 'hu' ? 'bg-indigo-600' : 'bg-gray-800'}`}
                    >
                        <Text className={`text-xs font-bold ${i18n.language === 'hu' ? 'text-white' : 'text-gray-400'}`}>HU</Text>
                    </TouchableOpacity>
                </View>

                <View className="mb-12">
                    <Text className="text-3xl font-bold text-white mb-2">
                        {isSignUp ? t('auth.signup_title') : t('auth.login_title')}
                    </Text>
                    <Text className="text-gray-400 text-lg">
                        {isSignUp
                            ? t('auth.signup_subtitle')
                            : t('auth.login_subtitle')}
                    </Text>
                </View>

                <View>
                    <Input
                        label={t('auth.email_placeholder')}
                        placeholder="hello@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <Input
                        ref={passwordRef}
                        label={t('auth.password_placeholder')}
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleAuth}
                    />

                    <Button
                        title={isSignUp ? t('auth.signup_button') : t('auth.login_button')}
                        onPress={handleAuth}
                        loading={loading}
                        className="mt-4"
                    />

                    <Button
                        title={isSignUp ? t('auth.login_link') : t('auth.signup_link')}
                        variant="outline"
                        onPress={() => setIsSignUp(!isSignUp)}
                        className="mt-4 border-gray-800"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
