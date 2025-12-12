import React from 'react';
import { View, Text, Modal, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePremium } from '../lib/premium';
import { t } from 'i18next';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
    const { purchasePremium, restorePurchases, isLoading } = usePremium();

    const handlePurchase = async () => {
        const success = await purchasePremium();
        if (success) {
            Alert.alert("Success", "Welcome to DogTrainer Pro!");
            onClose();
        } else {
            Alert.alert("Error", "Purchase failed. Please try again.");
        }
    };

    const handleRestore = async () => {
        const success = await restorePurchases();
        if (success) {
            Alert.alert("Success", "Purchases restored!");
            onClose();
        } else {
            Alert.alert("Notice", "No previous purchases found.");
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-900">
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Header Image */}
                    <View className="h-64 w-full relative">
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=2070&auto=format&fit=crop' }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                        <View className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-gray-900" />
                        <TouchableOpacity
                            onPress={onClose}
                            className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 -mt-12">
                        <Text className="text-4xl font-bold text-white text-center mb-2">
                            DogTrainer <Text className="text-indigo-500">Pro</Text>
                        </Text>
                        <Text className="text-gray-400 text-center text-lg mb-8">
                            Unlock the full potential of your training journey.
                        </Text>

                        {/* Features List */}
                        <View className="space-y-6 mb-10">
                            <FeatureRow
                                icon="infinite"
                                title="Unlimited Dogs"
                                description="Track progress for your entire pack, not just one."
                            />
                            <FeatureRow
                                icon="chatbubbles"
                                title="AI Personal Trainer"
                                description="24/7 access to expert training advice via chat."
                            />
                            <FeatureRow
                                icon="stats-chart"
                                title="Advanced Analytics"
                                description="Deep dive into your training consistency and results."
                            />
                        </View>

                        {/* Pricing Card */}
                        <View className="bg-gray-800 p-6 rounded-3xl border border-gray-700 mb-8">
                            <Text className="text-white text-center text-lg font-medium mb-2">
                                Pro Access
                            </Text>
                            <Text className="text-4xl font-bold text-white text-center mb-1">
                                $4.99
                                <Text className="text-xl text-gray-400 font-normal"> / month</Text>
                            </Text>
                            <Text className="text-gray-500 text-center text-sm">
                                Cancel anytime.
                            </Text>
                        </View>

                        {/* Action Buttons */}
                        <TouchableOpacity
                            onPress={handlePurchase}
                            disabled={isLoading}
                            className="bg-indigo-600 py-4 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4"
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center font-bold text-xl">
                                    Subscribe Now
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleRestore} disabled={isLoading}>
                            <Text className="text-gray-500 text-center font-medium">
                                Restore Purchases
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

function FeatureRow({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
    return (
        <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-indigo-500/20 items-center justify-center mr-4">
                <Ionicons name={icon} size={24} color="#818cf8" />
            </View>
            <View className="flex-1">
                <Text className="text-white font-bold text-lg">{title}</Text>
                <Text className="text-gray-400 leading-5">{description}</Text>
            </View>
        </View>
    );
}
