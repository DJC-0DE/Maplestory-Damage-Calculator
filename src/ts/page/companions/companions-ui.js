import { getCompanionEffects, getMaxCompanionLevel } from "@ts/services/index.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { calculateBothDpsDifferences, presetHasAnyCompanion, generateOptimalPreset, swapCompanionPresetEffects } from "./companion.js";
import { CLASS_DISPLAY_NAMES, RARITY_CONFIG } from "@ts/types/page/companions/companions.types.js";
import { debounce } from "@ts/utils/event-emitter.js";
let currentCompanion = null;
function initializeCompanionsUI() {
  renderCompanionsGrid();
  updateSummary();
  initializePresetsUI();
}
function loadCompanionsUI() {
}
function attachCompanionsEventListeners() {
  attachCompanionIconListeners();
  attachPresetEventListeners();
  attachClickOutsideListener();
  loadoutStore.on("stat:changed", debounce((_) => {
    refreshCompanionsUI();
  }, 3e3));
}
function refreshCompanionsUI() {
  renderCompanionsGrid();
  updateSummary();
  refreshPresetsUI();
}
function renderCompanionsGrid() {
  const container = document.getElementById("companions-grid-container");
  if (!container) return;
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
                    \u{1F5D1}\uFE0F Clear Slot
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
  const presetsContainer = document.getElementById("companions-presets-container");
  container.innerHTML = html;
  if (presetsContainer) {
    container.appendChild(presetsContainer);
  } else {
    const newPresetsContainer = document.createElement("div");
    newPresetsContainer.id = "companions-presets-container";
    newPresetsContainer.className = "companions-presets-panel";
    container.appendChild(newPresetsContainer);
  }
  attachCompanionIconListeners();
}
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
function renderIconGrid() {
  let html = "";
  Object.entries(RARITY_CONFIG).forEach(([rarity, config]) => {
    config.classes.forEach((className) => {
      const companionKey = `${className}-${rarity}`;
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
                        border: 2px solid ${isUnlocked ? config.borderColor : "#666"};
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        opacity: ${isUnlocked ? "1" : "0.4"};
                        filter: ${isUnlocked ? "none" : "grayscale(100%)"};
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
                    ` : ""}
                </div>
            `;
    });
  });
  return html;
}
function showDetailPanel(companionKey, className, rarity, borderColor, color) {
  const panel = document.getElementById("companion-detail-panel");
  const content = document.getElementById("companion-detail-content");
  if (!panel || !content) return;
  const companionData = loadoutStore.getCompanion(companionKey);
  const displayName = CLASS_DISPLAY_NAMES[className];
  const isUnlocked = companionData.unlocked;
  const level = companionData.level || 1;
  const maxLevel = getMaxCompanionLevel();
  let inventoryEffectText = "";
  let equipEffectText = "";
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
                    ` : ""}

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
                    ` : ""}
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
                        \u{1F512} Lock Companion
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
                    \u{1F513} Unlock Companion
                </button>
            </div>
        `}
    `;
  panel.style.borderColor = borderColor;
}
function initializePresetsUI() {
  const equippedPresetId = loadoutStore.getEquippedPresetId();
  updateContributedStatsForPreset(equippedPresetId);
  renderPresetsPanel();
}
function renderPresetsPanel() {
  const container = document.getElementById("companions-presets-container");
  if (!container) return;
  const showDpsComparison = loadoutStore.getShowPresetDpsComparison();
  const equippedPresetId = loadoutStore.getEquippedPresetId();
  const currentPresetEffects = getPresetEquipEffects(equippedPresetId);
  const maxBossDpsPreset = generateOptimalPreset(
    "bossDamage",
    getCompanionEffects,
    (key) => loadoutStore.getCompanion(key),
    getMaxCompanionLevel,
    loadoutStore.getLockedMainCompanion("optimal-boss")
  );
  const maxNormalDpsPreset = generateOptimalPreset(
    "normalDamage",
    getCompanionEffects,
    (key) => loadoutStore.getCompanion(key),
    getMaxCompanionLevel,
    loadoutStore.getLockedMainCompanion("optimal-normal")
  );
  let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
  html += `
        <header style="margin-bottom: 8px; padding: 10px 12px; background: rgba(0, 122, 255, 0.08); border: 1px solid rgba(0, 122, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 600; color: var(--text-primary);">Show DPS Comparison</span>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="preset-dps-comparison-toggle" onchange="window.togglePresetDpsComparison(this.checked)" ${showDpsComparison ? "checked" : ""}>
                <span style="font-size: 0.9em; color: var(--text-secondary);">Enable DPS info below each preset</span>
            </label>
        </header>
    `;
  for (let i = 1; i <= 5; i++) {
    const presetId = `preset${i}`;
    const presetData = loadoutStore.getPreset(presetId);
    const isEquipped = presetId === equippedPresetId;
    html += renderPresetRow(presetId, presetData, isEquipped, showDpsComparison, currentPresetEffects, false);
  }
  html += renderPresetRow("optimal-boss", maxBossDpsPreset, false, showDpsComparison, currentPresetEffects, true, "Max Boss Dmg");
  html += renderPresetRow("optimal-normal", maxNormalDpsPreset, false, showDpsComparison, currentPresetEffects, true, "Max Normal Dmg");
  html += "</div>";
  container.innerHTML = html;
  attachPresetEventListeners();
}
function renderPresetRow(presetId, presetData, isEquipped, showDpsComparison, currentPresetEffects, isSpecialPreset = false, customLabel = null) {
  const formatNumber = (num) => {
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return Math.floor(num).toString();
  };
  const labelText = customLabel || presetId.replace("preset", "#");
  const borderColor = isSpecialPreset ? "#fbbf24" : isEquipped ? "#10b981" : "var(--border-color)";
  const isLocked = isSpecialPreset && (presetId === "optimal-boss" || presetId === "optimal-normal") && loadoutStore.getLockedMainCompanion(presetId) !== null;
  let html = `
        <div class="preset-row" data-preset="${presetId}" data-special="${isSpecialPreset}" style="
            display: flex;
            flex-direction: column;
            background: var(--background);
            border: 2px solid ${borderColor};
            border-radius: 8px;
            transition: all 0.2s ease;
            ${isSpecialPreset ? "background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(245, 158, 11, 0.03));" : ""}
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
                    color: ${isSpecialPreset ? "#fbbf24" : "var(--text-secondary)"};
                    min-width: ${customLabel ? "100px" : "45px"};
                    text-align: right;
                    margin-right: 4px;
                ">${labelText}</div>

                <!-- Main slot -->
                ${isSpecialPreset ? renderOptimalMainSlot(presetId, presetData.main, 80, isLocked) : renderSlot(presetId, "main", 0, presetData.main, 80)}

                <!-- Sub slots (6 in a row) -->
                ${presetData.subs.map(
    (sub, index) => isSpecialPreset ? renderReadOnlySlot(sub, 50) : renderSlot(presetId, "sub", index, sub, 50)
  ).join("")}

                <!-- Badge for equipped or lock button for special presets -->
                ${isSpecialPreset ? `
                    <button onclick="window.toggleOptimalLock('${presetId}')" style="
                        margin-left: auto;
                        padding: 6px 12px;
                        background: ${isLocked ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))" : "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))"};
                        border: 2px solid ${isLocked ? "#ef4444" : "#3b82f6"};
                        border-radius: 6px;
                        color: ${isLocked ? "#ef4444" : "#3b82f6"};
                        font-weight: 600;
                        font-size: 0.8em;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                    " onmouseover="this.style.background='${isLocked ? "rgba(239, 68, 68, 0.25)" : "rgba(59, 130, 246, 0.25)"}'; this.style.transform='translateY(-1px)';"
                       onmouseout="this.style.background='${isLocked ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))" : "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))"}'; this.style.transform='translateY(0)';">
                        ${isLocked ? "CLEAR LOCK" : "LOCK MAIN"}
                    </button>
                ` : isEquipped ? `
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
                    ">\u2713 EQUIPPED</div>
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
                `}
            </div>
    `;
  if (showDpsComparison && presetHasAnyCompanion(presetData)) {
    const targetPresetEffects = isSpecialPreset ? getPresetEquipEffectsFromData(presetData) : getPresetEquipEffects(presetId);
    const dpsResults = calculateBothDpsDifferences(currentPresetEffects, targetPresetEffects);
    html += renderDpsComparisonSection(dpsResults, isEquipped, formatNumber);
  }
  html += `</div>`;
  return html;
}
function renderDpsComparisonSection(dpsResults, isEquipped, formatNumber) {
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
    const bossGainOverBaseline = dpsResults.boss.currentPresetGain;
    const normalGainOverBaseline = dpsResults.normal.currentPresetGain;
    const bossPctGain = dpsResults.boss.baselineDps > 0 ? bossGainOverBaseline / dpsResults.boss.baselineDps * 100 : 0;
    const normalPctGain = dpsResults.normal.baselineDps > 0 ? normalGainOverBaseline / dpsResults.normal.baselineDps * 100 : 0;
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
    const bossGain = dpsResults.boss.dpsGain;
    const normalGain = dpsResults.normal.dpsGain;
    html += `
            <div style="text-align: center;">
                <div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px;">DPS vs Boss</div>
                <div style="font-size: 1em; font-weight: 700;">
                    <span style="color: ${bossGain >= 0 ? "#10b981" : "#ef4444"};">
                        ${bossGain >= 0 ? "+" : ""}${bossGain.toFixed(2)}%
                    </span>
                </div>
                <div style="font-size: 0.7em; color: var(--text-secondary);">
                    ${formatNumber(dpsResults.boss.newPresetDps)}
                </div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 4px;">DPS vs Monster</div>
                <div style="font-size: 1em; font-weight: 700;">
                    <span style="color: ${normalGain >= 0 ? "#10b981" : "#ef4444"};">
                        ${normalGain >= 0 ? "+" : ""}${normalGain.toFixed(2)}%
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
function renderSlot(presetId, slotType, slotIndex, companionKey, size) {
  const slotId = `${presetId}-${slotType}-${slotIndex}`;
  if (!companionKey) {
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
  const [className, rarity] = companionKey.split("-");
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG["Normal"];
  const companionData = loadoutStore.getCompanion(companionKey);
  const level = companionData?.level ?? 1;
  const isLocked = !companionData?.unlocked;
  const isMain = slotType === "main";
  const iconName = isMain ? getClassWebpName(className) : getClassPngName(className);
  const iconExt = isMain ? "webp" : "png";
  const iconClass = isMain ? `comp-image comp-preset-${className}` : `comp-image comp-preset-sub-${className}`;
  return `
        <div class="preset-slot filled-slot ${isLocked ? "locked-companion-slot" : ""}"
             data-preset="${presetId}"
             data-slot-type="${slotType}"
             data-slot-index="${slotIndex}"
             data-slot-id="${slotId}"
             data-companion="${companionKey}"
             data-main-rarity="${isMain ? rarity : ""}"
             style="
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(135deg, ${config.color}22, ${config.borderColor}44);
                border: 2px solid ${isLocked ? "#ef4444" : config.borderColor};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: ${isLocked ? "0.6" : "1"};
             ">
            <!-- Companion icon (scaled up and clipped) -->
            <div style="
                position: absolute;
                width: ${size * 1.5}px;
                height: ${size * 1.5}px;
                display: flex;
                align-items: center;
                justify-content: center;
                ${isLocked ? "filter: grayscale(100%);" : ""}
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
            ">\u26A0\uFE0F</div>
            ` : ""}
        </div>
    `;
}
function renderOptimalMainSlot(presetId, companionKey, size, isLocked) {
  if (!companionKey) {
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
  const [className, rarity] = companionKey.split("-");
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG["Normal"];
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
            ">\u{1F512}</div>
            ` : ""}
        </div>
    `;
}
function renderReadOnlySlot(companionKey, size) {
  if (!companionKey) {
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
  const [className, rarity] = companionKey.split("-");
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG["Normal"];
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
function attachCompanionIconListeners() {
  document.querySelectorAll(".companion-icon").forEach((icon) => {
    icon.addEventListener("click", (e) => {
      const target = icon;
      const companionKey = target.dataset.companion;
      const className = target.dataset.class;
      const rarity = target.dataset.rarity;
      const borderColor = target.dataset.configBorder || "";
      const color = target.dataset.configColor || "";
      const selectedSlot = getSelectedSlotInfo();
      if (selectedSlot) {
        const companionData = loadoutStore.getCompanion(companionKey);
        const isOptimalPreset = selectedSlot.presetId === "optimal-boss" || selectedSlot.presetId === "optimal-normal";
        if (isOptimalPreset && selectedSlot.type === "main") {
          const currentLock = loadoutStore.getLockedMainCompanion(selectedSlot.presetId);
          if (currentLock === companionKey) {
            target.style.animation = "shake 0.5s ease-in-out";
            setTimeout(() => {
              target.style.animation = "";
            }, 500);
            return;
          }
        }
        if (!companionData?.unlocked) {
          target.style.animation = "shake 0.5s ease-in-out";
          setTimeout(() => {
            target.style.animation = "";
          }, 500);
        } else {
          assignCompanionToSlot(companionKey);
          return;
        }
      }
      currentCompanion = { companionKey, className, rarity, borderColor, color };
      document.querySelectorAll(".companion-icon").forEach((i) => {
        i.style.boxShadow = "none";
      });
      target.style.boxShadow = `0 0 0 3px ${borderColor}`;
      showDetailPanel(companionKey, className, rarity, borderColor, color);
    });
  });
}
function attachPresetEventListeners() {
  document.querySelectorAll(".preset-slot").forEach((slot) => {
    slot.addEventListener("click", (e) => {
      e.stopPropagation();
      handleSlotClick(slot);
    });
    slot.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = slot;
      const presetId = target.dataset.preset;
      const slotType = target.dataset.slotType;
      const slotIndex = parseInt(target.dataset.slotIndex || "0");
      const companionKey = target.dataset.companion;
      if (companionKey) {
        loadoutStore.clearPresetSlot(presetId, slotType, slotIndex);
        renderPresetsPanel();
      }
    });
  });
}
function attachClickOutsideListener() {
  const existingHandler = window._companionsClickOutsideHandler;
  if (existingHandler) {
    document.removeEventListener("click", existingHandler);
  }
  const handler = (e) => {
    const selectedSlot = getSelectedSlotInfo();
    if (!selectedSlot) return;
    const target = e.target;
    const clickedSlot = target.closest(".preset-slot");
    const clickedIcon = target.closest(".companion-icon");
    if (!clickedSlot && !clickedIcon) {
      clearSelectionFeedback();
      clearSelectedSlot();
    }
  };
  window._companionsClickOutsideHandler = handler;
  document.addEventListener("click", handler);
}
function handleSlotClick(slot) {
  const presetId = slot.dataset.preset;
  const slotType = slot.dataset.slotType;
  const slotIndex = parseInt(slot.dataset.slotIndex || "0");
  const mainRarity = slot.dataset.mainRarity;
  const isOptimalSlot = slot.classList.contains("optimal-main-slot");
  if (isOptimalSlot) {
    if (presetId === "optimal-boss" || presetId === "optimal-normal") {
      const currentLock = loadoutStore.getLockedMainCompanion(presetId);
      if (currentLock) {
        return;
      }
    }
  }
  setSelectedSlot(presetId, slotType, slotIndex);
  clearSelectionFeedback();
  if (isOptimalSlot) {
    slot.style.boxShadow = "0 0 15px 3px rgba(255, 255, 255, 0.6)";
    slot.style.animation = "pulse-glow 1s infinite";
    showTooltip(slot, "Select main companion from grid");
    highlightSourceIcons();
  } else {
    showSelectionFeedback(presetId, mainRarity || "");
  }
  const clearBtnContainer = document.getElementById("clear-slot-selection-container");
  if (clearBtnContainer) {
    clearBtnContainer.style.display = "block";
  }
}
function processEffects(effects) {
  if (!effects || Object.keys(effects).length === 0) return [];
  return Object.entries(effects).map(([stat, value]) => {
    const isPercentage = !["HitChance", "MaxHp", "Attack", "MainStat"].includes(stat);
    const formattedValue = typeof value === "number" ? Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, "") : value;
    return {
      stat,
      displayName: formatStat(stat),
      value: formattedValue,
      isPercentage
    };
  });
}
function formatEffects(effects) {
  if (!effects || Object.keys(effects).length === 0) return "";
  return processEffects(effects).map((entry) => `${entry.displayName}: +${entry.value}${entry.isPercentage ? "%" : ""}`).join("<br>");
}
function formatStat(stat) {
  const stats = {
    "maxhpr": "Max HP",
    "maxhp": "Max HP",
    "damage": "Damage",
    "maxdamage": "Max Damage Multiplier",
    "hitchance": "Accuracy",
    "normaldamage": "Normal Monster Damage",
    "critrate": "Critical Rate",
    "attackspeed": "Attack Speed",
    "attack speed": "Attack Speed",
    "damageInCc": "Status Effect Damage",
    "bossdamage": "Boss Monster Damage",
    "mindamage": "Min Damage Multiplier",
    "mainstat": "Main Stat",
    "attack": "Attack"
  };
  return stats[stat.toLowerCase()] || stat;
}
function setCurrentCompanion(companionKey, className, rarity, borderColor, color) {
  currentCompanion = { companionKey, className, rarity, borderColor, color };
}
function getClassPngName(className) {
  const names = {
    "Hero": "hero",
    "DarkKnight": "dk",
    "ArchMageIL": "mage-il",
    "ArchMageFP": "mage-fp",
    "BowMaster": "bowmaster",
    "Marksman": "marksman",
    "NightLord": "nl",
    "Shadower": "shadower"
  };
  return names[className];
}
function getClassWebpName(className) {
  const names = {
    "Hero": "hero",
    "DarkKnight": "dk",
    "ArchMageIL": "il",
    "ArchMageFP": "fp",
    "BowMaster": "bow",
    "Marksman": "mark",
    "NightLord": "night",
    "Shadower": "shad"
  };
  return names[className];
}
function updateSummary() {
  const container = document.getElementById("companions-summary-content");
  if (!container) return;
  const totalEffects = {};
  Object.entries(RARITY_CONFIG).forEach(([rarity, config]) => {
    config.classes.forEach((className) => {
      const companionKey = `${className}-${rarity}`;
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
  if (Object.keys(totalEffects).length === 0) {
    container.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">No unlocked companions</span>';
    return;
  }
  const processedEffects = processEffects(totalEffects);
  container.innerHTML = processedEffects.map((entry) => `
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
                <span style="font-weight: 600; color: var(--tab-teal);">${entry.displayName}:</span>
                <span style="color: var(--text-primary);">+${entry.value}${entry.isPercentage ? "%" : ""}</span>
            </span>
        `).join("");
}
function getPresetEquipEffects(presetId) {
  const preset = loadoutStore.getPreset(presetId);
  const allSlots = [preset.main, ...preset.subs];
  const totalEffects = {};
  allSlots.forEach((companionKey) => {
    if (!companionKey) return;
    const [className, rarity] = companionKey.split("-");
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
function getPresetEquipEffectsFromData(preset) {
  if (!preset) return {};
  const allSlots = [preset.main, ...preset.subs];
  const totalEffects = {};
  allSlots.forEach((companionKey) => {
    if (!companionKey) return;
    const [className, rarity] = companionKey.split("-");
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
function updateContributedStatsForPreset(presetId) {
  const effects = getPresetEquipEffects(presetId);
}
function refreshPresetsUI() {
  renderPresetsPanel();
}
function getSelectedSlotInfo() {
  return window._selectedSlotInfo || null;
}
function setSelectedSlot(presetId, type, index) {
  window._selectedSlotInfo = { presetId, type, index };
}
function clearSelectedSlot() {
  window._selectedSlotInfo = null;
}
function showSelectionFeedback(presetId, mainRarity) {
  const slot = getSelectedSlotInfo();
  if (!slot) return;
  const slotElement = document.querySelector(`[data-slot-id="${presetId}-${slot.type}-${slot.index}"]`);
  if (!slotElement) return;
  slotElement.style.boxShadow = "0 0 15px 3px rgba(255, 255, 255, 0.6)";
  slotElement.style.animation = "pulse-glow 1s infinite";
  showTooltip(slotElement, "Select a companion from the left");
  highlightSourceIcons();
}
function showTooltip(slotElement, text) {
  const tooltip = document.createElement("div");
  tooltip.id = "preset-selection-tooltip";
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
  slotElement.style.position = "relative";
  slotElement.appendChild(tooltip);
}
function highlightSourceIcons() {
  const slotInfo = getSelectedSlotInfo();
  let excludedCompanion = null;
  if (slotInfo && (slotInfo.presetId === "optimal-boss" || slotInfo.presetId === "optimal-normal")) {
    excludedCompanion = loadoutStore.getLockedMainCompanion(slotInfo.presetId);
  }
  document.querySelectorAll(".companion-icon").forEach((icon) => {
    const target = icon;
    const companionKey = target.dataset.companion;
    const companionData = loadoutStore.getCompanion(companionKey);
    if (companionKey === excludedCompanion) {
      target.style.transition = "all 0.3s ease";
      target.style.opacity = "0.3";
      target.style.transform = "scale(0.9)";
      target.style.boxShadow = "none";
      return;
    }
    if (companionData?.unlocked) {
      target.style.transition = "all 0.3s ease";
      target.style.boxShadow = "0 0 20px 5px rgba(187, 119, 255, 0.4)";
      target.style.transform = "scale(1.05)";
    }
  });
}
function clearSelectionFeedback() {
  document.querySelectorAll(".preset-slot").forEach((slot) => {
    const target = slot;
    target.style.boxShadow = "";
    target.style.animation = "";
  });
  const tooltip = document.getElementById("preset-selection-tooltip");
  if (tooltip) tooltip.remove();
  document.querySelectorAll(".companion-icon").forEach((icon) => {
    const target = icon;
    target.style.boxShadow = "";
    target.style.transform = "";
    target.style.opacity = "";
  });
  const clearBtnContainer = document.getElementById("clear-slot-selection-container");
  if (clearBtnContainer) {
    clearBtnContainer.style.display = "none";
  }
}
function assignCompanionToSlot(companionKey) {
  const slotInfo = getSelectedSlotInfo();
  if (!slotInfo) return;
  const isOptimalPreset = slotInfo.presetId === "optimal-boss" || slotInfo.presetId === "optimal-normal";
  const companionData = loadoutStore.getCompanion(companionKey);
  if (!companionData?.unlocked) {
    const slotSelector = isOptimalPreset ? `.optimal-main-slot[data-preset="${slotInfo.presetId}"]` : `[data-slot-id="${slotInfo.presetId}-${slotInfo.type}-${slotInfo.index}"]`;
    const slotElement = document.querySelector(slotSelector);
    if (slotElement) {
      showTooltip(slotElement, "\u274C Companion not unlocked!");
      setTimeout(() => {
        const tooltip = document.getElementById("preset-selection-tooltip");
        if (tooltip) tooltip.remove();
      }, 1500);
    }
    return;
  }
  if (isOptimalPreset && slotInfo.type === "main") {
    const currentLock = loadoutStore.getLockedMainCompanion(slotInfo.presetId);
    if (currentLock === companionKey) {
      const slotSelector = `.optimal-main-slot[data-preset="${slotInfo.presetId}"]`;
      const slotElement = document.querySelector(slotSelector);
      if (slotElement) {
        showTooltip(slotElement, "\u274C This companion is already locked!");
        setTimeout(() => {
          const tooltip = document.getElementById("preset-selection-tooltip");
          if (tooltip) tooltip.remove();
        }, 1500);
      }
      return;
    }
  }
  if (isOptimalPreset && slotInfo.type === "main") {
    loadoutStore.setLockedMainCompanion(slotInfo.presetId, companionKey);
    clearSelectionFeedback();
    clearSelectedSlot();
    renderPresetsPanel();
    return;
  }
  const preset = loadoutStore.getPreset(slotInfo.presetId);
  const allSlots = [preset.main, ...preset.subs];
  const duplicateSlot = allSlots.find((slotKey, idx) => {
    if (slotInfo.type === "main" && idx === 0) return false;
    if (slotInfo.type === "sub" && idx === slotInfo.index + 1) return false;
    return slotKey === companionKey;
  });
  if (duplicateSlot) {
    const slotElement = document.querySelector(`[data-slot-id="${slotInfo.presetId}-${slotInfo.type}-${slotInfo.index}"]`);
    if (slotElement) {
      showTooltip(slotElement, "\u274C Already equipped in this preset!");
      setTimeout(() => {
        const tooltip = document.getElementById("preset-selection-tooltip");
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
window.toggleCompanionLock = function(companionKey) {
  const current = loadoutStore.getCompanion(companionKey);
  if (!current) return;
  loadoutStore.updateCompanion(companionKey, {
    ...current,
    unlocked: !current.unlocked
  });
  const savedCompanion = currentCompanion;
  renderCompanionsGrid();
  updateSummary();
  refreshPresetsUI();
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
window.handleLevelChange = function(companionKey, newLevel) {
  const level = parseInt(newLevel);
  const maxLevel = getMaxCompanionLevel();
  if (isNaN(level) || level < 1 || level > maxLevel) {
    return;
  }
  const current = loadoutStore.getCompanion(companionKey);
  if (!current) return;
  loadoutStore.updateCompanion(companionKey, {
    ...current,
    level
  });
  const levelDisplay = document.querySelector(`.companion-icon-level[data-companion="${companionKey}"]`);
  if (levelDisplay) {
    levelDisplay.textContent = `Lv.${level}`;
  }
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
window.clearSelectedSlotCompanion = function() {
  const slotInfo = getSelectedSlotInfo();
  if (!slotInfo) return;
  loadoutStore.clearPresetSlot(slotInfo.presetId, slotInfo.type, slotInfo.index);
  clearSelectionFeedback();
  clearSelectedSlot();
  renderPresetsPanel();
};
window.togglePresetDpsComparison = function(checked) {
  loadoutStore.setShowPresetDpsComparison(checked);
  renderPresetsPanel();
};
window.toggleOptimalLock = function(optimalType) {
  const currentLock = loadoutStore.getLockedMainCompanion(optimalType);
  if (currentLock) {
    loadoutStore.setLockedMainCompanion(optimalType, null);
    clearSelectedSlot();
    clearSelectionFeedback();
    renderPresetsPanel();
  } else {
    setSelectedSlot(optimalType, "main", 0);
    clearSelectionFeedback();
    renderPresetsPanel();
    setTimeout(() => {
      const presetRow = document.querySelector(`.preset-row[data-preset="${optimalType}"]`);
      if (presetRow) {
        const allSlots = presetRow.querySelectorAll(".optimal-main-slot, .optimal-readonly-slot");
        allSlots.forEach((slot) => {
          const target = slot;
          target.style.boxShadow = "0 0 15px 3px rgba(255, 255, 255, 0.6)";
          target.style.animation = "pulse-glow 1s infinite";
        });
        const mainSlot = presetRow.querySelector(".optimal-main-slot");
        if (mainSlot) {
          showTooltip(mainSlot, "Select main companion from grid");
        }
        highlightSourceIcons();
      }
    }, 0);
  }
};
window.equipPreset = async function(presetId) {
  const currentPresetId = loadoutStore.getEquippedPresetId();
  if (currentPresetId === presetId) return;
  const newPresetEffects = getPresetEquipEffects(presetId);
  const currentPresetEffects = getPresetEquipEffects(currentPresetId);
  const hasEquipEffects = Object.keys(newPresetEffects).length > 0 || Object.keys(currentPresetEffects).length > 0;
  if (hasEquipEffects) {
    const userChoice = await showEquipConfirmModal(presetId, currentPresetEffects, newPresetEffects);
    if (userChoice === "cancel") {
      return;
    }
    if (userChoice === "no") {
      loadoutStore.setEquippedPresetId(presetId);
      updateContributedStatsForPreset(presetId);
      renderPresetsPanel();
    } else if (userChoice === "yes") {
      const newStats = swapCompanionPresetEffects(currentPresetEffects, newPresetEffects);
      loadoutStore.updateBaseStats(newStats);
      loadoutStore.setEquippedPresetId(presetId);
      updateContributedStatsForPreset(presetId);
      renderPresetsPanel();
    }
  } else {
    loadoutStore.setEquippedPresetId(presetId);
    updateContributedStatsForPreset(presetId);
    renderPresetsPanel();
  }
};
function showEquipConfirmModal(presetId, currentEffects, newEffects) {
  return new Promise((resolve) => {
    const existingModal = document.getElementById("equip-preset-modal");
    if (existingModal) {
      existingModal.remove();
    }
    const overlay = document.createElement("div");
    overlay.id = "equip-preset-modal";
    overlay.className = "modal-overlay";
    const modalBox = document.createElement("div");
    modalBox.className = "modal-box";
    const title = document.createElement("h2");
    title.className = "modal-title";
    title.textContent = `Equip ${presetId.replace("preset", "#")}`;
    const message = document.createElement("p");
    message.className = "modal-message";
    message.textContent = "Are the stats from the currently equipped preset already incorporated in your input stats?";
    const tableContainer = document.createElement("div");
    tableContainer.className = "stat-comparison-table";
    tableContainer.innerHTML = createStatComparisonTable(currentEffects, newEffects);
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "modal-buttons";
    const yesBtn = document.createElement("button");
    yesBtn.className = "modal-btn btn-yes";
    yesBtn.textContent = "Yes - Adjust Stats";
    yesBtn.onclick = () => {
      overlay.remove();
      resolve("yes");
    };
    const noBtn = document.createElement("button");
    noBtn.className = "modal-btn btn-no";
    noBtn.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))";
    noBtn.style.borderColor = "rgba(255, 255, 255, 0.3)";
    noBtn.style.color = "rgba(255, 255, 255, 0.7)";
    noBtn.textContent = "No - Just Switch";
    noBtn.onclick = () => {
      overlay.remove();
      resolve("no");
    };
    noBtn.onmouseenter = () => {
      noBtn.style.background = "rgba(255, 255, 255, 0.1)";
    };
    noBtn.onmouseleave = () => {
      noBtn.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))";
    };
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "modal-btn btn-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => {
      overlay.remove();
      resolve("cancel");
    };
    buttonContainer.appendChild(yesBtn);
    buttonContainer.appendChild(noBtn);
    buttonContainer.appendChild(cancelBtn);
    modalBox.appendChild(title);
    modalBox.appendChild(message);
    modalBox.appendChild(tableContainer);
    modalBox.appendChild(buttonContainer);
    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);
    const escHandler = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
        resolve("cancel");
      }
    };
    document.addEventListener("keydown", escHandler);
    yesBtn.focus();
  });
}
function createStatComparisonTable(currentEffects, newEffects) {
  const allStats = /* @__PURE__ */ new Set([
    ...Object.keys(currentEffects),
    ...Object.keys(newEffects)
  ]);
  allStats.delete("Attack");
  if (allStats.size === 0) {
    return '<div style="text-align: center; color: var(--text-secondary);">No stat changes</div>';
  }
  let rows = "";
  for (const stat of allStats) {
    const currentValue = currentEffects[stat] || 0;
    const newValue = newEffects[stat] || 0;
    const isPercentage = !["hitChance", "maxHp", "attack", "mainStat"].includes(stat);
    const formatValue = (val) => {
      if (val === 0) return "-";
      const displayValue = isPercentage ? val.toFixed(1).replace(/\.0$/, "") : val;
      return `+${displayValue}${isPercentage ? "%" : ""}`;
    };
    const currentClass = currentValue > 0 ? "stat-value-negative" : "stat-value-neutral";
    const newClass = newValue > 0 ? "stat-value-positive" : "stat-value-neutral";
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
export {
  attachCompanionsEventListeners,
  initializeCompanionsUI,
  loadCompanionsUI,
  refreshCompanionsUI
};
//# sourceMappingURL=companions-ui.js.map
