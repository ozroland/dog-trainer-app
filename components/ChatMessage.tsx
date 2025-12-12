import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

interface ChatMessageProps {
    message: string;
    isUser: boolean;
}

export const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
    return (
        <View
            className={`max-w-[80%] p-4 rounded-2xl mb-4 ${isUser
                    ? 'bg-indigo-600 self-end rounded-tr-none'
                    : 'bg-gray-800 self-start rounded-tl-none border border-gray-700'
                }`}
        >
            <Text className="text-white text-base leading-6">{message}</Text>
        </View>
    );
};
