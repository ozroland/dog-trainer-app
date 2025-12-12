import { useState } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from "react-i18next";

export default function CreateDogScreen() {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'hu' ? 'hu-HU' : 'en-US';
    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState("");
    const [birthday, setBirthday] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [weight, setWeight] = useState("");
    const [favoriteTreat, setFavoriteTreat] = useState("");
    const [gender, setGender] = useState<"Male" | "Female">("Male");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    async function handleCreate() {
        if (!name || !breed || !age) {
            Alert.alert(t('common.error'), t('dog.error_required'));
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from("dogs")
                .insert({
                    owner_id: user.id,
                    name,
                    breed,
                    age: parseInt(age),
                    gender,
                    birthday: birthday ? birthday.toISOString().split('T')[0] : null,
                    weight: weight || null,
                    favorite_treat: favoriteTreat || null,
                });

            if (error) throw error;

            router.replace("/");
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    }

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setBirthday(selectedDate);
        }
    };

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
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
                        {t('dog.add_new')}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="mt-4">
                        <Text className="text-white text-xl font-bold mb-6">
                            {t('dog.create_title')}
                        </Text>

                        <Input
                            label={t('dog.name') + " *"}
                            placeholder={t('dog.name_placeholder')}
                            value={name}
                            onChangeText={setName}
                        />

                        <Input
                            label={t('dog.breed') + " *"}
                            placeholder={t('dog.breed_placeholder')}
                            value={breed}
                            onChangeText={setBreed}
                        />

                        <View className="flex-row space-x-4">
                            <View className="flex-1">
                                <Input
                                    label={t('dog.age_label')}
                                    placeholder="12"
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Input
                                    label={t('dog.weight_label')}
                                    placeholder="25"
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View className="mb-4 space-y-2">
                            <Text className="text-gray-400 text-sm font-medium ml-1">{t('dog.birthday')}</Text>
                            {!showDatePicker || Platform.OS === 'android' ? (
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    className="h-14 bg-gray-800/50 border border-gray-700 rounded-2xl px-4 justify-center"
                                >
                                    <Text className={`text-base ${birthday ? 'text-white' : 'text-gray-500'}`}>
                                        {birthday ? birthday.toLocaleDateString(dateLocale) : t('dog.select_date')}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {showDatePicker && (
                                <View className={Platform.OS === 'ios' ? "bg-gray-800 rounded-2xl p-4 border border-gray-700" : ""}>
                                    <DateTimePicker
                                        value={birthday || new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? "spinner" : "default"}
                                        onChange={onDateChange}
                                        maximumDate={new Date()}
                                        textColor="white"
                                        themeVariant="dark"
                                    />
                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker(false)}
                                            className="bg-indigo-600 py-3 rounded-xl items-center mt-4"
                                        >
                                            <Text className="text-white font-bold">{t('common.done')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>

                        <Input
                            label={t('dog.favorite_treat')}
                            placeholder={t('dog.treat_placeholder')}
                            value={favoriteTreat}
                            onChangeText={setFavoriteTreat}
                        />

                        <View className="mb-6">
                            <Text className="text-gray-400 text-sm font-medium ml-1 mb-2">{t('dog.gender')}</Text>
                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    onPress={() => setGender("Male")}
                                    className={`flex-1 h-11 rounded-xl items-center justify-center ${gender === "Male" ? "bg-indigo-600" : "bg-gray-800 border border-gray-700"
                                        }`}
                                >
                                    <Text className={`font-semibold text-sm ${gender === "Male" ? "text-white" : "text-gray-400"
                                        }`}>{t('dog.male')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setGender("Female")}
                                    className={`flex-1 h-11 rounded-xl items-center justify-center ${gender === "Female" ? "bg-indigo-600" : "bg-gray-800 border border-gray-700"
                                        }`}
                                >
                                    <Text className={`font-semibold text-sm ${gender === "Female" ? "text-white" : "text-gray-400"
                                        }`}>{t('dog.female')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Button
                            title={t('dog.create_button')}
                            onPress={handleCreate}
                            loading={loading}
                            className="mt-4"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
