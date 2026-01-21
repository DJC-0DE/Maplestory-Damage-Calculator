/**
 * Centralized store for loadout data
 * Handles loading, saving, and migrating loadout configuration
 *
 * DATA FLOW:
 * 1. User changes DOM input
 * 2. Event listener fires UI handler
 * 3. UI handler calls loadoutStore.updateX()
 * 4. Store updates memory + saves to localStorage (dual-write)
 */

import type {
    LoadoutData,
    MasteryTier,
    MasteryType,
    LegacyDamageCalculatorData
} from '@ts/types/loadout';
import { DEFAULT_LOADOUT_DATA } from '@ts/types/loadout';
import type { ContentType } from '@ts/types/constants';

export class LoadoutStore {
    private data: LoadoutData;
    private isInitialized: boolean = false;

    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================

    constructor() {
        // Initialize with empty data - will be populated by initialize()
        this.data = JSON.parse(JSON.stringify(DEFAULT_LOADOUT_DATA));
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Initialize store - loads from localStorage, handles migration
     * Call this at the top of loadout-page init
     *
     * @returns Promise that resolves when initialization is complete
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('LoadoutStore already initialized');
            return;
        }

        // 1. Try loading from new 'loadout-data' key
        const newData = localStorage.getItem('loadout-data');

        if (newData) {
            try {
                this.data = JSON.parse(newData);
                console.log('LoadoutStore: Loaded from new format (loadout-data)');
            } catch (e) {
                console.error('LoadoutStore: Failed to parse loadout-data, falling back to migration', e);
                this.migrateFromLegacy();
            }
        } else {
            // 2. If new key doesn't exist, migrate from old keys
            this.migrateFromLegacy();
        }

        // 3. Validate and fill in missing fields with defaults
        this.validateAndFillDefaults();

        this.isInitialized = true;
        console.log('LoadoutStore: Initialization complete', this.data);
    }

    /**
     * Migrate data from legacy localStorage keys to new format
     */
    private migrateFromLegacy(): void {
        console.log('LoadoutStore: Migrating from legacy format...');

        const legacyDataStr = localStorage.getItem('damageCalculatorData');
        const selectedClass = localStorage.getItem('selectedClass');
        const selectedJobTier = localStorage.getItem('selectedJobTier');

        if (!legacyDataStr && !selectedClass && !selectedJobTier) {
            console.log('LoadoutStore: No legacy data found, using defaults');
            return;
        }

        const legacy: Partial<LegacyDamageCalculatorData> = legacyDataStr
            ? JSON.parse(legacyDataStr)
            : {};

        // Migrate baseStats
        if (legacy.baseSetup) {
            Object.entries(legacy.baseSetup).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    this.data.baseStats[key] = value;
                } else if (typeof value === 'string') {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                        this.data.baseStats[key] = parsed;
                    }
                }
            });
        }

        // Migrate weapons
        if (legacy.weapons) {
            Object.entries(legacy.weapons).forEach(([key, weapon]) => {
                this.data.weapons[key] = {
                    level: typeof weapon.level === 'number' ? weapon.level : parseInt(weapon.level) || 0,
                    stars: typeof weapon.stars === 'number' ? weapon.stars : parseInt(weapon.stars) || 0,
                    equipped: weapon.equipped || false
                };
            });
        }

        // Migrate mastery bonuses
        if (legacy.masteryBonuses) {
            const tiers: MasteryTier[] = ['3rd', '4th'];
            const types: MasteryType[] = ['all', 'boss'];

            tiers.forEach(tier => {
                types.forEach(type => {
                    const tierData = legacy.masteryBonuses![tier];
                    if (tierData && tierData[type]) {
                        this.data.mastery[tier][type] = { ...tierData[type] };
                    }
                });
            });
        }

        // Migrate target selection
        if (legacy.contentType) {
            this.data.target.contentType = legacy.contentType as ContentType;
        }
        if (legacy.subcategory) {
            this.data.target.subcategory = legacy.subcategory;
        }
        if (legacy.selectedStage) {
            this.data.target.selectedStage = legacy.selectedStage;
        }

        // Migrate character data from separate keys
        if (selectedClass) {
            this.data.character.class = selectedClass;
        }
        if (selectedJobTier) {
            this.data.character.jobTier = selectedJobTier as '3rd' | '4th';
        }

        console.log('LoadoutStore: Migration complete, saving to new format...');
        this.saveDualWrite();
    }

    /**
     * Validate data structure and fill missing fields with defaults
     */
    private validateAndFillDefaults(): void {
        const defaults = DEFAULT_LOADOUT_DATA;

        // Ensure baseStats exists
        if (!this.data.baseStats) {
            this.data.baseStats = {};
        }

        // Ensure character fields exist
        if (!this.data.character) {
            this.data.character = { ...defaults.character };
        }
        if (typeof this.data.character.level !== 'number') {
            this.data.character.level = defaults.character.level;
        }
        if (this.data.character.class === undefined) {
            this.data.character.class = defaults.character.class;
        }
        if (!this.data.character.jobTier || !['3rd', '4th'].includes(this.data.character.jobTier)) {
            this.data.character.jobTier = defaults.character.jobTier;
        }

        // Ensure weapons exists
        if (!this.data.weapons) {
            this.data.weapons = {};
        }

        // Ensure mastery structure exists
        if (!this.data.mastery) {
            this.data.mastery = { ...defaults.mastery };
        }
        (['3rd', '4th'] as MasteryTier[]).forEach(tier => {
            if (!this.data.mastery[tier]) {
                this.data.mastery[tier] = { all: {}, boss: {} };
            }
            (['all', 'boss'] as MasteryType[]).forEach(type => {
                if (!this.data.mastery[tier][type]) {
                    this.data.mastery[tier][type] = {};
                }
            });
        });

        // Ensure target exists
        if (!this.data.target) {
            this.data.target = { ...defaults.target };
        }
        if (!this.data.target.contentType) {
            this.data.target.contentType = 'none';
        }

        // Ensure weaponAttackBonus exists
        if (!this.data.weaponAttackBonus) {
            this.data.weaponAttackBonus = { ...defaults.weaponAttackBonus };
        }
        if (typeof this.data.weaponAttackBonus.totalAttack !== 'number') {
            this.data.weaponAttackBonus.totalAttack = defaults.weaponAttackBonus.totalAttack;
        }
        if (typeof this.data.weaponAttackBonus.equippedAttack !== 'number') {
            this.data.weaponAttackBonus.equippedAttack = defaults.weaponAttackBonus.equippedAttack;
        }
    }

    // ========================================================================
    // GETTERS - Return pre-hydrated data with safe defaults
    // ========================================================================

    /**
     * Get all base stats as key-value object
     * @returns Record of stat key → value (0 if not set)
     */
    getBaseStats(): Record<string, number> {
        return { ...this.data.baseStats };
    }

    /**
     * Get a single base stat value
     * @param key - Stat key (e.g., "attack-base", "crit-rate-base")
     * @returns Stat value (0 if not set)
     */
    getBaseStat(key: string): number {
        return this.data.baseStats[key] ?? 0;
    }

    /**
     * Get all weapons data
     * @returns Weapons object indexed by rarity-tier key
     */
    getWeapons(): LoadoutData['weapons'] {
        return { ...this.data.weapons };
    }

    /**
     * Get single weapon data
     * @param key - Weapon key (e.g., "legendary-t4")
     * @returns Weapon data or null if not found
     */
    getWeapon(key: string): LoadoutData['weapons'][string] | null {
        return this.data.weapons[key] ? { ...this.data.weapons[key] } : null;
    }

    /**
     * Get mastery bonuses
     * @returns Complete mastery bonus object
     */
    getMastery(): LoadoutData['mastery'] {
        return JSON.parse(JSON.stringify(this.data.mastery));
    }

    /**
     * Get specific mastery checkbox state
     * @param tier - Mastery tier ('3rd' or '4th')
     * @param type - Mastery type ('all' or 'boss')
     * @param level - Mastery level (e.g., '64', '124')
     * @returns Checkbox state (false if not set)
     */
    getMasteryCheckbox(tier: MasteryTier, type: MasteryType, level: string): boolean {
        return this.data.mastery[tier][type][level] ?? false;
    }

    /**
     * Get target selection
     * @returns Target selection object
     */
    getTarget(): LoadoutData['target'] {
        return { ...this.data.target };
    }

    /**
     * Get character metadata
     * @returns Character metadata object
     */
    getCharacter(): LoadoutData['character'] {
        return { ...this.data.character };
    }

    /**
     * Get selected class
     * @returns Selected class name or null
     */
    getSelectedClass(): string | null {
        return this.data.character.class;
    }

    /**
     * Get selected job tier
     * @returns Job tier ('3rd' or '4th')
     */
    getSelectedJobTier(): MasteryTier {
        return this.data.character.jobTier;
    }

    /**
     * Get character level
     * @returns Character level
     */
    getCharacterLevel(): number {
        return this.data.character.level;
    }

    /**
     * Get weapon attack bonus
     * @returns Weapon attack bonus object with totalAttack and equippedAttack
     */
    getWeaponAttackBonus(): LoadoutData['weaponAttackBonus'] {
        return { ...this.data.weaponAttackBonus };
    }

    /**
     * Get entire loadout data (for export/debugging)
     * @returns Deep clone of loadout data
     */
    getAllData(): LoadoutData {
        return JSON.parse(JSON.stringify(this.data));
    }

    // ========================================================================
    // SETTERS - Partial updates with immediate save
    // ========================================================================

    /**
     * Update multiple base stats at once
     * @param updates - Object mapping stat keys to values
     */
    updateBaseStats(updates: Record<string, number>): void {
        Object.assign(this.data.baseStats, updates);
        this.saveDualWrite();
    }

    /**
     * Update single base stat
     * @param key - Stat key (e.g., "attack-base")
     * @param value - New value
     */
    updateBaseStat(key: string, value: number): void {
        this.data.baseStats[key] = value;
        this.saveDualWrite();
    }

    /**
     * Update weapon data
     * @param key - Weapon key (e.g., "legendary-t4")
     * @param data - Partial weapon data to update
     */
    updateWeapon(key: string, data: Partial<LoadoutData['weapons'][string]>): void {
        if (!this.data.weapons[key]) {
            this.data.weapons[key] = { level: 0, stars: 0, equipped: false };
        }
        this.data.weapons[key] = { ...this.data.weapons[key], ...data };
        this.saveDualWrite();
    }

    /**
     * Update mastery checkbox state
     * @param tier - Mastery tier ('3rd' or '4th')
     * @param type - Mastery type ('all' or 'boss')
     * @param level - Mastery level (e.g., '64', '124')
     * @param checked - Checkbox state
     */
    updateMasteryCheckbox(
        tier: MasteryTier,
        type: MasteryType,
        level: string,
        checked: boolean
    ): void {
        this.data.mastery[tier][type][level] = checked;
        this.saveDualWrite();
    }

    /**
     * Update target selection
     * @param data - Partial target data
     */
    updateTarget(data: Partial<LoadoutData['target']>): void {
        Object.assign(this.data.target, data);
        this.saveDualWrite();
    }

    /**
     * Update character metadata
     * @param data - Partial character data
     */
    updateCharacter(data: Partial<LoadoutData['character']>): void {
        Object.assign(this.data.character, data);
        this.saveDualWrite();
    }

    /**
     * Set selected class
     * @param className - Class name or null
     */
    setSelectedClass(className: string | null): void {
        this.data.character.class = className;
        this.saveDualWrite();
    }

    /**
     * Set selected job tier
     * @param jobTier - Job tier ('3rd' or '4th')
     */
    setSelectedJobTier(jobTier: MasteryTier): void {
        this.data.character.jobTier = jobTier;
        this.saveDualWrite();
    }

    /**
     * Set character level
     * @param level - Character level
     */
    setCharacterLevel(level: number): void {
        this.data.character.level = level;
        this.saveDualWrite();
    }

    /**
     * Update weapon attack bonus
     * @param data - Partial weapon attack bonus data
     */
    updateWeaponAttackBonus(data: Partial<LoadoutData['weaponAttackBonus']>): void {
        Object.assign(this.data.weaponAttackBonus, data);
        this.saveDualWrite();
    }

    // ========================================================================
    // PERSISTENCE - Dual-write (new + legacy)
    // ========================================================================

    /**
     * Save to localStorage (dual-write: new + legacy format)
     */
    private saveDualWrite(): void {
        // 1. Write NEW structure to 'loadout-data'
        localStorage.setItem('loadout-data', JSON.stringify(this.data));

        // 2. Dual-write OLD structure to 'damageCalculatorData' (for backward compatibility)
        const legacyFormat = this.convertToLegacyFormat();
        localStorage.setItem('damageCalculatorData', JSON.stringify(legacyFormat));

        // 3. Write separate keys for class/jobTier (legacy compatibility)
        if (this.data.character.class) {
            localStorage.setItem('selectedClass', this.data.character.class);
        }
        localStorage.setItem('selectedJobTier', this.data.character.jobTier);
    }

    /**
     * Convert new LoadoutData to legacy damageCalculatorData format
     * Used for dual-write backward compatibility
     */
    private convertToLegacyFormat(): LegacyDamageCalculatorData {
        const legacy: LegacyDamageCalculatorData = {
            baseSetup: { ...this.data.baseStats },
            weapons: {},
            masteryBonuses: {
                '3rd': {
                    all: { ...this.data.mastery['3rd'].all },
                    boss: { ...this.data.mastery['3rd'].boss }
                },
                '4th': {
                    all: { ...this.data.mastery['4th'].all },
                    boss: { ...this.data.mastery['4th'].boss }
                }
            },
            contentType: this.data.target.contentType === 'none' ? undefined : this.data.target.contentType,
            subcategory: this.data.target.subcategory ?? undefined,
            selectedStage: this.data.target.selectedStage ?? undefined
        };

        // Convert weapons to legacy format
        Object.entries(this.data.weapons).forEach(([key, weapon]) => {
            legacy.weapons![key] = {
                level: weapon.level,
                stars: weapon.stars,
                equipped: weapon.equipped
            };
        });

        return legacy;
    }

    // ========================================================================
    // TESTING/DEBUGGING HELPERS
    // ========================================================================

    /**
     * Reset store to defaults (for testing)
     */
    reset(): void {
        this.data = JSON.parse(JSON.stringify(DEFAULT_LOADOUT_DATA));
        this.saveDualWrite();
    }

    /**
     * Check if store is initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}

// ========================================================================
// SINGLETON EXPORT
// ========================================================================

export const loadoutStore = new LoadoutStore();
