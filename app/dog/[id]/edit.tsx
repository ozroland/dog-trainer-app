import { useState, useEffect } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Image } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LinearGradient } from 'expo-linear-gradient';
import { Skeleton } from "../../../components/ui/Skeleton";

// Modern Input Field Component
function ModernInput({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType = 'default',
    required = false,
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    icon: keyof typeof Ionicons.glyphMap;
    keyboardType?: 'default' | 'numeric' | 'email-address';
    required?: boolean;
}) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View className="mb-5">
            <Text className="text-gray-400 text-sm font-medium mb-2 ml-1">
                {label}{required && <Text className="text-indigo-400"> *</Text>}
            </Text>
            <View
                className={`flex-row items-center bg-gray-800/60 rounded-2xl px-4 border ${isFocused ? 'border-indigo-500 bg-gray-800' : 'border-gray-700/50'
                    }`}
            >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isFocused ? 'bg-indigo-500/20' : 'bg-gray-700/50'
                    }`}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isFocused ? '#818cf8' : '#9ca3af'}
                    />
                </View>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#6b7280"
                    className="flex-1 h-14 text-white text-base"
                    keyboardType={keyboardType}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </View>
        </View>
    );
}

export default function EditDogScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [weight, setWeight] = useState("");
    const [favoriteTreat, setFavoriteTreat] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDogDetails();
    }, [id]);

    async function fetchDogDetails() {
        try {
            const { data, error } = await supabase
                .from('dogs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                setName(data.name);
                setBreed(data.breed);
                setAge(data.age.toString());
                setWeight(data.weight ? data.weight.toString() : "");
                setFavoriteTreat(data.favorite_treat || "");
                setPhotoUrl(data.photo_url);
            }
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('dog.error_load'));
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate() {
        if (!name || !breed || !age) {
            Alert.alert(t('common.error'), t('dog.error_required'));
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from("dogs")
                .update({
                    name,
                    breed,
                    age: parseInt(age),
                    weight: weight ? parseFloat(weight) : null,
                    favorite_treat: favoriteTreat || null,
                })
                .eq('id', id);

            if (error) throw error;

            Alert.alert(t('common.success'), t('dog.update_success'), [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        Alert.alert(
            t('dog.delete_profile'),
            t('dog.delete_profile_confirm', { name }),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('dogs')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;

                            router.replace("/");
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error.message);
                        }
                    }
                }
            ]
        );
    }

    if (loading) {
        return (
            <View className="flex-1 bg-gray-900">
                <LinearGradient
                    colors={['#4f46e5', '#3730a3']}
                    className="pb-10 px-4"
                    style={{ paddingTop: insets.top }}
                >
                    <View className="flex-row items-center h-14">
                        <View className="w-10 h-10 rounded-full bg-black/20" />
                    </View>
                    <View className="items-center mt-4">
                        <Skeleton width={96} height={96} borderRadius={48} />
                        <View className="mt-4">
                            <Skeleton width={150} height={28} />
                        </View>
                    </View>
                </LinearGradient>
                <View className="px-5 mt-6">
                    <Skeleton width="100%" height={200} borderRadius={24} />
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-900"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Hero Header */}
                <LinearGradient
                    colors={['#4f46e5', '#3730a3']}
                    className="pb-10 px-4"
                    style={{ paddingTop: insets.top }}
                >
                    {/* Back Button */}
                    <View className="flex-row items-center h-14">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center rounded-full bg-black/20"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Dog Avatar */}
                    <View className="items-center mt-4">
                        {photoUrl ? (
                            <Image
                                source={{ uri: photoUrl }}
                                className="w-24 h-24 rounded-full mb-4 border-4 border-white/30"
                            />
                        ) : (
                            <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4 border-4 border-white/30">
                                <Text className="text-white text-4xl font-bold">{name[0] || '?'}</Text>
                            </View>
                        )}
                        <Text className="text-white text-2xl font-bold text-center">
                            {t('dog.edit_title')}
                        </Text>
                        <Text className="text-indigo-200 text-center mt-1">
                            {t('dog.edit_subtitle') || 'Update your dog\'s information'}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Form Content */}
                <View className="px-5 mt-4">
                    {/* Basic Info Card */}
                    <View className="bg-gray-800/80 rounded-3xl p-5 mb-4 border border-gray-700/50">
                        <View className="flex-row items-center mb-5">
                            <View className="w-8 h-8 rounded-full bg-indigo-500/20 items-center justify-center mr-3">
                                <Ionicons name="information-circle" size={18} color="#818cf8" />
                            </View>
                            <Text className="text-white font-bold text-lg">{t('dog.basic_info') || 'Basic Info'}</Text>
                        </View>

                        <ModernInput
                            label={t('dog.name')}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('dog.name_placeholder')}
                            icon="paw"
                            required
                        />

                        <ModernInput
                            label={t('dog.breed')}
                            value={breed}
                            onChangeText={setBreed}
                            placeholder={t('dog.breed_placeholder')}
                            icon="pricetag"
                            required
                        />

                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <ModernInput
                                    label={t('dog.age')}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="12"
                                    icon="calendar"
                                    keyboardType="numeric"
                                    required
                                />
                            </View>
                            <View className="flex-1">
                                <ModernInput
                                    label={t('dog.weight')}
                                    value={weight}
                                    onChangeText={setWeight}
                                    placeholder="25"
                                    icon="scale"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Extra Info Card */}
                    <View className="bg-gray-800/80 rounded-3xl p-5 mb-6 border border-gray-700/50">
                        <View className="flex-row items-center mb-5">
                            <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-3">
                                <Ionicons name="star" size={18} color="#fbbf24" />
                            </View>
                            <Text className="text-white font-bold text-lg">{t('dog.extras') || 'Extras'}</Text>
                        </View>

                        <ModernInput
                            label={t('dog.favorite_treat')}
                            value={favoriteTreat}
                            onChangeText={setFavoriteTreat}
                            placeholder={t('dog.treat_placeholder')}
                            icon="heart"
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleUpdate}
                        disabled={saving}
                        className="bg-indigo-600 py-4 rounded-2xl items-center flex-row justify-center mb-4"
                    >
                        {saving ? (
                            <Text className="text-white font-bold text-lg">...</Text>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="white" />
                                <Text className="text-white font-bold text-lg ml-2">{t('dog.save_changes')}</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Delete Button */}
                    <TouchableOpacity
                        onPress={handleDelete}
                        className="bg-red-500/10 border border-red-500/30 py-4 rounded-2xl items-center flex-row justify-center mb-10"
                    >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        <Text className="text-red-500 font-bold ml-2">{t('dog.delete_profile')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
