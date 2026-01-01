// Artifacts System
// Manage artifact data, presets, and UI

import { artifactsData } from './artifacts-data.js';
import { artifactPotentialData } from './artifact-potential-data.js';
import { calculateDamage, formatNumber } from './calculations.js';

// Global state
let currentArtifactPreset = 1;
let selectedArtifactSlot = null; // Which of the 3 slots (1, 2, or 3) is being edited
let previewArtifactName = null; // Artifact being previewed (not yet equipped)
let artifactPresets = {};
let artifactLibrary = {}; // Stores star ratings and potentials for each artifact by name

// Initialize artifact library (one entry per artifact with its stats)
export function initializeArtifactLibrary() {
    // Initialize library entries for all artifacts with default values
    artifactsData.forEach(artifact => {
        if (!artifactLibrary[artifact.name]) {
            artifactLibrary[artifact.name] = {
                stars: 0,
                potentials: [null, null, null]
            };
        }
    });
}

// Initialize artifact presets (10 presets, each with 3 slots storing artifact name references)
export function initializeArtifactPresets() {
    for (let i = 1; i <= 10; i++) {
        artifactPresets[i] = {
            slot1: null, // Just stores artifact name (string) or null
            slot2: null,
            slot3: null
        };
    }
}

// Render the entire artifacts tab
export function renderArtifactsTab() {
    renderEquippedArtifacts();
    renderArtifactDetail();
    renderArtifactGrid();
}

// Render left panel: preset selector + 3 equipped slots
export function renderEquippedArtifacts() {
    const container = document.getElementById('artifacts-equipped-panel');
    if (!container) return;

    const preset = artifactPresets[currentArtifactPreset];

    let html = `
        <div style="background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.05));
                    border: 2px solid rgba(255, 193, 7, 0.3); border-radius: 12px; padding: 12px;
                    margin-bottom: 20px; text-align: center;">
            <div style="color: var(--text-primary); font-weight: 600; font-size: 0.9em; margin-bottom: 4px;">
                ⚠️ Work in Progress
            </div>
            <div style="color: var(--text-secondary); font-size: 0.8em; line-height: 1.4;">
                Artifact configuration is not yet used in damage calculations.<br>
                Full integration coming in a future update.
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Artifact Preset</label>
            <select id="artifact-preset-selector" onchange="switchArtifactPreset(this.value)"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
    `;

    for (let i = 1; i <= 10; i++) {
        html += `<option value="${i}" ${i === currentArtifactPreset ? 'selected' : ''}>Preset ${i}</option>`;
    }

    html += `
            </select>
        </div>
        <div style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px; text-align: center;">
            Equipped Artifacts (${currentArtifactPreset})
        </div>
    `;

    // Render 3 slots
    ['slot1', 'slot2', 'slot3'].forEach((slotKey, index) => {
        const artifactName = preset[slotKey]; // Now just a string or null
        const slotNum = index + 1;
        const isActive = selectedArtifactSlot === slotNum;

        html += `
            <div onclick="selectArtifactSlot(${slotNum})"
                 style="background: ${isActive ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(88, 86, 214, 0.1))' : 'var(--background)'};
                        border: 2px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'};
                        border-radius: 12px; padding: 15px; margin-bottom: 12px; cursor: pointer;
                        transition: all 0.3s; box-shadow: 0 2px 8px var(--shadow);"
                 onmouseover="this.style.borderColor='var(--accent-primary)'"
                 onmouseout="this.style.borderColor='${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}'">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--accent-primary);">Slot ${slotNum}</div>
        `;

        // Check if artifactName is a valid non-empty string
        if (artifactName && typeof artifactName === 'string' && artifactName.trim() !== '') {
            const artifact = artifactsData.find(a => a.name === artifactName);
            const libraryEntry = artifactLibrary[artifactName] || { stars: 0, potentials: [null, null, null] };

            // Build stars with filled (gold) and empty (grey) styling
            const filledStars = '★'.repeat(libraryEntry.stars);
            const emptyStars = '☆'.repeat(5 - libraryEntry.stars);
            const starsHtml = `<span style="color: #FFD700;">${filledStars}</span><span style="color: #666;">${emptyStars}</span>`;

            html += `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="media/artifacts/${artifact?.imageName || 'placeholder.png'}"
                         alt="${artifactName}"
                         style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover; flex-shrink: 0;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.9em; color: var(--text-primary);">${artifactName}</div>
                        <div style="font-size: 0.85em;">${starsHtml}</div>
                        <div style="color: var(--text-secondary); font-size: 0.75em; margin-top: 2px;">
                            ${libraryEntry.potentials.filter(p => p).length} potential(s)
                        </div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 0.85em;">
                    Empty Slot<br>
                    <span style="font-size: 0.75em; opacity: 0.7;">Click to select artifact</span>
                </div>
            `;
        }

        html += `</div>`;
    });

    container.innerHTML = html;
}

// Render center panel: detail editor
export function renderArtifactDetail() {
    const container = document.getElementById('artifacts-detail-panel');
    if (!container) return;

    // Determine what to show: artifact from grid or artifact from equipped slot
    let artifactToShow = null;
    let artifactName = null;
    let showEquipButton = false;

    if (previewArtifactName) {
        // User clicked an artifact from the grid
        artifactName = previewArtifactName;
        artifactToShow = artifactsData.find(a => a.name === previewArtifactName);
        showEquipButton = selectedArtifactSlot !== null; // Show equip button if slot is selected
    } else if (selectedArtifactSlot) {
        // User selected a slot - show equipped artifact if any
        const preset = artifactPresets[currentArtifactPreset];
        const slotKey = `slot${selectedArtifactSlot}`;
        artifactName = preset[slotKey]; // Now just a string or null
        if (artifactName) {
            artifactToShow = artifactsData.find(a => a.name === artifactName);
        }
    }

    // No artifact to display
    if (!artifactToShow) {
        let message = 'Click an artifact from the grid to view/edit';
        if (selectedArtifactSlot && !previewArtifactName) {
            message = 'Click an artifact from the grid to equip or edit';
        }
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%;
                        color: var(--text-secondary); font-size: 1.1em; text-align: center; padding: 40px;">
                ${message}
            </div>
        `;
        return;
    }

    const artifact = artifactToShow;

    // Always get stars and potentials from the library
    const libraryEntry = artifactLibrary[artifactName] || { stars: 0, potentials: [null, null, null] };
    let currentStars = libraryEntry.stars;
    let currentPotentials = libraryEntry.potentials;

    let statusText = showEquipButton ?
        `<span style="color: var(--accent-warning);">Library View</span> - ${selectedArtifactSlot ? `Click Equip to add to Slot ${selectedArtifactSlot}` : 'Select a slot on the left first'}` :
        `Editing from Library`;

    let html = `
        <div style="background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(88, 86, 214, 0.05));
                    border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <img src="media/artifacts/${artifact.imageName}" alt="${artifact.name}"
                     style="width: 45px; height: 45px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px var(--shadow); flex-shrink: 0;">
                <div style="min-width: 0; flex: 1;">
                    <div style="font-size: 1.2em; font-weight: 700; color: var(--text-primary);">${artifact.name}</div>
                    <div style="color: var(--text-secondary); font-size: 0.85em;">${statusText}</div>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">Star Rating</label>
                <div style="display: flex; gap: 8px;">
    `;

    // Star rating buttons
    for (let i = 0; i <= 5; i++) {
        const isSelected = currentStars === i;
        html += `
            <button onclick="setArtifactStars('${artifactName}', ${i})"
                    style="flex: 1; padding: 8px; border: 2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'};
                           background: ${isSelected ? 'var(--accent-primary)' : 'var(--background)'};
                           color: ${isSelected ? '#FFD700' : 'var(--text-primary)'};
                           border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                ${i}★
            </button>
        `;
    }

    html += `
                </div>
            </div>

            <div style="background: var(--background); border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                <div style="font-weight: 600; margin-bottom: 6px; color: var(--accent-primary); font-size: 0.9em;">Effect:</div>
                <div style="color: var(--text-primary); font-size: 0.9em; line-height: 1.5;">
                    ${artifact.descriptions[currentStars]}
                </div>
            </div>
        </div>

        <div style="background: var(--background); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
            <div style="font-weight: 600; margin-bottom: 12px; color: var(--text-primary);">Artifact Potentials</div>
    `;

    // 3 potential dropdowns
    for (let i = 0; i < 3; i++) {
        html += `
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.85em; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary);">
                    Potential ${i + 1}
                </label>
                <select id="artifact-potential-${i}" onchange="setArtifactPotential('${artifactName.replace(/'/g, "\\'")}', ${i}, this.value)"
                        class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <option value="">-- None --</option>
        `;

        // Add potential options grouped by rarity
        Object.entries(artifactPotentialData).forEach(([rarity, stats]) => {
            html += `<optgroup label="${rarity}">`;
            Object.entries(stats).forEach(([statName, value]) => {
                const isSelected = currentPotentials[i] === `${rarity}:${statName}`;
                html += `<option value="${rarity}:${statName}" ${isSelected ? 'selected' : ''}>
                    ${statName} (+${value}${statName.includes('Accuracy') && !statName.includes('%') ? '' : '%'})
                </option>`;
            });
            html += `</optgroup>`;
        });

        html += `
                </select>
            </div>
        `;
    }

    // Action buttons
    html += `
            <div style="display: flex; gap: 8px; margin-top: 20px;">
    `;

    if (showEquipButton) {
        // Show Equip button when viewing artifact from grid with slot selected
        html += `
                <button onclick="equipPreviewedArtifact()"
                        class="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                        style="flex: 1;">
                    Equip to Slot ${selectedArtifactSlot}
                </button>
                <button onclick="cancelPreview()"
                        class="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                        style="flex: 1;">
                    Cancel
                </button>
        `;
    } else if (selectedArtifactSlot && artifactName) {
        // Viewing equipped artifact - show Clear Slot button
        html += `
                <button onclick="clearArtifactSlot()"
                        class="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg cursor-pointer font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                        style="flex: 1;">
                    Clear Slot ${selectedArtifactSlot}
                </button>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Render right panel: artifact grid
export function renderArtifactGrid() {
    const container = document.getElementById('artifacts-grid-panel');
    if (!container) return;

    const preset = artifactPresets[currentArtifactPreset];
    // Slots now store artifact names directly (strings), not objects
    const equippedNames = [preset.slot1, preset.slot2, preset.slot3].filter(name => name && typeof name === 'string');

    let html = `
        <div style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 15px; text-align: center;">
            Select Artifact
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-height: 600px; overflow-y: auto; padding: 5px;">
    `;

    artifactsData.forEach(artifact => {
        const isEquipped = equippedNames.includes(artifact.name);
        const isPreviewing = previewArtifactName === artifact.name;
        const libraryEntry = artifactLibrary[artifact.name] || { stars: 0, potentials: [null, null, null] };

        // Build stars with filled (gold) and empty (grey) styling
        const filledStars = '★'.repeat(libraryEntry.stars);
        const emptyStars = '☆'.repeat(5 - libraryEntry.stars);
        const starsHtml = `<span style="color: #FFD700;">${filledStars}</span><span style="color: #666;">${emptyStars}</span>`;

        html += `
            <div onclick="previewArtifact('${artifact.name.replace(/'/g, "\\'")}')"
                 style="background: var(--background); border: 2px solid ${isPreviewing ? 'var(--accent-primary)' : (isEquipped ? 'var(--accent-success)' : 'var(--border-color)')};
                        border-radius: 8px; padding: 8px; cursor: pointer; transition: all 0.3s;
                        box-shadow: 0 2px 8px var(--shadow); position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px;"
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px var(--shadow)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px var(--shadow)'"
                 title="${artifact.name}">
                ${isEquipped ? `<div style="position: absolute; top: 4px; right: 4px; background: var(--accent-success);
                                            color: white; border-radius: 50%; width: 18px; height: 18px;
                                            display: flex; align-items: center; justify-content: center; font-size: 0.7em; font-weight: 700;">✓</div>` : ''}
                <img src="media/artifacts/${artifact.imageName}" alt="${artifact.name}"
                     style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
                <div style="font-size: 0.75em; font-weight: 600;">${starsHtml}</div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Event Handlers

export function switchArtifactPreset(presetNum) {
    currentArtifactPreset = parseInt(presetNum);
    selectedArtifactSlot = null;
    // Keep previewArtifactName so user can equip the same artifact across multiple presets
    renderArtifactsTab();
    saveArtifactsToLocalStorage();
}

export function selectArtifactSlot(slotNum) {
    selectedArtifactSlot = slotNum;

    // Only clear preview if the slot already has an artifact (so user can edit it)
    // Keep preview if slot is empty (so user can equip the selected artifact)
    const preset = artifactPresets[currentArtifactPreset];
    const slotKey = `slot${slotNum}`;
    const artifactInSlot = preset[slotKey];

    if (artifactInSlot && typeof artifactInSlot === 'string' && artifactInSlot.trim() !== '') {
        // Slot has an artifact - clear preview to show the equipped artifact
        previewArtifactName = null;
    }
    // Otherwise keep previewArtifactName so user can equip it to this empty slot

    renderArtifactsTab();
}

export function previewArtifact(artifactName) {
    previewArtifactName = artifactName;
    renderArtifactDetail();
    renderArtifactGrid();
}

export function equipPreviewedArtifact() {
    if (!selectedArtifactSlot || !previewArtifactName) return;

    const preset = artifactPresets[currentArtifactPreset];
    const slotKey = `slot${selectedArtifactSlot}`;

    // Check if artifact is already equipped in this preset
    const equippedInPreset = Object.values(preset).includes(previewArtifactName);
    if (equippedInPreset) {
        alert('This artifact is already equipped in another slot of this preset!');
        return;
    }

    // Equip the artifact (just store the name reference)
    preset[slotKey] = previewArtifactName;

    // Ensure artifact exists in library
    if (!artifactLibrary[previewArtifactName]) {
        artifactLibrary[previewArtifactName] = {
            stars: 0,
            potentials: [null, null, null]
        };
    }

    // Clear preview and refresh
    previewArtifactName = null;
    renderArtifactsTab();
    saveArtifactsToLocalStorage();
}

export function cancelPreview() {
    previewArtifactName = null;
    renderArtifactDetail();
    renderArtifactGrid();
}

export function setArtifactStars(artifactName, stars) {
    // Edit the artifact in the library (not the preset slot)
    if (!artifactLibrary[artifactName]) {
        artifactLibrary[artifactName] = {
            stars: 0,
            potentials: [null, null, null]
        };
    }

    artifactLibrary[artifactName].stars = stars;

    // Refresh all views (this will update all presets using this artifact)
    renderArtifactDetail();
    renderEquippedArtifacts();
    renderArtifactGrid();
    saveArtifactsToLocalStorage();
}

export function setArtifactPotential(artifactName, potentialIndex, value) {
    // Edit the artifact in the library (not the preset slot)
    if (!artifactLibrary[artifactName]) {
        artifactLibrary[artifactName] = {
            stars: 0,
            potentials: [null, null, null]
        };
    }

    artifactLibrary[artifactName].potentials[potentialIndex] = value || null;

    // Refresh all views (this will update all presets using this artifact)
    renderEquippedArtifacts();
    saveArtifactsToLocalStorage();
}

export function clearArtifactSlot() {
    if (!selectedArtifactSlot) return;

    const preset = artifactPresets[currentArtifactPreset];
    const slotKey = `slot${selectedArtifactSlot}`;
    preset[slotKey] = null; // Just clear the reference

    previewArtifactName = null; // Also clear preview
    renderArtifactsTab();
    saveArtifactsToLocalStorage();
}

// LocalStorage

export function saveArtifactsToLocalStorage() {
    try {
        localStorage.setItem('artifactLibrary', JSON.stringify(artifactLibrary));
        localStorage.setItem('artifactPresets', JSON.stringify(artifactPresets));
        localStorage.setItem('currentArtifactPreset', currentArtifactPreset.toString());
    } catch (error) {
        console.error('Error saving artifacts to localStorage:', error);
    }
}

export function loadArtifactsFromLocalStorage() {
    try {
        // Load library
        const savedLibrary = localStorage.getItem('artifactLibrary');
        if (savedLibrary) {
            artifactLibrary = JSON.parse(savedLibrary);
        } else {
            initializeArtifactLibrary();
        }

        // Load presets
        const saved = localStorage.getItem('artifactPresets');
        if (saved) {
            const loadedPresets = JSON.parse(saved);

            // Migrate old format to new format if needed
            let needsMigration = false;
            for (let presetNum in loadedPresets) {
                const preset = loadedPresets[presetNum];
                for (let slotKey in preset) {
                    if (preset[slotKey] && typeof preset[slotKey] === 'object' && preset[slotKey].name) {
                        needsMigration = true;
                        break;
                    }
                }
                if (needsMigration) break;
            }

            if (needsMigration) {
                // Migrate old format: extract stars/potentials to library
                for (let presetNum in loadedPresets) {
                    const preset = loadedPresets[presetNum];
                    for (let slotKey in preset) {
                        const slot = preset[slotKey];
                        if (slot && typeof slot === 'object' && slot.name) {
                            // Move stars and potentials to library if not already there
                            if (!artifactLibrary[slot.name]) {
                                artifactLibrary[slot.name] = {
                                    stars: slot.stars || 0,
                                    potentials: slot.potentials || [null, null, null]
                                };
                            }
                            // Replace slot object with just the name
                            preset[slotKey] = slot.name;
                        } else if (slot && typeof slot === 'object') {
                            // Malformed object without name - clear it
                            preset[slotKey] = null;
                        }
                    }
                }
                console.log('Migrated artifact data from old format to new library format');
            }

            // Final cleanup: ensure all slots are either valid strings or null
            for (let presetNum in loadedPresets) {
                const preset = loadedPresets[presetNum];
                for (let slotKey in preset) {
                    const slot = preset[slotKey];
                    if (slot !== null && (typeof slot !== 'string' || slot.trim() === '')) {
                        preset[slotKey] = null;
                    }
                }
            }

            artifactPresets = loadedPresets;
        } else {
            initializeArtifactPresets();
        }

        const savedPreset = localStorage.getItem('currentArtifactPreset');
        if (savedPreset) {
            currentArtifactPreset = parseInt(savedPreset);
        }
    } catch (error) {
        console.error('Error loading artifacts from localStorage:', error);
        initializeArtifactLibrary();
        initializeArtifactPresets();
    }
}

// Initialize on load
export function initializeArtifacts() {
    initializeArtifactLibrary();
    initializeArtifactPresets();
    loadArtifactsFromLocalStorage();
    renderArtifactsTab();
}
