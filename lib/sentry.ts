import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
    if (!SENTRY_DSN) {
        console.warn('Sentry DSN not configured. Crash reporting disabled.');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,

        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
        // In production, you might want to lower this to 0.1 or 0.2
        tracesSampleRate: __DEV__ ? 1.0 : 0.2,

        // Only send errors in production
        enabled: !__DEV__,

        // Capture unhandled promise rejections
        enableAutoPerformanceTracing: true,

        // Additional configuration
        beforeSend(event) {
            // You can modify or filter events here
            // Return null to drop the event
            return event;
        },
    });
}

// Helper to capture exceptions manually
export function captureException(error: Error, context?: Record<string, any>) {
    if (context) {
        Sentry.setContext('additional', context);
    }
    Sentry.captureException(error);
}

// Helper to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
}

// Helper to set user context
export function setUser(user: { id: string; email?: string } | null) {
    Sentry.setUser(user);
}

// Helper to add breadcrumb for debugging
export function addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
        category,
        message,
        data,
        level: 'info',
    });
}

// Export Sentry for direct access if needed
export { Sentry };
