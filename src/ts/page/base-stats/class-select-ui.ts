/**
 * DOM manipulation layer for Class Selection
 * All functions handle only DOM operations and delegate logic to class-select.ts
 */

import { updateSkillCoefficient } from './base-stats';
import { updateMasteryBonuses } from './mastery-bonus';
import type { JobTier, ClassName } from '@ts/types';
import { CLASS, JOB_TIER } from '@ts/types/constants';
import {
    isStrMainStatClass,
    isDexMainStatClass,
    isIntMainStatClass,
    isLukMainStatClass
} from './class-select';
import { syncMainStatsToHidden } from './base-stats-ui';
import type { ClassConfig } from '@ts/types/page/base-stats/base-stats.types';
import { loadoutStore } from '@ts/store/loadout.store';

// ============================================================================
// CLASSES CONFIGURATION
// ============================================================================

// Classes configuration for generating class selector HTML
const CLASSES: ClassConfig[] = [
    { id: CLASS.HERO, name: 'Hero', image: 'media/classes/hero.png' },
    { id: CLASS.DARK_KNIGHT, name: 'Dark Knight', image: 'media/classes/dk.png' },
    { id: CLASS.BOWMASTER, name: 'Bowmaster', image: 'media/classes/bowmaster.png' },
    { id: CLASS.MARKSMAN, name: 'Marksman', image: 'media/classes/marksman.png' },
    { id: CLASS.NIGHT_LORD, name: 'Night Lord', image: 'media/classes/nl.png' },
    { id: CLASS.SHADOWER, name: 'Shadower', image: 'media/classes/shadower.png' },
    { id: CLASS.ARCH_MAGE_IL, name: 'Arch Mage (I/L)', image: 'media/classes/mage-il.png' },
    { id: CLASS.ARCH_MAGE_FP, name: 'Arch Mage (F/P)', image: 'media/classes/mage-fp.png' }
];

// ============================================================================
// WINDOW GLOBALS - HTML onclick handlers
// ============================================================================

if (typeof window !== 'undefined') {
    window.selectJobTier = selectJobTier;
    window.selectClass = selectClass;
    window.selectMasteryTab = selectMasteryTab;
}

// ============================================================================
// USER INTERACTION METHODS
// ============================================================================

/**
 * Handle user clicking on a job tier button
 */
export function selectJobTier(tier: JobTier): void {
    loadoutStore.updateCharacter({ jobTier: tier });
    updateJobTierButtonUI(tier);
    updateMasteryTableVisibility(tier);
    updateMasteryTabUI(tier);
    updateSkillCoefficient();
    updateMasteryBonuses();
    //updateAnalysisTabs();
}

/**
 * Handle user clicking on a class card
 */
export function selectClass(className: ClassName): void {
    loadoutStore.updateCharacter({ class: className });
    updateClassSelectionUI(className);
    updateClassUI(className);

    try {
        //updateClassWarning();
    } catch (error) {
        // Cube module may not be initialized yet
    }
}

/**
 * Handle user clicking on a mastery tab (3rd Job / 4th Job)
 * Switches the visible mastery table without changing job tier state
 */
export function selectMasteryTab(tier: JobTier): void {
    updateMasteryTabUI(tier);
    updateMasteryTableVisibility(tier);
}

// ============================================================================
// INITIALIZATION METHODS
// ============================================================================

/**
 * Initialize class select state from saved localStorage data
 */
export function initializeClassSelectUI(): void {
    const character = loadoutStore.getCharacter();

    if (character.jobTier) {
        initializeJobTierState(character.jobTier);
    }

    if (character.class) {
        initializeClassState(character.class as ClassName);
    }
}

/**
 * Load class select UI from saved state
 */
export function loadClassSelectUI(): void {
    const character = loadoutStore.getCharacter();

    if (character.jobTier) {
        restoreJobTierSelection(character.jobTier);
    }

    if (character.class) {
        restoreClassSelection(character.class as ClassName);
    }
}

// ============================================================================
// STATE INITIALIZATION (UI-LESS)
// ============================================================================

/**
 * Initialize job tier state only - does NOT update UI
 */
function initializeJobTierState(tier: JobTier): void {
    loadoutStore.updateCharacter({ jobTier: tier });
}

/**
 * Initialize class state only - does NOT update UI
 */
function initializeClassState(className: ClassName): void {
    loadoutStore.updateCharacter({ class: className });
}

// ============================================================================
// UI RESTORATION
// ============================================================================

function restoreJobTierSelection(tier: JobTier): void {
    updateJobTierButtonUI(tier);
    updateMasteryTableVisibility(tier);
    updateMasteryTabUI(tier);
    updateSkillCoefficient();
}

function restoreClassSelection(className: ClassName): void {
    updateClassSelectionUI(className);
    updateClassUI(className);
}

// ============================================================================
// UI HELPERS
// ============================================================================

function updateJobTierButtonUI(tier: JobTier): void {
    document.querySelectorAll('.bgstats-tier-btn').forEach(el => {
        el.classList.remove('active');
    });

    const tierElement = document.getElementById(`job-tier-${tier}`);
    if (tierElement) {
        tierElement.classList.add('active');
    }
}

function updateClassSelectionUI(className: ClassName): void {
    document.querySelectorAll('.class-selector').forEach(el => {
        el.classList.remove('selected');
    });

    const classElement = document.getElementById(`class-${className}`);
    if (classElement) {
        classElement.classList.add('selected');
    }
}

function updateMasteryTabUI(tier: JobTier): void {
    document.querySelectorAll('.bgstats-mastery-tab').forEach(el => {
        el.classList.remove('active');
    });

    const masteryTab = document.getElementById(`mastery-tab-${tier}`);
    if (masteryTab) {
        masteryTab.classList.add('active');
    }
}

function updateMasteryTableVisibility(tier: JobTier): void {
    const mastery3rdTable = document.getElementById('mastery-table-3rd');
    const mastery4thTable = document.getElementById('mastery-table-4th');

    if (!mastery3rdTable || !mastery4thTable) return;

    if (tier === JOB_TIER.THIRD) {
        mastery3rdTable.style.display = 'block';
        mastery4thTable.style.display = 'none';
    } else if (tier === JOB_TIER.FOURTH) {
        mastery3rdTable.style.display = 'none';
        mastery4thTable.style.display = 'block';
    }
}

/**
 * Update UI elements that depend on the selected class
 * Defense input only shows for Dark Knight
 */
function updateClassUI(className: ClassName): void {
    const defenseInputGroup = document.getElementById('defense-input-group');
    if (defenseInputGroup) {
        defenseInputGroup.style.display = className === CLASS.DARK_KNIGHT ? 'flex' : 'none';
    }

    const strRow = document.getElementById('str-row');
    const dexRow = document.getElementById('dex-row');
    const intRow = document.getElementById('int-row');
    const lukRow = document.getElementById('luk-row');

    if (strRow) strRow.style.display = 'none';
    if (dexRow) dexRow.style.display = 'none';
    if (intRow) intRow.style.display = 'none';
    if (lukRow) lukRow.style.display = 'none';

    if (isStrMainStatClass(className)) {
        if (strRow) strRow.style.display = 'flex';
        if (dexRow) dexRow.style.display = 'flex';
    } else if (isDexMainStatClass(className)) {
        if (dexRow) dexRow.style.display = 'flex';
        if (strRow) strRow.style.display = 'flex';
    } else if (isIntMainStatClass(className)) {
        if (intRow) intRow.style.display = 'flex';
        if (lukRow) lukRow.style.display = 'flex';
    } else if (isLukMainStatClass(className)) {
        if (lukRow) lukRow.style.display = 'flex';
        if (dexRow) dexRow.style.display = 'flex';
    }

    syncMainStatsToHidden();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Attach event listeners to class selector cards
 */
function attachClassSelectorListeners(): void {
    CLASSES.forEach(cls => {
        const element = document.getElementById(`class-${cls.id}`);
        if (element) {
            element.addEventListener('click', () => selectClass(cls.id));
        }
    });
}

/**
 * Attach event listeners to job tier buttons
 */
function attachJobTierListeners(): void {
    const tier3rd = document.getElementById('job-tier-3rd');
    const tier4th = document.getElementById('job-tier-4th');

    if (tier3rd) {
        tier3rd.addEventListener('click', () => selectJobTier(JOB_TIER.THIRD));
    }
    if (tier4th) {
        tier4th.addEventListener('click', () => selectJobTier(JOB_TIER.FOURTH));
    }
}

/**
 * Attach all event listeners for class select UI
 */
export function attachClassSelectEventListeners(): void {
    attachClassSelectorListeners();
    attachJobTierListeners();
}

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for class selector cards
 */
export function generateClassSelectorHTML(): string {
    return CLASSES.map(cls => `
        <div id="class-${cls.id}" class="class-selector bgstats-class-card" title="${cls.title || cls.name}">
            <div class="bgstats-class-image-wrapper">
                <img src="${cls.image}" alt="${cls.name}" class="bgstats-class-image">
            </div>
            <span class="bgstats-class-name">${cls.name}</span>
        </div>
    `).join('');
}
