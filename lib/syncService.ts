import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { Logger } from './logger';
import {
    LocalWalk,
    getPendingWalks,
    updateWalkSyncStatus,
    removeSyncedWalks,
    clearActiveWalk
} from './walkStorage';

let isSyncing = false;

/**
 * Sync a single walk to Supabase
 */
async function syncWalk(walk: LocalWalk): Promise<boolean> {
    try {
        // Mark as syncing
        await updateWalkSyncStatus(walk.localId, 'syncing');

        // Insert walk
        const { data, error } = await supabase
            .from('walks')
            .insert({
                user_id: walk.userId,
                dog_id: walk.dogId,
                start_time: walk.startTime,
                end_time: walk.endTime,
                duration_seconds: walk.durationSeconds,
                distance_meters: walk.distanceMeters,
                route_coordinates: walk.routeCoordinates,
            })
            .select()
            .single();

        if (error) throw error;

        // Insert walk events
        if (walk.events.length > 0) {
            const { error: eventsError } = await supabase
                .from('walk_events')
                .insert(walk.events.map(event => ({
                    walk_id: data.id,
                    event_type: event.event_type,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    timestamp: event.timestamp,
                })));

            if (eventsError) {
                console.warn('[SyncService] Failed to sync walk events:', eventsError);
                // Don't fail the whole sync for events
            }
        }

        // Mark as synced
        await updateWalkSyncStatus(walk.localId, 'synced', data.id);
        Logger.debug('SyncService', `Walk ${walk.localId} synced successfully as ${data.id}`);
        return true;

    } catch (error) {
        console.error(`[SyncService] Failed to sync walk ${walk.localId}:`, error);
        await updateWalkSyncStatus(walk.localId, 'failed');
        return false;
    }
}

/**
 * Sync all pending walks to Supabase
 */
export async function syncPendingWalks(): Promise<{ synced: number; failed: number }> {
    if (isSyncing) {
        Logger.debug('SyncService', 'Sync already in progress, skipping');
        return { synced: 0, failed: 0 };
    }

    // Check network connectivity
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
        Logger.debug('SyncService', 'No network connection, skipping sync');
        return { synced: 0, failed: 0 };
    }

    isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
        const pending = await getPendingWalks();
        const toSync = pending.filter(w => w.syncStatus === 'pending' || w.syncStatus === 'failed');

        Logger.debug('SyncService', `Syncing ${toSync.length} pending walks...`);

        for (const walk of toSync) {
            const success = await syncWalk(walk);
            if (success) {
                synced++;
            } else {
                failed++;
            }
        }

        // Clean up synced walks
        await removeSyncedWalks();

    } catch (error) {
        console.error('[SyncService] Sync failed:', error);
    } finally {
        isSyncing = false;
    }

    Logger.debug('SyncService', `Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
}

/**
 * Complete a walk: save locally first, then attempt sync
 * Returns the remote walk ID if synced, or null if saved locally only
 */
export async function completeWalk(walk: LocalWalk): Promise<string | null> {
    try {
        // Check network
        const netState = await NetInfo.fetch();

        if (netState.isConnected) {
            // Try to sync immediately
            const { data, error } = await supabase
                .from('walks')
                .insert({
                    user_id: walk.userId,
                    dog_id: walk.dogId,
                    start_time: walk.startTime,
                    end_time: walk.endTime,
                    duration_seconds: walk.durationSeconds,
                    distance_meters: walk.distanceMeters,
                    route_coordinates: walk.routeCoordinates,
                })
                .select()
                .single();

            if (!error && data) {
                // Sync events
                if (walk.events.length > 0) {
                    await supabase.from('walk_events').insert(
                        walk.events.map(event => ({
                            walk_id: data.id,
                            event_type: event.event_type,
                            latitude: event.latitude,
                            longitude: event.longitude,
                            timestamp: event.timestamp,
                        }))
                    );
                }

                // Clear active walk after successful sync
                await clearActiveWalk();
                Logger.debug('SyncService', `Walk synced immediately: ${data.id}`);
                return data.id;
            }
        }

        // If we get here, either offline or sync failed - save to pending queue
        Logger.debug('SyncService', 'Saving walk to pending queue for later sync');
        const { addToPendingWalks } = await import('./walkStorage');
        await addToPendingWalks({
            ...walk,
            syncStatus: 'pending',
        });
        await clearActiveWalk();

        return null;

    } catch (error) {
        console.error('[SyncService] Error completing walk:', error);
        // Save to pending as fallback
        const { addToPendingWalks } = await import('./walkStorage');
        await addToPendingWalks({
            ...walk,
            syncStatus: 'pending',
        });
        await clearActiveWalk();
        return null;
    }
}

/**
 * Subscribe to network changes and trigger sync when online
 */
export function startNetworkListener(): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
        if (state.isConnected) {
            Logger.debug('SyncService', 'Network connected, triggering sync');
            syncPendingWalks();
        }
    });

    return unsubscribe;
}
