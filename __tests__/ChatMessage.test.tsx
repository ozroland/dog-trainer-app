import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatMessage } from '../components/ChatMessage';

describe('ChatMessage', () => {
    it('renders user message correctly', () => {
        const { getByText } = render(
            <ChatMessage message="Hello AI" isUser={true} />
        );
        expect(getByText('Hello AI')).toBeTruthy();
    });

    it('renders AI message correctly', () => {
        const { getByText } = render(
            <ChatMessage message="Hello Human" isUser={false} />
        );
        expect(getByText('Hello Human')).toBeTruthy();
    });
});
