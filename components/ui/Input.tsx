import React, { forwardRef } from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <View className="mb-4 space-y-2">
                {label && (
                    <Text className="text-gray-400 text-sm font-medium ml-1">
                        {label}
                    </Text>
                )}
                <TextInput
                    ref={ref}
                    className={`h-14 bg-gray-800/50 border border-gray-700 rounded-2xl px-4 text-white text-base focus:border-indigo-500 focus:bg-gray-800 ${className}`}
                    placeholderTextColor="#6B7280"
                    {...props}
                />
                {error && (
                    <Text className="text-red-400 text-xs ml-1">{error}</Text>
                )}
            </View>
        );
    }
);

Input.displayName = "Input";
