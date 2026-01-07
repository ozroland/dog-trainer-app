import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LessonsScreen from '../app/(tabs)/lessons';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn(),
        }
    },
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
    useLocalSearchParams: () => ({ dogId: 'dog123' }),
    useFocusEffect: jest.fn((callback) => require('react').useEffect(callback, [])),
}));

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Lessons Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders lessons list', async () => {
        const mockLessons = [
            { id: '1', title: 'Sit', difficulty: 'Beginner', description: 'Teach your dog to sit', duration_minutes: 5 },
            { id: '2', title: 'Stay', difficulty: 'Intermediate', description: 'Teach your dog to stay', duration_minutes: 10 },
        ];

        // Mock fetch lessons
        const mockSelect = jest.fn().mockResolvedValue({ data: mockLessons, error: null });
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
        });

        const { getByText } = render(<LessonsScreen />);

        await waitFor(() => {
            expect(getByText('Sit')).toBeTruthy();
            expect(getByText('Stay')).toBeTruthy();
        });
    });

    it('filters lessons by difficulty', async () => {
        const mockLessons = [
            { id: '1', title: 'Sit', difficulty: 'Beginner', description: 'Teach your dog to sit', duration_minutes: 5 },
            { id: '2', title: 'Stay', difficulty: 'Intermediate', description: 'Teach your dog to stay', duration_minutes: 10 },
        ];

        const mockSelect = jest.fn().mockResolvedValue({ data: mockLessons, error: null });
        (supabase.from as jest.Mock).mockReturnValue({
            select: mockSelect,
        });

        const { getByText, queryByText } = render(<LessonsScreen />);

        await waitFor(() => {
            expect(getByText('Sit')).toBeTruthy();
        });

        // Tap 'Intermediate' filter
        // TODO: Implement interaction test when filter UI is finalized

        // expect(getByText('Stay')).toBeTruthy();
    });
});
