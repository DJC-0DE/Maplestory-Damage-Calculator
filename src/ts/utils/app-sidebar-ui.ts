/**
 * App Sidebar UI Generation
 *
 * This file handles all HTML generation for the main application sidebar navigation.
 */

import { StatCalculationService } from "@ts/services/stat-calculation-service";
import { loadoutStore } from "@ts/store/loadout.store";
import { formatDPS } from "./formatters";
import { debounce } from "./event-emitter";

// ============================================================================
// HTML GENERATION
// ============================================================================

/**
 * Generate HTML for a submenu item
 */
function generateSubmenuItem(page: string, tab: string, label: string): string {
    const displayStyle = tab === 'stat-breakdown' || tab === 'artifacts' ? 'style="display: none;"' : '';
    return `<button ${displayStyle} class="sidebar-submenu-item" data-tab="${tab}" onclick="navigateToTab('${page}', '${tab}')">${label}</button>`;
}

/**
 * Generate HTML for a navigation section with submenu
 */
function generateNavSection(
    pageId: string,
    icon: string,
    label: string,
    submenus: Array<{ tab: string; label: string }>
): string {
    const submenuItems = submenus
        .map(({ tab, label }) => generateSubmenuItem(pageId, tab, label))
        .join('\n                ');

    return `
            <!-- ${label} Section -->
            <button class="sidebar-nav-item" data-page="${pageId}" onclick="toggleSubMenu('${pageId}')">
                <span class="sidebar-icon">${icon}</span>
                <span>${label}</span>
                <span class="submenu-arrow">▼</span>
            </button>
            <div class="sidebar-submenu" id="submenu-${pageId}">
                ${submenuItems}
            </div>`;
}

/**
 * Generate the complete HTML for the app sidebar
 */
export function generateAppSidebarHTML(): string {
    return `
        <nav class="sidebar-nav">
            ${generateNavSection('setup', '🎮', 'Loadout', [
        { tab: 'base-stats', label: 'Base Stats' },
        { tab: 'equipment', label: 'Equipment' },
        { tab: 'weapon-levels', label: 'Weapon Levels' },
        { tab: 'companions', label: 'Companions' },
        { tab: 'artifacts', label: 'Artifacts' }
    ])}

            ${generateNavSection('optimization', '🧪', 'Gear Lab', [
        { tab: 'item-comparison', label: 'Item Comparison' },
        { tab: 'inner-ability', label: 'Inner Ability' },
        { tab: 'artifact-potential', label: 'Artifact Potential' },
        { tab: 'scroll-optimizer', label: 'Scrolling' },
        { tab: 'cube-potential', label: 'Cube Potential' },
        { tab: 'stat-breakdown', label: 'Stat Breakdown' }
    ])}

            ${generateNavSection('predictions', '📊', 'Stat Hub', [
        { tab: 'stat-tables', label: 'Stat Predictions' },
        { tab: 'equivalency', label: 'Stat Equivalency' }
    ])}
        </nav>

        <div class="sidebar-footer">
            <div class="sidebar-dps-summary">
                <span class="sidebar-dps-label">Current DPS</span>
                <span id="sidebar-dps-value" class="sidebar-dps-value">-</span>
            </div>
            <div class="sidebar-footer-actions">
                <button onclick="exportData()" class="sidebar-footer-btn">
                    <span>📋</span>
                    <span>Copy</span>
                </button>
                <button onclick="importData()" class="sidebar-footer-btn">
                    <span>📥</span>
                    <span>Paste</span>
                </button>
            </div>
            <button onclick="toggleTheme()" id="theme-toggle-sidebar" class="sidebar-footer-btn" style="display: none !important;">
                <span id="theme-icon-sidebar">🌙</span>import { StatCalculationService } from '@ts/services/stat-calculation-service.js';

                <span>Toggle Theme</span>
            </button>
            <a href="https://paypal.me/freakehms" target="_blank" rel="noopener noreferrer" class="sidebar-footer-btn donate-btn">
                <span>💝</span>
                <span>Support</span>
            </a>
            <button onclick="openCreditsModal()" class="sidebar-footer-btn credits-btn">
                <span>✨</span>
                <span>Credits</span>
            </button>
        </div>`;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the app sidebar UI
 */
export function initializeAppSidebarUI(): void {
    const container = document.getElementById('app-sidebar');
    if (!container) {
        console.error('App sidebar container not found');
        return;
    }

    // Generate HTML
    container.innerHTML = generateAppSidebarHTML();

    attachAppSidebarEventListeners();
}

/**
 * Attach event listeners for app sidebar UI
 */
export function attachAppSidebarEventListeners(): void {
    loadoutStore.on('data:initialized', (_) => {
        updateDps();
    });

    loadoutStore.on('stat:changed', debounce((_) => {
        updateDps();
    }, 1500));
}

function updateDps(): void {
    const statCalculationService = new StatCalculationService(loadoutStore.getBaseStats());
    const dpsValue = document.getElementById(`sidebar-dps-value`) as HTMLSpanElement;
    dpsValue.innerText = formatDPS(statCalculationService.baseBossDPS);
}