import { getCompanionEffects, getMaxCompanionLevel } from '@core/companions/index.js';
import { updateCompanion, getCompanionsState, getCompanion, getSelectedSlotInfo, clearSelectedSlot } from '@core/state/state.js';
import { saveToLocalStorage } from '@core/state/storage.js';
import { initializePresetsUI, assignCompanionToSlot, clearSelectionFeedback, refreshPresetsUI } from '@ui/companions-presets-ui.js';

// Mapping of class names to display names
const CLASS_DISPLAY_NAMES = {
    'Hero': 'Hero',
    'DarkKnight': 'Dark Knight',
    'ArchMageIL': 'I/L Mage',
    'ArchMageFP': 'F/P Mage',
    'BowMaster': 'Bow Master',
    'Marksman': 'Marksman',
    'NightLord': 'Night Lord',
    'Shadower': 'Shadower'
};

// Class order for companions
const CLASS_ORDER = ['Hero', 'DarkKnight', 'ArchMageIL', 'ArchMageFP', 'BowMaster', 'Marksman', 'NightLord', 'Shadower'];

// Rarity configurations
const RARITY_CONFIG = {
    'Normal': {
        color: '#ffffff',
        borderColor: '#888888',
        count: 4,
        classes: ['Hero', 'ArchMageIL', 'BowMaster', 'Shadower'] // Only first 4 classes
    },
    'Rare': {
        color: '#00ccff',
        borderColor: '#5d87df',
        count: 8,
        classes: CLASS_ORDER // All 8 classes
    },
    'Epic': {
        color: '#bb77ff',
        borderColor: '#7e5ad4',
        count: 8,
        classes: CLASS_ORDER
    },
    'Unique': {
        color: '#ffaa00',
        borderColor: '#e8a019',
        count: 8,
        classes: CLASS_ORDER
    },
    'Legendary': {
        color: '#1fffca',
        borderColor: '#2dbd7a',
        count: 8,
        classes: CLASS_ORDER
    }
};

/**
 * Initialize the companions UI
 */
export function initializeCompanionsUI() {
    renderCompanionsGrid();
    updateSummary();
    initializePresetsUI();
}

/**
 * Render the companions grid
 */
function renderCompanionsGrid() {
    const container = document.getElementById('companions-grid-container');
    if (!container) return;

    // Render icon grid and detail panel as separate flex items
    // Note: presets are rendered separately by initializePresetsUI()
    let html = `
        <!-- Icon Grid wrapper -->
        <div class="companions-icon-grid-wrapper">
            <div class="companions-icon-grid">
                ${renderIconGrid()}
            </div>

            <!-- Clear Slot Button (shown when slot is selected) -->
            <div id="clear-slot-selection-container" style="display: none; margin-top: 15px;">
                <button id="clear-slot-selection-btn" onclick="clearSelectedSlotCompanion()" style="
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
    attachCompanionEventListeners();
}

/**
 * Render placeholder for detail panel
 */
function renderDetailPlaceholder() {
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
function renderIconGrid() {
    let html = '';

    // Create grid for all rarity-class combinations
    // Normal: 4 classes, Rare/Epic/Unique/Legendary: 8 classes each = 36 total
    Object.entries(RARITY_CONFIG).forEach(([rarity, config]) => {
        config.classes.forEach(className => {
            const companionKey = `${className}-${rarity}`;
            const companionData = getCompanion(companionKey);
            const isUnlocked = companionData.unlocked;
            const level = companionData.level || 1;

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

// Track currently selected companion for re-opening detail panel after updates
let currentCompanion = null;

/**
 * Set the current companion and save its details
 */
function setCurrentCompanion(companionKey, className, rarity, borderColor, color) {
    currentCompanion = { companionKey, className, rarity, borderColor, color };
}

/**
 * Get png icon representation for class
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
 * Process effects and return formatted entries
 * Shared logic used by both formatEffects and updateSummary
 *
 * Note: Effect values are now pre-formatted in companion-data.js
 * (percentage stats already divided by 10 during generation)
 */
function processEffects(effects) {
    if (!effects || Object.keys(effects).length === 0) return [];

    return Object.entries(effects)
        .map(([stat, value]) => {
            // Determine if this stat should display as a percentage
            // Raw value stats (not divided by 10): HitChance, MaxHp, Attack, MainStat
            const isPercentage = !["HitChance", 'MaxHp', 'Attack', 'MainStat'].includes(stat);

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
function formatEffects(effects) {
    if (!effects || Object.keys(effects).length === 0) return '';

    return processEffects(effects)
        .map(entry => `${entry.displayName}: +${entry.value}${entry.isPercentage ? '%' : ''}`)
        .join('<br>');
}

/**
 * Format stat name for display
 */
function formatStat(stat) {
    const stats = {
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

    if(stats[stat.toLowerCase()] == undefined)
    {
        console.log(stat);
    }
    return stats[stat.toLowerCase()];
}

/**
 * Attach event listeners to companion icons
 */
function attachCompanionEventListeners() {
    // Icon click to show detail panel
    document.querySelectorAll('.companion-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const companionKey = icon.dataset.companion;
            const className = icon.dataset.class;
            const rarity = icon.dataset.rarity;
            const borderColor = icon.dataset.configBorder;
            const color = icon.dataset.configColor;

            // Check if a preset slot is selected for assignment
            const selectedSlot = getSelectedSlotInfo();
            if (selectedSlot) {
                // Check if companion is locked and show visual feedback
                const companionData = getCompanion(companionKey);
                if (!companionData.unlocked) {
                    // Add shake animation
                    icon.style.animation = 'shake 0.5s ease-in-out';
                    setTimeout(() => {
                        icon.style.animation = '';
                    }, 500);
                }

                // Assign this companion to the selected slot (will check unlock status)
                assignCompanionToSlot(companionKey);
                return;
            }

            // Track current companion
            setCurrentCompanion(companionKey, className, rarity, borderColor, color);

            // Update active state
            document.querySelectorAll('.companion-icon').forEach(i => {
                i.style.boxShadow = 'none';
            });
            icon.style.boxShadow = `0 0 0 3px ${borderColor}`;

            // Show detail panel
            showDetailPanel(companionKey, className, rarity, borderColor, color);
        });
    });
}

/**
 * Show the detail panel for a companion
 */
function showDetailPanel(companionKey, className, rarity, borderColor, color) {
    const panel = document.getElementById('companion-detail-panel');
    const content = document.getElementById('companion-detail-content');
    const companionData = getCompanion(companionKey);

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
                       onchange="handleLevelChange('${companionKey}', this.value)"
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
                    <button onclick="toggleCompanionLock('${companionKey}')" style="
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
                <button onclick="toggleCompanionLock('${companionKey}')" style="
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

/**
 * Toggle companion lock status
 */
window.toggleCompanionLock = function(companionKey) {
    const current = getCompanion(companionKey);

    updateCompanion(companionKey, {
        ...current,
        unlocked: !current.unlocked
    });

    // Re-render the grid
    const savedCompanion = currentCompanion;
    renderCompanionsGrid();
    updateSummary();
    refreshPresetsUI(); // Update preset slots to show/hide warning badges
    saveToLocalStorage();

    // Re-open the detail panel if there was a selected companion
    if (savedCompanion) {
        setTimeout(() => {
            const icon = document.querySelector(`.companion-icon[data-companion="${savedCompanion.companionKey}"]`);
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
window.handleLevelChange = function(companionKey, newLevel) {
    const level = parseInt(newLevel);
    const maxLevel = getMaxCompanionLevel();

    if (isNaN(level) || level < 1 || level > maxLevel) {
        return;
    }

    const current = getCompanion(companionKey);

    updateCompanion(companionKey, {
        ...current,
        level: level
    });

    // Update the icon level text in real-time
    const levelDisplay = document.querySelector(`.companion-icon-level[data-companion="${companionKey}"]`);
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
    refreshPresetsUI(); // Update preset DPS comparisons
    saveToLocalStorage();
};

/**
 * Update the summary section
 */
function updateSummary() {
    const container = document.getElementById('companions-summary-content');
    if (!container) return;

    const totalEffects = {};

    // Calculate total inventory effects from all unlocked companions
    // Iterate over all possible companion combinations
    Object.entries(RARITY_CONFIG).forEach(([rarity, config]) => {
        config.classes.forEach(className => {
            const companionKey = `${className}-${rarity}`;
            const data = getCompanion(companionKey);

            if (!data.unlocked) return;

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
 * Refresh the companions UI
 */
export function refreshCompanionsUI() {
    renderCompanionsGrid();
    updateSummary();
    // Presets UI will be refreshed by its own initialization
}
