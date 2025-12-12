import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Sentry from '@sentry/react-native';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    screenName?: string; // Optional screen name for better error reporting
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component for catching React errors.
 * Use this to wrap screens or components that might fail.
 * 
 * Usage:
 * <ErrorBoundary screenName="WalkScreen">
 *   <ActiveWalkScreen />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to Sentry with screen context
        Sentry.captureException(error, {
            extra: {
                componentStack: errorInfo.componentStack,
                screenName: this.props.screenName || 'Unknown',
            },
        });
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View className="flex-1 bg-gray-900 items-center justify-center p-8">
                    <View className="bg-red-500/20 p-6 rounded-full mb-6">
                        <Ionicons name="warning" size={64} color="#f87171" />
                    </View>

                    <Text className="text-white text-2xl font-bold text-center mb-3">
                        Oops! Something went wrong
                    </Text>

                    <Text className="text-gray-400 text-center leading-6 mb-8">
                        We're sorry, but something unexpected happened. Please try again.
                    </Text>

                    <TouchableOpacity
                        onPress={this.handleRetry}
                        className="bg-indigo-600 px-8 py-4 rounded-2xl"
                    >
                        <Text className="text-white font-bold text-lg">Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap any screen with error boundary.
 * 
 * Usage:
 * export default withErrorBoundary(MyScreen, 'MyScreen');
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    screenName: string
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary screenName={screenName}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}

/**
 * Inline error fallback for smaller components (not full screen).
 * Use when you don't want to show a full-screen error.
 */
export function InlineErrorFallback({
    message = "Something went wrong",
    onRetry
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <View className="bg-gray-800 p-4 rounded-xl border border-red-500/30 items-center">
            <Ionicons name="alert-circle" size={24} color="#f87171" />
            <Text className="text-gray-300 text-sm mt-2 text-center">{message}</Text>
            {onRetry && (
                <TouchableOpacity
                    onPress={onRetry}
                    className="mt-3 bg-gray-700 px-4 py-2 rounded-lg"
                >
                    <Text className="text-white text-sm">Retry</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
