import { useState, useEffect } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "react-i18next";

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
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <Text className="text-white">{t('common.loading')}</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View
                className="bg-gray-800 border-b border-gray-700"
                style={{ paddingTop: insets.top }}
            >
                <View className="flex-row items-center justify-between px-4 h-14">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-gray-700"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold text-center">
                        {t('dog.edit_title')}
                    </Text>
                    <View className="w-10" />
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView className="flex-1 p-6">
                    <View className="mt-2">
                        <Input
                            label={t('dog.name') + " *"}
                            value={name}
                            onChangeText={setName}
                        />

                        <Input
                            label={t('dog.breed') + " *"}
                            value={breed}
                            onChangeText={setBreed}
                        />

                        <View className="flex-row space-x-4">
                            <View className="flex-1">
                                <Input
                                    label={t('dog.age_label')}
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Input
                                    label={t('dog.weight_label')}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <Input
                            label={t('dog.favorite_treat')}
                            value={favoriteTreat}
                            onChangeText={setFavoriteTreat}
                            placeholder={t('dog.treat_placeholder')}
                        />

                        <Button
                            title={t('dog.save_changes')}
                            onPress={handleUpdate}
                            loading={saving}
                            className="mt-4 mb-4"
                        />

                        <TouchableOpacity
                            onPress={handleDelete}
                            className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl items-center flex-row justify-center mb-10"
                        >
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold ml-2">{t('dog.delete_profile')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
