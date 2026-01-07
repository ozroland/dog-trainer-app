import { Audio } from 'expo-av';
import { Logger } from './logger';

// Preloaded sounds cache
let achievementSound: Audio.Sound | null = null;
let clickerSound: Audio.Sound | null = null;
let whistleSound: Audio.Sound | null = null;

/**
 * Preload sounds for instant playback.
 * Call this early in app lifecycle.
 */
export async function preloadSounds() {
    try {
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        });

        // Preload achievement sound (we'll create a placeholder)
        //     require('../assets/sounds/achievement.mp3')
        // )).sound;

        Logger.debug('Sounds', 'Sounds preloaded');
    } catch (error) {
        console.error('[Sounds] Failed to preload sounds:', error);
    }
}

/**
 * Play achievement unlock sound
 * Note: Currently silent - relies on haptics + visual feedback.
 * Replace with proper achievement sound when available.
 */
export async function playAchievementSound() {
    // Intentionally silent for now - the clicker sound is distracting
    // The confetti + haptics provide enough feedback
    Logger.debug('Sounds', 'Achievement unlocked (silent)');
}

/**
 * Play clicker sound (for training tool)
 */
export async function playClickerSound() {
    try {
        const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/dog-clicker.mp3')
        );
        await sound.playAsync();

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (error) {
        Logger.error('Sounds', 'Failed to play clicker sound:', error);
    }
}

/**
 * Play/stop whistle sound
 */
let activeWhistle: Audio.Sound | null = null;

export async function startWhistle(): Promise<Audio.Sound | null> {
    try {
        if (activeWhistle) {
            await activeWhistle.stopAsync();
            await activeWhistle.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/dog-whistle.mp3'),
            { isLooping: true }
        );
        activeWhistle = sound;
        await sound.playAsync();
        return sound;
    } catch (error) {
        Logger.error('Sounds', 'Failed to start whistle:', error);
        return null;
    }
}

export async function stopWhistle() {
    try {
        if (activeWhistle) {
            await activeWhistle.stopAsync();
            await activeWhistle.unloadAsync();
            activeWhistle = null;
        }
    } catch (error) {
        Logger.error('Sounds', 'Failed to stop whistle:', error);
    }
}

/**
 * Play a success/completion sound
 */
export async function playSuccessSound() {
    // Reuse clicker for now - replace with proper sound later
    await playClickerSound();
}
