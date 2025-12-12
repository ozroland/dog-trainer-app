import * as Haptics from 'expo-haptics';

/**
 * Enhanced haptic patterns for specific interactions.
 * More immersive than simple haptic calls.
 */

/**
 * Clicker pattern - sharp, satisfying click
 */
export async function clickerPattern() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        // Double tap feeling
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 50);
    } catch (e) { }
}

/**
 * Whistle start pattern - ascending feel
 */
export async function whistleStartPattern() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 80);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 160);
    } catch (e) { }
}

/**
 * Whistle stop pattern - descending feel
 */
export async function whistleStopPattern() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 80);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 160);
    } catch (e) { }
}

/**
 * Achievement unlock pattern - celebration feel
 */
export async function achievementPattern() {
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Extra flourish
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 200);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 300);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 400);
    } catch (e) { }
}

/**
 * Streak milestone pattern - epic celebration
 */
export async function streakMilestonePattern() {
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Triple tap celebration
        for (let i = 0; i < 3; i++) {
            setTimeout(async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 200 + i * 150);
        }
    } catch (e) { }
}

/**
 * Walk event pattern (poop, pee, etc) - quick confirmation
 */
export async function walkEventPattern() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(async () => {
            await Haptics.selectionAsync();
        }, 60);
    } catch (e) { }
}

/**
 * Photo capture pattern
 */
export async function photoCapturePattern() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 100);
    } catch (e) { }
}

/**
 * Navigation/page change - subtle
 */
export async function navigationPattern() {
    try {
        await Haptics.selectionAsync();
    } catch (e) { }
}

/**
 * Error/warning pattern
 */
export async function errorPattern() {
    try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) { }
}

/**
 * Heartbeat pattern - for emotional moments
 */
export async function heartbeatPattern() {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
        // Pause
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 400);
        setTimeout(async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 500);
    } catch (e) { }
}
