/**
 * Companion System UI
 * Merged from companions-ui.js and companions-presets-ui.js
 * Handles all HTML generation and event handling for the companions tab
 */

import { getCompanionEffects, getMaxCompanionLevel } from '@core/companions/index.js';
import { loadoutStore } from '@ts/store/loadout.store.js';
import { addStat, subtractStat } from '@core/services/stat-inputs-service.js';
import { calculateBothDpsDifferences, presetHasAnyCompanion, generateOptimalPreset } from './companion.js';
import type {
    CompanionKey,
    CompanionPresetId,
    CompanionPreset,
    CompanionData,
    CompanionEffects,
    CompanionRarity,
    ProcessedEffect,
    DpsComparisonResult,
    BothDpsResults,
    CompanionClass
} from '@ts/types/page/companions/companions.types';
import { CLASS_DISPLAY_NAMES, RARITY_CONFIG } from '@ts/types/page/companions/companions.types';

// ============================================================================
// STATE TRACKING
// ============================================================================

// Track currently selected companion for re-opening detail panel after updates
interface CurrentCompanion {
    companionKey: CompanionKey;
    className: CompanionClass;
    rarity: CompanionRarity;
    borderColor: string;
    color: string;
}

let currentCompanion: CurrentCompanion | null = null;

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize the companions UI
 */
export function initializeCompanionsUI(): void {
    renderCompanionsGrid();
    updateSummary();
    initializePresetsUI();
}

/**
 * Load companions UI from saved state
 */
export function loadCompanionsUI(): void {
    // Load and update UI based on store state
    // (Individual components update themselves via event listeners)
}

/**
 * Attach event listeners to companion-related elements
 */
export function attachCompanionsEventListeners(): void {
    attachCompanionIconListeners();
    attachPresetEventListeners();
    attachClickOutsideListener();
}

/**
 * Refresh the companions UI
 */
export function refreshCompanionsUI(): void {
    renderCompanionsGrid();
    updateSummary();
    refreshPresetsUI();
}

// ============================================================================
// RENDER FUNCTIONS - GRID & DETAIL PANEL
// ============================================================================

/**
 * Render the companions grid
 */
function renderCompanionsGrid(): void {
    const container = document.getElementById('companions-grid-container');
    if (!container) return;

    // Render icon grid and detail panel as separate flex items
    let html = `
        <!-- Icon Grid wrapper -->
        <div class="companions-icon-grid-wrapper">
            <div class="companions-icon-grid">
                ${renderIconGrid()}
            </div>

            <!-- Clear Slot Button (shown when slot is selected) -->
            <div id="clear-slot-selection-container" style="display: none; margin-top: 15px;">
                <button id="clear-slot-selection-btn" onclick="window.clearSelectedSlotCompanion()" style="
                    padding: 10px 20px;
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
                    border: 2px solid #ef4444;
                    border-radius: 8px;
                    color: #ef4444;
                    font-weight: 600;
                    font-size: 0.95em;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
                " onmouseover="this.style.background='linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.2))'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)';"
                   onmouseout="this.style.background='linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(239, 68, 68, 0.2)';">
                    🗑️ Clear Slot
                </button>
            </div>
        </div>

        <!-- Detail Panel -->
        <div id="companion-detail-panel" class="companions-detail-panel">
            <div id="companion-detail-content">
                ${renderDetailPlaceholder()}
            </div>
        </div>
    `;

    // Append to container without removing existing elements (like presets)
    const presetsContainer = document.getElementById('companions-presets-container');
    container.innerHTML = html;

    // Re-append presets container if it existed
    if (presetsContainer) {
        container.appendChild(presetsContainer);
    } else {
        // Create presets container if it doesn't exist
        const newPresetsContainer = document.createElement('div');
        newPresetsContainer.id = 'companions-presets-container';
        newPresetsContainer.className = 'companions-presets-panel';
        container.appendChild(newPresetsContainer);
    }

    // Attach event listeners
    attachCompanionIconListeners();
}

/**
 * Render placeholder for detail panel
 */
function renderDetailPlaceholder(): string {
    return `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 300px;
            color: var(--text-secondary);
            text-align: center;
        ">
            <div style="font-size: 1.1em; font-weight: 500;">Select a companion</div>
            <div style="font-size: 0.9em; margin-top: 8px; opacity: 0.7;">
                Click any companion icon to view details and effects
            </div>
        </div>
    `;
}

/**
 * Render the icon grid (all class-rarity combinations)
 */
function renderIconGrid(): string {
    let html = '';

    // Create grid for all rarity-class combinations
    Object.entries(RARITY_CONFIG).forEach(([rarity, config]) => {
        config.classes.forEach(className => {
            const companionKey: CompanionKey = `${className}-${rarity}` as CompanionKey;
            const companionData = loadoutStore.getCompanion(companionKey);
            const isUnlocked = companionData?.unlocked ?? false;
            const level = companionData?.level ?? 1;

            html += `
                <div class="companion-icon"
                     data-companion="${companionKey}"
                     data-class="${className}"
                     data-rarity="${rarity}"
                     data-config-color="${config.color}"
                     data-config-border="${config.borderColor}"
                     style="
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(135deg, ${config.color}22, ${config.borderColor}44);
                        border: 2px solid ${isUnlocked ? config.borderColor : '#666'};
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        opacity: ${isUnlocked ? '1' : '0.4'};
                        filter: ${isUnlocked ? 'none' : 'grayscale(100%)'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                     "
                     onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';"
                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                    <img class="comp-image comp-${className}" src="media/classes/${getClassPngName(className)}.png" style="width: 45px; height: 45px; object-fit: contain;">
                    ${isUnlocked ? `
                        <div class="companion-icon-level" data-companion="${companionKey}" style="position: absolute; top: 2px; right: 2px; font-size: 0.75em; color: white; font-weight: 900; text-shadow: 2px 2px 3px rgba(0,0,0,0.9);">
                            Lv.${level}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    });

    return html;
}

/**
 * Show the detail panel for a companion
 */
function showDetailPanel(
    companionKey: CompanionKey,
    className: ClassName,
    rarity: CompanionRarity,
    borderColor: string,
    color: string
): void {
    const panel = document.getElementById('companion-detail-panel');
    const content = document.getElementById('companion-detail-content');
    if (!panel || !content) return;

    const companionData = loadoutStore.getCompanion(companionKey);
    if (!companionData) return;

    const displayName = CLASS_DISPLAY_NAMES[className];
    const isUnlocked = companionData.unlocked;
    const level = companionData.level || 1;
    const maxLevel = getMaxCompanionLevel();

    // Get companion effects
    let inventoryEffectText = '';
    let equipEffectText = '';

    if (isUnlocked) {
        const effects = getCompanionEffects(className, rarity, level);
        if (effects) {
            inventoryEffectText = formatEffects(effects.inventoryEffect);
            equipEffectText = formatEffects(effects.equipEffect);
        }
    }

    content.innerHTML = `
        <!-- Gradient background with color at bottom - takes top 1/3 -->
        <div style="
            background: linear-gradient(to top, ${borderColor}88 0%, transparent 50%);
            border-radius: 12px;
            height: 265px;
            width: 400px;
            margin: -20px -20px 20px -20px;
            position: relative;
            pointer-events: none;
            border: solid 1px ${borderColor}
        ">
            <!-- Class animated webp - much larger, centered -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px;">
                <img class="comp-image comp-${className}" src="media/classes/${getClassWebpName(className)}.webp" style="width: 100%; height: 100%; object-fit: contain;">
            </div>

            <!-- Class name - absolute bottom left -->
            <div style="
                position: absolute;
                bottom: 12px;
                left: 12px;
                color: white;
                font-size: 1.2em;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            ">${displayName}</div>

            <!-- Rarity badge - absolute bottom right -->
            <div style="
                position: absolute;
                bottom: 12px;
                right: 12px;
                background: ${borderColor};
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">${rarity}</div>
        </div>

        ${isUnlocked ? `
            <!-- Level Input -->
            <div style="margin-bottom: 20px;">
                <label style="
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: var(--text-primary);
                ">Level</label>
                <input type="number"
                       class="companion-level-input"
                       data-companion="${companionKey}"
                       value="${level}"
                       min="1"
                       max="${maxLevel}"
                       onchange="window.handleLevelChange('${companionKey}', this.value)"
                       style="
                        width: 100%;
                        padding: 10px;
                        border: 2px solid ${borderColor};
                        border-radius: 8px;
                        background: var(--input-bg);
                        color: var(--text-primary);
                        text-align: center;
                        font-size: 1.1em;
                        font-weight: 600;
                       ">
            </div>

            <!-- Two column layout: Effects and Lock button -->
            <div style="display: flex; gap: 15px;">
                <!-- Left: Effects Display -->
                <div style="
                    flex: 1;
                    border-top: 1px solid var(--border-color);
                ">
                    <h4 style="
                        color: ${borderColor};
                        margin: 0 0 10px 0;
                        font-size: 1em;
                        font-weight: 600;
                    ">Effects</h4>

                    ${inventoryEffectText ? `
                        <div style="margin-bottom: 12px;">
                            <div style="
                                font-weight: 600;
                                color: var(--text-primary);
                                margin-bottom: 4px;
                                font-size: 0.9em;
                            ">Inventory</div>
                            <div style="
                                font-size: 0.85em;
                                color: var(--text-secondary);
                                line-height: 1.5;
                            ">${inventoryEffectText}</div>
                        </div>
                    ` : ''}

                    ${equipEffectText ? `
                        <div>
                            <div style="
                                font-weight: 600;
                                color: var(--text-primary);
                                margin-bottom: 4px;
                                font-size: 0.9em;
                            ">Equip</div>
                            <div style="
                                font-size: 0.85em;
                                color: var(--text-secondary);
                                line-height: 1.5;
                            ">${equipEffectText}</div>
                        </div>
                    ` : ''}
                </div>

                <!-- Right: Lock/Unlock button -->
                <div style="flex: 1; display: flex; align-items: flex-start;">
                    <button onclick="window.toggleCompanionLock('${companionKey}')" style="
                        width: 100%;
                        padding: 12px;
                        background: rgba(239, 68, 68, 0.15);
                        border: 2px solid #ef4444;
                        border-radius: 8px;
                        color: #ef4444;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        🔒 Lock Companion
                    </button>
                </div>
            </div>
        ` : `
            <!-- Locked state: show unlock button -->
            <div style="display: flex; justify-content: center; padding-top: 20px;">
                <button onclick="window.toggleCompanionLock('${companionKey}')" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(16, 185, 129, 0.15);
                    border: 2px solid #10b981;
                    border-radius: 8px;
                    color: #10b981;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    🔓 Unlock Companion
                </button>
            </div>
        `}
    `;

    panel.style.borderColor = borderColor;
}

// ============================================================================
// RENDER FUNCTIONS - PRESETS
// ============================================================================

/**
 * Initialize the presets UI
 */
function initializePresetsUI(): void {
    // Update ContributedStats for current equipped preset on init
    const equippedPresetId = loadoutStore.getEquippedPresetId();
    updateContributedStatsForPreset(equippedPresetId);
    renderPresetsPanel();
}

/**
 * Render the presets panel
 */
function renderPresetsPanel(): void {
    const container = document.getElementById('companions-presets-container');
    if (!container) return;

    // Skip expensive optimal preset generation if companions tab is not visible
    const companionsTab = document.getElementById('setup-companions');
    const isTabVisible = companionsTab && companionsTab.classList.contains('active');

    if (!isTabVisible) {
        // Still render basic UI without optimal presets
        const showDpsComparison = loadoutStore.getShowPresetDpsComparison();
        const equippedPresetId = loadoutStore.getEquippedPresetId();
        const currentPresetEffects = getPresetEquipEffects(equippedPresetId);

        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

        // Add toggle header
        html += `
            <header style="margin-bottom: 8px; padding: 10px 12px; background: rgba(0, 122, 255, 0.08); border: 1px solid rgba(0, 122, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 600; color: var(--text-primary);">Show DPS Comparison</span>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" id="preset-dps-comparison-toggle" onchange="window.togglePresetDpsComparison(this.checked)" ${showDpsComparison ? 'checked' : ''}>
                    <span style="font-size: 0.9em; color: var(--text-secondary);">Enable DPS info below each preset</span>
                </label>
            </header>
        `;

        // Render user presets only (skip optimal ones)
        for (let i = 1; i <= 5; i++) {
            const presetId: CompanionPresetId = `preset${i}` as CompanionPresetId;
            const presetData = loadoutStore.getPreset(presetId);
            const isEquipped = presetId === equippedPresetId;
            html += renderPresetRow(presetId, presetData, isEquipped, showDpsComparison, currentPresetEffects, false);
        }

        html += '</div>';
        container.innerHTML = html;
        attachPresetEventListeners();
        return;
    }

    const showDpsComparison = loadoutStore.getShowPresetDpsComparison();
    const equippedPresetId = loadoutStore.getEquippedPresetId();

    // Get current and all preset effects for DPS comparison
    const currentPresetEffects = getPresetEquipEffects(equippedPresetId);

    // Generate optimal presets for boss and normal damage
    const maxBossDpsPreset = generateOptimalPreset(
        'bossDamage',
        getCompanionEffects,
        (key) => loadoutStore.getCompanion(key),
        getMaxCompanionLevel,
        loadoutStore.getLockedMainCompanion('optimal-boss')
    );
    const maxNormalDpsPreset = generateOptimalPreset(
        'normalDamage',
        getCompanionEffects,
        (key) => loadoutStore.getCompanion(key),
        getMaxCompanionLevel,
        loadoutStore.getLockedMainCompanion('optimal-normal')
    );

    let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

    // Add toggle header at the top
    html += `
        <header style="margin-bottom: 8px; padding: 10px 12px; background: rgba(0, 122, 255, 0.08); border: 1px solid rgba(0, 122, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 600; color: var(--text-primary);">Show DPS Comparison</span>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="preset-dps-comparison-toggle" onchange="window.togglePresetDpsComparison(this.checked)" ${showDpsComparison ? 'checked' : ''}>
                <span style="font-size: 0.9em; color: var(--text-secondary);">Enable DPS info below each preset</span>
            </label>
        </header>
    `;

    // Render 5 user presets
    for (let i = 1; i <= 5; i++) {
        const presetId: CompanionPresetId = `preset${i}` as CompanionPresetId;
        const presetData = loadoutStore.getPreset(presetId);
        const isEquipped = presetId === equippedPresetId;

        html += renderPresetRow(presetId, presetData, isEquipped, showDpsComparison, currentPresetEffects, false);
    }

    // Render 2 special optimal presets
    html += renderPresetRow('optimal-boss', maxBossDpsPreset, false, showDpsComparison, currentPresetEffects, true, 'Max Boss Dmg');
    html += renderPresetRow('optimal-normal', maxNormalDpsPreset, false, showDpsComparison, currentPresetEffects, true, 'Max Normal Dmg');

    html += '</div>';

    container.innerHTML = html;

    // Attach event listeners (only for user presets, not optimal ones)
    attachPresetEventListeners();
}

/**
 * Render a single preset row
 */
function renderPresetRow(
    presetId: CompanionPresetId,
    presetData: CompanionPreset,
    isEquipped: boolean,
    showDpsComparison: boolean,
    currentPresetEffects: Record<string, number>,
    isSpecialPreset = false,
    customLabel: string | null = null
): string {
    // Format number helper
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toString();
    };

    // Determine label
    const labelText = customLabel || presetId.replace('preset', '#');

    // Determine border color (gold for special presets)
    const borderColor = isSpecialPreset ? '#fbbf24' : (isEquipped ? '#10b981' : 'var(--border-color)');

    // For optimal presets, check if main is locked
    const isLocked = isSpecialPreset &&
        (presetId === 'optimal-boss' || presetId === 'optimal-normal') &&
        loadoutStore.getLockedMainCompanion(presetId) !== null;

    // Build the preset row HTML
    let html = `
        <div class="preset-row" data-preset="${presetId}" data-special="${isSpecialPreset}" style="
            display: flex;
            flex-direction: column;
            background: var(--background);
            border: 2px solid ${borderColor};
            border-radius: 8px;
            transition: all 0.2s ease;
            ${isSpecialPreset ? 'background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(245, 158, 11, 0.03));' : ''}
        ">
            <!-- Top row: label, slots, and badge -->
            <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
            ">
                <!-- Preset label -->
                <div style="
                    font-size: 0.8em;
                    font-weight: 600;
                    color: ${isSpecialPreset ? '#fbbf24' : 'var(--text-secondary)'};
                    min-width: ${customLabel ? '100px' : '45px'};
                    text-align: right;
                    margin-right: 4px;
                ">${labelText}</div>

                <!-- Main slot -->
                ${isSpecialPreset ? renderOptimalMainSlot(presetId, presetData.main, 80, isLocked) : renderSlot(presetId, 'main', 0, presetData.main, 80)}

                <!-- Sub slots (6 in a row) -->
                ${presetData.subs.map((sub, index) =>
                    isSpecialPreset ? renderReadOnlySlot(sub, 50) : renderSlot(presetId, 'sub', index, sub, 50)
                ).join('')}

                <!-- Badge for equipped or lock button for special presets -->
                ${isSpecialPreset ? `
                    <button onclick="window.toggleOptimalLock('${presetId}')" style="
                        margin-left: auto;
                        padding: 6px 12px;
                        background: ${isLocked ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))'};
                        border: 2px solid ${isLocked ? '#ef4444' : '#3b82f6'};
                        border-radius: 6px;
                        color: ${isLocked ? '#ef4444' : '#3b82f6'};
                        font-weight: 600;
                        font-size: 0.8em;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                    " onmouseover="this.style.background='${isLocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'}'; this.style.transform='translateY(-1px)';"
                       onmouseout="this.style.background='${isLocked ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))'}'; this.style.transform='translateY(0)';">
                        ${isLocked ? 'CLEAR LOCK' : 'LOCK MAIN'}
                    </button>
                ` : (isEquipped ? `
                    <div style="
                        margin-left: auto;
                        padding: 6px 12px;
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.1));
                        border: 2px solid #10b981;
                        border-radius: 6px;
                        color: #10b981;
                        font-weight: 700;
                        font-size: 0.8em;
                        white-space: nowrap;
                    ">✓ EQUIPPED</div>
                ` : `
                    <button onclick="window.equipPreset('${presetId}')" style="
                        margin-left: auto;
                        padding: 6px 14px;
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1));
                        border: 2px solid #3b82f6;
                        border-radius: 6px;
                        color: #3b82f6;
                        font-weight: 600;
                        font-size: 0.8em;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                    " onmouseover="this.style.background='rgba(59, 130, 246, 0.25)'; this.style.transform='translateY(-1px)';"
                       onmouseout="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))'; this.style.transform='translateY(0)';">
                        EQUIP
                    </button>
                `)}
            </div>
    `;

    // Add DPS comparison section if enabled and preset has companions
    if (showDpsComparison && presetHasAnyCompanion(presetData)) {
        const targetPresetEffects = isSpecialPreset
            ? getPresetEquipEffectsFromData(presetData)
            : getPresetEquipEffects(presetId);

        const dpsResults = calculateBothDpsDifferences(currentPresetEffects, targetPresetEffects);

        html += renderDpsComparisonSection(dpsResults, isEquipped, formatNumber);
    }

    html += `</div>`;
    return html;
}

/**
 * Render DPS comparison section for a preset row
 */
function renderDpsComparisonSection(
    dpsResults: BothDpsResults,
    isEquipped: boolean,
    formatNumber: (num: number) => string
): string {
    let html = `
        <div class="preset-dps-comparison" style="
            margin-top: 8px;
            padding: 10px 12px;
            background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(88, 86, 214, 0.05));
            border-top: 1px solid rgba(0, 122, 255, 0.2);
            border-radius: 0 0 6px 6px;
        ">
            <div style="display: flex; gap: 20px; justify-content: space-around;">
    `;

    if (isEquipped) {
        // Show current DPS and gain over baseline for equipped preset
        const bossGainOverBaseline = dpsResults.boss.currentPresetGain;
        const normalGainOverBaseline = dpsResults.normal.currentPresetGain;
        const bossPctGain = dpsResults.boss.baselineDps > 0 ? (bossGainOverBaseline / dpsResults.boss.baselineDps) * 100 : 0;
        const normalPctGain = dpsResults.normal.baselineDps > 0 ? (normalGainOverBaseline / dpsResults.normal.baselineDps) * 100 : 0;

        html += `
            <div style="text-align: center;">
                <div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px;">DPS vs Boss</div>
                <div style="font-size: 1em; font-weight: 700; color: var(--accent-success);">
                    Current
                </div>
                <div style="font-size: 0.7em; color: var(--text-secondary);">
                    ${formatNumber(dpsResults.boss.currentPresetDps)}
                </div>
                <div style="font-size: 0.65em; color: var(--text-secondary);">
                    +${bossPctGain.toFixed(1)}% over baseline
                </div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px;">DPS vs Monster</div>
                <div style="font-size: 1em; font-weight: 700; color: var(--accent-success);">
                    Current
                </div>
                <div style="font-size: 0.7em; color: var(--text-secondary);">
                    ${formatNumber(dpsResults.normal.currentPresetDps)}
                </div>
                <div style="font-size: 0.65em; color: var(--text-secondary);">
                    +${normalPctGain.toFixed(1)}% over baseline
                </div>
            </div>
        `;
    } else {
        // Show DPS difference relative to current preset for non-equipped presets
        const bossGain = dpsResults.boss.dpsGain;
        const normalGain = dpsResults.normal.dpsGain;

        html += `
            <div style="text-align: center;">
                <div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px;">DPS vs Boss</div>
                <div style="font-size: 1em; font-weight: 700;">
                    <span style="color: ${bossGain >= 0 ? '#10b981' : '#ef4444'};">
                        ${bossGain >= 0 ? '+' : ''}${bossGain.toFixed(2)}%
                    </span>
                </div>
                <div style="font-size: 0.7em; color: var(--text-secondary);">
                    ${formatNumber(dpsResults.boss.newPresetDps)}
                </div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px;">DPS vs Monster</div>
                <div style="font-size: 1em; font-weight: 700;">
                    <span style="color: ${normalGain >= 0 ? '#10b981' : '#ef4444'};">
                        ${normalGain >= 0 ? '+' : ''}${normalGain.toFixed(2)}%
                    </span>
                </div>
                <div style="font-size: 0.7em; color: var(--text-secondary);">
                    ${formatNumber(dpsResults.normal.newPresetDps)}
                </div>
            </div>
        `;
    }

    html += `
                </div>
            </div>
        `;

    return html;
}

/**
 * Render a single slot
 */
function renderSlot(
    presetId: CompanionPresetId,
    slotType: 'main' | 'sub',
    slotIndex: number,
    companionKey: CompanionKey | null,
    size: number
): string {
    const slotId = `${presetId}-${slotType}-${slotIndex}`;

    if (!companionKey) {
        // Empty slot
        return `
            <div class="preset-slot empty-slot"
                 data-preset="${presetId}"
                 data-slot-type="${slotType}"
                 data-slot-index="${slotIndex}"
                 data-slot-id="${slotId}"
                 style="
                    width: ${size}px;
                    height: ${size}px;
                    border: 2px dashed #666;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                 "
                 onmouseover="this.style.background='rgba(255,255,255,0.1)';"
                 onmouseout="this.style.background='rgba(255,255,255,0.05)';">
                <div style="font-size: ${size * 0.5}px; color: #888; font-weight: bold;">+</div>
            </div>
        `;
    }

    // Filled slot
    const [className, rarity] = companionKey.split('-');
    const config = RARITY_CONFIG[rarity as CompanionRarity] || RARITY_CONFIG['Normal'];
    const companionData = loadoutStore.getCompanion(companionKey);
    const level = companionData?.level ?? 1;
    const isLocked = !companionData?.unlocked;

    // For main slots: use webp with preset-specific class
    // For sub slots: use png with preset-specific sub class
    const isMain = slotType === 'main';
    const iconName = isMain ? getClassWebpName(className as ClassName) : getClassPngName(className as ClassName);
    const iconExt = isMain ? 'webp' : 'png';
    const iconClass = isMain
        ? `comp-image comp-preset-${className}`
        : `comp-image comp-preset-sub-${className}`;

    return `
        <div class="preset-slot filled-slot ${isLocked ? 'locked-companion-slot' : ''}"
             data-preset="${presetId}"
             data-slot-type="${slotType}"
             data-slot-index="${slotIndex}"
             data-slot-id="${slotId}"
             data-companion="${companionKey}"
             data-main-rarity="${isMain ? rarity : ''}"
             style="
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(135deg, ${config.color}22, ${config.borderColor}44);
                border: 2px solid ${isLocked ? '#ef4444' : config.borderColor};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: ${isLocked ? '0.6' : '1'};
             ">
            <!-- Companion icon (scaled up and clipped) -->
            <div style="
                position: absolute;
                width: ${size * 1.5}px;
                height: ${size * 1.5}px;
                display: flex;
                align-items: center;
                justify-content: center;
                ${isLocked ? 'filter: grayscale(100%);' : ''}
            ">
                <img class="${iconClass}" src="media/classes/${iconName}.${iconExt}" style="
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                ">
            </div>

            <!-- Level badge -->
            <div style="
                position: absolute;
                top: 2px;
                right: 2px;
                font-size: 0.65em;
                color: white;
                font-weight: 900;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
                background: rgba(0,0,0,0.5);
                padding: 1px 3px;
                border-radius: 4px;
            ">${level}</div>

            ${isLocked ? `
            <!-- Locked warning indicator -->
            <div style="
                position: absolute;
                top: 2px;
                left: 2px;
                font-size: ${size * 0.25}px;
                line-height: 1;
                background: rgba(239, 68, 68, 0.9);
                color: white;
                width: ${size * 0.35}px;
                height: ${size * 0.35}px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 10;
            ">⚠️</div>
            ` : ''}
        </div>
    `;
}

/**
 * Render optimal preset main slot (clickable for lock management)
 */
function renderOptimalMainSlot(
    presetId: CompanionPresetId,
    companionKey: CompanionKey | null,
    size: number,
    isLocked: boolean
): string {
    if (!companionKey) {
        // Empty slot - clickable to select
        return `
            <div class="preset-slot optimal-main-slot"
                 data-preset="${presetId}"
                 data-slot-type="main"
                 data-slot-index="0"
                 style="
                    width: ${size}px;
                    height: ${size}px;
                    border: 2px dashed #666;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                 "
                 onmouseover="this.style.background='rgba(255,255,255,0.1)';"
                 onmouseout="this.style.background='rgba(255,255,255,0.05)';">
                <div style="font-size: ${size * 0.5}px; color: #888; font-weight: bold;">+</div>
            </div>
        `;
    }

    // Filled slot
    const [className, rarity] = companionKey.split('-');
    const config = RARITY_CONFIG[rarity as CompanionRarity] || RARITY_CONFIG['Normal'];
    const iconName = getClassWebpName(className as ClassName);
    const iconClass = `comp-image comp-preset-${className}`;

    return `
        <div class="preset-slot optimal-main-slot filled-slot"
             data-preset="${presetId}"
             data-slot-type="main"
             data-slot-index="0"
             data-companion="${companionKey}"
             style="
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(135deg, ${config.color}22, ${config.borderColor}44);
                border: 2px solid ${config.borderColor};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
             ">
            <!-- Companion icon (scaled up and clipped) -->
            <div style="
                position: absolute;
                width: ${size * 1.5}px;
                height: ${size * 1.5}px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <img src="media/classes/${iconName}.webp"
                     class="${iconClass}"
                     style="width: 100%; height: 100%; object-fit: contain;"
                     alt="${className}">
            </div>

            ${isLocked ? `
            <!-- Lock icon indicator -->
            <div style="
                position: absolute;
                top: 2px;
                left: 2px;
                font-size: ${size * 0.25}px;
                line-height: 1;
                background: rgba(239, 68, 68, 0.9);
                color: white;
                width: ${size * 0.35}px;
                height: ${size * 0.35}px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 10;
            ">🔒</div>
            ` : ''}
        </div>
    `;
}

/**
 * Render a read-only slot (for optimal presets - non-clickable)
 */
function renderReadOnlySlot(companionKey: CompanionKey | null, size: number): string {
    if (!companionKey) {
        // Empty slot
        return `
            <div class="optimal-readonly-slot" style="
                width: ${size}px;
                height: ${size}px;
                border: 2px dashed #444;
                border-radius: 8px;
                background: rgba(255,255,255,0.03);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.5;
             ">
                <div style="font-size: ${size * 0.5}px; color: #666; font-weight: bold;">+</div>
            </div>
        `;
    }

    // Filled slot (read-only)
    const [className, rarity] = companionKey.split('-');
    const config = RARITY_CONFIG[rarity as CompanionRarity] || RARITY_CONFIG['Normal'];

    // Use PNG icons for sub slots in optimal presets
    const iconName = getClassPngName(className as ClassName);
    const iconClass = `comp-image comp-preset-sub-${className}`;

    return `
        <div class="optimal-readonly-slot" style="
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(135deg, ${config.color}22, ${config.borderColor}44);
            border: 2px solid ${config.borderColor};
            border-radius: 8px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.8;
         ">
            <!-- Companion icon (scaled up and clipped) -->
            <div style="
                position: absolute;
                width: ${size * 1.5}px;
                height: ${size * 1.5}px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <img src="media/classes/${iconName}.png"
                     class="${iconClass}"
                     style="width: 100%; height: 100%; object-fit: contain;"
                     alt="${className}">
            </div>
        </div>
    `;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Attach event listeners to companion icons
 */
function attachCompanionIconListeners(): void {
    // Icon click to show detail panel
    document.querySelectorAll('.companion-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const target = icon as HTMLElement;
            const companionKey = target.dataset.companion as CompanionKey;
            const className = target.dataset.class as ClassName;
            const rarity = target.dataset.rarity as CompanionRarity;
            const borderColor = target.dataset.configBorder || '';
            const color = target.dataset.configColor || '';

            // Check if a preset slot is selected for assignment
            const selectedSlot = getSelectedSlotInfo();
            if (selectedSlot) {
                // Check if companion is locked and show visual feedback
                const companionData = loadoutStore.getCompanion(companionKey);
                if (!companionData?.unlocked) {
                    // Add shake animation
                    target.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        target.style.animation = '';
                    }, 500);
                }

                // Assign this companion to the selected slot (will check unlock status)
                assignCompanionToSlot(companionKey);
                return;
            }

            // Track current companion
            currentCompanion = { companionKey, className, rarity, borderColor, color };

            // Update active state
            document.querySelectorAll('.companion-icon').forEach(i => {
                (i as HTMLElement).style.boxShadow = 'none';
            });
            target.style.boxShadow = `0 0 0 3px ${borderColor}`;

            // Show detail panel
            showDetailPanel(companionKey, className, rarity, borderColor, color);
        });
    });
}

/**
 * Attach event listeners to preset slots
 */
function attachPresetEventListeners(): void {
    document.querySelectorAll('.preset-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            e.stopPropagation();
            handleSlotClick(slot as HTMLElement);
        });

        // Right-click to clear filled slot
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = slot as HTMLElement;
            const presetId = target.dataset.preset as CompanionPresetId;
            const slotType = target.dataset.slotType as 'main' | 'sub';
            const slotIndex = parseInt(target.dataset.slotIndex || '0');
            const companionKey = target.dataset.companion as CompanionKey | null;

            if (companionKey) {
                loadoutStore.clearPresetSlot(presetId, slotType, slotIndex);
                renderPresetsPanel();
            }
        });
    });
}

/**
 * Attach click outside listener to clear selection
 */
function attachClickOutsideListener(): void {
    // Remove existing listener if any
    const existingHandler = (window as any)._companionsClickOutsideHandler;
    if (existingHandler) {
        document.removeEventListener('click', existingHandler);
    }

    const handler = (e: Event) => {
        const selectedSlot = getSelectedSlotInfo();
        if (!selectedSlot) return;

        // Check if clicking outside of preset slots and companion icons
        const target = e.target as HTMLElement;
        const clickedSlot = target.closest('.preset-slot');
        const clickedIcon = target.closest('.companion-icon');

        if (!clickedSlot && !clickedIcon) {
            clearSelectionFeedback();
            clearSelectedSlot();
        }
    };

    (window as any)._companionsClickOutsideHandler = handler;
    document.addEventListener('click', handler);
}

/**
 * Handle slot click
 */
function handleSlotClick(slot: HTMLElement): void {
    const presetId = slot.dataset.preset as CompanionPresetId;
    const slotType = slot.dataset.slotType as 'main' | 'sub';
    const slotIndex = parseInt(slot.dataset.slotIndex || '0');
    const mainRarity = slot.dataset.mainRarity;

    // Check if this is an optimal preset slot
    const isOptimalSlot = slot.classList.contains('optimal-main-slot');

    // For optimal slots, toggle the lock instead of selecting for assignment
    if (isOptimalSlot) {
        // Only optimal-boss and optimal-normal have locked companions
        if (presetId === 'optimal-boss' || presetId === 'optimal-normal') {
            const currentLock = loadoutStore.getLockedMainCompanion(presetId);
            if (currentLock) {
                // Currently locked - clicking the slot should just show that it's locked
                return;
            }
        }
        // Not locked - proceed with selection
    }

    // Set this as the selected slot
    setSelectedSlot(presetId, slotType, slotIndex);

    // Clear any previous selection feedback
    clearSelectionFeedback();

    // Show selection feedback
    if (isOptimalSlot) {
        // For optimal slots, use custom feedback
        slot.style.boxShadow = '0 0 15px 3px rgba(255, 255, 255, 0.6)';
        slot.style.animation = 'pulse-glow 1s infinite';
        showTooltip(slot, 'Select main companion from grid');
        highlightSourceIcons();
    } else {
        showSelectionFeedback(presetId, mainRarity || '');
    }

    // Show the clear selection button
    const clearBtnContainer = document.getElementById('clear-slot-selection-container');
    if (clearBtnContainer) {
        clearBtnContainer.style.display = 'block';
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process effects and return formatted entries
 */
function processEffects(effects: Record<string, number>): ProcessedEffect[] {
    if (!effects || Object.keys(effects).length === 0) return [];

    return Object.entries(effects)
        .map(([stat, value]) => {
            // Determine if this stat should display as a percentage
            // Raw value stats (not divided by 10): HitChance, MaxHp, Attack, MainStat
            const isPercentage = !['HitChance', 'MaxHp', 'Attack', 'MainStat'].includes(stat);

            // Values are already pre-formatted from companion-data.js
            // Just format for display (avoid floating point issues)
            const formattedValue = typeof value === 'number' ?
                (Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, '')) : value;

            return {
                stat,
                displayName: formatStat(stat),
                value: formattedValue,
                isPercentage
            };
        });
}

/**
 * Format effects for display in detail panel
 */
function formatEffects(effects: Record<string, number>): string {
    if (!effects || Object.keys(effects).length === 0) return '';

    return processEffects(effects)
        .map(entry => `${entry.displayName}: +${entry.value}${entry.isPercentage ? '%' : ''}`)
        .join('<br>');
}

/**
 * Format stat name for display
 */
function formatStat(stat: string): string {
    const stats: Record<string, string> = {
        'maxhpr': 'Max HP',
        'maxhp': 'Max HP',
        'damage': 'Damage',
        'maxdamage': 'Max Damage Multiplier',
        'hitchance': 'Accuracy',
        'normaldamage': 'Normal Monster Damage',
        'critrate': 'Critical Rate',
        'attackspeed': 'Attack Speed',
        'attack speed': 'Attack Speed',
        'attackpowerincc': 'Status Effect Damage',
        'bossdamage': 'Boss Monster Damage',
        'mindamage': 'Min Damage Multiplier',
        'mainstat': 'Main Stat',
        'attack': 'Attack'
    };

    return stats[stat.toLowerCase()] || stat;
}

/**
 * Set the current companion and save its details
 */
function setCurrentCompanion(
    companionKey: CompanionKey,
    className: ClassName,
    rarity: CompanionRarity,
    borderColor: string,
    color: string
): void {
    currentCompanion = { companionKey, className, rarity, borderColor, color };
}

/**
 * Get png icon representation for class
 */
function getClassPngName(className: CompanionClass): string {
    const names: Record<ClassName, string> = {
        'Hero': 'hero',
        'DarkKnight': 'dk',
        'ArchMageIL': 'mage-il',
        'ArchMageFP': 'mage-fp',
        'BowMaster': 'bowmaster',
        'Marksman': 'marksman',
        'NightLord': 'nl',
        'Shadower': 'shadower'
    };
    return names[className];
}

/**
 * Get webp representation for class
 */
function getClassWebpName(className: CompanionClass): string {
    const names: Record<ClassName, string> = {
        'Hero': 'hero',
        'DarkKnight': 'dk',
        'ArchMageIL': 'il',
        'ArchMageFP': 'fp',
        'BowMaster': 'bow',
        'Marksman': 'mark',
        'NightLord': 'night',
        'Shadower': 'shad'
    };
    return names[className];
}

/**
 * Update the summary section
 */
function updateSummary(): void {
    const container = document.getElementById('companions-summary-content');
    if (!container) return;

    const totalEffects: Record<string, number> = {};

    // Calculate total inventory effects from all unlocked companions
    // Iterate over all possible companion combinations
    Object.entries(RARITY_CONFIG).forEach(([rarity, config]) => {
        config.classes.forEach(className => {
            const companionKey: CompanionKey = `${className}-${rarity}` as CompanionKey;
            const data = loadoutStore.getCompanion(companionKey);

            if (!data?.unlocked) return;

            const effects = getCompanionEffects(className, rarity, data.level);

            if (effects && effects.inventoryEffect) {
                Object.entries(effects.inventoryEffect).forEach(([stat, value]) => {
                    totalEffects[stat] = (totalEffects[stat] || 0) + value;
                });
            }
        });
    });

    // Render summary
    if (Object.keys(totalEffects).length === 0) {
        container.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">No unlocked companions</span>';
        return;
    }

    // Use the same processEffects logic for consistency
    const processedEffects = processEffects(totalEffects);

    // Render each effect as a compact inline badge
    container.innerHTML = processedEffects
        .map(entry => `
            <span style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: rgba(0, 122, 255, 0.1);
                padding: 3px 10px;
                border-radius: 12px;
                border: 1px solid var(--border-color);
                white-space: nowrap;
            ">
                <span style="font-weight: 600; color: var(--accent-primary);">${entry.displayName}:</span>
                <span style="color: var(--text-primary);">+${entry.value}${entry.isPercentage ? '%' : ''}</span>
            </span>
        `)
        .join('');
}

/**
 * Get equip effects for all companions in a preset
 */
function getPresetEquipEffects(presetId: CompanionPresetId): Record<string, number> {
    const preset = loadoutStore.getPreset(presetId);
    const allSlots: (CompanionKey | null)[] = [preset.main, ...preset.subs];
    const totalEffects: Record<string, number> = {};

    allSlots.forEach(companionKey => {
        if (!companionKey) return;

        const [className, rarity] = companionKey.split('-');
        const companionData = loadoutStore.getCompanion(companionKey);

        if (!companionData?.unlocked) return;

        const level = companionData.level || 1;
        const effects = getCompanionEffects(className, rarity, level);

        if (effects && effects.equipEffect) {
            Object.entries(effects.equipEffect).forEach(([stat, value]) => {
                totalEffects[stat] = (totalEffects[stat] || 0) + value;
            });
        }
    });

    return totalEffects;
}

/**
 * Get equip effects from preset data directly (for special optimal presets)
 */
function getPresetEquipEffectsFromData(preset: CompanionPreset): Record<string, number> {
    if (!preset) return {};
    const allSlots: (CompanionKey | null)[] = [preset.main, ...preset.subs];
    const totalEffects: Record<string, number> = {};

    allSlots.forEach(companionKey => {
        if (!companionKey) return;

        const [className, rarity] = companionKey.split('-');
        const companionData = loadoutStore.getCompanion(companionKey);

        if (!companionData?.unlocked) return;

        const level = companionData.level || 1;
        const effects = getCompanionEffects(className, rarity, level);

        if (effects && effects.equipEffect) {
            Object.entries(effects.equipEffect).forEach(([stat, value]) => {
                totalEffects[stat] = (totalEffects[stat] || 0) + value;
            });
        }
    });

    return totalEffects;
}

/**
 * Update ContributedStats with current preset's effects
 */
function updateContributedStatsForPreset(presetId: CompanionPresetId): void {
    const effects = getPresetEquipEffects(presetId);
    // TODO: Implement updateCompanionEquippedContributions
    // This will be added when integrating with state management
}

/**
 * Refresh the presets UI
 */
function refreshPresetsUI(): void {
    renderPresetsPanel();
}

// ============================================================================
// SLOT SELECTION MANAGEMENT
// ============================================================================

interface SlotSelection {
    presetId: CompanionPresetId;
    type: 'main' | 'sub';
    index: number;
}

function getSelectedSlotInfo(): SlotSelection | null {
    return (window as any)._selectedSlotInfo || null;
}

function setSelectedSlot(presetId: CompanionPresetId, type: 'main' | 'sub', index: number): void {
    (window as any)._selectedSlotInfo = { presetId, type, index };
}

function clearSelectedSlot(): void {
    (window as any)._selectedSlotInfo = null;
}

/**
 * Show selection feedback based on main companion's rarity
 */
function showSelectionFeedback(presetId: CompanionPresetId, mainRarity: string): void {
    const slot = getSelectedSlotInfo();
    if (!slot) return;

    const slotElement = document.querySelector(`[data-slot-id="${presetId}-${slot.type}-${slot.index}"]`) as HTMLElement;
    if (!slotElement) return;

    // Add common glow effect
    slotElement.style.boxShadow = '0 0 15px 3px rgba(255, 255, 255, 0.6)';
    slotElement.style.animation = 'pulse-glow 1s infinite';

    // Show tooltip and highlight source icons for all rarities
    showTooltip(slotElement, 'Select a companion from the left');
    highlightSourceIcons();
}

/**
 * Show tooltip above slot
 */
function showTooltip(slotElement: HTMLElement, text: string): void {
    const tooltip = document.createElement('div');
    tooltip.id = 'preset-selection-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        top: -35px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85em;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
    `;
    tooltip.textContent = text;
    slotElement.style.position = 'relative';
    slotElement.appendChild(tooltip);
}

/**
 * Highlight source companion icons (only unlocked ones)
 */
function highlightSourceIcons(): void {
    document.querySelectorAll('.companion-icon').forEach(icon => {
        const target = icon as HTMLElement;
        const companionKey = target.dataset.companion as CompanionKey;
        const companionData = loadoutStore.getCompanion(companionKey);

        // Only highlight unlocked companions
        if (companionData?.unlocked) {
            target.style.transition = 'all 0.3s ease';
            target.style.boxShadow = '0 0 20px 5px rgba(187, 119, 255, 0.4)';
            target.style.transform = 'scale(1.05)';
        }
    });
}

/**
 * Clear all selection feedback
 */
function clearSelectionFeedback(): void {
    // Remove glow and animation from slots
    document.querySelectorAll('.preset-slot').forEach(slot => {
        const target = slot as HTMLElement;
        target.style.boxShadow = '';
        target.style.animation = '';
    });

    // Remove tooltip
    const tooltip = document.getElementById('preset-selection-tooltip');
    if (tooltip) tooltip.remove();

    // Remove highlight from icons
    document.querySelectorAll('.companion-icon').forEach(icon => {
        const target = icon as HTMLElement;
        target.style.boxShadow = '';
        target.style.transform = '';
    });

    // Hide the clear selection button
    const clearBtnContainer = document.getElementById('clear-slot-selection-container');
    if (clearBtnContainer) {
        clearBtnContainer.style.display = 'none';
    }
}

/**
 * Assign companion to selected slot
 */
function assignCompanionToSlot(companionKey: CompanionKey): void {
    const slotInfo = getSelectedSlotInfo();
    if (!slotInfo) return;

    // Check if this is an optimal preset slot
    const isOptimalPreset = slotInfo.presetId === 'optimal-boss' || slotInfo.presetId === 'optimal-normal';

    // Check if companion is unlocked
    const companionData = loadoutStore.getCompanion(companionKey);
    if (!companionData?.unlocked) {
        // Show error feedback
        const slotSelector = isOptimalPreset
            ? `.optimal-main-slot[data-preset="${slotInfo.presetId}"]`
            : `[data-slot-id="${slotInfo.presetId}-${slotInfo.type}-${slotInfo.index}"]`;
        const slotElement = document.querySelector(slotSelector) as HTMLElement;
        if (slotElement) {
            showTooltip(slotElement, '❌ Companion not unlocked!');
            setTimeout(() => {
                const tooltip = document.getElementById('preset-selection-tooltip');
                if (tooltip) tooltip.remove();
            }, 1500);
        }
        return;
    }

    // For optimal presets, just set the locked main
    if (isOptimalPreset && slotInfo.type === 'main') {
        loadoutStore.setLockedMainCompanion(slotInfo.presetId, companionKey);
        clearSelectionFeedback();
        clearSelectedSlot();
        renderPresetsPanel();
        return;
    }

    // Check for duplicates in regular presets
    const preset = loadoutStore.getPreset(slotInfo.presetId);
    const allSlots: (CompanionKey | null)[] = [preset.main, ...preset.subs];

    const duplicateSlot = allSlots.find((slotKey, idx) => {
        if (slotInfo.type === 'main' && idx === 0) return false;
        if (slotInfo.type === 'sub' && idx === slotInfo.index + 1) return false;
        return slotKey === companionKey;
    });

    if (duplicateSlot) {
        const slotElement = document.querySelector(`[data-slot-id="${slotInfo.presetId}-${slotInfo.type}-${slotInfo.index}"]`) as HTMLElement;
        if (slotElement) {
            showTooltip(slotElement, '❌ Already equipped in this preset!');
            setTimeout(() => {
                const tooltip = document.getElementById('preset-selection-tooltip');
                if (tooltip) tooltip.remove();
            }, 1500);
        }
        return;
    }

    loadoutStore.setPresetSlot(slotInfo.presetId, slotInfo.type, slotInfo.index, companionKey);

    clearSelectionFeedback();
    clearSelectedSlot();
    renderPresetsPanel();
}

// ============================================================================
// GLOBAL WINDOW FUNCTIONS (for HTML onclick attributes)
// ============================================================================

/**
 * Toggle companion lock status
 */
(window as any).toggleCompanionLock = function(companionKey: CompanionKey): void {
    const current = loadoutStore.getCompanion(companionKey);
    if (!current) return;

    loadoutStore.updateCompanion(companionKey, {
        ...current,
        unlocked: !current.unlocked
    });

    // Re-render the grid
    const savedCompanion = currentCompanion;
    renderCompanionsGrid();
    updateSummary();
    refreshPresetsUI();

    // Re-open the detail panel if there was a selected companion
    if (savedCompanion) {
        setTimeout(() => {
            const icon = document.querySelector(`.companion-icon[data-companion="${savedCompanion.companionKey}"]`) as HTMLElement;
            if (icon) {
                icon.style.boxShadow = `0 0 0 3px ${savedCompanion.borderColor}`;
                showDetailPanel(
                    savedCompanion.companionKey,
                    savedCompanion.className,
                    savedCompanion.rarity,
                    savedCompanion.borderColor,
                    savedCompanion.color
                );
            }
        }, 0);
    }
};

/**
 * Handle level change
 */
(window as any).handleLevelChange = function(companionKey: CompanionKey, newLevel: string): void {
    const level = parseInt(newLevel);
    const maxLevel = getMaxCompanionLevel();

    if (isNaN(level) || level < 1 || level > maxLevel) {
        return;
    }

    const current = loadoutStore.getCompanion(companionKey);
    if (!current) return;

    loadoutStore.updateCompanion(companionKey, {
        ...current,
        level: level
    });

    // Update the icon level text in real-time
    const levelDisplay = document.querySelector(`.companion-icon-level[data-companion="${companionKey}"]`) as HTMLElement;
    if (levelDisplay) {
        levelDisplay.textContent = `Lv.${level}`;
    }

    // Only update the detail panel and summary, not the whole grid
    if (currentCompanion && currentCompanion.companionKey === companionKey) {
        showDetailPanel(
            currentCompanion.companionKey,
            currentCompanion.className,
            currentCompanion.rarity,
            currentCompanion.borderColor,
            currentCompanion.color
        );
    }
    updateSummary();
    refreshPresetsUI();
};

/**
 * Clear the companion from the selected slot
 */
(window as any).clearSelectedSlotCompanion = function(): void {
    const slotInfo = getSelectedSlotInfo();
    if (!slotInfo) return;

    // Clear the companion from the slot
    loadoutStore.clearPresetSlot(slotInfo.presetId, slotInfo.type, slotInfo.index);

    // Clear the selection feedback
    clearSelectionFeedback();
    clearSelectedSlot();

    // Re-render the presets panel
    renderPresetsPanel();
};

/**
 * Toggle preset DPS comparison visibility
 */
(window as any).togglePresetDpsComparison = function(checked: boolean): void {
    loadoutStore.setShowPresetDpsComparison(checked);
    renderPresetsPanel();
};

/**
 * Toggle optimal preset lock
 */
(window as any).toggleOptimalLock = function(optimalType: 'optimal-boss' | 'optimal-normal'): void {
    const currentLock = loadoutStore.getLockedMainCompanion(optimalType);

    if (currentLock) {
        // Currently locked - clear the lock
        loadoutStore.setLockedMainCompanion(optimalType, null);
        clearSelectedSlot();
        clearSelectionFeedback();
        renderPresetsPanel();
    } else {
        // Currently unlocked - select the main slot for assignment
        setSelectedSlot(optimalType, 'main', 0);

        // Clear any previous selection feedback
        clearSelectionFeedback();

        // Re-render the presets panel
        renderPresetsPanel();

        // Apply glow effects AFTER render completes
        setTimeout(() => {
            // Find the preset row container
            const presetRow = document.querySelector(`.preset-row[data-preset="${optimalType}"]`) as HTMLElement;
            if (presetRow) {
                // Make all slots in this preset row glow (main + readonly subs)
                const allSlots = presetRow.querySelectorAll('.optimal-main-slot, .optimal-readonly-slot');
                allSlots.forEach(slot => {
                    const target = slot as HTMLElement;
                    target.style.boxShadow = '0 0 15px 3px rgba(255, 255, 255, 0.6)';
                    target.style.animation = 'pulse-glow 1s infinite';
                });

                // Show tooltip on main slot
                const mainSlot = presetRow.querySelector('.optimal-main-slot') as HTMLElement;
                if (mainSlot) {
                    showTooltip(mainSlot, 'Select main companion from grid');
                }

                // Highlight companion icons in grid
                highlightSourceIcons();
            }
        }, 0);
    }
};

/**
 * Equip a preset with confirmation modal
 */
(window as any).equipPreset = async function(presetId: CompanionPresetId): Promise<void> {
    const currentPresetId = loadoutStore.getEquippedPresetId();
    if (currentPresetId === presetId) return; // Already equipped

    const newPresetEffects = getPresetEquipEffects(presetId);
    const currentPresetEffects = getPresetEquipEffects(currentPresetId);

    // Check if new preset has any equip effects
    const hasEquipEffects = Object.keys(newPresetEffects).length > 0 || Object.keys(currentPresetEffects).length > 0;

    if (hasEquipEffects) {
        // Show confirmation modal
        const userChoice = await showEquipConfirmModal(presetId, currentPresetEffects, newPresetEffects);

        if (userChoice === 'cancel') {
            return;
        }

        if (userChoice === 'no') {
            // User says stats are NOT incorporated - just switch presets
            loadoutStore.setEquippedPresetId(presetId);
            updateContributedStatsForPreset(presetId);
            renderPresetsPanel();
        } else if (userChoice === 'yes') {
            // User says stats ARE incorporated - need to subtract old and add new
            // Subtract current preset effects from input stats (excluding Attack flat stat)
            Object.entries(currentPresetEffects).forEach(([stat, value]) => {
                if (stat !== 'Attack') {
                    subtractStat(stat, value);
                }
            });

            // Add new preset effects to input stats (excluding Attack flat stat)
            Object.entries(newPresetEffects).forEach(([stat, value]) => {
                if (stat !== 'Attack') {
                    addStat(stat, value);
                }
            });

            loadoutStore.setEquippedPresetId(presetId);
            updateContributedStatsForPreset(presetId);
            renderPresetsPanel();
        }
    } else {
        // No equip effects - just switch presets
        loadoutStore.setEquippedPresetId(presetId);
        updateContributedStatsForPreset(presetId);
        renderPresetsPanel();
    }
};

/**
 * Show equip preset confirmation modal
 */
function showEquipConfirmModal(
    presetId: CompanionPresetId,
    currentEffects: Record<string, number>,
    newEffects: Record<string, number>
): Promise<'yes' | 'no' | 'cancel'> {
    return new Promise((resolve) => {
        // Remove any existing modal
        const existingModal = document.getElementById('equip-preset-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'equip-preset-modal';
        overlay.className = 'modal-overlay';

        // Create modal box
        const modalBox = document.createElement('div');
        modalBox.className = 'modal-box';

        // Create title
        const title = document.createElement('h2');
        title.className = 'modal-title';
        title.textContent = `Equip ${presetId.replace('preset', '#')}`;

        // Create message
        const message = document.createElement('p');
        message.className = 'modal-message';
        message.textContent = 'Are the stats from the currently equipped preset already incorporated in your input stats?';

        // Create stat comparison table
        const tableContainer = document.createElement('div');
        tableContainer.className = 'stat-comparison-table';
        tableContainer.innerHTML = createStatComparisonTable(currentEffects, newEffects);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-buttons';

        // Create Yes button
        const yesBtn = document.createElement('button');
        yesBtn.className = 'modal-btn btn-yes';
        yesBtn.textContent = 'Yes - Adjust Stats';
        yesBtn.onclick = () => {
            overlay.remove();
            resolve('yes');
        };

        // Create No button
        const noBtn = document.createElement('button');
        noBtn.className = 'modal-btn btn-no';
        noBtn.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))';
        noBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        noBtn.style.color = 'rgba(255, 255, 255, 0.7)';
        noBtn.textContent = 'No - Just Switch';
        noBtn.onclick = () => {
            overlay.remove();
            resolve('no');
        };

        // Hover for neutral No button
        noBtn.onmouseenter = () => {
            noBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        noBtn.onmouseleave = () => {
            noBtn.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))';
        };

        // Create Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn btn-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            overlay.remove();
            resolve('cancel');
        };

        // Assemble modal
        buttonContainer.appendChild(yesBtn);
        buttonContainer.appendChild(noBtn);
        buttonContainer.appendChild(cancelBtn);

        modalBox.appendChild(title);
        modalBox.appendChild(message);
        modalBox.appendChild(tableContainer);
        modalBox.appendChild(buttonContainer);

        overlay.appendChild(modalBox);
        document.body.appendChild(overlay);

        // Handle ESC key
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
                resolve('cancel');
            }
        };
        document.addEventListener('keydown', escHandler);

        // Focus on Yes button by default
        yesBtn.focus();
    });
}

/**
 * Create stat comparison table HTML
 */
function createStatComparisonTable(
    currentEffects: Record<string, number>,
    newEffects: Record<string, number>
): string {
    // Get all unique stats from both effects (excluding Attack)
    const allStats = new Set([
        ...Object.keys(currentEffects),
        ...Object.keys(newEffects)
    ]);

    // Filter out Attack stat
    allStats.delete('Attack');

    if (allStats.size === 0) {
        return '<div style="text-align: center; color: var(--text-secondary);">No stat changes</div>';
    }

    let rows = '';
    for (const stat of allStats) {
        const currentValue = currentEffects[stat] || 0;
        const newValue = newEffects[stat] || 0;

        // Determine if this stat displays as a percentage
        const isPercentage = !['hitChance', 'maxHp', 'attack', 'mainStat'].includes(stat);

        const formatValue = (val: number): string => {
            if (val === 0) return '-';
            const displayValue = isPercentage ? val.toFixed(1).replace(/\.0$/, '') : val;
            return `+${displayValue}${isPercentage ? '%' : ''}`;
        };

        // Determine color class
        const currentClass = currentValue > 0 ? 'stat-value-negative' : 'stat-value-neutral';
        const newClass = newValue > 0 ? 'stat-value-positive' : 'stat-value-neutral';

        rows += `
            <tr>
                <td>${formatStat(stat)}</td>
                <td class="${currentClass}">${formatValue(currentValue)}</td>
                <td class="${newClass}">${formatValue(newValue)}</td>
            </tr>
        `;
    }

    return `
        <table class="stat-table">
            <thead>
                <tr>
                    <th>Stat</th>
                    <th>Current Preset</th>
                    <th>New Preset</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}
