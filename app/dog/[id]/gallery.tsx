import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, Dimensions, FlatList, ActivityIndicator, Share, Platform, InteractionManager } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { Dog, Photo } from "../../../types";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from "expo-router";
import { checkAndUnlockAchievements } from "../../../lib/achievements";
import { AchievementModal } from "../../../components/AchievementModal";
import { Achievement } from "../../../types";
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import haptics from "../../../lib/haptics";
import { uploadImageToSupabase } from "../../../lib/imageUpload";

const { width, height } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48 - 16) / 3; // 3 columns with padding

// Group photos by month
function groupPhotosByMonth(photos: Photo[]): { month: string; photos: Photo[] }[] {
    const groups: { [key: string]: Photo[] } = {};

    photos.forEach(photo => {
        const date = new Date(photo.taken_at || photo.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groups[monthKey]) {
            groups[monthKey] = [];
        }
        groups[monthKey].push(photo);
    });

    return Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a)) // Newest first
        .map(([key, photos]) => {
            const [year, month] = key.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return { month: monthName, photos };
        });
}

// Image with loading indicator
function LoadingImage({ uri, style, onPress }: { uri: string; style?: any; onPress?: () => void }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <TouchableOpacity onPress={onPress} disabled={!onPress}>
            <View style={style} className="bg-gray-800 rounded-xl overflow-hidden">
                {loading && !error && (
                    <View className="absolute inset-0 items-center justify-center">
                        <ActivityIndicator color="#818cf8" />
                    </View>
                )}
                {error ? (
                    <View className="absolute inset-0 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#6b7280" />
                    </View>
                ) : (
                    <Image
                        source={{ uri }}
                        style={style}
                        className="rounded-xl"
                        onLoadStart={() => setLoading(true)}
                        onLoadEnd={() => setLoading(false)}
                        onError={() => { setError(true); setLoading(false); }}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function GalleryScreen() {
    const { t, i18n } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [dog, setDog] = useState<Dog | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [showUploadOptions, setShowUploadOptions] = useState(false);

    const flatListRef = useRef<FlatList>(null);

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

            const { data: photosData, error: photosError } = await supabase
                .from("photos")
                .select("*")
                .eq("dog_id", id)
                .order("taken_at", { ascending: false });
            if (photosError) throw photosError;
            setPhotos(photosData || []);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert(t('common.error'), message);
        } finally {
            setLoading(false);
        }
    }

    // Store the pending upload action to execute after modal fully closes
    const [pendingUploadAction, setPendingUploadAction] = useState<boolean | null>(null);

    // Effect to handle the actual upload after modal closes
    useEffect(() => {
        if (pendingUploadAction !== null && !showUploadOptions) {
            const useCamera = pendingUploadAction;
            setPendingUploadAction(null);
            // Use InteractionManager to ensure all UI animations are complete before launching picker
            InteractionManager.runAfterInteractions(() => {
                executeUploadPhoto(useCamera);
            });
        }
    }, [pendingUploadAction, showUploadOptions]);

    function handleUploadPhoto(useCamera: boolean) {
        console.log('[Gallery] handleUploadPhoto called, useCamera:', useCamera);
        setShowUploadOptions(false);
        setPendingUploadAction(useCamera);
    }

    async function executeUploadPhoto(useCamera: boolean) {
        console.log('[Gallery] executeUploadPhoto called, useCamera:', useCamera);

        try {
            let result: ImagePicker.ImagePickerResult;
            if (useCamera) {
                console.log('[Gallery] Requesting camera permission...');
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                console.log('[Gallery] Camera permission result:', permission);
                if (!permission.granted) {
                    Alert.alert(t('common.error'), t('gallery.camera_permission'));
                    return;
                }
                console.log('[Gallery] Launching camera...');
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                });
                console.log('[Gallery] Camera result:', JSON.stringify(result, null, 2));
            } else {
                console.log('[Gallery] Requesting media library permission...');
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                console.log('[Gallery] Library permission result:', permission);
                if (!permission.granted) {
                    Alert.alert(t('common.error'), t('gallery.library_permission') || 'Library permission is required.');
                    return;
                }
                console.log('[Gallery] Launching library...');
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                });
                console.log('[Gallery] Library result:', JSON.stringify(result, null, 2));
            }

            console.log('[Gallery] Result canceled?', result.canceled);
            if (!result.canceled && id) {
                setUploading(true);
                haptics.light();
                const photo = result.assets[0];
                console.log('[Gallery] Photo URI:', photo.uri);
                console.log('[Gallery] Photo mimeType:', photo.mimeType);

                const fileExt = photo.uri.split('.').pop() || 'jpg';
                const fileName = `gallery/${id}_${Date.now()}.${fileExt}`;
                console.log('[Gallery] Uploading to fileName:', fileName);

                // Use the proper upload helper
                const { url, error: uploadError } = await uploadImageToSupabase(
                    supabase,
                    'dog_photos',
                    photo.uri,
                    fileName,
                    photo.mimeType
                );
                console.log('[Gallery] Upload result - url:', url, 'error:', uploadError);

                if (uploadError || !url) {
                    throw new Error(uploadError || 'Upload failed');
                }

                console.log('[Gallery] Inserting into photos table...');
                // Save to photos table
                const { error: insertError } = await supabase
                    .from('photos')
                    .insert({
                        dog_id: id,
                        url: url,
                    });

                if (insertError) {
                    console.log('[Gallery] Insert error:', insertError);
                    throw insertError;
                }

                console.log('[Gallery] Success!');
                haptics.success();

                // Check for achievements
                const { newlyUnlocked } = await checkAndUnlockAchievements(id);
                if (newlyUnlocked.length > 0) {
                    setUnlockedAchievement(newlyUnlocked[0]);
                    setShowAchievementModal(true);
                }

                fetchData();
            }
        } catch (error: unknown) {
            console.log('[Gallery] ERROR:', error);
            haptics.error();
            const message = error instanceof Error ? error.message : 'Upload failed';
            Alert.alert(t('common.error'), message);
        } finally {
            setUploading(false);
        }
    }

    async function handleDeletePhoto(photo: Photo) {
        Alert.alert(
            t('gallery.delete_title'),
            t('gallery.delete_confirm'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            haptics.warning();
                            const { error } = await supabase
                                .from('photos')
                                .delete()
                                .eq('id', photo.id);

                            if (error) throw error;

                            setShowDetailModal(false);
                            fetchData();
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : 'Delete failed';
                            Alert.alert(t('common.error'), message);
                        }
                    }
                }
            ]
        );
    }

    async function handleShare() {
        const currentPhoto = photos[selectedPhotoIndex];
        if (!currentPhoto) return;

        try {
            await Share.share({
                message: t('gallery.check_out', { name: dog?.name || '' }),
                url: currentPhoto.url,
            });
        } catch (error) {
            console.log('Share cancelled');
        }
    }

    async function handleSetAsProfilePhoto() {
        const currentPhoto = photos[selectedPhotoIndex];
        if (!currentPhoto || !dog) return;

        Alert.alert(
            t('gallery.set_profile_title'),
            t('gallery.set_profile_confirm', { name: dog.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('dogs')
                                .update({ photo_url: currentPhoto.url })
                                .eq('id', dog.id);

                            if (error) throw error;

                            haptics.success();
                            Alert.alert(t('common.success'), t('gallery.profile_updated'));
                            setShowDetailModal(false);
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : 'Update failed';
                            Alert.alert(t('common.error'), message);
                        }
                    }
                }
            ]
        );
    }

    const groupedPhotos = groupPhotosByMonth(photos);

    // Skeleton loading
    if (loading) {
        return (
            <View className="flex-1 bg-gray-900">
                <View className="bg-gray-800 border-b border-gray-700" style={{ paddingTop: insets.top }}>
                    <View className="flex-row items-center px-4 h-14">
                        <View className="w-10 h-10 rounded-full bg-gray-700" />
                        <View className="flex-1 items-center">
                            <View className="w-24 h-5 rounded bg-gray-700" />
                        </View>
                        <View className="w-10 h-10 rounded-full bg-gray-700" />
                    </View>
                </View>
                <View className="flex-row flex-wrap p-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <View
                            key={i}
                            className="bg-gray-800 rounded-xl m-1"
                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                        />
                    ))}
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
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 items-center justify-center rounded-full bg-gray-700"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="text-white text-lg font-semibold">
                            {t('gallery.title')}
                        </Text>
                        {photos.length > 0 && (
                            <Text className="text-gray-400 text-xs">{photos.length} {t('gallery.photos_count')}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowUploadOptions(true)}
                        disabled={uploading}
                        className="w-10 h-10 items-center justify-center rounded-full bg-indigo-600"
                    >
                        <Ionicons name={uploading ? "hourglass" : "add"} size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {photos.length === 0 ? (
                // Empty State
                <View className="flex-1 items-center justify-center px-8">
                    <View className="bg-pink-500/20 p-6 rounded-full mb-6">
                        <Ionicons name="images" size={64} color="#f472b6" />
                    </View>
                    <Text className="text-white text-2xl font-bold text-center mb-3">
                        {t('gallery.empty_title')}
                    </Text>
                    <Text className="text-gray-400 text-center leading-6 mb-8">
                        {t('gallery.empty_message', { name: dog?.name || '' })}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowUploadOptions(true)}
                        className="bg-indigo-600 px-6 py-4 rounded-2xl flex-row items-center"
                    >
                        <Ionicons name="camera" size={24} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">{t('gallery.add_first')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // Photo Grid grouped by month
                <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
                    {groupedPhotos.map((group) => (
                        <View key={group.month} className="mb-6">
                            <Text className="text-gray-400 font-semibold mb-3">{group.month}</Text>
                            <View className="flex-row flex-wrap">
                                {group.photos.map((photo) => {
                                    const photoIndex = photos.findIndex(p => p.id === photo.id);
                                    return (
                                        <LoadingImage
                                            key={photo.id}
                                            uri={photo.url}
                                            style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, margin: 4 }}
                                            onPress={() => {
                                                setSelectedPhotoIndex(photoIndex);
                                                setShowDetailModal(true);
                                                haptics.light();
                                            }}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Upload Options Modal */}
            <Modal visible={showUploadOptions} transparent animationType="fade">
                <TouchableOpacity
                    className="flex-1 bg-black/70 justify-end"
                    onPress={() => setShowUploadOptions(false)}
                    activeOpacity={1}
                >
                    <View className="bg-gray-800 rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 16 }}>
                        <Text className="text-white text-xl font-bold text-center mb-6">{t('gallery.add_photo')}</Text>

                        <TouchableOpacity
                            onPress={() => handleUploadPhoto(true)}
                            className="bg-indigo-600 p-4 rounded-2xl flex-row items-center mb-3"
                        >
                            <View className="bg-white/20 p-2 rounded-full mr-4">
                                <Ionicons name="camera" size={24} color="white" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-lg">{t('gallery.take_photo')}</Text>
                                <Text className="text-white/70 text-sm">{t('gallery.take_photo_desc')}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleUploadPhoto(false)}
                            className="bg-gray-700 p-4 rounded-2xl flex-row items-center"
                        >
                            <View className="bg-white/20 p-2 rounded-full mr-4">
                                <Ionicons name="images" size={24} color="white" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-lg">{t('gallery.from_library')}</Text>
                                <Text className="text-white/70 text-sm">{t('gallery.from_library_desc')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Photo Detail Modal with Swipe */}
            <Modal visible={showDetailModal} transparent animationType="fade">
                <View className="flex-1 bg-black">
                    {/* Header */}
                    <View
                        className="absolute top-0 left-0 right-0 z-10 flex-row justify-between px-4"
                        style={{ paddingTop: insets.top + 8 }}
                    >
                        <TouchableOpacity
                            onPress={() => setShowDetailModal(false)}
                            className="bg-gray-800/80 p-3 rounded-full"
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <Text className="text-white/60 self-center">
                            {selectedPhotoIndex + 1} / {photos.length}
                        </Text>

                        <TouchableOpacity
                            onPress={handleShare}
                            className="bg-gray-800/80 p-3 rounded-full"
                        >
                            <Ionicons name="share-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Swipeable Photo Viewer */}
                    <FlatList
                        ref={flatListRef}
                        data={photos}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        initialScrollIndex={selectedPhotoIndex}
                        getItemLayout={(data, index) => ({
                            length: width,
                            offset: width * index,
                            index,
                        })}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setSelectedPhotoIndex(index);
                        }}
                        renderItem={({ item: photo }) => (
                            <View style={{ width, height }} className="items-center justify-center">
                                <ReactNativeZoomableView
                                    maxZoom={3}
                                    minZoom={1}
                                    zoomStep={0.5}
                                    initialZoom={1}
                                    bindToBorders={true}
                                    style={{ width: width, height: width }}
                                >
                                    <Image
                                        source={{ uri: photo.url }}
                                        style={{ width: width, height: width }}
                                        resizeMode="contain"
                                    />
                                </ReactNativeZoomableView>
                            </View>
                        )}
                        keyExtractor={(item) => item.id}
                    />

                    {/* Bottom Actions */}
                    <View
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent"
                        style={{ paddingBottom: insets.bottom + 16, paddingTop: 60 }}
                    >
                        {/* Action Buttons */}
                        <View className="flex-row justify-center space-x-4 px-6">
                            <TouchableOpacity
                                onPress={handleSetAsProfilePhoto}
                                className="bg-gray-800/80 px-4 py-3 rounded-xl flex-row items-center"
                            >
                                <Ionicons name="person-circle" size={18} color="white" />
                                <Text className="text-white ml-2">{t('gallery.set_profile')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDeletePhoto(photos[selectedPhotoIndex])}
                                className="bg-red-500/20 px-4 py-3 rounded-xl flex-row items-center"
                            >
                                <Ionicons name="trash" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Achievement Modal */}
            {unlockedAchievement && (
                <AchievementModal
                    visible={showAchievementModal}
                    achievement={unlockedAchievement}
                    onClose={() => {
                        setShowAchievementModal(false);
                        setUnlockedAchievement(null);
                    }}
                />
            )}
        </View>
    );
}
