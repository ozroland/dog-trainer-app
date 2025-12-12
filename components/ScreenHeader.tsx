import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ScreenHeaderProps {
    /** The title displayed in the center */
    title: string;
    /** Show back button (default: true for screens that can go back) */
    showBack?: boolean;
    /** Custom back action (default: router.back()) */
    onBack?: () => void;
    /** Right side action button */
    rightAction?: {
        icon: keyof typeof Ionicons.glyphMap;
        onPress: () => void;
        color?: string;
        backgroundColor?: string;
    };
    /** Additional right side content */
    rightContent?: React.ReactNode;
    /** Whether this is a tab screen (no back button by default) */
    isTabScreen?: boolean;
    /** Custom subtitle under the title */
    subtitle?: string;
    /** Background style variant */
    variant?: 'default' | 'transparent';
    /** Additional styles for the container */
    style?: ViewStyle;
}

/**
 * Standardized screen header component for consistent UI across all screens.
 * 
 * Usage:
 * ```tsx
 * <ScreenHeader title="My Screen" />
 * <ScreenHeader title="Detail" showBack />
 * <ScreenHeader 
 *   title="Add Item" 
 *   rightAction={{ icon: 'checkmark', onPress: handleSave }} 
 * />
 * ```
 */
export function ScreenHeader({
    title,
    showBack = true,
    onBack,
    rightAction,
    rightContent,
    isTabScreen = false,
    subtitle,
    variant = 'default',
    style,
}: ScreenHeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    // Tab screens don't show back button by default
    const shouldShowBack = showBack && !isTabScreen;

    return (
        <View
            style={[{ paddingTop: insets.top }, style]}
            className={`px-4 pb-4 ${variant === 'transparent' ? '' : 'bg-gray-900'}`}
        >
            <View className="flex-row items-center justify-between min-h-[44px]">
                {/* Left side - Back button or spacer */}
                <View className="w-11 items-start">
                    {shouldShowBack ? (
                        <TouchableOpacity
                            onPress={handleBack}
                            className="w-11 h-11 items-center justify-center rounded-full bg-gray-800/80"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Center - Title */}
                <View className="flex-1 items-center px-2">
                    <Text
                        className="text-white text-xl font-bold text-center"
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    {subtitle && (
                        <Text className="text-gray-400 text-sm text-center" numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                {/* Right side - Action button or spacer */}
                <View className="w-11 items-end">
                    {rightAction ? (
                        <TouchableOpacity
                            onPress={rightAction.onPress}
                            className="w-11 h-11 items-center justify-center rounded-full"
                            style={{ backgroundColor: rightAction.backgroundColor || 'rgba(99, 102, 241, 0.8)' }}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={rightAction.icon}
                                size={24}
                                color={rightAction.color || 'white'}
                            />
                        </TouchableOpacity>
                    ) : rightContent ? (
                        rightContent
                    ) : null}
                </View>
            </View>
        </View>
    );
}

/**
 * Tab screen header - centered title with optional icon, no back button
 */
interface TabHeaderProps {
    title: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    subtitle?: string;
    rightAction?: ScreenHeaderProps['rightAction'];
}

export function TabHeader({ title, icon, iconColor = '#fbbf24', subtitle, rightAction }: TabHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View className="px-4" style={{ paddingTop: insets.top + 16 }}>
            <View className="flex-row items-center mb-1">
                {icon && <Ionicons name={icon} size={28} color={iconColor} />}
                <Text className="text-white text-2xl font-bold ml-2">
                    {title}
                </Text>
            </View>
            {subtitle && (
                <Text className="text-gray-400 mb-4">
                    {subtitle}
                </Text>
            )}
        </View>
    );
}

export default ScreenHeader;
