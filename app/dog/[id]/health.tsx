import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Dog, WeightLog, HealthRecord } from "../../../types";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function HealthScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [dog, setDog] = useState<Dog | null>(null);
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [newWeight, setNewWeight] = useState("");

    const [showHealthModal, setShowHealthModal] = useState(false);
    const [recordType, setRecordType] = useState<'vaccination' | 'vet_visit' | 'medication'>('vet_visit');
    const [recordTitle, setRecordTitle] = useState("");
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
    const [recordNotes, setRecordNotes] = useState("");

    // Fetch Data
    useEffect(() => {
        fetchHealthData();
    }, [id]);

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
            Alert.alert("Error", error.message);
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

    async function handleAddHealthRecord() {
        if (!recordTitle) {
            Alert.alert("Error", "Please enter a title");
            return;
        }
        try {
            const { error } = await supabase.from("health_records").insert({
                dog_id: id,
                type: recordType,
                title: recordTitle,
                date: recordDate,
                notes: recordNotes
            });

            if (error) throw error;

            fetchHealthData();
            setShowHealthModal(false);
            setRecordTitle("");
            setRecordNotes("");
            setRecordDate(new Date().toISOString().split('T')[0]);
            setRecordType('vet_visit');

        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
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
        legend: ["Weight (kg)"]
    };

    if (loading) {
        return <View className="flex-1 bg-gray-900 items-center justify-center"><Text className="text-white">Loading...</Text></View>;
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
                    <Text className="text-white text-lg font-semibold flex-1 text-center mr-14">Health & Wellness</Text>
                </View>
            </View>

            <ScrollView className="flex-1 p-6">

                {/* Dog ID Card Button */}
                <TouchableOpacity
                    className="bg-indigo-600 rounded-2xl p-4 flex-row items-center justify-between mb-8 shadow-lg shadow-indigo-900/20"
                    onPress={() => Alert.alert("Coming Soon", "Sitter Mode / Dog ID Card will be implemented next!")}
                >
                    <View className="flex-row items-center space-x-4">
                        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                            <Ionicons name="id-card-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text className="text-white font-bold text-lg">Sitter Mode</Text>
                            <Text className="text-indigo-200 text-sm">Generate Boarding Pass</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>

                {/* Weight Tracker */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-end mb-4">
                        <Text className="text-white text-xl font-bold">Weight Tracker</Text>
                        <TouchableOpacity onPress={() => setShowWeightModal(true)}>
                            <Text className="text-indigo-400 font-semibold">Log Weight</Text>
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
                                <Text className="text-gray-400 mt-4 text-center font-semibold">No weight history yet</Text>
                                <Text className="text-gray-500 text-sm text-center mt-1">Log your dog's weight to see the chart</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Health Records */}
                <View className="mb-20">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-xl font-bold">Health Records</Text>
                        <TouchableOpacity
                            onPress={() => setShowHealthModal(true)}
                            className="w-8 h-8 bg-gray-800 rounded-full items-center justify-center"
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {healthRecords.length === 0 ? (
                        <View className="bg-gray-800 rounded-2xl p-6 items-center">
                            <Ionicons name="medical-outline" size={48} color="#4b5563" />
                            <Text className="text-gray-400 mt-2">No records yet</Text>
                        </View>
                    ) : (
                        healthRecords.map(record => (
                            <View key={record.id} className="bg-gray-800 rounded-2xl p-4 mb-3 flex-row items-center">
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
                                    <Text className="text-gray-400 text-sm">{new Date(record.date).toLocaleDateString()}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Add Weight Modal */}
            <Modal visible={showWeightModal} transparent animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowWeightModal(false)}
                    className="flex-1 bg-black/60 justify-center items-center p-6"
                >
                    <View className="bg-gray-800 w-full rounded-3xl p-6">
                        <Text className="text-white text-xl font-bold mb-4">Log Weight</Text>
                        <TextInput
                            className="bg-gray-700 text-white p-4 rounded-xl text-lg mb-6"
                            placeholder="Weight in kg"
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
                                <Text className="text-white font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddWeight}
                                className="flex-1 bg-indigo-600 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Add Health Record Modal */}
            <Modal visible={showHealthModal} transparent animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowHealthModal(false)}
                    className="flex-1 bg-black/60 justify-center items-center p-6"
                >
                    <View className="bg-gray-800 w-full rounded-3xl p-6">
                        <Text className="text-white text-xl font-bold mb-4">Add Health Record</Text>

                        {/* Type Selection */}
                        <View className="flex-row mb-4 space-x-2">
                            {(['vaccination', 'vet_visit', 'medication'] as const).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setRecordType(type)}
                                    className={`flex-1 p-2 rounded-lg items-center border ${recordType === type
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-gray-700 border-gray-600'
                                        }`}
                                >
                                    <Text className={`text-xs font-bold capitalize ${recordType === type ? 'text-white' : 'text-gray-400'
                                        }`}>
                                        {type.replace('_', ' ')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            className="bg-gray-700 text-white p-4 rounded-xl text-base mb-3"
                            placeholder="Title (e.g. Rabies Vaccine)"
                            placeholderTextColor="#9ca3af"
                            value={recordTitle}
                            onChangeText={setRecordTitle}
                        />

                        <TextInput
                            className="bg-gray-700 text-white p-4 rounded-xl text-base mb-3"
                            placeholder="Date (YYYY-MM-DD)"
                            placeholderTextColor="#9ca3af"
                            value={recordDate}
                            onChangeText={setRecordDate}
                        />

                        <TextInput
                            className="bg-gray-700 text-white p-4 rounded-xl text-base mb-6 h-24"
                            placeholder="Notes (optional)"
                            placeholderTextColor="#9ca3af"
                            multiline
                            textAlignVertical="top"
                            value={recordNotes}
                            onChangeText={setRecordNotes}
                        />

                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={() => setShowHealthModal(false)}
                                className="flex-1 bg-gray-700 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddHealthRecord}
                                className="flex-1 bg-indigo-600 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

        </View>
    );
}
