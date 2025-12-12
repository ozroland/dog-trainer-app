import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useMemo, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { Dog, HealthRecord, CalendarEvent } from "../../../types";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, DateData } from 'react-native-calendars';
import { format, parseISO, addYears, isBefore } from "date-fns";
import { ScreenHeader } from "../../../components/ScreenHeader";

const { width } = Dimensions.get('window');

export default function CalendarScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'hu' ? 'hu-HU' : 'en-US';

    const [dog, setDog] = useState<Dog | null>(null);
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [showAddOptions, setShowAddOptions] = useState(false);

    // Tab state for switching between views
    const [activeTab, setActiveTab] = useState<'calendar' | 'upcoming'>('calendar');

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [id])
    );

    async function fetchData() {
        try {
            const { data: dogData, error: dogError } = await supabase
                .from("dogs")
                .select("*")
                .eq("id", id)
                .single();

            if (dogError) throw dogError;
            setDog(dogData);

            const { data: healthData, error: healthError } = await supabase
                .from("health_records")
                .select("*")
                .eq("dog_id", id)
                .order("date", { ascending: true });

            if (healthError) throw healthError;
            setHealthRecords(healthData || []);

            const { data: eventData, error: eventError } = await supabase
                .from("calendar_events")
                .select("*")
                .eq("dog_id", id)
                .order("date", { ascending: true });

            if (eventError) throw eventError;
            setCalendarEvents(eventData || []);

        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteEvent(event: any) {
        if (event.source !== 'calendar' && event.source !== 'health') return;

        const isHealth = event.source === 'health';
        const titleKey = isHealth ? 'health.delete_confirm_title' : 'calendar.delete_event';
        const messageKey = isHealth ? 'health.delete_confirm_message' : 'calendar.delete_event_confirm';
        const tableName = isHealth ? 'health_records' : 'calendar_events';

        Alert.alert(
            t(titleKey),
            t(messageKey),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from(tableName)
                                .delete()
                                .eq("id", event.id);

                            if (error) throw error;

                            fetchData();
                            setShowDetailModal(false);
                            setSelectedEvent(null);
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error.message);
                        }
                    }
                }
            ]
        );
    }

    // Calculate upcoming birthdays
    const upcomingBirthdays = useMemo(() => {
        if (!dog?.birthday) return [];
        const today = new Date();
        const birthDate = parseISO(dog.birthday);
        const currentYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const nextBirthday = isBefore(currentYearBirthday, today)
            ? addYears(currentYearBirthday, 1)
            : currentYearBirthday;

        return [{
            date: format(nextBirthday, 'yyyy-MM-dd'),
            title: t('calendar.birthday_event', { name: dog.name }),
            type: 'birthday'
        }];
    }, [dog]);

    // Combine all events for marking
    const markedDates = useMemo(() => {
        const marks: any = {};

        // Health Records
        healthRecords.forEach(record => {
            const date = record.date;
            let dotColor = '#60a5fa';
            if (record.type === 'vaccination') dotColor = '#4ade80';
            if (record.type === 'medication') dotColor = '#fb923c';

            if (!marks[date]) marks[date] = { dots: [] };
            marks[date].dots.push({ color: dotColor });
        });

        // Calendar Events
        calendarEvents.forEach(event => {
            const date = event.date;
            let dotColor = '#a78bfa';
            if (event.type === 'training') dotColor = '#fbbf24';
            if (event.type === 'grooming') dotColor = '#f472b6';

            if (!marks[date]) marks[date] = { dots: [] };
            marks[date].dots.push({ color: dotColor });
        });

        // Birthdays
        upcomingBirthdays.forEach(bday => {
            if (!marks[bday.date]) marks[bday.date] = { dots: [] };
            marks[bday.date].dots.push({ color: '#f472b6' });
        });

        // Selected Date
        if (marks[selectedDate]) {
            marks[selectedDate].selected = true;
            marks[selectedDate].selectedColor = '#6366f1';
        } else {
            marks[selectedDate] = { selected: true, selectedColor: '#6366f1', dots: [] };
        }

        return marks;
    }, [healthRecords, calendarEvents, upcomingBirthdays, selectedDate]);

    // Filter events for selected date
    const selectedDateEvents = useMemo(() => {
        const records = healthRecords.filter(r => r.date === selectedDate).map(r => ({ ...r, source: 'health' }));
        const events = calendarEvents.filter(e => e.date === selectedDate).map(e => ({ ...e, source: 'calendar' }));
        const birthdays = upcomingBirthdays.filter(b => b.date === selectedDate).map(b => ({ ...b, source: 'birthday' }));
        return [...records, ...events, ...birthdays];
    }, [healthRecords, calendarEvents, upcomingBirthdays, selectedDate]);

    // Get upcoming events (future only)
    const upcomingEvents = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const records = healthRecords.filter(r => r.date >= today).map(r => ({ ...r, source: 'health' }));
        const events = calendarEvents.filter(e => e.date >= today).map(e => ({ ...e, source: 'calendar' }));
        const birthdays = upcomingBirthdays.map(b => ({ ...b, source: 'birthday' }));

        return [...records, ...events, ...birthdays].sort((a: any, b: any) =>
            (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0)
        );
    }, [healthRecords, calendarEvents, upcomingBirthdays]);

    const getEventIcon = (event: any) => {
        if (event.source === 'health') {
            if (event.type === 'vaccination') return 'shield-checkmark';
            if (event.type === 'vet_visit') return 'medkit';
            return 'bandage';
        }
        if (event.source === 'birthday') return 'gift';
        if (event.type === 'training') return 'barbell';
        if (event.type === 'grooming') return 'cut';
        return 'calendar';
    };

    const getEventColor = (event: any) => {
        if (event.source === 'health') {
            if (event.type === 'vaccination') return '#4ade80';
            if (event.type === 'vet_visit') return '#60a5fa';
            return '#fb923c';
        }
        if (event.source === 'birthday') return '#f472b6';
        if (event.type === 'training') return '#fbbf24';
        if (event.type === 'grooming') return '#f472b6';
        return '#a78bfa';
    };

    const getEventBgColor = (event: any) => {
        const color = getEventColor(event);
        return color + '20'; // 20% opacity
    };

    const EventCard = ({ event, showDate = false }: { event: any; showDate?: boolean }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedEvent(event);
                setShowDetailModal(true);
            }}
            className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/50"
            style={{ flexDirection: 'row', alignItems: 'center' }}
        >
            {showDate && (
                <View className="mr-4 items-center" style={{ width: 50 }}>
                    <Text className="text-gray-400 text-xs font-bold uppercase">
                        {format(parseISO(event.date), 'MMM')}
                    </Text>
                    <Text className="text-white text-2xl font-bold">
                        {format(parseISO(event.date), 'd')}
                    </Text>
                </View>
            )}
            <View
                style={{ backgroundColor: getEventBgColor(event), width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
            >
                <Ionicons name={getEventIcon(event)} size={22} color={getEventColor(event)} />
            </View>
            <View style={{ flex: 1 }}>
                <Text className="text-white font-semibold text-base" numberOfLines={1}>
                    {event.title}
                </Text>
                <Text className="text-gray-400 text-sm capitalize">
                    {event.source === 'birthday' ? t('calendar.birthday') :
                        event.source === 'health' ? t(`health.${event.type}`) :
                            t(`calendar.types.${event.type}`)}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 bg-gray-900">
                <View style={{ paddingTop: insets.top + 16 }} className="px-6">
                    <View className="w-full h-[320] rounded-3xl bg-gray-800/50 mb-6" />
                    <View className="h-6 w-32 rounded bg-gray-800/50 mb-4" />
                    <View className="h-20 rounded-2xl bg-gray-800/50 mb-3" />
                    <View className="h-20 rounded-2xl bg-gray-800/50" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Standardized Header */}
            <ScreenHeader
                title={t('calendar.calendar_health_title')}
                rightAction={{
                    icon: 'add',
                    onPress: () => setShowAddOptions(true),
                }}
            />

            {/* Tab Switcher */}
            <View className="px-4 pb-4">
                <View className="flex-row bg-gray-800/50 rounded-2xl p-1">
                    <TouchableOpacity
                        onPress={() => setActiveTab('calendar')}
                        className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'calendar' ? 'bg-indigo-500' : ''}`}
                    >
                        <Text className={`font-semibold ${activeTab === 'calendar' ? 'text-white' : 'text-gray-400'}`}>
                            {t('common.calendar')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('upcoming')}
                        className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'upcoming' ? 'bg-indigo-500' : ''}`}
                    >
                        <Text className={`font-semibold ${activeTab === 'upcoming' ? 'text-white' : 'text-gray-400'}`}>
                            {t('calendar.upcoming_events')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {activeTab === 'calendar' ? (
                    <View>
                        {/* Modern Calendar */}
                        <View className="mx-4 rounded-3xl overflow-hidden bg-gray-800/30 border border-gray-700/30">
                            <Calendar
                                current={selectedDate}
                                onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                                markedDates={markedDates}
                                markingType={'multi-dot'}
                                enableSwipeMonths={true}
                                theme={{
                                    backgroundColor: 'transparent',
                                    calendarBackground: 'transparent',
                                    textSectionTitleColor: '#9ca3af',
                                    selectedDayBackgroundColor: '#6366f1',
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: '#818cf8',
                                    todayBackgroundColor: 'rgba(129, 140, 248, 0.15)',
                                    dayTextColor: '#ffffff',
                                    textDisabledColor: '#4b5563',
                                    dotColor: '#6366f1',
                                    selectedDotColor: '#ffffff',
                                    arrowColor: '#818cf8',
                                    monthTextColor: '#ffffff',
                                    indicatorColor: '#6366f1',
                                    textDayFontWeight: '500',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '600',
                                    textDayFontSize: 15,
                                    textMonthFontSize: 18,
                                    textDayHeaderFontSize: 12
                                }}
                                style={{ paddingBottom: 10 }}
                            />
                        </View>

                        {/* Selected Date Events */}
                        <View className="px-4 pt-6 pb-8">
                            <View className="flex-row items-center mb-4">
                                <View className="w-1 h-6 bg-indigo-500 rounded-full mr-3" />
                                <Text className="text-white text-lg font-bold flex-1">
                                    {selectedDate === format(new Date(), 'yyyy-MM-dd')
                                        ? t('calendar.todays_events')
                                        : format(parseISO(selectedDate), 'MMMM d, yyyy')}
                                </Text>
                                {selectedDateEvents.length > 0 && (
                                    <View className="bg-indigo-500/20 px-3 py-1 rounded-full">
                                        <Text className="text-indigo-400 font-bold text-sm">{selectedDateEvents.length}</Text>
                                    </View>
                                )}
                            </View>

                            {selectedDateEvents.length === 0 ? (
                                <View className="bg-gray-800/30 rounded-2xl p-8 items-center border border-gray-700/30">
                                    <View className="bg-gray-700/30 p-4 rounded-full mb-4">
                                        <Ionicons name="calendar-outline" size={32} color="#6b7280" />
                                    </View>
                                    <Text className="text-gray-400 text-center">{t('calendar.no_events_day')}</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowAddOptions(true)}
                                        className="mt-4 flex-row items-center"
                                    >
                                        <Ionicons name="add-circle" size={20} color="#818cf8" />
                                        <Text className="text-indigo-400 font-semibold ml-2">{t('calendar.add_event')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                selectedDateEvents.map((event: any, index) => (
                                    <EventCard key={`day-${index}`} event={event} />
                                ))
                            )}
                        </View>
                    </View>
                ) : (
                    /* Upcoming Events Tab */
                    <View className="px-4 pb-8">
                        {upcomingEvents.length === 0 ? (
                            <View className="bg-gray-800/30 rounded-2xl p-8 items-center border border-gray-700/30 mt-4">
                                <View className="bg-gray-700/30 p-4 rounded-full mb-4">
                                    <Ionicons name="sparkles" size={32} color="#6b7280" />
                                </View>
                                <Text className="text-white font-semibold text-lg mb-2">{t('calendar.no_upcoming_events')}</Text>
                                <Text className="text-gray-400 text-center mb-4">Schedule your next vet visit or training session</Text>
                                <TouchableOpacity
                                    onPress={() => setShowAddOptions(true)}
                                    className="bg-indigo-500 px-6 py-3 rounded-xl flex-row items-center"
                                >
                                    <Ionicons name="add" size={20} color="white" />
                                    <Text className="text-white font-bold ml-2">{t('calendar.add_event')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            upcomingEvents.map((event: any, index) => (
                                <EventCard key={`upcoming-${index}`} event={event} showDate={true} />
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Event Detail Modal */}
            <Modal visible={showDetailModal} transparent animationType="slide">
                <View className="flex-1 bg-black/70 justify-end">
                    <View
                        className="bg-gray-900 rounded-t-[32px] border-t border-gray-700/50"
                        style={{ paddingBottom: insets.bottom + 20, maxHeight: '70%' }}
                    >
                        {/* Handle bar */}
                        <View className="items-center pt-3 pb-4">
                            <View className="w-10 h-1 bg-gray-600 rounded-full" />
                        </View>

                        {selectedEvent && (
                            <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
                                {/* Event Icon & Type */}
                                <View className="items-center mb-6">
                                    <View
                                        style={{ backgroundColor: getEventBgColor(selectedEvent), width: 72, height: 72, borderRadius: 20 }}
                                        className="items-center justify-center mb-4"
                                    >
                                        <Ionicons name={getEventIcon(selectedEvent)} size={36} color={getEventColor(selectedEvent)} />
                                    </View>
                                    <Text className="text-white text-2xl font-bold text-center mb-1">{selectedEvent.title}</Text>
                                    <Text className="text-gray-400 capitalize">
                                        {selectedEvent.source === 'birthday' ? t('calendar.birthday') :
                                            selectedEvent.source === 'health' ? t(`health.${selectedEvent.type}`) :
                                                t(`calendar.types.${selectedEvent.type}`)}
                                    </Text>
                                </View>

                                {/* Date */}
                                <View className="bg-gray-800/50 rounded-2xl p-4 mb-4 flex-row items-center">
                                    <View className="bg-indigo-500/20 p-3 rounded-xl mr-4">
                                        <Ionicons name="calendar" size={22} color="#818cf8" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-400 text-sm">{t('health.date')}</Text>
                                        <Text className="text-white font-semibold text-base">
                                            {format(parseISO(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Notes */}
                                {selectedEvent.notes && (
                                    <View className="bg-gray-800/50 rounded-2xl p-4 mb-6">
                                        <Text className="text-gray-400 text-sm mb-2">{t('health.notes')}</Text>
                                        <Text className="text-white leading-6">{selectedEvent.notes}</Text>
                                    </View>
                                )}

                                {/* Actions */}
                                <View className="flex-row gap-3 mb-6">
                                    <TouchableOpacity
                                        onPress={() => setShowDetailModal(false)}
                                        className="flex-1 bg-gray-800 p-4 rounded-2xl items-center"
                                    >
                                        <Text className="text-white font-semibold">{t('common.close')}</Text>
                                    </TouchableOpacity>
                                    {(selectedEvent.source === 'calendar' || selectedEvent.source === 'health') && (
                                        <TouchableOpacity
                                            onPress={() => handleDeleteEvent(selectedEvent)}
                                            className="flex-1 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl items-center"
                                        >
                                            <Text className="text-red-400 font-semibold">{t('common.delete')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Add Options Modal */}
            <Modal visible={showAddOptions} transparent animationType="slide">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowAddOptions(false)}
                    className="flex-1 bg-black/70 justify-end"
                >
                    <View
                        className="bg-gray-900 rounded-t-[32px] p-6 border-t border-gray-700/50"
                        style={{ paddingBottom: insets.bottom + 20 }}
                    >
                        {/* Handle bar */}
                        <View className="items-center mb-6">
                            <View className="w-10 h-1 bg-gray-600 rounded-full" />
                        </View>

                        <Text className="text-white text-xl font-bold text-center mb-6">{t('calendar.add_new')}</Text>

                        <TouchableOpacity
                            onPress={() => {
                                setShowAddOptions(false);
                                router.push(`/dog/${id}/add-event`);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-2xl flex-row items-center mb-3"
                            style={{ backgroundColor: '#7c3aed' }}
                        >
                            <View className="bg-white/20 p-3 rounded-xl mr-4">
                                <Ionicons name="calendar" size={26} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-lg">{t('calendar.add_event')}</Text>
                                <Text className="text-white/70 text-sm">{t('calendar.add_event_desc')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setShowAddOptions(false);
                                router.push(`/dog/${id}/add-health`);
                            }}
                            className="p-5 rounded-2xl flex-row items-center border border-gray-700"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        >
                            <View className="bg-red-500/20 p-3 rounded-xl mr-4">
                                <Ionicons name="medical" size={26} color="#f87171" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-lg">{t('health.add_record')}</Text>
                                <Text className="text-gray-400 text-sm">{t('health.add_record_desc')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View >
    );
}
