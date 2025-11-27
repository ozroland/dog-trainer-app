import { useState } from "react";
import { View, Text, Alert, ImageBackground } from "react-native";
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

    async function handleAuth() {
        setLoading(true);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert("Success", "Please check your inbox for email verification!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (error) throw error;
                // Explicitly redirect to ensure fast response
                router.replace("/");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Background Gradient */}
            <LinearGradient
                colors={['#4f46e5', '#111827']}
                className="absolute top-0 left-0 right-0 h-1/2 opacity-20"
            />

            <View className="flex-1 justify-center px-8">
                <View className="mb-12">
                    <Text className="text-4xl font-bold text-white mb-2">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </Text>
                    <Text className="text-gray-400 text-lg">
                        {isSignUp
                            ? "Start your training journey today."
                            : "Your dog is waiting for you."}
                    </Text>
                </View>

                <View>
                    <Input
                        label="Email"
                        placeholder="hello@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <Input
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title={isSignUp ? "Sign Up" : "Sign In"}
                        onPress={handleAuth}
                        loading={loading}
                        className="mt-4"
                    />

                    <Button
                        title={isSignUp ? "Already have an account? Sign In" : "New here? Create Account"}
                        variant="outline"
                        onPress={() => setIsSignUp(!isSignUp)}
                        className="mt-4 border-gray-800"
                    />
                </View>
            </View>
        </View>
    );
}
