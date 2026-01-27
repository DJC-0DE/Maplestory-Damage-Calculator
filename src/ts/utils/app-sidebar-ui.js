import { StatCalculationService } from "@ts/services/stat-calculation-service.js";
import { loadoutStore } from "@ts/store/loadout.store.js";
import { formatDPS } from "./formatters.js";
import { debounce } from "./event-emitter.js";
function generateSubmenuItem(page, tab, label) {
  const displayStyle = tab === "stat-breakdown" || tab === "artifacts" ? 'style="display: none;"' : "";
  return `<button ${displayStyle} class="sidebar-submenu-item" data-tab="${tab}" onclick="navigateToTab('${page}', '${tab}')">${label}</button>`;
}
function generateNavSection(pageId, icon, label, submenus) {
  const submenuItems = submenus.map(({ tab, label: label2 }) => generateSubmenuItem(pageId, tab, label2)).join("\n                ");
  return `
            <!-- ${label} Section -->
            <button class="sidebar-nav-item" data-page="${pageId}" onclick="toggleSubMenu('${pageId}')">
                <span class="sidebar-icon">${icon}</span>
                <span>${label}</span>
                <span class="submenu-arrow">\u25BC</span>
            </button>
            <div class="sidebar-submenu" id="submenu-${pageId}">
                ${submenuItems}
            </div>`;
}
function generateAppSidebarHTML() {
  return `
        <nav class="sidebar-nav">
            ${generateNavSection("setup", "\u{1F3AE}", "Loadout", [
    { tab: "base-stats", label: "Base Stats" },
    { tab: "equipment", label: "Equipment" },
    { tab: "weapon-levels", label: "Weapon Levels" },
    { tab: "companions", label: "Companions" },
    { tab: "artifacts", label: "Artifacts" }
  ])}

            ${generateNavSection("optimization", "\u{1F9EA}", "Gear Lab", [
    { tab: "item-comparison", label: "Item Comparison" },
    { tab: "inner-ability", label: "Inner Ability" },
    { tab: "artifact-potential", label: "Artifact Potential" },
    { tab: "scroll-optimizer", label: "Scrolling" },
    { tab: "cube-potential", label: "Cube Potential" },
    { tab: "stat-breakdown", label: "Stat Breakdown" }
  ])}

            ${generateNavSection("predictions", "\u{1F4CA}", "Stat Hub", [
    { tab: "stat-tables", label: "Stat Predictions" },
    { tab: "equivalency", label: "Stat Equivalency" }
  ])}
        </nav>

        <div class="sidebar-footer">
            <div class="sidebar-dps-summary">
                <span class="sidebar-dps-label">Current DPS</span>
                <span id="sidebar-dps-value" class="sidebar-dps-value">-</span>
            </div>
            <div class="sidebar-footer-actions">
                <button onclick="exportData()" class="sidebar-footer-btn">
                    <span>\u{1F4CB}</span>
                    <span>Copy</span>
                </button>
                <button onclick="importData()" class="sidebar-footer-btn">
                    <span>\u{1F4E5}</span>
                    <span>Paste</span>
                </button>
            </div>
            <button onclick="toggleTheme()" id="theme-toggle-sidebar" class="sidebar-footer-btn" style="display: none !important;">
                <span id="theme-icon-sidebar">\u{1F319}</span>import { StatCalculationService } from '@ts/services/stat-calculation-service.js';

                <span>Toggle Theme</span>
            </button>
            <a href="https://paypal.me/freakehms" target="_blank" rel="noopener noreferrer" class="sidebar-footer-btn donate-btn">
                <span>\u{1F49D}</span>
                <span>Support</span>
            </a>
            <button onclick="openCreditsModal()" class="sidebar-footer-btn credits-btn">
                <span>\u2728</span>
                <span>Credits</span>
            </button>
        </div>`;
}
function initializeAppSidebarUI() {
  const container = document.getElementById("app-sidebar");
  if (!container) {
    console.error("App sidebar container not found");
    return;
  }
  container.innerHTML = generateAppSidebarHTML();
  attachAppSidebarEventListeners();
}
function attachAppSidebarEventListeners() {
  loadoutStore.on("data:initialized", (_) => {
    updateDps();
  });
  loadoutStore.on("stat:changed", debounce((_) => {
    updateDps();
  }, 1500));
}
function updateDps() {
  const statCalculationService = new StatCalculationService(loadoutStore.getBaseStats());
  const dpsValue = document.getElementById(`sidebar-dps-value`);
  dpsValue.innerText = formatDPS(statCalculationService.baseBossDPS);
}
export {
  attachAppSidebarEventListeners,
  generateAppSidebarHTML,
  initializeAppSidebarUI
};
//# sourceMappingURL=app-sidebar-ui.js.map
