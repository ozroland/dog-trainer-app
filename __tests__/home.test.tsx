import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import Home from '../app/(tabs)/index';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn(),
            insert: jest.fn().mockReturnThis(),
        })),
        auth: {
            getUser: jest.fn(),
        },
        storage: {
            from: jest.fn(() => ({
                upload: jest.fn(),
                getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://test.com/image.jpg' } }),
            })),
        }
    },
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
    useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock Expo Image Picker
jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    launchImageLibraryAsync: jest.fn(),
}));

// Mock Expo AV
jest.mock('expo-av', () => ({
    Audio: {
        Sound: {
            createAsync: jest.fn().mockResolvedValue({ sound: { playAsync: jest.fn(), unloadAsync: jest.fn() } }),
        },
    },
}));

describe('Home Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly and fetches dogs', async () => {
        // Mock user
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user123' } } });

        // Mock dogs response
        const mockDogs = [
            { id: 'dog1', name: 'Buddy', breed: 'Golden Retriever', owner_id: 'user123', image_url: null }
        ];

        // Setup chain for fetching dogs
        const mockSelect = jest.fn().mockReturnThis();
        const mockEq = jest.fn().mockReturnThis();
        const mockOrder = jest.fn().mockResolvedValue({ data: mockDogs, error: null });

        (supabase.from as jest.Mock).mockImplementation((table) => {
            if (table === 'dogs') {
                return {
                    select: mockSelect,
                    eq: mockEq,
                    order: mockOrder,
                };
            }
            if (table === 'daily_lessons') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }
            }
            if (table === 'progress') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    gte: jest.fn().mockReturnThis(),
                    lte: jest.fn().mockResolvedValue({ data: [], error: null }),
                }
            }
            return {
                select: jest.fn().mockReturnThis(),
            };
        });

        const { getByText } = render(<Home />);

        await waitFor(() => {
            expect(getByText('Buddy')).toBeTruthy();
        });
    });

    it('shows loading state initially', () => {
        // Mock user to prevent immediate resolution issues if any
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user123' } } });

        const { getByText } = render(<Home />);
        // Assuming you might add a testID to the loader, or check for "Good Morning" text if it renders early
        // For now, just checking it doesn't crash is a good start, or checking for specific static text
        // But Home shows "Good Morning" immediately.
        // Let's check for "Quick Actions" which is static
        expect(getByText('Loading...')).toBeTruthy();
    });
});
