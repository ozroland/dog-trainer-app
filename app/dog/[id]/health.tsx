import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from "date-fns";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { Dog, WeightLog, HealthRecord } from "../../../types";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { Skeleton, CardSkeleton } from "../../../components/ui/Skeleton";
import { NoHealthRecordsEmptyState } from "../../../components/EmptyState";

const screenWidth = Dimensions.get("window").width;

export default function HealthScreen() {
    const { id, action } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [dog, setDog] = useState<Dog | null>(null);
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'hu' ? 'hu-HU' : 'en-US';
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchHealthData();
        setRefreshing(false);
    }, [id]);

    // Modal States
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [newWeight, setNewWeight] = useState("");

    // Health Record Modal State - REMOVED (Moved to add-health.tsx)

    // Detail Modal State
    const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Fetch Data
    useFocusEffect(
        useCallback(() => {
            fetchHealthData();
        }, [id])
    );

    useEffect(() => {
        if (action === 'log_weight') {
            setShowWeightModal(true);
        } else if (action === 'add_record') {
            router.push(`/dog/${id}/add-event`);
        }
    }, [action]);

    async function fetchHealthData() {
        try {
            const { data: dogData, error: dogError } = await supabase
                .from("dogs")
                .select("*")
                .eq("id", id)
                .single();

            if (dogError) throw dogError;
            setDog(dogData);

            const { data: weightData, error: weightError } = await supabase
                .from("weight_logs")
                .select("*")
                .eq("dog_id", id)
                .order("date", { ascending: true });

            if (weightError) throw weightError;
            setWeightLogs(weightData || []);

            const { data: healthData, error: healthError } = await supabase
                .from("health_records")
                .select("*")
                .eq("dog_id", id)
                .order("date", { ascending: false });

            if (healthError) throw healthError;
            setHealthRecords(healthData || []);

        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddWeight() {
        if (!newWeight) return;
        try {
            const { error } = await supabase.from("weight_logs").insert({
                dog_id: id,
                weight: parseFloat(newWeight),
                date: new Date().toISOString().split('T')[0]
            });

            if (error) throw error;

            // Update local state
            fetchHealthData();
            setShowWeightModal(false);
            setNewWeight("");

            // Also update the main dog record if it's the latest
            await supabase.from("dogs").update({ weight: parseFloat(newWeight) }).eq("id", id);

        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    }

    // handleAddHealthRecord REMOVED (Moved to add-event.tsx)

    async function handleDeleteHealthRecord(recordId: string) {
        Alert.alert(
            t('health.delete_confirm_title'),
            t('health.delete_confirm_message'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from("health_records")
                                .delete()
                                .eq("id", recordId);

                            if (error) throw error;

                            fetchHealthData();
                            setShowDetailModal(false);
                            setSelectedRecord(null);
                        } catch (error: any) {
                            Alert.alert(t('common.error'), error.message);
                        }
                    }
                }
            ]
        );
    }

    const chartData = {
        labels: weightLogs.length > 0 ? weightLogs.map(l => {
            const date = new Date(l.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }) : ["Now"],
        datasets: [
            {
                data: weightLogs.length > 0 ? weightLogs.map(l => l.weight) : [dog?.weight || 0],
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // Indigo 600
                strokeWidth: 2
            }
        ],
        legend: [t('health.weight_chart_label')]
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-900">
                <View className="px-6" style={{ paddingTop: insets.top + 60 }}>
                    {/* Weight chart skeleton */}
                    <View className="bg-gray-800 p-4 rounded-2xl border border-gray-700 mb-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Skeleton width="50%" height={20} />
                            <Skeleton width={100} height={36} borderRadius={18} />
                        </View>
                        <Skeleton width="100%" height={200} borderRadius={16} />
                    </View>

                    {/* Records section skeleton */}
                    <View className="flex-row justify-between items-center mb-4">
                        <Skeleton width="40%" height={20} />
                        <Skeleton width={120} height={36} borderRadius={18} />
                    </View>
                    <CardSkeleton />
                    <CardSkeleton />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-gray-800 border-b border-gray-700" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-4 h-14">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-gray-700">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-semibold flex-1 text-center mr-14">{t('health.title')}</Text>
                </View>
            </View>

            <ScrollView
                className="flex-1 p-6"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >



                {/* Weight Tracker */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-end mb-4">
                        <Text className="text-white text-xl font-bold">{t('health.weight_tracker')}</Text>
                        <TouchableOpacity onPress={() => setShowWeightModal(true)}>
                            <Text className="text-indigo-400 font-semibold">{t('health.log_weight')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-gray-800 rounded-3xl p-4 shadow-sm overflow-hidden items-center justify-center">
                        {weightLogs.length > 0 ? (
                            <LineChart
                                data={chartData}
                                width={screenWidth - 80} // Adjusted for padding
                                height={220}
                                chartConfig={{
                                    backgroundColor: "#1f2937",
                                    backgroundGradientFrom: "#1f2937",
                                    backgroundGradientTo: "#1f2937",
                                    decimalPlaces: 1,
                                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "6", strokeWidth: "2", stroke: "#4f46e5" }
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                            />
                        ) : (
                            <View className="py-10 items-center">
                                <Ionicons name="stats-chart" size={48} color="#374151" />
                                <Text className="text-gray-400 mt-4 text-center font-semibold">{t('health.no_weight_history')}</Text>
                                <Text className="text-gray-500 text-sm text-center mt-1">{t('health.log_weight_hint')}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Health Records */}
                <View className="mb-20">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-xl font-bold">{t('health.records')}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                router.push(`/dog/${id}/add-event`);
                            }}
                            className="w-8 h-8 bg-gray-800 rounded-full items-center justify-center"
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {healthRecords.length === 0 ? (
                        <NoHealthRecordsEmptyState onAddRecord={() => router.push(`/dog/${id}/add-event`)} />
                    ) : (
                        healthRecords.map(record => (
                            <TouchableOpacity
                                key={record.id}
                                onPress={() => {
                                    setSelectedRecord(record);
                                    setShowDetailModal(true);
                                }}
                                className="bg-gray-800 rounded-2xl p-4 mb-3 flex-row items-center"
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${record.type === 'vaccination' ? 'bg-green-500/20' :
                                    record.type === 'vet_visit' ? 'bg-blue-500/20' : 'bg-orange-500/20'
                                    }`}>
                                    <Ionicons name={
                                        record.type === 'vaccination' ? 'shield-checkmark' :
                                            record.type === 'vet_visit' ? 'medkit' : 'bandage'
                                    } size={20} color={
                                        record.type === 'vaccination' ? '#4ade80' :
                                            record.type === 'vet_visit' ? '#60a5fa' : '#fb923c'
                                    } />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-semibold text-base">{record.title}</Text>
                                    <Text className="text-gray-400 text-sm">{new Date(record.date).toLocaleDateString(dateLocale)}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#4b5563" />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

            </ScrollView>

            {/* Add Weight Modal */}
            <Modal visible={showWeightModal} transparent animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowWeightModal(false)}
                    className="flex-1 bg-black/60 justify-start items-center p-6 pt-48"
                >
                    <View className="bg-gray-800 w-full rounded-3xl p-6">
                        <Text className="text-white text-xl font-bold mb-4">{t('health.log_weight')}</Text>
                        <TextInput
                            className="bg-gray-700 text-white p-4 rounded-xl text-lg mb-6"
                            placeholder={t('health.weight_in_kg')}
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                            value={newWeight}
                            onChangeText={setNewWeight}
                            autoFocus
                        />
                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={() => setShowWeightModal(false)}
                                className="flex-1 bg-gray-700 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-semibold">{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddWeight}
                                className="flex-1 bg-indigo-600 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">{t('common.save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Add Health Record Modal REMOVED */}

            {/* Record Detail Modal */}
            <Modal visible={showDetailModal} transparent animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowDetailModal(false)}
                    className="flex-1 bg-black/60 justify-center items-center p-6"
                >
                    <View className="bg-gray-800 w-full rounded-3xl p-6">
                        {selectedRecord && (
                            <>
                                <View className="flex-row justify-between items-start mb-6">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-white text-2xl font-bold mb-1">{selectedRecord.title}</Text>
                                        <Text className="text-indigo-400 font-semibold capitalize">{t(`health.${selectedRecord.type}`)}</Text>
                                    </View>
                                    <View className="bg-gray-700 px-3 py-1 rounded-lg">
                                        <Text className="text-gray-300 text-sm">{new Date(selectedRecord.date).toLocaleDateString(dateLocale)}</Text>
                                    </View>
                                </View>

                                {selectedRecord.notes ? (
                                    <View className="bg-gray-700/50 p-4 rounded-xl mb-6">
                                        <Text className="text-gray-400 text-sm mb-2 font-medium">{t('health.notes')}</Text>
                                        <Text className="text-white text-base leading-6">{selectedRecord.notes}</Text>
                                    </View>
                                ) : (
                                    <Text className="text-gray-500 italic mb-8">{t('health.no_notes')}</Text>
                                )}

                                <View className="flex-row space-x-4">
                                    <TouchableOpacity
                                        onPress={() => setShowDetailModal(false)}
                                        className="flex-1 bg-gray-700 p-4 rounded-xl items-center"
                                    >
                                        <Text className="text-white font-semibold">{t('common.close')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteHealthRecord(selectedRecord.id)}
                                        className="flex-1 bg-red-500/20 border border-red-500/50 p-4 rounded-xl items-center"
                                    >
                                        <Text className="text-red-400 font-bold">{t('common.delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

        </View >
    );
}
