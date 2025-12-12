import { View, Text, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { useState } from 'react';
import { usePremium } from '../lib/premium';
import { PaywallModal } from './PaywallModal';
import { Dog } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { t } from 'i18next';
import haptics from '../lib/haptics';

interface DogSwitcherProps {
    visible: boolean;
    dogs: Dog[];
    activeDogId: string;
    onSelect: (dog: Dog) => void;
    onClose: () => void;
    onAddDog: () => void;
}

export function DogSwitcher({ visible, dogs, activeDogId, onSelect, onClose, onAddDog }: DogSwitcherProps) {
    const insets = useSafeAreaInsets();
    const { isPremium } = usePremium();
    const [showPaywall, setShowPaywall] = useState(false);

    const handleAddDog = () => {
        haptics.medium();
        if (dogs.length >= 1 && !isPremium) {
            setShowPaywall(true);
        } else {
            onAddDog();
        }
    };

    const handleSelect = (dog: Dog) => {
        haptics.selection();
        onSelect(dog);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center p-6">
                {/* Blur Backdrop */}
                <BlurView
                    intensity={20}
                    tint="dark"
                    className="absolute top-0 left-0 right-0 bottom-0"
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={onClose}
                        className="flex-1 bg-black/40"
                    />
                </BlurView>

                {/* Modal Content */}
                <View className="bg-gray-800 w-full rounded-3xl border border-gray-700 overflow-hidden shadow-2xl shadow-black elevation-10">
                    <View className="p-6 pb-4 border-b border-gray-700 flex-row justify-between items-center">
                        <Text className="text-2xl font-bold text-white">{t('dog.switch')}</Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-700 p-2 rounded-full">
                            <Ionicons name="close" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={dogs}
                        keyExtractor={d => d.id}
                        contentContainerStyle={{ padding: 24 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleSelect(item)}
                                className={`p-4 mb-3 flex-row items-center rounded-2xl border ${item.id === activeDogId
                                    ? 'bg-indigo-500/20 border-indigo-500'
                                    : 'bg-gray-700/50 border-gray-600'
                                    }`}
                            >
                                <View className="w-14 h-14 rounded-full bg-gray-600 items-center justify-center overflow-hidden border-2 border-gray-500">
                                    {item.photo_url ? (
                                        <Image source={{ uri: item.photo_url }} className="w-full h-full" />
                                    ) : (
                                        <Ionicons name="paw" size={24} color="#9ca3af" />
                                    )}
                                </View>
                                <View className="flex-1 ml-4">
                                    <Text className={`text-lg font-bold ${item.id === activeDogId ? 'text-indigo-300' : 'text-white'}`}>
                                        {item.name}
                                    </Text>
                                    <Text className="text-sm text-gray-400">{item.breed || 'Unknown Breed'}</Text>
                                </View>
                                {item.id === activeDogId && (
                                    <Ionicons name="checkmark-circle" size={28} color="#6366f1" />
                                )}
                            </TouchableOpacity>
                        )}
                        ListFooterComponent={() => (
                            <TouchableOpacity
                                onPress={handleAddDog}
                                className="mt-2 p-4 bg-indigo-600 rounded-2xl flex-row items-center justify-center space-x-2 active:bg-indigo-700 shadow-lg shadow-indigo-900/20"
                            >
                                <Ionicons name="add" size={24} color="white" />
                                <Text className="text-white font-bold text-lg">{t('dog.add_new')}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>

            <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
        </Modal>
    );
}
