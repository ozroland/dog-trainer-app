import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const ACTIVE_WALK_KEY = 'dogtrainer_active_walk';
const PENDING_WALKS_KEY = 'dogtrainer_pending_walks';

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface LocalWalkEvent {
    id: string;
    event_type: 'poop' | 'pee' | 'reaction' | 'sniff' | 'water';
    latitude: number;
    longitude: number;
    timestamp: string;
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface LocalWalk {
    localId: string;
    dogId: string;
    userId: string;
    startTime: string;
    endTime?: string;
    routeCoordinates: Coordinate[];
    events: LocalWalkEvent[];
    durationSeconds: number;
    distanceMeters: number;
    syncStatus: SyncStatus;
    lastSavedAt: string;
    remoteId?: string; // Set after successful sync
}

/**
 * Generate a unique local ID for walks
 */
export function generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save the currently active walk (for auto-save and crash recovery)
 */
export async function saveActiveWalk(walk: LocalWalk): Promise<void> {
    try {
        await AsyncStorage.setItem(ACTIVE_WALK_KEY, JSON.stringify({
            ...walk,
            lastSavedAt: new Date().toISOString(),
        }));
    } catch (error) {
        console.error('[WalkStorage] Failed to save active walk:', error);
        throw error;
    }
}

/**
 * Get the currently active walk (for crash recovery)
 */
export async function getActiveWalk(): Promise<LocalWalk | null> {
    try {
        const data = await AsyncStorage.getItem(ACTIVE_WALK_KEY);
        if (!data) return null;
        return JSON.parse(data) as LocalWalk;
    } catch (error) {
        console.error('[WalkStorage] Failed to get active walk:', error);
        return null;
    }
}

/**
 * Clear the active walk (called when walk is completed and synced)
 */
export async function clearActiveWalk(): Promise<void> {
    try {
        await AsyncStorage.removeItem(ACTIVE_WALK_KEY);
    } catch (error) {
        console.error('[WalkStorage] Failed to clear active walk:', error);
    }
}

/**
 * Get all pending (unsynced) walks
 */
export async function getPendingWalks(): Promise<LocalWalk[]> {
    try {
        const data = await AsyncStorage.getItem(PENDING_WALKS_KEY);
        if (!data) return [];
        return JSON.parse(data) as LocalWalk[];
    } catch (error) {
        console.error('[WalkStorage] Failed to get pending walks:', error);
        return [];
    }
}

/**
 * Add a completed walk to the pending sync queue
 */
export async function addToPendingWalks(walk: LocalWalk): Promise<void> {
    try {
        const pending = await getPendingWalks();
        pending.push({
            ...walk,
            syncStatus: 'pending',
        });
        await AsyncStorage.setItem(PENDING_WALKS_KEY, JSON.stringify(pending));
    } catch (error) {
        console.error('[WalkStorage] Failed to add to pending walks:', error);
        throw error;
    }
}

/**
 * Update sync status of a pending walk
 */
export async function updateWalkSyncStatus(
    localId: string,
    status: SyncStatus,
    remoteId?: string
): Promise<void> {
    try {
        const pending = await getPendingWalks();
        const updated = pending.map(walk =>
            walk.localId === localId
                ? { ...walk, syncStatus: status, remoteId }
                : walk
        );
        await AsyncStorage.setItem(PENDING_WALKS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('[WalkStorage] Failed to update walk sync status:', error);
    }
}

/**
 * Remove successfully synced walks from pending queue
 */
export async function removeSyncedWalks(): Promise<void> {
    try {
        const pending = await getPendingWalks();
        const stillPending = pending.filter(walk => walk.syncStatus !== 'synced');
        await AsyncStorage.setItem(PENDING_WALKS_KEY, JSON.stringify(stillPending));
    } catch (error) {
        console.error('[WalkStorage] Failed to remove synced walks:', error);
    }
}

/**
 * Get count of pending walks (for UI badge)
 */
export async function getPendingWalkCount(): Promise<number> {
    const pending = await getPendingWalks();
    return pending.filter(w => w.syncStatus === 'pending' || w.syncStatus === 'failed').length;
}
