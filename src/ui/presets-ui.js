// Hero Power Presets UI functionality

import { innerAbilityStats } from '../data/inner-ability-data.js';
import { renderTheoreticalBest, renderPresetComparison } from '../core/inner-ability.js';

export function initializeHeroPowerPresets() {
    const container = document.getElementById('hero-power-presets-container');
    if (!container) return;

    // Create tabs
    let tabsHTML = '<div class="preset-tabs" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px;">';
    for (let i = 1; i <= 10; i++) {
        const activeClass = i === 1 ? 'active' : '';
        tabsHTML += `<button class="preset-tab ${activeClass}" id="preset-tab-${i}" onclick="switchPreset(${i})">${i}</button>`;
    }
    tabsHTML += '</div>';

    // Create preset contents
    let contentsHTML = '';
    for (let i = 1; i <= 10; i++) {
        contentsHTML += createPresetContentHTML(i, i === 1);
    }

    container.innerHTML = tabsHTML + contentsHTML;
}

export function createPresetContentHTML(presetId, isActive = false) {
    let optionsHTML = '<option value="">-- Select Stat --</option>';

    innerAbilityStats.forEach(stat => {
        optionsHTML += `<option value="${stat}">${stat}</option>`;
    });

    const activeClass = isActive ? 'active' : '';

    return `
        <div class="preset-content ${activeClass}" id="preset-${presetId}-content">
            <div class="preset-equipped-checkbox">
                <input type="checkbox" id="preset-${presetId}-equipped" onchange="handlePresetEquipped(${presetId})">
                <label for="preset-${presetId}-equipped">Currently Equipped</label>
            </div>
            <div class="inner-ability-lines">
                ${Array.from({ length: 6 }, (_, i) => `
                    <div class="inner-ability-line">
                        <div class="input-group">
                            <label>Line ${i + 1} - Stat</label>
                            <select id="preset-${presetId}-line-${i + 1}-stat" onchange="saveHeroPowerPresets()">
                                ${optionsHTML}
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Value</label>
                            <input type="number" step="0.1" id="preset-${presetId}-line-${i + 1}-value" placeholder="0" onchange="saveHeroPowerPresets()">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}


export function switchPreset(presetId) {
    // Hide all preset contents
    for (let i = 1; i <= 10; i++) {
        const content = document.getElementById(`preset-${i}-content`);
        const tab = document.getElementById(`preset-tab-${i}`);

        if (content) content.classList.remove('active');
        if (tab) tab.classList.remove('active');
    }

    // Show selected preset
    const selectedContent = document.getElementById(`preset-${presetId}-content`);
    const selectedTab = document.getElementById(`preset-tab-${presetId}`);

    if (selectedContent) selectedContent.classList.add('active');
    if (selectedTab) selectedTab.classList.add('active');
}


export function handlePresetEquipped(presetId) {
    const checkbox = document.getElementById(`preset-${presetId}-equipped`);

    if (checkbox.checked) {
        // Uncheck all other presets
        for (let i = 1; i <= 10; i++) {
            if (i !== presetId) {
                const otherCheckbox = document.getElementById(`preset-${i}-equipped`);
                const otherTab = document.getElementById(`preset-tab-${i}`);

                if (otherCheckbox) otherCheckbox.checked = false;
                if (otherTab) otherTab.classList.remove('equipped');
            }
        }

        // Mark this preset tab as equipped
        const tab = document.getElementById(`preset-tab-${presetId}`);
        if (tab) tab.classList.add('equipped');
    } else {
        // Unmark this preset tab
        const tab = document.getElementById(`preset-tab-${presetId}`);
        if (tab) tab.classList.remove('equipped');
    }

    saveHeroPowerPresets();
}

export function saveHeroPowerPresets() {
    const presets = {};

    for (let i = 1; i <= 10; i++) {
        const isEquipped = document.getElementById(`preset-${i}-equipped`)?.checked || false;
        const lines = [];

        for (let j = 1; j <= 6; j++) {
            const stat = document.getElementById(`preset-${i}-line-${j}-stat`)?.value || '';
            const value = document.getElementById(`preset-${i}-line-${j}-value`)?.value || '';

            if (stat && value) {
                lines.push({ stat, value: parseFloat(value) });
            }
        }

        presets[i] = { isEquipped, lines };
    }

    localStorage.setItem('heroPowerPresets', JSON.stringify(presets));

    // Update Inner Ability Analysis when presets change
    renderPresetComparison();
    renderTheoreticalBest();
}


export function loadHeroPowerPresets() {
    const saved = localStorage.getItem('heroPowerPresets');
    if (!saved) return;

    try {
        const presets = JSON.parse(saved);

        for (let i = 1; i <= 10; i++) {
            const preset = presets[i];
            if (!preset) continue;

            // Set equipped checkbox
            const equippedCheckbox = document.getElementById(`preset-${i}-equipped`);
            const tab = document.getElementById(`preset-tab-${i}`);

            if (equippedCheckbox) {
                equippedCheckbox.checked = preset.isEquipped;
                if (preset.isEquipped && tab) {
                    tab.classList.add('equipped');
                }
            }

            // Set lines
            preset.lines.forEach((line, index) => {
                const lineNum = index + 1;
                const statSelect = document.getElementById(`preset-${i}-line-${lineNum}-stat`);
                const valueInput = document.getElementById(`preset-${i}-line-${lineNum}-value`);

                if (statSelect) statSelect.value = line.stat;
                if (valueInput) valueInput.value = line.value;
            });
        }
    } catch (error) {
        console.error('Failed to load hero power presets:', error);
    }
}

// Equipment Slots Management
