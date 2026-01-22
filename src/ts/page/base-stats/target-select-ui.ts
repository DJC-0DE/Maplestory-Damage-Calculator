/**
 * DOM manipulation layer for Target/Stage selection
 * All functions handle only DOM operations and delegate logic to target-select.ts
 */
import { CONTENT_TYPE } from '@ts/types/constants';
import type { ContentType } from '@ts/types';
import type { ContentTypeConfig } from '@ts/types/page/base-stats/base-stats.types';
import {
    getSubcategoryOptions,
    getFilteredStageEntries,
    formatStageLabel,
    requiresSubcategory,
    SavedContentTypeData
} from './target-select';
import { loadoutStore } from '@ts/store/loadout.store';

// Content type configuration for generating content selector HTML
const CONTENT_TYPES: ContentTypeConfig[] = [
    { id: CONTENT_TYPE.NONE, name: 'None', icon: '🎯', title: 'Training Dummy' },
    { id: CONTENT_TYPE.STAGE_HUNT, name: 'Stage Hunt', icon: '🗺️', title: 'Stage Hunt' },
    { id: CONTENT_TYPE.CHAPTER_BOSS, name: 'Chapter Boss', icon: '👑', title: 'Chapter Boss' },
    { id: CONTENT_TYPE.WORLD_BOSS, name: 'World Boss', icon: '🌍', title: 'World Boss' },
    { id: CONTENT_TYPE.GROWTH_DUNGEON, name: 'Growth Dungeon', icon: '📈', title: 'Growth Dungeon' }
];

// ============================================================================
// WINDOW GLOBALS - HTML onclick handlers
// ============================================================================

if (typeof window !== 'undefined') {
    window.selectContentType = selectContentType;
    window.onSubcategoryChange = onSubcategoryChange;
}

// ============================================================================
// USER INTERACTION METHODS
// ============================================================================

/**
 * Handle user clicking on a content type button
 */
export function selectContentType(contentType: ContentType): void {
    updateContentTypeSelectionUI(contentType);
    configureDropdownsForContentType(contentType);

    // Save via loadout store (auto dual-writes to localStorage)
    const updateData: { contentType: ContentType; subcategory?: string } = { contentType };

    // If content type requires subcategory, save the default first option
    if (requiresSubcategory(contentType)) {
        const subcategorySelect = document.getElementById('target-subcategory') as HTMLSelectElement;
        if (subcategorySelect && subcategorySelect.options.length > 0) {
            updateData.subcategory = subcategorySelect.options[0].value;
        }
    }

    loadoutStore.updateTarget(updateData);
    //updateAnalysisTabs();
}

/**
 * Handle user changing the subcategory dropdown
 */
export function onSubcategoryChange(): void {
    const subcategorySelect = document.getElementById('target-subcategory') as HTMLSelectElement;
    const stageSelect = document.getElementById('target-stage') as HTMLSelectElement;
    if (!subcategorySelect || !stageSelect) return;

    const subcategory = subcategorySelect.value;
    const target = loadoutStore.getTarget();

    if (target.contentType === CONTENT_TYPE.STAGE_HUNT) {
        const chapter = subcategory.replace('chapter-', '');
        populateStageDropdownFiltered(CONTENT_TYPE.STAGE_HUNT, chapter);
    } else if (target.contentType === CONTENT_TYPE.GROWTH_DUNGEON) {
        populateStageDropdownFiltered(CONTENT_TYPE.GROWTH_DUNGEON, subcategory);
    }

    stageSelect.style.display = 'block';

    // Save subcategory only - selectedStage is saved by the stage dropdown's own change event listener
    loadoutStore.updateTarget({ subcategory });
    //updateAnalysisTabs();
}

// ============================================================================
// INITIALIZATION METHODS
// ============================================================================

/**
 * Load target select UI from saved state
 */
export function loadTargetSelectUI(): void {
    const target = loadoutStore.getTarget();

    restoreSavedSelectionUI({ contentType: target.contentType, subcategory: target.subcategory, selectedStage: target.selectedStage });
}

// ============================================================================
// STATE INITIALIZATION (UI-LESS)
// ============================================================================

function initializeWithDefaultState(): void {
    loadoutStore.updateTarget({ contentType: CONTENT_TYPE.NONE});
}

// ============================================================================
// UI RESTORATION
// ============================================================================

function restoreSavedSelectionUI(savedData: SavedContentTypeData): void {
    const { contentType, subcategory, selectedStage } = savedData;

    updateContentTypeSelectionUI(contentType);
    configureDropdownsForContentType(contentType);

    if (subcategory && requiresSubcategory(contentType)) {
        const subcategorySelect = document.getElementById('target-subcategory') as HTMLSelectElement;
        if (subcategorySelect) {
            subcategorySelect.value = subcategory;

            if (contentType === CONTENT_TYPE.STAGE_HUNT) {
                const chapter = subcategory.replace('chapter-', '');
                populateStageDropdownFiltered(CONTENT_TYPE.STAGE_HUNT, chapter);
            } else if (contentType === CONTENT_TYPE.GROWTH_DUNGEON) {
                populateStageDropdownFiltered(CONTENT_TYPE.GROWTH_DUNGEON, subcategory);
            }

            // Show the stage select after populating it
            const stageSelect = document.getElementById('target-stage') as HTMLSelectElement;
            if (stageSelect) {
                stageSelect.style.display = 'block';
            }
        }
    }

    if (selectedStage) {
        const stageSelect = document.getElementById('target-stage') as HTMLSelectElement;
        if (stageSelect) {
            stageSelect.value = selectedStage;
        }
    }
}

// ============================================================================
// UI HELPERS
// ============================================================================

function updateContentTypeSelectionUI(contentType: ContentType): void {
    document.querySelectorAll('.content-type-selector').forEach(el => {
        el.classList.remove('selected');
    });

    const selectedEl = document.getElementById(`content-${contentType}`);
    if (selectedEl) {
        selectedEl.classList.add('selected');
    }

    const subcategorySelect = document.getElementById('target-subcategory') as HTMLSelectElement;
    const stageSelect = document.getElementById('target-stage') as HTMLSelectElement;

    if (subcategorySelect) subcategorySelect.style.display = 'none';
    if (stageSelect) stageSelect.style.display = 'none';
}

function configureDropdownsForContentType(contentType: ContentType): void {
    const subcategorySelect = document.getElementById('target-subcategory') as HTMLSelectElement;
    const stageSelect = document.getElementById('target-stage') as HTMLSelectElement;
    if (!stageSelect) return;

    if (contentType === CONTENT_TYPE.NONE) {
        stageSelect.value = 'none';
        return;
    }

    if (requiresSubcategory(contentType)) {
        populateSubcategoryDropdown(contentType);
        if (subcategorySelect) {
            subcategorySelect.style.display = 'block';
            // Auto-select first option and populate stage dropdown
            subcategorySelect.selectedIndex = 0;
            const firstSubcategory = subcategorySelect.value;

            if (contentType === CONTENT_TYPE.STAGE_HUNT) {
                const chapter = firstSubcategory.replace('chapter-', '');
                populateStageDropdownFiltered(CONTENT_TYPE.STAGE_HUNT, chapter);
            } else if (contentType === CONTENT_TYPE.GROWTH_DUNGEON) {
                populateStageDropdownFiltered(CONTENT_TYPE.GROWTH_DUNGEON, firstSubcategory);
            }
        }
        stageSelect.style.display = 'block';
    } else {
        stageSelect.style.display = 'block';
        populateStageDropdown(contentType);
    }
}

function populateSubcategoryDropdown(contentType: ContentType): void {
    const select = document.getElementById('target-subcategory') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';

    const options = getSubcategoryOptions(contentType);
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        select.appendChild(option);
    });
}

function populateStageDropdown(contentType: ContentType): void {
    const select = document.getElementById('target-stage') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';

    const entries = getFilteredStageEntries(contentType, contentType);

    entries.forEach(({ entry, identifier, prefix }) => {
        const opt = document.createElement('option');
        opt.value = `${prefix}-${identifier}`;
        opt.textContent = formatStageLabel(entry, identifier, contentType);
        select.appendChild(opt);
    });
}

function populateStageDropdownFiltered(contentType: ContentType, filter: string): void {
    const select = document.getElementById('target-stage') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';

    const entries = getFilteredStageEntries(contentType, filter);

    entries.forEach(({ entry, identifier, prefix }) => {
        const opt = document.createElement('option');
        opt.value = `${prefix}-${identifier}`;
        opt.textContent = formatStageLabel(entry, identifier, contentType);
        select.appendChild(opt);
    });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Attach event listeners to content type selector cards
 */
function attachContentTypeSelectorListeners(): void {
    CONTENT_TYPES.forEach(content => {
        const element = document.getElementById(`content-${content.id}`);
        if (element) {
            element.addEventListener('click', () => selectContentType(content.id));
        }
    });
}

/**
 * Attach event listeners to target content dropdowns
 */
function attachTargetContentListeners(): void {
    const subcategorySelect = document.getElementById('target-subcategory') as HTMLSelectElement;
    const stageSelect = document.getElementById('target-stage') as HTMLSelectElement;

    if (subcategorySelect) {
        subcategorySelect.addEventListener('change', () => onSubcategoryChange());
    }

    if (stageSelect) {
        stageSelect.addEventListener('change', () => {
            // Save via loadout store (auto dual-writes to localStorage)
            const stageValue = stageSelect.value;
            loadoutStore.updateTarget({ selectedStage: stageValue });
           // updateAnalysisTabs();
        });
    }
}

/**
 * Attach all event listeners for target select UI
 */
export function attachTargetSelectEventListeners(): void {
    attachContentTypeSelectorListeners();
    attachTargetContentListeners();
}

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for content type selector cards
 */
export function generateContentTypeSelectorHTML(): string {
    return CONTENT_TYPES.map(content => `
        <div id="content-${content.id}" class="content-type-selector bgstats-content-card" title="${content.title}">
            <span class="bgstats-content-icon">${content.icon}</span>
            <span class="bgstats-content-name">${content.name}</span>
        </div>
    `).join('');
}
