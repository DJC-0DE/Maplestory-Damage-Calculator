import { getPresets, getPreset, setPresetSlot, clearPresetSlot, getSelectedSlotInfo, setSelectedSlot, clearSelectedSlot, getCompanion, getEquippedPresetId, setEquippedPresetId, updateCompanionEquippedContributions, getShowPresetDpsComparison, setShowPresetDpsComparison, getLockedMainCompanion, setLockedMainCompanion } from '@core/state/state.js';
import { saveToLocalStorage } from '@core/state/storage.js';
import { getCompanionEffects, getMaxCompanionLevel } from '@core/companions/index.js';
import { addStat, subtractStat, Stat } from '@core/services/stat-inputs-service.js';
import { calculateBothDpsDifferences, presetHasAnyCompanion, generateOptimalPreset } from '@core/companions/companion-logic.js';

// Rarity configurations - same as in companions-ui.js
const RARITY_CONFIG = {
    'Normal': { color: '#ffffff', borderColor: '#888888' },
    'Rare': { color: '#00ccff', borderColor: '#5d87df' },
    'Epic': { color: '#bb77ff', borderColor: '#7e5ad4' },
    'Unique': { color: '#ffaa00', borderColor: '#e8a019' },
    'Legendary': { color: '#1fffca', borderColor: '#2dbd7a' }
};

/**
 * Initialize the presets UI
 */
export function initializePresetsUI() {
    // Update ContributedStats for current equipped preset on init
    updateContributedStatsForPreset(getEquippedPresetId());
    renderPresetsPanel();
}

/**
 * Render the presets panel
 */
function renderPresetsPanel() {
    const container = document.getElementById('companions-presets-container');
    if (!container) return;

    const presets = getPresets();
    const showDpsComparison = getShowPresetDpsComparison();
    const equippedPresetId = getEquippedPresetId();

    // Get current and all preset effects for DPS comparison
    const currentPresetEffects = getPresetEquipEffects(equippedPresetId);

    // Generate optimal presets for boss and normal damage
    const maxBossDpsPreset = generateOptimalPreset('bossDamage', getCompanionEffects, getCompanion, getMaxCompanionLevel, getLockedMainCompanion('optimal-boss'));
    const maxNormalDpsPreset = generateOptimalPreset('normalDamage', getCompanionEffects, getCompanion, getMaxCompanionLevel, getLockedMainCompanion('optimal-normal'));

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

    // Render 10 user presets
    for (let i = 1; i <= 5; i++) {
        const presetId = `preset${i}`;
        const presetData = presets[presetId];
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
function renderPresetRow(presetId, presetData, isEquipped, showDpsComparison, currentPresetEffects, isSpecialPreset = false, customLabel = null) {
    // Format number helper
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toString();
    };

    // Determine label
    const labelText = customLabel || presetId.replace('preset', '#');

    // Determine border color (gold for special presets)
    const borderColor = isSpecialPreset ? '#fbbf24' : (isEquipped ? '#10b981' : 'var(--border-color)');

    // For optimal presets, check if main is locked
    const isLocked = isSpecialPreset && getLockedMainCompanion(presetId);

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
                    <button onclick="toggleOptimalLock('${presetId}')" style="
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
                    <button onclick="equipPreset('${presetId}')" style="
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
        // For special presets (optimal-boss, optimal-normal), get effects from the presetData directly
        // For regular presets, use the state lookup
        const targetPresetEffects = isSpecialPreset
            ? getPresetEquipEffectsFromData(presetData)
            : getPresetEquipEffects(presetId);

        const dpsResults = calculateBothDpsDifferences(currentPresetEffects, targetPresetEffects);

        html += `
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
    }

    html += `</div>`;
    return html;
}

/**
 * Get equip effects for all companions in a preset
 */
export function getPresetEquipEffects(presetId) {
    const preset = getPreset(presetId);
    const allSlots = [preset.main, ...preset.subs];
    const totalEffects = {};

    allSlots.forEach(companionKey => {
        if (!companionKey) return;

        const [className, rarity] = companionKey.split('-');
        const companionData = getCompanion(companionKey);

        if (!companionData.unlocked) return;

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
function getPresetEquipEffectsFromData(preset) {
    if (!preset) return {};
    const allSlots = [preset.main, ...preset.subs];
    const totalEffects = {};

    allSlots.forEach(companionKey => {
        if (!companionKey) return;

        const [className, rarity] = companionKey.split('-');
        const companionData = getCompanion(companionKey);

        if (!companionData.unlocked) return;

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
 * Render a single slot
 */
function renderSlot(presetId, slotType, slotIndex, companionKey, size) {
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
    const config = RARITY_CONFIG[rarity] || RARITY_CONFIG['Normal'];
    const companionData = getCompanion(companionKey);
    const level = companionData.level || 1;
    const isLocked = !companionData.unlocked;

    // For main slots: use webp with preset-specific class
    // For sub slots: use png with preset-specific sub class
    const isMain = slotType === 'main';
    const iconName = isMain ? getClassWebpName(className) : getClassPngName(className);
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
function renderOptimalMainSlot(presetId, companionKey, size, isLocked) {
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
    const config = RARITY_CONFIG[rarity] || RARITY_CONFIG['Normal'];
    const iconName = getClassWebpName(className);
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
function renderReadOnlySlot(companionKey, size) {
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
    const config = RARITY_CONFIG[rarity] || RARITY_CONFIG['Normal'];

    // Use PNG icons for sub slots in optimal presets
    const iconName = getClassPngName(className);
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

/**
 * Get webp representation for class
 */
function getClassWebpName(className) {
    const names = {
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
 * Get png representation for class
 */
function getClassPngName(className) {
    const names = {
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
 * Attach event listeners to preset slots
 */
function attachPresetEventListeners() {
    document.querySelectorAll('.preset-slot').forEach(slot => {
        slot.addEventListener('click', (e) => {
            e.stopPropagation();
            handleSlotClick(slot);
        });

        // Right-click to clear filled slot
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const presetId = slot.dataset.preset;
            const slotType = slot.dataset.slotType;
            const slotIndex = parseInt(slot.dataset.slotIndex);
            const companionKey = slot.dataset.companion;

            if (companionKey) {
                clearPresetSlot(presetId, slotType, slotIndex);
                renderPresetsPanel();
                saveToLocalStorage();
            }
        });
    });

    // Click outside to clear selection
    document.addEventListener('click', (e) => {
        const selectedSlot = getSelectedSlotInfo();
        if (!selectedSlot) return;

        // Check if clicking outside of preset slots and companion icons
        const clickedSlot = e.target.closest('.preset-slot');
        const clickedIcon = e.target.closest('.companion-icon');

        if (!clickedSlot && !clickedIcon) {
            clearSelectionFeedback();
            clearSelectedSlot();
        }
    });
}

/**
 * Handle slot click
 */
function handleSlotClick(slot) {
    const presetId = slot.dataset.preset;
    const slotType = slot.dataset.slotType;
    const slotIndex = parseInt(slot.dataset.slotIndex);
    const companionKey = slot.dataset.companion;
    const mainRarity = slot.dataset.mainRarity;

    // Check if this is an optimal preset slot
    const isOptimalSlot = slot.classList.contains('optimal-main-slot');

    // For optimal slots, toggle the lock instead of selecting for assignment
    if (isOptimalSlot) {
        const currentLock = getLockedMainCompanion(presetId);
        if (currentLock) {
            // Currently locked - clicking the slot should just show that it's locked
            // (user should use the CLEAR LOCK button to unlock)
            return;
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
        showSelectionFeedback(presetId, mainRarity);
    }

    // Show the clear selection button
    const clearBtnContainer = document.getElementById('clear-slot-selection-container');
    if (clearBtnContainer) {
        clearBtnContainer.style.display = 'block';
    }
}

/**
 * Show selection feedback based on main companion's rarity
 */
function showSelectionFeedback(presetId, mainRarity) {
    const slot = getSelectedSlotInfo();
    if (!slot) return;

    const slotElement = document.querySelector(`[data-slot-id="${presetId}-${slot.type}-${slot.index}"]`);
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
function showTooltip(slotElement, text) {
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
function highlightSourceIcons() {
    document.querySelectorAll('.companion-icon').forEach(icon => {
        const companionKey = icon.dataset.companion;
        const companionData = getCompanion(companionKey);

        // Only highlight unlocked companions
        if (companionData && companionData.unlocked) {
            icon.style.transition = 'all 0.3s ease';
            icon.style.boxShadow = '0 0 20px 5px rgba(187, 119, 255, 0.4)';
            icon.style.transform = 'scale(1.05)';
        }
    });
}

/**
 * Show connector lines from slot to icon grid
 */
function showConnectorLines(slotElement) {
    // Create SVG overlay
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'preset-connector-lines';
    svg.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999;
    `;

    const slotRect = slotElement.getBoundingClientRect();
    const iconGrid = document.querySelector('.companion-icon');
    if (!iconGrid) return;
    const gridRect = iconGrid.getBoundingClientRect();

    // Create line from slot to grid
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', slotRect.left + slotRect.width / 2);
    line.setAttribute('y1', slotRect.top);
    line.setAttribute('x2', gridRect.right);
    line.setAttribute('y2', slotRect.top);
    line.setAttribute('stroke', '#ffaa00');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-dasharray', '10,5');
    line.style.animation = 'dash 1s linear infinite';

    svg.appendChild(line);
    document.body.appendChild(svg);
}

/**
 * Clear all selection feedback
 */
export function clearSelectionFeedback() {
    // Remove glow and animation from slots
    document.querySelectorAll('.preset-slot').forEach(slot => {
        slot.style.boxShadow = '';
        slot.style.animation = '';
    });

    // Remove tooltip
    const tooltip = document.getElementById('preset-selection-tooltip');
    if (tooltip) tooltip.remove();

    // Remove highlight from icons
    document.querySelectorAll('.companion-icon').forEach(icon => {
        icon.style.boxShadow = '';
        icon.style.transform = '';
    });

    // Remove connector lines
    const svg = document.getElementById('preset-connector-lines');
    if (svg) svg.remove();

    // Hide the clear selection button
    const clearBtnContainer = document.getElementById('clear-slot-selection-container');
    if (clearBtnContainer) {
        clearBtnContainer.style.display = 'none';
    }
}

/**
 * Assign companion to selected slot (called from companions-ui.js)
 */
export function assignCompanionToSlot(companionKey) {
    const slotInfo = getSelectedSlotInfo();
    if (!slotInfo) return;

    // Check if this is an optimal preset slot
    const isOptimalPreset = slotInfo.presetId === 'optimal-boss' || slotInfo.presetId === 'optimal-normal';

    // Check if companion is unlocked
    const companionData = getCompanion(companionKey);
    if (!companionData.unlocked) {
        // Show error feedback
        const slotSelector = isOptimalPreset
            ? `.optimal-main-slot[data-preset="${slotInfo.presetId}"]`
            : `[data-slot-id="${slotInfo.presetId}-${slotInfo.type}-${slotInfo.index}"]`;
        showTooltip(document.querySelector(slotSelector), '❌ Companion not unlocked!');
        setTimeout(() => {
            const tooltip = document.getElementById('preset-selection-tooltip');
            if (tooltip) tooltip.remove();
        }, 1500);
        return;
    }

    // For optimal presets, just set the locked main (no duplicate check needed for main slot)
    if (isOptimalPreset && slotInfo.type === 'main') {
        setLockedMainCompanion(slotInfo.presetId, companionKey);
        clearSelectionFeedback();
        clearSelectedSlot();
        renderPresetsPanel();
        saveToLocalStorage();
        return;
    }

    // Check if this companion (same class + rarity) is already equipped in this preset
    const preset = getPreset(slotInfo.presetId);
    const allSlots = [preset.main, ...preset.subs];

    // Check if companion exists in any slot (excluding the current slot being assigned)
    const duplicateSlot = allSlots.find((slotKey, idx) => {
        // Skip the current slot we're assigning to
        if (slotInfo.type === 'main' && idx === 0) return false;
        if (slotInfo.type === 'sub' && idx === slotInfo.index + 1) return false;
        return slotKey === companionKey;
    });

    if (duplicateSlot) {
        showTooltip(
            document.querySelector(`[data-slot-id="${slotInfo.presetId}-${slotInfo.type}-${slotInfo.index}"]`),
            '❌ Already equipped in this preset!'
        );
        setTimeout(() => {
            const tooltip = document.getElementById('preset-selection-tooltip');
            if (tooltip) tooltip.remove();
        }, 1500);
        return;
    }

    setPresetSlot(slotInfo.presetId, slotInfo.type, slotInfo.index, companionKey);

    clearSelectionFeedback();
    clearSelectedSlot();

    // Re-render the presets panel
    renderPresetsPanel();
    saveToLocalStorage();
}

/**
 * Refresh the presets UI
 */
export function refreshPresetsUI() {
    renderPresetsPanel();
}

/**
 * Update ContributedStats with current preset's effects
 * This is called when the equipped preset changes
 */
export function updateContributedStatsForPreset(presetId) {
    // Get the preset effects
    const effects = getPresetEquipEffects(presetId);

    // Use the centralized update function which will notify all listeners
    updateCompanionEquippedContributions(effects);
}

/**
 * Format stat name for display (same as in companions-ui.js)
 */
function formatStat(stat) {
    const stats = {
        'maxHpR': 'Max HP %',
        'maxHp': 'Max HP',
        'damage': 'Damage',
        'maxDamage': 'Max Damage Multiplier',
        'hitChance': 'Accuracy',
        'normalDamage': 'Normal Monster Damage',
        'critRate': 'Critical Rate',
        'attackSpeed': 'Attack Speed',
        'bossDamage': 'Boss Monster Damage',
        'minDamage': 'Min Damage Multiplier',
        'mainStat': 'Main Stat',
        'attack': 'Attack'
    };
    return stats[stat] || stat;
}

/**
 * Create stat comparison table HTML
 */
function createStatComparisonTable(currentEffects, newEffects) {
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
        // Raw value stats (not divided by 10): hitChance, maxHp, attack, mainStat
        // Note: Values are now pre-formatted in companion-data.js
        const isPercentage = !["hitChance", 'maxHp', 'attack', 'mainStat'].includes(stat);

        const formatValue = (val) => {
            if (val === 0) return '-';
            // Values are already pre-formatted from companion-data.js
            const displayValue = isPercentage ? val.toFixed(1).replace(/\.0$/, '') : val;
            return `+${displayValue}${isPercentage ? '%' : ''}`;
        };

        // Determine color class for current value (being removed)
        const currentClass = currentValue > 0 ? 'stat-value-negative' : 'stat-value-neutral';
        // Determine color class for new value (being added)
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

/**
 * Show equip preset confirmation modal
 * Returns Promise that resolves with 'yes', 'no', or 'cancel'
 */
function showEquipConfirmModal(presetId, currentEffects, newEffects) {
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

        // Create Yes button (stats ARE incorporated - need to adjust)
        const yesBtn = document.createElement('button');
        yesBtn.className = 'modal-btn btn-yes';
        yesBtn.textContent = 'Yes - Adjust Stats';
        yesBtn.onclick = () => {
            overlay.remove();
            resolve('yes');
        };

        // Create No button (stats NOT incorporated - just switch)
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
        const escHandler = (e) => {
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
 * Global function to equip a preset (called from HTML button)
 */
window.equipPreset = async function(presetId) {
    const currentPresetId = getEquippedPresetId();
    if (currentPresetId === presetId) return; // Already equipped

    const newPresetEffects = getPresetEquipEffects(presetId);
    const currentPresetEffects = getPresetEquipEffects(currentPresetId);

    // Check if new preset has any equip effects
    const hasEquipEffects = Object.keys(newPresetEffects).length > 0 || Object.keys(currentPresetEffects).length > 0;

    if (hasEquipEffects) {
        // Show confirmation modal
        const userChoice = await showEquipConfirmModal(presetId, currentPresetEffects, newPresetEffects);

        if (userChoice === 'cancel') {
            // User cancelled - do nothing
            return;
        }

        if (userChoice === 'no') {
            // User says stats are NOT incorporated - just switch presets
            setEquippedPresetId(presetId);
            updateContributedStatsForPreset(presetId);
            renderPresetsPanel();
            saveToLocalStorage();
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

            setEquippedPresetId(presetId);
            updateContributedStatsForPreset(presetId);
            renderPresetsPanel();
            saveToLocalStorage();
        }
    } else {
        // No equip effects - just switch presets
        setEquippedPresetId(presetId);
        updateContributedStatsForPreset(presetId);
        renderPresetsPanel();
        saveToLocalStorage();
    }
};

/**
 * Global function to clear the companion from the selected slot (called from HTML button)
 */
window.clearSelectedSlotCompanion = function() {
    const slotInfo = getSelectedSlotInfo();
    if (!slotInfo) return;

    // Clear the companion from the slot
    clearPresetSlot(slotInfo.presetId, slotInfo.type, slotInfo.index);

    // Clear the selection feedback
    clearSelectionFeedback();
    clearSelectedSlot();

    // Re-render the presets panel and save
    renderPresetsPanel();
    saveToLocalStorage();
};

/**
 * Global function to toggle preset DPS comparison visibility
 */
window.togglePresetDpsComparison = function(checked) {
    setShowPresetDpsComparison(checked);
    renderPresetsPanel();
    saveToLocalStorage();
};

/**
 * Global function to toggle optimal preset lock
 */
window.toggleOptimalLock = function(optimalType) {
    const currentLock = getLockedMainCompanion(optimalType);

    if (currentLock) {
        // Currently locked - clear the lock
        setLockedMainCompanion(optimalType, null);
        clearSelectedSlot();
        clearSelectionFeedback();
        renderPresetsPanel();
        saveToLocalStorage();
    } else {
        // Currently unlocked - select the main slot for assignment
        setSelectedSlot(optimalType, 'main', 0);

        // Clear any previous selection feedback
        clearSelectionFeedback();

        // Save state first
        saveToLocalStorage();

        // Re-render the presets panel
        renderPresetsPanel();

        // Apply glow effects AFTER render completes
        setTimeout(() => {
            // Find the preset row container
            const presetRow = document.querySelector(`.preset-row[data-preset="${optimalType}"]`);
            if (presetRow) {
                // Make all slots in this preset row glow (main + readonly subs)
                const allSlots = presetRow.querySelectorAll('.optimal-main-slot, .optimal-readonly-slot');
                allSlots.forEach(slot => {
                    slot.style.boxShadow = '0 0 15px 3px rgba(255, 255, 255, 0.6)';
                    slot.style.animation = 'pulse-glow 1s infinite';
                });

                // Show tooltip on main slot
                const mainSlot = presetRow.querySelector('.optimal-main-slot');
                if (mainSlot) {
                    showTooltip(mainSlot, 'Select main companion from grid');
                }

                // Highlight companion icons in grid
                highlightSourceIcons();
            }
        }, 0);
    }
};

// Add CSS animations for feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 15px 3px rgba(255, 255, 255, 0.6); }
        50% { box-shadow: 0 0 25px 5px rgba(255, 255, 255, 0.8); }
    }
    @keyframes dash {
        to { stroke-dashoffset: -30; }
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-5px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
    }

    /* Modal Styles */
    @keyframes modal-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes modal-scale-in {
        from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 9999;
        animation: modal-fade-in 0.2s ease-out;
    }

    .modal-box {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        max-width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        background: var(--background, #1a1a2e);
        border: 2px solid;
        border-image: linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6) 1;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: modal-scale-in 0.2s ease-out;
    }

    .modal-title {
        margin: 0 0 16px 0;
        font-size: 1.5em;
        font-weight: 700;
        color: var(--text-primary, #ffffff);
        text-align: center;
    }

    .modal-message {
        margin: 0 0 20px 0;
        font-size: 0.95em;
        color: var(--text-secondary, #b0b0b0);
        text-align: center;
        line-height: 1.5;
    }

    .stat-comparison-table {
        margin: 20px 0;
        padding: 16px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        border: 1px solid var(--border-color, #333);
    }

    .stat-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9em;
    }

    .stat-table th {
        text-align: left;
        padding: 8px;
        font-weight: 600;
        color: var(--text-secondary, #b0b0b0);
        border-bottom: 1px solid var(--border-color, #333);
    }

    .stat-table td {
        padding: 8px;
        color: var(--text-primary, #ffffff);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .stat-table tr:last-child td {
        border-bottom: none;
    }

    .stat-value-positive {
        color: #10b981;
        font-weight: 600;
    }

    .stat-value-negative {
        color: #ef4444;
        font-weight: 600;
    }

    .stat-value-neutral {
        color: var(--text-secondary, #b0b0b0);
    }

    .modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 24px;
    }

    .modal-btn {
        padding: 12px 24px;
        border: 2px solid;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.95em;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 120px;
    }

    .modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .modal-btn:active {
        transform: translateY(0);
    }

    .btn-yes {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.1));
        border-color: #10b981;
        color: #10b981;
    }

    .btn-yes:hover {
        background: rgba(16, 185, 129, 0.25);
    }

    .btn-no {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.1));
        border-color: #f59e0b;
        color: #f59e0b;
    }

    .btn-no:hover {
        background: rgba(245, 158, 11, 0.25);
    }

    .btn-cancel {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.1));
        border-color: #6b7280;
        color: #6b7280;
    }

    .btn-cancel:hover {
        background: rgba(107, 114, 128, 0.25);
    }
`;
document.head.appendChild(style);
