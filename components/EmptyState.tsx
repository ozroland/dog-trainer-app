import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBgColor?: string;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    // New: emoji illustration option
    emoji?: string;
    accentEmojis?: string[];
}

export function EmptyState({
    icon,
    iconColor = '#6b7280',
    iconBgColor = 'bg-gray-700',
    title,
    message,
    actionLabel,
    onAction,
    emoji,
    accentEmojis,
}: EmptyStateProps) {
    return (
        <View className="bg-gray-800/50 rounded-3xl p-8 items-center border border-gray-700/50">
            {/* Illustration area */}
            <View className="relative mb-6">
                {/* Decorative circles */}
                <View className={`absolute -top-2 -left-2 w-20 h-20 rounded-full ${iconBgColor} opacity-20`} />
                <View className={`absolute -bottom-1 -right-1 w-16 h-16 rounded-full ${iconBgColor} opacity-10`} />

                {/* Main icon/emoji */}
                {emoji ? (
                    <View className={`${iconBgColor} p-4 rounded-full z-10 items-center justify-center`}>
                        <Text className="text-5xl">{emoji}</Text>
                    </View>
                ) : icon ? (
                    <View className={`${iconBgColor} p-5 rounded-full z-10`}>
                        <Ionicons name={icon} size={40} color={iconColor} />
                    </View>
                ) : null}
            </View>

            {/* Accent emojis row */}
            {accentEmojis && accentEmojis.length > 0 && (
                <View className="flex-row items-center gap-3 mb-4">
                    {accentEmojis.map((e, i) => (
                        <Text key={i} className="text-xl">{e}</Text>
                    ))}
                </View>
            )}

            <Text className="text-white text-xl font-bold mb-2 text-center">
                {title}
            </Text>
            <Text className="text-gray-400 text-center leading-6 mb-6">
                {message}
            </Text>

            {actionLabel && onAction && (
                <TouchableOpacity
                    onPress={onAction}
                    className="bg-indigo-600 px-6 py-3 rounded-2xl flex-row items-center"
                >
                    <Ionicons name="add" size={20} color="white" />
                    <Text className="text-white font-bold ml-2">{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// Pre-built empty states for common scenarios
export function NoDogsEmptyState({ onAddDog }: { onAddDog: () => void }) {
    const { t } = useTranslation();
    return (
        <EmptyState
            emoji="🐕"
            iconBgColor="bg-indigo-500/20"
            accentEmojis={['🦴', '🎾', '❤️']}
            title={t('home.no_dogs')}
            message={t('home.add_dog_message')}
            actionLabel={t('home.add_dog_button')}
            onAction={onAddDog}
        />
    );
}

export function NoWalksEmptyState({ onStartWalk }: { onStartWalk?: () => void }) {
    const { t } = useTranslation();
    return (
        <EmptyState
            emoji="🦮"
            iconBgColor="bg-indigo-500/20"
            accentEmojis={['🌳', '🐾', '🌤️']}
            title={t('stats.no_walks_title')}
            message={t('stats.no_walks_message')}
            actionLabel={onStartWalk ? t('home.start_walk') : undefined}
            onAction={onStartWalk}
        />
    );
}

export function NoHealthRecordsEmptyState({ onAddRecord }: { onAddRecord?: () => void }) {
    const { t } = useTranslation();
    return (
        <EmptyState
            emoji="💊"
            iconBgColor="bg-red-500/20"
            accentEmojis={['🩺', '💉', '❤️‍🩹']}
            title={t('health.empty_title')}
            message={t('health.empty_message')}
            actionLabel={onAddRecord ? t('health.add_record') : undefined}
            onAction={onAddRecord}
        />
    );
}

export function NoEventsEmptyState({ onAddEvent }: { onAddEvent?: () => void }) {
    return (
        <EmptyState
            icon="calendar"
            iconColor="#a78bfa"
            iconBgColor="bg-purple-500/20"
            title="No Events"
            message="Add events like training sessions, grooming, or vet visits."
            actionLabel={onAddEvent ? "Add Event" : undefined}
            onAction={onAddEvent}
        />
    );
}

export function NoLessonsEmptyState() {
    return (
        <EmptyState
            icon="book"
            iconColor="#fbbf24"
            iconBgColor="bg-yellow-500/20"
            title="No Lessons Found"
            message="Looks like there are no lessons available. Check back later!"
        />
    );
}
