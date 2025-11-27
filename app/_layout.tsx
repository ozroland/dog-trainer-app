import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Layout() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState(false);
    const router = useRouter();
    const segments = useSegments();

    const [fontsLoaded] = useFonts({
        ...Ionicons.font,
    });

    useEffect(() => {
        // Check session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setInitialized(true);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setInitialized(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!initialized || !fontsLoaded) return;

        const inAuthGroup = segments[0] === 'auth';

        if (session && inAuthGroup) {
            // Redirect to home if logged in and trying to access auth
            router.replace('/(tabs)');
        } else if (!session && !inAuthGroup) {
            // Redirect to login if not logged in and trying to access protected route
            router.replace('/auth');
        }
    }, [session, initialized, segments, fontsLoaded]);

    // Optional: Show a loading indicator only if not initialized yet
    if (!initialized) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-900">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#111827' },
                    headerStyle: { backgroundColor: '#111827' },
                    headerTintColor: '#fff',
                    headerShadowVisible: false
                }}
            />
        </SafeAreaProvider>
    );
}
