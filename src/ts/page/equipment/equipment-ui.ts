/**
 * Equipment UI - HTML Generation and Event Handlers
 * Handles all UI rendering and user interactions for equipment slots
 */

import type {
    EquipmentSlotConfig,
    EquipmentSlotData,
    EquipmentSlotId,
    EquipmentAggregateStats,
    StatDisplayConfig,
} from '@ts/types/page/equipment/equipment.types';
import {
    EQUIPMENT_SLOTS,
    getSlotConfig,
    generateStatTypeOptionsHTML,
    setSlotData,
    loadAllEquipmentData,
    getAllEquipmentData,
    calculateAllContributions,
    isValidSlot,
    migrateStatlineFormats,
} from './equipment';
import { STAT, type StatId } from '@ts/types/constants';

/**
 * Legacy kebab-case to STAT.X.id mapping for UI migration
 * Used to convert legacy data format to new STAT.X.id format
 */
const LEGACY_KEY_TO_STAT_ID: Record<string, StatId> = {
    'attack': STAT.ATTACK.id,
    'main-stat': STAT.PRIMARY_MAIN_STAT.id,
    'defense': STAT.DEFENSE.id,
    'crit-rate': STAT.CRIT_RATE.id,
    'crit-damage': STAT.CRIT_DAMAGE.id,
    'skill-level-1st': STAT.SKILL_LEVEL_1ST.id,
    'skill-level-2nd': STAT.SKILL_LEVEL_2ND.id,
    'skill-level-3rd': STAT.SKILL_LEVEL_3RD.id,
    'skill-level-4th': STAT.SKILL_LEVEL_4TH.id,
    'attack-speed': STAT.ATTACK_SPEED.id,
    'skill-level-all': STAT.SKILL_LEVEL_ALL.id,
    'normal-damage': STAT.NORMAL_DAMAGE.id,
    'boss-damage': STAT.BOSS_DAMAGE.id,
    'damage': STAT.DAMAGE.id,
    'damage-amp': STAT.DAMAGE_AMP.id,
    'final-damage': STAT.FINAL_DAMAGE.id,
    'min-damage': STAT.MIN_DAMAGE.id,
    'max-damage': STAT.MAX_DAMAGE.id,
} as const;

// ============================================================================
// WINDOW TYPE DECLARATIONS
// ============================================================================

declare global {
    interface Window {
        saveSlotData: (slotId: string) => void;
        addStatLineToSlot: (slotId: string) => void;
        removeStatLineFromSlot: (slotId: string, statId: number) => void;
        clearSlotData: (slotId: string) => void;
        loadEquipmentData: () => void;
        notifyStatContributors: () => void;
        equipmentAggregateStats?: EquipmentAggregateStats;
    }
}

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for a single equipment slot card
 */
function generateSlotCardHTML(slot: EquipmentSlotConfig): string {
    const mainStatInput = slot.hasMainStat ? `
        <div class="equipment-input-group">
            <label class="equipment-input-label" for="equipment-${slot.id}-main-stat">Main Stat</label>
            <input type="number" step="1" id="equipment-${slot.id}-main-stat" value="0" min="0" class="equipment-input-field">
        </div>
    ` : '';

    return `
        <div id="equipment-slot-${slot.id}" class="equipment-slot-card" data-needs-init="true">
            <div class="equipment-slot-header">
                <div class="equipment-slot-name">${slot.name}</div>
            </div>

            <div class="equipment-inputs-grid">
                <div class="equipment-input-group">
                    <label class="equipment-input-label" for="equipment-${slot.id}-attack">${STAT.ATTACK.label}</label>
                    <input type="number" step="0.1" id="equipment-${slot.id}-attack" value="0" min="0" class="equipment-input-field">
                </div>
                ${mainStatInput}
            </div>

            <div class="equipment-stats-section">
                <div class="equipment-stats-header">
                    <label class="equipment-stats-label">Additional Stats</label>
                    <button data-slot="${slot.id}" class="equipment-action-btn equipment-btn-add">
                        + Add Stat
                    </button>
                </div>
                <div id="equipment-${slot.id}-stats-container" class="equipment-stats-container">
                    <!-- Stat lines will be added here -->
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate HTML for a stat line
 */
function generateStatLineHTML(slotId: string, statIndex: number): string {
    const optionsHTML = generateStatTypeOptionsHTML();

    return `
        <div id="equipment-${slotId}-stat-${statIndex}" class="equipment-stat-line">
            <div class="equipment-input-group equipment-stat-type-select">
                <select id="equipment-${slotId}-stat-${statIndex}-type" class="equipment-input-field equipment-select-field">
                    ${optionsHTML}
                </select>
            </div>
            <div class="equipment-input-group">
                <input type="number" step="0.1" id="equipment-${slotId}-stat-${statIndex}-value" value="0" class="equipment-input-field equipment-stat-value-input">
            </div>
            <button data-slot="${slotId}" data-stat="${statIndex}" class="equipment-btn-delete equipment-stat-delete-btn" title="Remove stat line">✕</button>
        </div>
    `;
}

/**
 * Generate the complete HTML for all equipment slots
 */
export function generateEquipmentHTML(): string {
    return `
        <div id="equipment-summary-container" class="mb-8">
            <div class="mb-4">Equipment Summary</div>
            <div id="equipment-summary-content" class="equipment-summary-content">
                <span class="equipment-summary-empty">No equipment configured</span>
            </div>
        </div>

        <div id="equipment-slots-container" class="equipment-slots-grid">
            ${EQUIPMENT_SLOTS.map(generateSlotCardHTML).join('')}
        </div>       
    `;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the equipment UI - generates HTML only
 */
export function initializeEquipmentUI(): void {
    const container = document.getElementById('setup-equipment');
    if (!container) {
        console.error('Equipment container not found');
        return;
    }

    // Run one-time migration of legacy kebab-case statline formats to statId format
    migrateStatlineFormats();

    // Generate HTML
    container.innerHTML = generateEquipmentHTML();
}

/**
 * Load equipment data from localStorage and populate UI
 */
export function loadEquipmentUI(): void {
    loadAllEquipmentData();

    const equipmentData = getAllEquipmentData();

    EQUIPMENT_SLOTS.forEach(slot => {
        const slotElement = document.getElementById(`equipment-slot-${slot.id}`);
        const slotData = equipmentData[slot.id];

        if (!slotElement) return;

        // Clear init flag
        slotElement.dataset.needsInit = 'false';

        if (slotData) {
            populateSlotWithData(slot.id, slotData);
        } else {
            // Initialize with empty stat lines
            const statsContainer = document.getElementById(`equipment-${slot.id}-stats-container`);
            if (statsContainer && statsContainer.children.length === 0) {
                for (let i = 0; i < 3; i++) {
                    addStatLineToSlot(slot.id);
                }
            }
        }
    });

    // Update summary after loading
    updateEquipmentSummary();
}

/**
 * Populate a slot with saved data
 */
function populateSlotWithData(slotId: string, data: EquipmentSlotData): void {
    // Set attack
    const attackInput = document.getElementById(`equipment-${slotId}-attack`) as HTMLInputElement;
    if (attackInput) attackInput.value = (data.attack || 0).toString();

    // Set main stat if applicable
    const mainStatInput = document.getElementById(`equipment-${slotId}-main-stat`) as HTMLInputElement;
    if (mainStatInput && data.mainStat !== undefined) {
        mainStatInput.value = data.mainStat.toString();
    }

    // Clear and rebuild stat lines
    const statsContainer = document.getElementById(`equipment-${slotId}-stats-container`);
    if (statsContainer) {
        statsContainer.innerHTML = '';

        if (data.statLines && Array.isArray(data.statLines)) {
            data.statLines.forEach(statLine => {
                addStatLineToSlot(slotId);
                const statCount = statsContainer.children.length;
                const typeInput = document.getElementById(`equipment-${slotId}-stat-${statCount}-type`) as HTMLSelectElement;
                const valueInput = document.getElementById(`equipment-${slotId}-stat-${statCount}-value`) as HTMLInputElement;

                // Handle both old format (kebab-case) and new format (statId)
                let typeValue = statLine.type;
                // Convert old kebab-case format to statId if needed
                if (typeValue in LEGACY_KEY_TO_STAT_ID) {
                    typeValue = LEGACY_KEY_TO_STAT_ID[typeValue];
                }

                if (typeInput) typeInput.value = typeValue;
                if (valueInput) valueInput.value = statLine.value.toString();
            });
        }
    }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Debounce utility function
 */
function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return function executedFunction(...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Save data for a specific slot from DOM inputs
 */
function saveSlotDataFromDOM(slotId: string): void {
    // Type guard check
    if (!isValidSlot(slotId)) {
        console.warn(`Invalid slot ID: ${slotId}`);
        return;
    }

    // After type guard check, we can safely cast to EquipmentSlotId
    const validSlotId = slotId as EquipmentSlotId;

    const slotConfig = getSlotConfig(validSlotId);
    if (!slotConfig) return;

    // Get attack value
    const attackInput = document.getElementById(`equipment-${validSlotId}-attack`) as HTMLInputElement;
    const attack = attackInput ? parseFloat(attackInput.value) || 0 : 0;

    // Get main stat (if applicable)
    let mainStat: number | undefined;
    if (slotConfig.hasMainStat) {
        const mainStatInput = document.getElementById(`equipment-${validSlotId}-main-stat`) as HTMLInputElement;
        mainStat = mainStatInput ? parseFloat(mainStatInput.value) || 0 : undefined;
    }

    // Get stat lines - now stores STAT constant ID format (camelCase)
    // statId format: 'attack', 'critRate', 'bossDamage', etc.
    const statLines: Array<{ type: StatId; value: number }> = [];
    const statsContainer = document.getElementById(`equipment-${validSlotId}-stats-container`);
    if (statsContainer) {
        const statElements = statsContainer.querySelectorAll(`[id^="equipment-${validSlotId}-stat-"]:not([id*="-type"]):not([id*="-value"])`);
        statElements.forEach(statElement => {
            const typeInput = statElement.querySelector('[id$="-type"]') as HTMLSelectElement;
            const valueInput = statElement.querySelector('[id$="-value"]') as HTMLInputElement;
            if (typeInput && valueInput && typeInput.value && valueInput.value) {
                statLines.push({
                    type: typeInput.value as StatId, // Cast to StatId
                    value: parseFloat(valueInput.value) || 0
                });
            }
        });
    }

    // Store the data
    const slotData: EquipmentSlotData = {
        name: '',
        attack,
        mainStat,
        statLines
    };

    setSlotData(validSlotId, slotData);
}

/**
 * Add a stat line to a slot
 */
function addStatLineToSlot(slotId: string): void {
    const statsContainer = document.getElementById(`equipment-${slotId}-stats-container`);
    if (!statsContainer) return;

    const currentCount = statsContainer.children.length;
    const statId = currentCount + 1;

    const statDiv = document.createElement('div');
    statDiv.innerHTML = generateStatLineHTML(slotId, statId);
    statsContainer.appendChild(statDiv.firstElementChild!);
}

/**
 * Remove a stat line from a slot
 */
function removeStatLineFromSlot(slotId: string, statId: number): void {
    const statElement = document.getElementById(`equipment-${slotId}-stat-${statId}`);
    if (statElement) {
        statElement.remove();
        saveSlotDataFromDOM(slotId);
        notifyStatContributors();
    }
}

/**
 * Notify that stats have changed
 * Updates ContributedStats and notifies all listeners
 */
function notifyStatContributors(): void {
    // Calculate equipment contributions
    const equipmentStats = calculateAllContributions();

    // Update the equipment summary display
    updateEquipmentSummary();
}

// ============================================================================
// EQUIPMENT SUMMARY
// ============================================================================

/**
 * Calculate aggregate stats across all equipment
 */
function calculateAggregateStats(equipmentData: ReturnType<typeof getAllEquipmentData>): EquipmentAggregateStats {
    const totals: EquipmentAggregateStats = {
        [STAT.ATTACK.id]: 0,
        [STAT.PRIMARY_MAIN_STAT.id]: 0, 
        [STAT.MAIN_STAT_PCT.id]: 0, 
        [STAT.DEFENSE.id]: 0,
        [STAT.CRIT_RATE.id]: 0,
        [STAT.CRIT_DAMAGE.id]: 0,
        [STAT.BOSS_DAMAGE.id]: 0,
        [STAT.NORMAL_DAMAGE.id]: 0,
        [STAT.DAMAGE.id]: 0,
        [STAT.DAMAGE_AMP.id]: 0,
        [STAT.FINAL_DAMAGE.id]: 0,
        [STAT.MIN_DAMAGE.id]: 0,
        [STAT.MAX_DAMAGE.id]: 0,
        [STAT.SKILL_LEVEL_1ST.id]: 0,
        [STAT.SKILL_LEVEL_2ND.id]: 0,
        [STAT.SKILL_LEVEL_3RD.id]: 0,
        [STAT.SKILL_LEVEL_4TH.id]: 0,
        [STAT.SKILL_LEVEL_ALL.id]: 0,
        [STAT.ATTACK_SPEED.id]: 0
    };

    Object.values(equipmentData).forEach(slotData => {
        if (!slotData) return;

        // Add attack
        if (slotData.attack) {
            totals[STAT.ATTACK.id] += slotData.attack;
        }

        // Add main stat
        if (slotData.mainStat) {
            totals[STAT.PRIMARY_MAIN_STAT.id] += slotData.mainStat;
        }

        // Add stat lines - statLine.type is now STAT.X.id
        if (slotData.statLines && Array.isArray(slotData.statLines)) {
            slotData.statLines.forEach(statLine => {
                const statId = statLine.type;
                if (statId && totals.hasOwnProperty(statId)) {
                    totals[statId] += statLine.value;
                }
            });
        }
    });

    return totals;
}

/**
 * Update the equipment summary with aggregate stats
 */
export function updateEquipmentSummary(): void {
    const equipmentData = getAllEquipmentData();
    const totals = calculateAggregateStats(equipmentData);
    updateSummaryDisplay(totals);
}

/**
 * Update the summary display with premium styling
 */
function updateSummaryDisplay(totals: EquipmentAggregateStats): void {
    const summaryElement = document.getElementById('equipment-summary-content');
    if (!summaryElement) return;

    const parts: string[] = [];

    // Define stat display configuration using STAT constant labels and IDs
    const statConfigs: StatDisplayConfig[] = [
        { key: STAT.ATTACK.id, label: STAT.ATTACK.label, isPercent: false },
        { key: STAT.PRIMARY_MAIN_STAT.id, label: 'Main Stat', isPercent: false }, 
        { key: STAT.MAIN_STAT_PCT.id, label: 'Main Stat %', isPercent: true }, 
        { key: STAT.DEFENSE.id, label: STAT.DEFENSE.label, isPercent: false },
        { key: STAT.CRIT_RATE.id, label: STAT.CRIT_RATE.label.replace(' (%)', ''), isPercent: true },
        { key: STAT.CRIT_DAMAGE.id, label: STAT.CRIT_DAMAGE.label.replace(' (%)', ''), isPercent: true },
        { key: STAT.BOSS_DAMAGE.id, label: STAT.BOSS_DAMAGE.label.replace(' (%)', '').replace('Monster ', ''), isPercent: true },
        { key: STAT.DAMAGE.id, label: STAT.DAMAGE.label.replace(' (%)', ''), isPercent: true },
        { key: STAT.NORMAL_DAMAGE.id, label: STAT.NORMAL_DAMAGE.label.replace(' (%)', '').replace('Monster ', ''), isPercent: true },
        { key: STAT.FINAL_DAMAGE.id, label: STAT.FINAL_DAMAGE.label.replace(' (%)', ''), isPercent: true },
        { key: STAT.MIN_DAMAGE.id, label: STAT.MIN_DAMAGE.label.replace(' (%)', '').replace(' Multiplier', ''), isPercent: true },
        { key: STAT.MAX_DAMAGE.id, label: STAT.MAX_DAMAGE.label.replace(' (%)', '').replace(' Multiplier', ''), isPercent: true },
        { key: STAT.SKILL_LEVEL_1ST.id, label: STAT.SKILL_LEVEL_1ST.label, isPercent: false },
        { key: STAT.SKILL_LEVEL_2ND.id, label: STAT.SKILL_LEVEL_2ND.label, isPercent: false },
        { key: STAT.SKILL_LEVEL_3RD.id, label: STAT.SKILL_LEVEL_3RD.label, isPercent: false },
        { key: STAT.SKILL_LEVEL_4TH.id, label: STAT.SKILL_LEVEL_4TH.label, isPercent: false },
        { key: STAT.SKILL_LEVEL_ALL.id, label: STAT.SKILL_LEVEL_ALL.label, isPercent: false },
        { key: STAT.ATTACK_SPEED.id, label: 'All Jobs (Atk Speed)', isPercent: false } // Fallback for skill-level-all
    ];

    statConfigs.forEach(config => {
        const value = totals[config.key];
        // Round to 1 decimal place using Math.round
        const roundedValue = Math.round(value * 10) / 10;
        if (roundedValue > 0) {
            const formattedValue = config.isPercent ? `${roundedValue}%` : roundedValue;
            parts.push(`
                <span class="equipment-summary-stat">
                    <span class="equipment-summary-stat-value">+${formattedValue}</span>
                    ${config.label}
                </span>
            `);
        }
    });

    if (parts.length === 0) {
        summaryElement.innerHTML = '<span class="equipment-summary-empty">No equipment configured</span>';
    } else {
        summaryElement.innerHTML = parts.join('<span class="equipment-summary-divider">•</span>');
    }

    // Store totals for potential future use
    window.equipmentAggregateStats = totals;
}

// ============================================================================
// EVENT LISTENER ATTACHMENT
// ============================================================================

/**
 * Attach event listeners for the equipment UI
 * Uses event delegation to handle dynamically added stat lines
 */
export function attachEquipmentEventListeners(): void {
    // Attach listeners for each slot
    EQUIPMENT_SLOTS.forEach(slot => {
        const slotElement = document.getElementById(`equipment-slot-${slot.id}`);
        if (!slotElement) return;

        // Use event delegation for input changes - this handles dynamically added stat lines
        slotElement.addEventListener('input', debounce(() => {
            saveSlotDataFromDOM(slot.id);
            notifyStatContributors();
        }, 300));

        // Add stat button
        const addStatBtn = slotElement.querySelector('.equipment-btn-add');
        addStatBtn?.addEventListener('click', () => addStatLineToSlot(slot.id));

        // Delete stat buttons (delegation)
        slotElement.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('equipment-stat-delete-btn')) {
                const statId = target.getAttribute('data-stat');
                if (statId) {
                    removeStatLineFromSlot(slot.id, parseInt(statId));
                }
            }
        });
    });
}

// ============================================================================
// GLOBAL FUNCTIONS (for backward compatibility)
// ============================================================================

// Export functions for global access (needed for onclick handlers)
window.saveSlotData = (slotId: string) => {
    saveSlotDataFromDOM(slotId);
    notifyStatContributors();
};

window.addStatLineToSlot = addStatLineToSlot;

window.removeStatLineFromSlot = (slotId: string, statId: number) => {
    removeStatLineFromSlot(slotId, statId);
};

window.loadEquipmentData = loadEquipmentUI;

window.notifyStatContributors = notifyStatContributors;
