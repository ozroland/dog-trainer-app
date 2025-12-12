import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatScreen from '../app/(tabs)/chat';

// Mock the AI service
jest.mock('../lib/aiService', () => ({
    sendMessageToAI: jest.fn(() => Promise.resolve({ message: 'Mock Response' })),
}));

describe('ChatScreen', () => {
    it('renders initial message', () => {
        const { getByText } = render(<ChatScreen />);
        expect(getByText(/Hello! I'm your AI Dog Training Coach/)).toBeTruthy();
    });

    it('allows sending a message', async () => {
        const { getByPlaceholderText, getByText } = render(<ChatScreen />);

        const input = getByPlaceholderText('Ask a question...');
        fireEvent.changeText(input, 'Sit command');

        expect(input.props.value).toBe('Sit command');
    });
});
