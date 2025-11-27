import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);
            setEmail(user.email || "");

            const { data, error } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error(error);
            }

            if (data) {
                setFullName(data.full_name || "");
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleUpdateProfile() {
        if (!userId) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: fullName,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSignOut() {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/auth');
                    }
                }
            ]
        );
    }

    async function handleDeleteAccount() {
        Alert.alert(
            "Delete Account",
            "This action is irreversible. All your data including dogs and progress will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const { error } = await supabase.rpc('delete_user');
                            if (error) throw error;

                            await supabase.auth.signOut();
                            router.replace("/auth");
                            Alert.alert("Account Deleted", "Your account has been permanently deleted.");
                        } catch (error: any) {
                            Alert.alert("Error", "Failed to delete account: " + error.message);
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900" edges={['top']}>
            <ScrollView className="flex-1 p-6">
                <Text className="text-white text-3xl font-bold mb-8">Profile</Text>

                {/* User Info */}
                <View className="mb-8 items-center">
                    <View className="w-24 h-24 bg-indigo-600 rounded-full items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                        <Text className="text-white text-3xl font-bold">
                            {fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?')}
                        </Text>
                    </View>
                    <Text className="text-white text-xl font-bold">{email}</Text>
                </View>

                {/* Edit Profile */}
                <View className="bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-700">
                    <Text className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">Edit Profile</Text>

                    <View className="mb-4">
                        <Text className="text-gray-300 mb-2 ml-1">Full Name</Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your name"
                            placeholderTextColor="#6b7280"
                            className="bg-gray-900 text-white p-4 rounded-xl border border-gray-700"
                        />
                    </View>

                    <Button
                        title="Update Profile"
                        onPress={handleUpdateProfile}
                        loading={loading}
                        className="mt-2"
                    />
                </View>

                {/* App Settings */}
                <View className="bg-gray-800 rounded-2xl overflow-hidden mb-6 border border-gray-700">
                    <Text className="text-gray-400 text-sm font-bold m-4 mb-2 uppercase tracking-wider">App</Text>
                    <TouchableOpacity
                        className="flex-row items-center p-4"
                    >
                        <View className="bg-gray-700 p-2 rounded-full mr-4">
                            <Ionicons name="star-outline" size={20} color="white" />
                        </View>
                        <Text className="text-white text-lg flex-1">Rate App</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* Account Actions */}
                <View className="bg-gray-800 rounded-2xl overflow-hidden mb-8 border border-gray-700">
                    <Text className="text-gray-400 text-sm font-bold m-4 mb-2 uppercase tracking-wider">Account</Text>

                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="flex-row items-center p-4 border-b border-gray-700"
                    >
                        <View className="bg-red-500/10 p-2 rounded-full mr-4">
                            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                        </View>
                        <Text className="text-red-400 text-lg flex-1 font-semibold">Sign Out</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleDeleteAccount}
                        className="flex-row items-center p-4"
                    >
                        <View className="bg-red-500/10 p-2 rounded-full mr-4">
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </View>
                        <Text className="text-red-500 text-lg flex-1 font-semibold">Delete Account</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                <Text className="text-gray-600 text-center mb-8 text-xs">
                    Version 1.0.0 • Dog Trainer App
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
