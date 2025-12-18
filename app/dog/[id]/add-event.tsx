import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Platform, Switch, KeyboardAvoidingView, Modal } from "react-native";
import { useTranslation } from "react-i18next";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleReminder } from "../../../lib/notifications";
import { ScreenHeader } from "../../../components/ScreenHeader";

type EventType = 'training' | 'grooming' | 'vet_visit' | 'walk' | 'vaccination' | 'other';

const eventTypeConfig: Record<EventType, { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }> = {
    training: { icon: 'barbell', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' },
    grooming: { icon: 'cut', color: '#f472b6', bgColor: 'rgba(244, 114, 182, 0.15)' },
    vet_visit: { icon: 'medkit', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
    walk: { icon: 'walk', color: '#4ade80', bgColor: 'rgba(74, 222, 128, 0.15)' },
    vaccination: { icon: 'fitness', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' },
    other: { icon: 'calendar', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' },
};

export default function AddEventScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [eventTitle, setEventTitle] = useState("");
    const [eventDate, setEventDate] = useState(() => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return today;
    });
    const [eventType, setEventType] = useState<EventType>('other');
    const [eventNotes, setEventNotes] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Reminder State
    const [eventReminderEnabled, setEventReminderEnabled] = useState(false);
    const [eventReminderTime, setEventReminderTime] = useState(new Date());
    const [eventRecurrence, setEventRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [showEventTimePicker, setShowEventTimePicker] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    async function handleAddEvent() {
        if (!eventTitle.trim()) {
            Alert.alert(t('common.error'), t('calendar.error_title_required'));
            return;
        }

        let finalDate = eventDate;
        if (!finalDate || finalDate.getFullYear() <= 1970) {
            finalDate = new Date();
        }

        setSaving(true);
        try {
            const { error } = await supabase.from("calendar_events").insert({
                dog_id: id,
                title: eventTitle.trim(),
                date: format(finalDate, 'yyyy-MM-dd'),
                type: eventType,
                notes: eventNotes.trim()
            });

            if (error) throw error;

            if (eventReminderEnabled) {
                await scheduleReminder(
                    eventTitle,
                    `Reminder: ${eventTitle}`,
                    eventReminderTime.getHours(),
                    eventReminderTime.getMinutes(),
                    eventRecurrence,
                    finalDate
                );
            }

            router.back();

        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setSaving(false);
        }
    }

    const config = eventTypeConfig[eventType];

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-900"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Standardized Header */}
            <ScreenHeader title={t('calendar.add_event')} />

            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Title Input */}
                <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                    {t('calendar.event_title_placeholder')}
                </Text>
                <View className="bg-gray-800/50 rounded-2xl border border-gray-700/50 mb-6 overflow-hidden">
                    <TextInput
                        className="text-white p-4 text-base"
                        placeholder={t('calendar.event_title_placeholder')}
                        placeholderTextColor="#6b7280"
                        value={eventTitle}
                        onChangeText={setEventTitle}
                        returnKeyType="done"
                    />
                </View>

                {/* Type Selection - Visual Cards (2x3 Grid) */}
                <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">{t('health.type')}</Text>
                <View className="flex-row flex-wrap mb-6" style={{ marginHorizontal: -4 }}>
                    {(['training', 'grooming', 'vet_visit', 'walk', 'vaccination', 'other'] as const).map((type) => {
                        const typeConfig = eventTypeConfig[type];
                        const isSelected = eventType === type;
                        return (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setEventType(type)}
                                className={`p-3 rounded-2xl items-center border-2 mb-2 ${isSelected ? 'border-indigo-500' : 'border-transparent'
                                    }`}
                                style={{
                                    backgroundColor: isSelected ? typeConfig.bgColor : 'rgba(31, 41, 55, 0.5)',
                                    width: '31%',
                                    marginHorizontal: '1%'
                                }}
                            >
                                <View
                                    style={{ backgroundColor: typeConfig.bgColor, width: 40, height: 40, borderRadius: 12 }}
                                    className="items-center justify-center mb-2"
                                >
                                    <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
                                </View>
                                <Text
                                    className={`font-semibold text-xs text-center ${isSelected ? 'text-white' : 'text-gray-400'}`}
                                    numberOfLines={1}
                                >
                                    {t(`calendar.types.${type}`)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Date Selection */}
                <Text className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">{t('calendar.date')}</Text>
                <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-gray-800/50 rounded-2xl border border-gray-700/50 mb-6 p-4 flex-row items-center justify-between"
                >
                    <View className="flex-row items-center">
                        <View className="bg-indigo-500/20 p-2 rounded-xl mr-3">
                            <Ionicons name="calendar" size={22} color="#818cf8" />
                        </View>
                        <Text className="text-white text-lg">{format(eventDate, "MMMM dd, yyyy")}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>

                {/* Reminder Section */}
                <View className="bg-gray-800/50 rounded-2xl border border-gray-700/50 mb-6 overflow-hidden">
                    <View className="flex-row justify-between items-center p-4">
                        <View className="flex-row items-center">
                            <View className="bg-indigo-500/20 p-2 rounded-xl mr-3">
                                <Ionicons name="notifications" size={22} color="#818cf8" />
                            </View>
                            <Text className="text-white font-semibold text-base">{t('calendar.remind_me')}</Text>
                        </View>
                        <Switch
                            value={eventReminderEnabled}
                            onValueChange={setEventReminderEnabled}
                            trackColor={{ false: "#374151", true: "#6366f1" }}
                            thumbColor="#ffffff"
                        />
                    </View>

                    {eventReminderEnabled && (
                        <View className="px-4 pb-4 border-t border-gray-700/50 pt-4">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-gray-400 font-medium">{t('calendar.time')}</Text>
                                {Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        value={eventReminderTime}
                                        mode="time"
                                        display="compact"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) setEventReminderTime(selectedDate);
                                        }}
                                        themeVariant="dark"
                                    />
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => setShowEventTimePicker(true)}
                                        className="bg-gray-700 px-4 py-2 rounded-xl"
                                    >
                                        <Text className="text-white font-semibold">{format(eventReminderTime, "h:mm a")}</Text>
                                    </TouchableOpacity>
                                )}
                                {showEventTimePicker && Platform.OS === 'android' && (
                                    <DateTimePicker
                                        value={eventReminderTime}
                                        mode="time"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowEventTimePicker(false);
                                            if (selectedDate) setEventReminderTime(selectedDate);
                                        }}
                                    />
                                )}
                            </View>

                            <View>
                                <Text className="text-gray-400 font-medium mb-3">{t('calendar.repeat')}</Text>
                                <View className="flex-row bg-gray-900/50 rounded-xl p-1">
                                    {(['none', 'daily', 'weekly'] as const).map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            onPress={() => setEventRecurrence(opt)}
                                            className={`flex-1 py-2.5 rounded-lg items-center ${eventRecurrence === opt ? 'bg-indigo-500' : ''}`}
                                        >
                                            <Text className={`text-sm capitalize ${eventRecurrence === opt ? 'text-white font-bold' : 'text-gray-400'}`}>
                                                {t(`calendar.repeat_options.${opt === 'none' ? 'no' : opt}`)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}
                </View>

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
                    <Text className={`flex-1 ${eventNotes ? 'text-white' : 'text-gray-500'}`} numberOfLines={2}>
                        {eventNotes || t('health.notes') + '...'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleAddEvent}
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
                        value={eventNotes}
                        onChangeText={setEventNotes}
                        autoFocus
                    />
                </View>
            </Modal>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <Modal visible={showDatePicker} transparent animationType="slide">
                    <View className="flex-1 bg-black/70 justify-end">
                        <View className="bg-gray-900 rounded-t-3xl p-4" style={{ paddingBottom: insets.bottom + 20 }}>
                            <View className="flex-row justify-between items-center mb-4 px-2">
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text className="text-indigo-400 font-semibold text-base">{t('common.cancel')}</Text>
                                </TouchableOpacity>
                                <Text className="text-white font-bold text-lg">{t('calendar.date')}</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text className="text-indigo-400 font-semibold text-base">{t('common.done')}</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={eventDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        setShowDatePicker(false);
                                    }
                                    if (selectedDate) setEventDate(selectedDate);
                                }}
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
