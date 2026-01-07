import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { Logger } from './logger';

/**
 * Check if the device is currently online.
 */
export async function isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
}

/**
 * Execute a function with network error handling.
 * Shows an alert if offline and returns a fallback value.
 */
export async function withNetworkCheck<T>(
    fn: () => Promise<T>,
    fallback: T,
    options?: {
        showAlert?: boolean;
        alertTitle?: string;
        alertMessage?: string;
    }
): Promise<T> {
    const online = await isOnline();

    if (!online) {
        if (options?.showAlert !== false) {
            Alert.alert(
                options?.alertTitle || 'No Connection',
                options?.alertMessage || 'Please check your internet connection and try again.'
            );
        }
        return fallback;
    }

    try {
        return await fn();
    } catch (error) {
        Logger.error('Network', 'Request failed:', error);
        throw error;
    }
}

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries - 1) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                Logger.debug('Network', `Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * Safe Supabase query wrapper with error handling.
 * Returns null on error instead of throwing.
 */
export async function safeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
    try {
        const online = await isOnline();
        if (!online) {
            return { data: null, error: 'No internet connection' };
        }

        const { data, error } = await queryFn();

        if (error) {
            Logger.error('SafeQuery', 'Error:', error);
            return { data: null, error: error.message || 'Database error' };
        }

        return { data, error: null };
    } catch (error) {
        Logger.error('SafeQuery', 'Exception:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
