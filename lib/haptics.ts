import * as Haptics from 'expo-haptics';

/**
 * Unified haptic feedback utilities for consistent tactile experience.
 * 
 * Usage:
 * - haptics.light() - subtle feedback (selections, toggles)
 * - haptics.medium() - standard feedback (button taps, confirmations)
 * - haptics.heavy() - strong feedback (clicker, important actions)
 * - haptics.success() - success pattern (achievement, completion)
 * - haptics.warning() - warning pattern (deletion, destructive)
 * - haptics.error() - error pattern (failures)
 */

/**
 * Light impact - for subtle interactions like selections
 */
export async function light() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
        // Haptics may not be available on all devices
    }
}

/**
 * Medium impact - for standard button taps
 */
export async function medium() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) { }
}

/**
 * Heavy impact - for important actions like clicker
 */
export async function heavy() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) { }
}

/**
 * Success notification - for achievements, completions
 */
export async function success() {
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }
}

/**
 * Warning notification - for destructive actions
 */
export async function warning() {
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) { }
}

/**
 * Error notification - for failures
 */
export async function error() {
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) { }
}

/**
 * Selection changed - for pickers, toggles
 */
export async function selection() {
    try {
        await Haptics.selectionAsync();
    } catch (e) { }
}

// Default export for convenient destructuring
const haptics = {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
};

export default haptics;
