import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, Alert } from "react-native";
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import "../lib/i18n";
import { PremiumProvider } from '../lib/premium';
import { initSentry, setUser } from '../lib/sentry';
import { hasCompletedOnboarding } from './onboarding';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { startNetworkListener, syncPendingWalks } from '../lib/syncService';
import { getActiveWalk } from '../lib/walkStorage';

// Initialize Sentry as early as possible
initSentry();

export default function Layout() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
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
            // Set Sentry user context
            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email });
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setInitialized(true);
            // Update Sentry user context
            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Check onboarding status at mount and when leaving onboarding screen
    const inOnboarding = segments[0] === 'onboarding';
    useEffect(() => {
        hasCompletedOnboarding().then(setOnboardingCompleted);
    }, [inOnboarding]);

    // Initialize sync service and check for crashed walks
    useEffect(() => {
        // Start network listener for background sync
        const unsubscribe = startNetworkListener();

        // Sync any pending walks on app start
        syncPendingWalks();

        // Check for crashed/interrupted walks
        const checkCrashedWalk = async () => {
            const activeWalk = await getActiveWalk();
            if (activeWalk && initialized && session) {
                Alert.alert(
                    'Walk Recovery',
                    'We found a walk in progress from a previous session. Would you like to resume it?',
                    [
                        {
                            text: 'Discard',
                            style: 'destructive',
                            onPress: async () => {
                                const { clearActiveWalk } = await import('../lib/walkStorage');
                                await clearActiveWalk();
                            }
                        },
                        {
                            text: 'Resume',
                            onPress: () => {
                                router.push({
                                    pathname: '/walk/active',
                                    params: { dogId: activeWalk.dogId, recovered: 'true' }
                                });
                            }
                        },
                    ]
                );
            }
        };

        if (initialized && session) {
            checkCrashedWalk();
        }

        return () => unsubscribe();
    }, [initialized, session]);


    useEffect(() => {
        if (!initialized || !fontsLoaded || onboardingCompleted === null) return;

        const inAuthGroup = segments[0] === 'auth';

        // Check onboarding first
        if (!onboardingCompleted && !inOnboarding) {
            router.replace('/onboarding');
            return;
        }

        if (session && inAuthGroup) {
            // Redirect to home if logged in and trying to access auth
            router.replace('/(tabs)');
        } else if (!session && !inAuthGroup && !inOnboarding) {
            // Redirect to login if not logged in and trying to access protected route
            router.replace('/auth');
        }
    }, [session, initialized, segments, fontsLoaded, onboardingCompleted, inOnboarding]);

    // Optional: Show a loading indicator only if not initialized yet
    if (!initialized) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-900">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <PremiumProvider>
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
            </PremiumProvider>
        </ErrorBoundary>
    );
}
