import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Platform, KeyboardAvoidingView, Modal } from "react-native";
import { useTranslation } from "react-i18next";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import { ScreenHeader } from "../../../components/ScreenHeader";
import DateTimePicker from '@react-native-community/datetimepicker';

type RecordType = 'vaccination' | 'vet_visit' | 'medication';

const recordTypeConfig: Record<RecordType, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
    vaccination: { icon: 'shield-checkmark', color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.15)' },
    vet_visit: { icon: 'medkit', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
    medication: { icon: 'bandage', color: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.15)' },
};

export default function AddHealthRecordScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [recordType, setRecordType] = useState<RecordType>('vet_visit');
    const [recordTitle, setRecordTitle] = useState("");
    const [recordDate, setRecordDate] = useState(() => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today;
    });
    const [recordNotes, setRecordNotes] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    async function handleAddHealthRecord() {
        if (!recordTitle.trim()) {
            Alert.alert(t('common.error'), t('health.error_title_required'));
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase.from("health_records").insert({
                dog_id: id,
                type: recordType,
                title: recordTitle.trim(),
                date: format(recordDate, 'yyyy-MM-dd'),
                notes: recordNotes.trim()
            });

            if (error) throw error;
            router.back();

        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Standardized Header */}
            <ScreenHeader title={t('health.add_record')} />

            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Type Selection - Visual Cards */}
                <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">{t('health.type')}</Text>
                <View className="flex-row mb-6 gap-3">
                    {(['vaccination', 'vet_visit', 'medication'] as const).map((type) => {
                        const typeConfig = recordTypeConfig[type];
                        const isSelected = recordType === type;
                        return (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setRecordType(type)}
                                className={`flex-1 p-4 rounded-2xl items-center border-2 ${isSelected ? 'border-indigo-500' : 'border-transparent'
                                    }`}
                                style={{ backgroundColor: isSelected ? typeConfig.bgColor : 'rgba(31, 41, 55, 0.5)' }}
                            >
                                <View
                                    style={{ backgroundColor: typeConfig.bgColor, width: 48, height: 48, borderRadius: 14 }}
                                    className="items-center justify-center mb-2"
                                >
                                    <Ionicons name={typeConfig.icon} size={24} color={typeConfig.color} />
                                </View>
                                <Text
                                    className={`font-semibold text-xs text-center ${isSelected ? 'text-white' : 'text-gray-400'}`}
                                    numberOfLines={1}
                                >
                                    {t(`health.${type}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Title Input */}
                <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">{t('health.record_title')}</Text>
                <View className="bg-gray-800/50 rounded-2xl border border-gray-700/50 mb-6 overflow-hidden">
                    <TextInput
                        className="text-white p-4 text-base"
                        placeholder={t('health.title_placeholder')}
                        placeholderTextColor="#6b7280"
                        value={recordTitle}
                        onChangeText={setRecordTitle}
                        returnKeyType="done"
                    />
                </View>

                {/* Date Selection */}
                <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">{t('health.date')}</Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-gray-800/50 rounded-2xl border border-gray-700/50 mb-6 p-4 flex-row items-center justify-between"
                >
                    <View className="flex-row items-center">
                        <View className="bg-indigo-500/20 p-2 rounded-xl mr-3">
                            <Ionicons name="calendar" size={22} color="#818cf8" />
                        </View>
                        <Text className="text-white text-lg">{format(recordDate, "MMMM dd, yyyy")}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>

                {/* Notes - Simplified with Modal Option */}
                <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                    {t('health.notes')} <Text className="text-gray-500 normal-case">({t('health.optional')})</Text>
                </Text>
                <TouchableOpacity
                    onPress={() => setShowNotesModal(true)}
                    className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4 mb-8 flex-row items-center"
                >
                    <View className="bg-gray-700/50 p-2 rounded-xl mr-3">
                        <Ionicons name="document-text" size={22} color="#9ca3af" />
                    </View>
                    <Text className={`flex-1 ${recordNotes ? 'text-white' : 'text-gray-500'}`} numberOfLines={2}>
                        {recordNotes || t('health.notes') + '...'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleAddHealthRecord}
                    disabled={saving}
                    className={`p-4 rounded-2xl items-center mb-10 flex-row justify-center ${saving ? 'bg-indigo-600/50' : 'bg-indigo-500'}`}
                >
                    {saving ? (
                        <Text className="text-white/70 font-bold text-lg">{t('common.loading')}</Text>
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color="white" />
                            <Text className="text-white font-bold text-lg ml-2">{t('common.save')}</Text>
                        </>
                    )}
                </TouchableOpacity>
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
                                <Text className="text-white font-bold text-lg">{t('health.date')}</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text className="text-indigo-400 font-semibold text-base">{t('common.done')}</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={recordDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        setShowDatePicker(false);
                                    }
                                    if (selectedDate) setRecordDate(selectedDate);
                                }}
                                maximumDate={new Date()}
                                themeVariant="dark"
                                style={Platform.OS === 'ios' ? { height: 200 } : undefined}
                            />
                        </View>
                    </View>
                </Modal>
            )}

            {/* Notes Modal */}
            <Modal visible={showNotesModal} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-gray-900" style={{ paddingTop: Platform.OS === 'ios' ? 20 : insets.top }}>
                    <View className="flex-row items-center justify-between px-4 pb-4 border-b border-gray-800">
                        <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                            <Text className="text-indigo-400 font-semibold text-base">{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-lg">{t('health.notes')}</Text>
                        <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                            <Text className="text-indigo-400 font-semibold text-base">{t('common.done')}</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        className="flex-1 text-white text-base p-4"
                        placeholder={t('health.notes') + '...'}
                        placeholderTextColor="#6b7280"
                        multiline
                        textAlignVertical="top"
                        value={recordNotes}
                        onChangeText={setRecordNotes}
                        autoFocus
                    />
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
