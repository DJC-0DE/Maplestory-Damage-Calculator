/**
 * Centralized State Manager for Comparison Items
 *
 * This module manages the state of comparison items for all equipment slots,
 * ensuring proper synchronization and preventing data loss from race conditions.
 *
 * KEY FEATURES:
 * - Per-slot isolation (no data bleeding between slots)
 * - Operation queue (prevents concurrent write conflicts)
 * - Version tracking (detects stale updates)
 * - Automatic persistence to localStorage
 * - Error recovery and validation
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * In-memory state for all comparison items
 * Structure: { slotId: { guid: { guid, version, name, attack, stats } } }
 */
const comparisonState = {};

/**
 * Version counter for detecting concurrent modifications
 */
let stateVersion = 0;

/**
 * Operation queue to serialize async operations
 * Prevents race conditions from concurrent saves
 */
let operationQueue = Promise.resolve();

/**
 * Pending saves that haven't been written to localStorage yet
 * Allows batching and prevents redundant writes
 */
const pendingSaves = new Map(); // slotId -> { timeout, data, version }

// ============================================================================
// CORE STATE OPERATIONS
// ============================================================================

/**
 * Queue an operation to ensure serialized execution
 * @param {Function} operation - Async function to execute
 * @returns {Promise} Result of the operation
 */
function queueOperation(operation) {
    operationQueue = operationQueue.then(operation).catch(error => {
        console.error('[ComparisonState] Operation failed:', error);
        throw error;
    });
    return operationQueue;
}

/**
 * Get current state version
 * @returns {number} Current version
 */
export function getStateVersion() {
    return stateVersion;
}

/**
 * Initialize state for a slot if not exists
 * @param {string} slotId - Equipment slot ID
 */
function ensureSlotState(slotId) {
    if (!comparisonState[slotId]) {
        comparisonState[slotId] = {};
    }
}

/**
 * Get all items for a slot
 * @param {string} slotId - Equipment slot ID
 * @returns {Object} Object mapping GUIDs to item data
 */
export function getSlotItems(slotId) {
    ensureSlotState(slotId);
    return { ...comparisonState[slotId] }; // Return copy to prevent mutation
}

/**
 * Get a specific item
 * @param {string} slotId - Equipment slot ID
 * @param {string} guid - Item GUID
 * @returns {Object|null} Item data or null if not found
 */
export function getItem(slotId, guid) {
    ensureSlotState(slotId);
    const item = comparisonState[slotId][guid];
    return item ? { ...item } : null; // Return copy
}

/**
 * Update or create an item in a slot
 * @param {string} slotId - Equipment slot ID
 * @param {string} guid - Item GUID
 * @param {Object} data - Item data (name, attack, stats)
 * @returns {Promise<boolean>} True if successful
 */
export function updateItem(slotId, guid, data) {
    return queueOperation(async () => {
        try {
            ensureSlotState(slotId);

            const existingItem = comparisonState[slotId][guid];
            const newVersion = Date.now();

            // Create or update item
            comparisonState[slotId][guid] = {
                guid,
                version: newVersion,
                name: data.name || '',
                attack: data.attack || 0,
                stats: data.stats || []
            };

            stateVersion++;

            // Trigger debounced persist
            schedulePersist(slotId);

            console.log(`[ComparisonState] Updated item ${guid} in slot ${slotId} (v${newVersion})`);
            return true;

        } catch (error) {
            console.error(`[ComparisonState] Failed to update item ${guid}:`, error);
            return false;
        }
    });
}

/**
 * Remove an item from a slot
 * @param {string} slotId - Equipment slot ID
 * @param {string} guid - Item GUID
 * @returns {Promise<boolean>} True if successful
 */
export function removeItem(slotId, guid) {
    return queueOperation(async () => {
        try {
            ensureSlotState(slotId);

            if (!comparisonState[slotId][guid]) {
                console.warn(`[ComparisonState] Item ${guid} not found in slot ${slotId}`);
                return false;
            }

            delete comparisonState[slotId][guid];
            stateVersion++;

            // Trigger immediate persist (no debounce for deletions)
            await persistSlot(slotId);

            console.log(`[ComparisonState] Removed item ${guid} from slot ${slotId}`);
            return true;

        } catch (error) {
            console.error(`[ComparisonState] Failed to remove item ${guid}:`, error);
            return false;
        }
    });
}

/**
 * Remove all items from a slot
 * @param {string} slotId - Equipment slot ID
 * @returns {Promise<boolean>} True if successful
 */
export function clearSlot(slotId) {
    return queueOperation(async () => {
        try {
            comparisonState[slotId] = {};
            stateVersion++;

            await persistSlot(slotId);

            console.log(`[ComparisonState] Cleared slot ${slotId}`);
            return true;

        } catch (error) {
            console.error(`[ComparisonState] Failed to clear slot ${slotId}:`, error);
            return false;
        }
    });
}

// ============================================================================
// PERSISTENCE
// ============================================================================

const PERSIST_DEBOUNCE_MS = 500;

/**
 * Schedule a debounced persist for a slot
 * @param {string} slotId - Equipment slot ID
 */
function schedulePersist(slotId) {
    // Clear any existing pending save for this slot
    if (pendingSaves.has(slotId)) {
        clearTimeout(pendingSaves.get(slotId).timeout);
    }

    // Schedule new persist
    const timeout = setTimeout(() => {
        persistSlot(slotId);
        pendingSaves.delete(slotId);
    }, PERSIST_DEBOUNCE_MS);

    // Store the data to be saved (in case state changes before timeout)
    pendingSaves.set(slotId, {
        timeout,
        data: JSON.stringify(getSlotItemsAsArray(slotId)),
        version: stateVersion
    });
}

/**
 * Persist a slot's items to localStorage immediately
 * @param {string} slotId - Equipment slot ID
 * @returns {Promise<boolean>} True if successful
 */
async function persistSlot(slotId) {
    try {
        const items = getSlotItemsAsArray(slotId);
        const storageKey = `comparisonItems.${slotId}`;
        const data = JSON.stringify(items);

        // Validate before writing
        if (data.length > 5 * 1024 * 1024) { // 5MB safety limit
            throw new Error(`Data too large: ${data.length} bytes`);
        }

        localStorage.setItem(storageKey, data);

        console.log(`[ComparisonState] Persisted ${items.length} items for slot ${slotId}`);
        return true;

    } catch (error) {
        console.error(`[ComparisonState] Failed to persist slot ${slotId}:`, error);

        // Show user notification for quota errors
        if (error.name === 'QuotaExceededError') {
            console.error('[ComparisonState] localStorage quota exceeded!');
            // Could trigger UI notification here
        }

        return false;
    }
}

/**
 * Get slot items as array (for localStorage serialization)
 * @param {string} slotId - Equipment slot ID
 * @returns {Array} Array of item objects
 */
function getSlotItemsAsArray(slotId) {
    const items = getSlotItems(slotId);
    return Object.values(items).sort((a, b) => a.version - b.version);
}

/**
 * Load a slot's items from localStorage
 * @param {string} slotId - Equipment slot ID
 * @returns {Promise<Array>} Array of item objects
 */
export async function loadSlot(slotId) {
    try {
        const storageKey = `comparisonItems.${slotId}`;
        const stored = localStorage.getItem(storageKey);

        if (!stored) {
            console.log(`[ComparisonState] No saved data for slot ${slotId}`);
            return [];
        }

        const items = JSON.parse(stored);

        // Validate data structure
        if (!Array.isArray(items)) {
            console.error(`[ComparisonState] Invalid data format for slot ${slotId}`);
            return [];
        }

        // Load into state
        ensureSlotState(slotId);
        items.forEach(item => {
            if (item.guid && typeof item.version === 'number') {
                comparisonState[slotId][item.guid] = {
                    guid: item.guid,
                    version: item.version,
                    name: item.name || '',
                    attack: item.attack || 0,
                    stats: Array.isArray(item.stats) ? item.stats : []
                };
            }
        });

        console.log(`[ComparisonState] Loaded ${items.length} items for slot ${slotId}`);
        return items;

    } catch (error) {
        console.error(`[ComparisonState] Failed to load slot ${slotId}:`, error);
        return [];
    }
}

/**
 * Persist all slots immediately (for page unload, etc.)
 * @returns {Promise<boolean>} True if all successful
 */
export async function persistAll() {
    console.log('[ComparisonState] Persisting all slots...');

    const slotIds = Object.keys(comparisonState);
    const results = await Promise.all(
        slotIds.map(slotId => persistSlot(slotId))
    );

    const success = results.every(r => r === true);
    console.log(`[ComparisonState] Persist all ${success ? 'succeeded' : 'failed'}`);

    return success;
}

// ============================================================================
// MIGRATION & VALIDATION
// ============================================================================

/**
 * Validate and repair corrupted state
 * @param {string} slotId - Equipment slot ID
 * @returns {Object} Validation report
 */
export function validateSlot(slotId) {
    const report = {
        valid: true,
        issues: [],
        repairs: []
    };

    try {
        const items = getSlotItems(slotId);

        Object.entries(items).forEach(([guid, item]) => {
            // Check for required fields
            if (!item.guid) {
                report.valid = false;
                report.issues.push(`Item missing GUID`);
                return;
            }

            if (typeof item.version !== 'number') {
                report.valid = false;
                report.issues.push(`Item ${guid} has invalid version`);
                report.repairs.push(`Repaired version for ${guid}`);
                item.version = Date.now();
            }

            if (!Array.isArray(item.stats)) {
                report.valid = false;
                report.issues.push(`Item ${guid} has invalid stats`);
                report.repairs.push(`Repaired stats for ${guid}`);
                item.stats = [];
            }
        });

        if (report.repairs.length > 0) {
            persistSlot(slotId);
        }

    } catch (error) {
        report.valid = false;
        report.issues.push(`Validation error: ${error.message}`);
    }

    return report;
}

/**
 * Migrate old data format if needed
 * @returns {Promise<boolean>} True if migration succeeded
 */
export async function migrateLegacyData() {
    try {
        // Check for old format keys
        const oldKey = 'comparison-items';
        const legacyData = localStorage.getItem(oldKey);

        if (!legacyData) {
            return true; // Nothing to migrate
        }

        console.log('[ComparisonState] Found legacy data, migrating...');

        const items = JSON.parse(legacyData);

        // Migration strategy: put legacy items in 'head' slot
        // User can reorganize from there
        ensureSlotState('head');

        if (Array.isArray(items)) {
            items.forEach(item => {
                if (item.guid) {
                    comparisonState.head[item.guid] = {
                        guid: item.guid,
                        version: Date.now(),
                        name: item.name || '',
                        attack: item.attack || 0,
                        stats: Array.isArray(item.stats) ? item.stats : []
                    };
                }
            });
        }

        // Persist migrated data
        await persistSlot('head');

        // Backup and remove old key
        localStorage.setItem(`${oldKey}.backup`, legacyData);
        localStorage.removeItem(oldKey);

        console.log('[ComparisonState] Migration complete');

        return true;

    } catch (error) {
        console.error('[ComparisonState] Migration failed:', error);
        return false;
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the comparison state manager
 * Should be called on application startup
 * @returns {Promise<boolean>} True if initialization succeeded
 */
export async function initializeComparisonState() {
    console.log('[ComparisonState] Initializing...');

    try {
        // Run migration if needed
        await migrateLegacyData();

        // Listen for page unload to persist all data
        window.addEventListener('beforeunload', () => {
            persistAll();
        });

        // Listen for visibility change to persist when tab becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                persistAll();
            }
        });

        console.log('[ComparisonState] Initialized successfully');
        return true;

    } catch (error) {
        console.error('[ComparisonState] Initialization failed:', error);
        return false;
    }
}

// ============================================================================
// DEBUGGING EXPORTS
// ============================================================================

if (typeof window !== 'undefined') {
    window.__comparisonStateDebug = {
        getState: () => comparisonState,
        getStateVersion: () => stateVersion,
        getPendingSaves: () => Array.from(pendingSaves.keys()),
        validateSlot: validateSlot,
        persistAll: persistAll
    };
}
