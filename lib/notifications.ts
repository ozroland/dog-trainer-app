import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { Logger } from './logger';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            Alert.alert('Permission required', 'Failed to get push token for push notification!');
            return;
        }
    }

    return token;
}

/**
 * Calendar trigger type for repeating notifications.
 * Properly typed to avoid `any` usage.
 */
interface CalendarTrigger {
    type: 'calendar';
    repeats: boolean;
    hour: number;
    minute: number;
    weekday?: number; // 1-7, Sunday = 1
    day?: number; // 1-31
}

export async function scheduleReminder(
    title: string,
    body: string,
    hour: number,
    minute: number,
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly' = 'none',
    date?: Date
) {
    try {
        Logger.debug('Notifications', `Scheduling reminder: ${title} at ${hour}:${minute}, recurrence: ${recurrence}`);

        let trigger: CalendarTrigger | Date;

        if (recurrence === 'daily') {
            trigger = {
                type: 'calendar',
                hour,
                minute,
                repeats: true,
            };
        } else if (recurrence === 'weekly') {
            if (!date) throw new Error("Date is required for weekly recurrence");
            // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
            // date.getDay() returns 0 (Sun) - 6 (Sat). Expo expects 1-7.
            const weekday = date.getDay() + 1;
            trigger = {
                type: 'calendar',
                weekday,
                hour,
                minute,
                repeats: true,
            };
        } else if (recurrence === 'monthly') {
            if (!date) throw new Error("Date is required for monthly recurrence");
            const day = date.getDate();
            trigger = {
                type: 'calendar',
                day,
                hour,
                minute,
                repeats: true,
            };
        } else {
            // One-time trigger (Date object)
            const now = new Date();
            const triggerDate = date ? new Date(date) : new Date();
            triggerDate.setHours(hour, minute, 0, 0);

            // If the time is in the past for today (and no specific date provided), schedule for tomorrow
            if (triggerDate <= now && !date) {
                triggerDate.setDate(triggerDate.getDate() + 1);
            }
            trigger = triggerDate;
        }

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            // @ts-expect-error - Expo types don't fully match runtime API for calendar triggers
            trigger,
        });
        Logger.debug('Notifications', `Reminder scheduled with ID: ${identifier}`);
        return identifier;
    } catch (error) {
        Logger.error('Notifications', "Error scheduling notification:", error);
        throw error;
    }
}

export async function cancelReminder(identifier: string) {
    Logger.debug('Notifications', `Cancelling reminder: ${identifier}`);
    await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function getAllReminders() {
    const reminders = await Notifications.getAllScheduledNotificationsAsync();
    Logger.debug('Notifications', `Fetched ${reminders.length} active reminders`);
    return reminders;
}
