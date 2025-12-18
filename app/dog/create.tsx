import { useState, useRef } from "react";
import { View, Text, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Animated, Modal } from "react-native";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from "react-i18next";
import { LinearGradient } from 'expo-linear-gradient';
import { ensureLeaderboardStats } from "../../lib/leaderboardService";

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

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    async function handleCreate() {
        if (!name || !breed || !age) {
            Alert.alert(t('common.error'), t('dog.error_required'));
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { data: newDog, error } = await supabase
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
                })
                .select()
                .single();

            if (error) throw error;

            // Create leaderboard stats for the new dog
            if (newDog) {
                await ensureLeaderboardStats(newDog.id, name, user.id);
            }

            router.replace("/");
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
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

                    {/* Header Content */}
                    <View className="items-center mt-4">
                        <View className="bg-white/20 w-20 h-20 rounded-3xl items-center justify-center mb-4">
                            <Ionicons name="paw" size={40} color="white" />
                        </View>
                        <Text className="text-white text-2xl font-bold text-center">
                            {t('dog.add_new')}
                        </Text>
                        <Text className="text-indigo-200 text-center mt-2">
                            {t('dog.create_title')}
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

                    {/* Gender & Birthday Card */}
                    <View className="bg-gray-800/80 rounded-3xl p-5 mb-4 border border-gray-700/50">
                        <View className="flex-row items-center mb-5">
                            <View className="w-8 h-8 rounded-full bg-pink-500/20 items-center justify-center mr-3">
                                <Ionicons name="heart" size={18} color="#f472b6" />
                            </View>
                            <Text className="text-white font-bold text-lg">{t('dog.details') || 'Details'}</Text>
                        </View>

                        {/* Gender Selector */}
                        <View className="mb-5">
                            <Text className="text-gray-400 text-sm font-medium mb-3 ml-1">{t('dog.gender')}</Text>
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => setGender("Male")}
                                    className={`flex-1 py-4 rounded-2xl items-center justify-center flex-row ${gender === "Male"
                                        ? "bg-blue-500/20 border-2 border-blue-500"
                                        : "bg-gray-700/50 border border-gray-600"
                                        }`}
                                >
                                    <Ionicons
                                        name="male"
                                        size={20}
                                        color={gender === "Male" ? "#60a5fa" : "#9ca3af"}
                                    />
                                    <Text className={`font-bold text-base ml-2 ${gender === "Male" ? "text-blue-400" : "text-gray-400"
                                        }`}>{t('dog.male')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setGender("Female")}
                                    className={`flex-1 py-4 rounded-2xl items-center justify-center flex-row ${gender === "Female"
                                        ? "bg-pink-500/20 border-2 border-pink-500"
                                        : "bg-gray-700/50 border border-gray-600"
                                        }`}
                                >
                                    <Ionicons
                                        name="female"
                                        size={20}
                                        color={gender === "Female" ? "#f472b6" : "#9ca3af"}
                                    />
                                    <Text className={`font-bold text-base ml-2 ${gender === "Female" ? "text-pink-400" : "text-gray-400"
                                        }`}>{t('dog.female')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Birthday Picker */}
                        <View>
                            <Text className="text-gray-400 text-sm font-medium mb-2 ml-1">{t('dog.birthday')}</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="flex-row items-center bg-gray-800/50 rounded-2xl px-4 border border-gray-700/50"
                            >
                                <View className="bg-indigo-500/20 p-2 rounded-xl mr-3">
                                    <Ionicons name="gift" size={22} color="#818cf8" />
                                </View>
                                <Text className={`flex-1 py-4 text-lg ${birthday ? 'text-white' : 'text-gray-500'}`}>
                                    {birthday ? birthday.toLocaleDateString(dateLocale) : t('dog.select_date')}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                            </TouchableOpacity>
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

                    {/* Create Button */}
                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={loading}
                        className="bg-indigo-600 py-4 rounded-2xl items-center flex-row justify-center mb-4"
                    >
                        {loading ? (
                            <Text className="text-white font-bold text-lg">...</Text>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="white" />
                                <Text className="text-white font-bold text-lg ml-2">{t('dog.create_button')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <Modal visible={showDatePicker} transparent animationType="slide">
                    <View className="flex-1 bg-black/70 justify-end">
                        <View className="bg-gray-900 rounded-t-3xl p-4" style={{ paddingBottom: insets.bottom + 20 }}>
                            <View className="flex-row justify-between items-center mb-4 px-2">
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text className="text-indigo-400 font-semibold text-base">{t('common.cancel')}</Text>
                                </TouchableOpacity>
                                <Text className="text-white font-bold text-lg">{t('dog.birthday')}</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text className="text-indigo-400 font-semibold text-base">{t('common.done')}</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={birthday || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        setShowDatePicker(false);
                                    }
                                    if (selectedDate) setBirthday(selectedDate);
                                }}
                                maximumDate={new Date()}
                                themeVariant="dark"
                                style={Platform.OS === 'ios' ? { height: 200 } : undefined}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </KeyboardAvoidingView>
    );
}
