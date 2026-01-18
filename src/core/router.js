// Hash-based Router
// Manages navigation between pages using URL hashes

import { switchTab } from '@utils/tabs.js';

let currentPage = 'setup';
let currentTab = null;

// Page configurations
const pages = {
    'setup': {
        id: 'page-setup',
        title: 'Loadout',
        defaultTab: 'base-stats'
    },
    'optimization': {
        id: 'page-optimization',
        title: 'Gear Lab',
        defaultTab: 'item-comparison'
    },
    'predictions': {
        id: 'page-predictions',
        title: 'StatHub',
        defaultTab: 'stat-tables'
    }
};

// Navigate to a page
export function navigateTo(pageName) {
    if (!pages[pageName]) {
        console.error(`Page "${pageName}" not found`);
        return;
    }

    // Update hash without triggering hashchange event (only update if no tab specified)
    if (!currentTab || currentPage !== pageName) {
        window.location.hash = pageName === 'setup' ? '' : `#/${pageName}`;
    }

    // Update current page
    currentPage = pageName;

    // Show/hide pages
    showPage(pageName);

    // Update sidebar active state
    updateSidebarActiveState(pageName);

    // Close mobile menu if open
    closeMobileMenu();

    // Activate default tab if no specific tab is set
    if (!window.location.hash.includes(`${pageName}/`)) {
        const defaultTab = pages[pageName]?.defaultTab;
        if (defaultTab) {
            // Use requestAnimationFrame for smoother immediate update
            requestAnimationFrame(() => {
                restoreTabState(pageName, defaultTab);
            });
        }
    }
}

// Show the specified page, hide others
function showPage(pageName) {
    // Hide all pages
    Object.values(pages).forEach(page => {
        const element = document.getElementById(page.id);
        if (element) {
            element.style.display = 'none';
            element.style.visibility = 'visible'; // Ensure visibility is set
        }
    });

    // Show the selected page
    const pageElement = document.getElementById(pages[pageName].id);
    if (pageElement) {
        pageElement.style.display = 'block';
        pageElement.style.visibility = 'visible';
        pageElement.classList.add('page-fade-in');

        // Remove animation class after animation completes
        setTimeout(() => {
            pageElement.classList.remove('page-fade-in');
        }, 300);
    }
}

// Update sidebar navigation to highlight active page
function updateSidebarActiveState(pageName) {
    // Remove active class from all nav items
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to current page nav item
    const activeNavItem = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Expand the submenu for the active page
    expandSubmenuForPage(pageName);
}

// Expand submenu for a specific page (only needed on mobile)
function expandSubmenuForPage(pageName) {
    // Check if we're on mobile (width < 1024px)
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
        // Collapse all submenus first on mobile
        document.querySelectorAll('.sidebar-submenu').forEach(submenu => {
            submenu.classList.remove('expanded');
        });
        document.querySelectorAll('.sidebar-nav-item').forEach(item => {
            item.classList.remove('expanded');
        });

        // Expand the submenu for the active page
        const submenu = document.getElementById(`submenu-${pageName}`);
        const navItem = document.querySelector(`[data-page="${pageName}"]`);

        if (submenu) {
            submenu.classList.add('expanded');
        }
        if (navItem) {
            navItem.classList.add('expanded');
        }
    }
    // On desktop, all submenus are always visible, so no need to manage expansion
}

// Close mobile menu
export function closeMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const hamburger = document.getElementById('mobile-menu-btn');

    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    if (backdrop) {
        backdrop.classList.remove('active');
    }
    if (hamburger) {
        hamburger.classList.remove('hidden');
    }
}

// Open mobile menu
export function openMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const hamburger = document.getElementById('mobile-menu-btn');

    if (sidebar) {
        sidebar.classList.add('mobile-open');
    }
    if (backdrop) {
        backdrop.classList.add('active');
    }
    if (hamburger) {
        hamburger.classList.add('hidden');
    }
}

// Get current page
export function getCurrentPage() {
    return currentPage;
}

// Initialize router - read hash and navigate to appropriate page
export function initializeRouter() {
    // Pre-set the correct active states BEFORE the page renders to prevent flash
    presetActiveStates();

    // Handle initial load BEFORE adding event listener to avoid flash
    handleHashChange();

    // Handle hash changes (browser back/forward)
    window.addEventListener('hashchange', handleHashChange);
}

// Preset active states based on URL hash before page renders
function presetActiveStates() {
    const hash = window.location.hash;
    const hashParts = hash.replace('#/', '').split('/');
    const isMobile = window.innerWidth < 1024;

    let pageName = 'setup';
    let tabName = null;

    if (hash === '' || hash === '#/' || hash === '#') {
        pageName = 'setup';
    } else if (hashParts[0] === 'optimization') {
        pageName = 'optimization';
        tabName = hashParts[1] || null;
    } else if (hashParts[0] === 'predictions') {
        pageName = 'predictions';
        tabName = hashParts[1] || null;
    } else if (hashParts[0] === 'setup') {
        pageName = 'setup';
        tabName = hashParts[1] || null;
    }

    // Set active nav item
    const navItem = document.querySelector(`[data-page="${pageName}"]`);
    if (navItem) {
        navItem.classList.add('active');
        // Only add expanded class on mobile
        if (isMobile) {
            navItem.classList.add('expanded');
        }
    }

    // Set active nav item
    //const tabItem = document.querySelector(`[data-tab="${tabName}"]`);
    //if (tabName) {
    //    tabItem.classList.add('active');
    //    // Only add expanded class on mobile
    //    if (isMobile) {
    //        tabItem.classList.add('expanded');
    //    }
    //}

    // Expand the correct submenu (only on mobile, desktop shows all)
    if (isMobile) {
        const submenu = document.getElementById(`submenu-${pageName}`);
        if (submenu) {
            submenu.classList.add('expanded');
        }
    }

    // Set active submenu item if tab is specified
    if (tabName) {
        const submenu = document.getElementById(`submenu-${pageName}`);
        if (submenu) {
            const items = submenu.querySelectorAll('.sidebar-submenu-item');
            items.forEach(item => {
                const onclickAttr = item.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
                    item.classList.add('active');
                }
            });
        }
    }
}

// Handle hash change events
function handleHashChange() {
    const hash = window.location.hash;
    let pageName = 'setup'; // default
    let tabName = null;

    // Parse hash format: #/page or #/page/tab
    const hashParts = hash.replace('#/', '').split('/');

    if (hash === '' || hash === '#/' || hash === '#') {
        pageName = 'setup';
    } else if (hashParts[0] === 'optimization') {
        pageName = 'optimization';
        tabName = hashParts[1] || null;
    } else if (hashParts[0] === 'predictions') {
        pageName = 'predictions';
        tabName = hashParts[1] || null;
    } else if (hashParts[0] === 'setup') {
        pageName = 'setup';
        tabName = hashParts[1] || null;
    }

    // Update without triggering another hash change
    currentPage = pageName;
    currentTab = tabName;
    showPage(pageName);
    updateSidebarActiveState(pageName);

    // Restore tab state
    restoreTabState(pageName, tabName);
}

// Reset cube tabs to default (Comparison) - flattened 4-tab structure
function resetCubeMainTabs() {
    const mainTabButtons = [
        document.getElementById('cube-main-tab-comparison'),
        document.getElementById('cube-main-tab-rankings'),
        document.getElementById('cube-main-tab-summary'),
        document.getElementById('cube-main-tab-simulation')
    ];
    const mainTabContents = [
        document.getElementById('cube-comparison-content'),
        document.getElementById('cube-rankings-content'),
        document.getElementById('cube-summary-content'),
        document.getElementById('cube-simulation-content')
    ];

    // Control sections
    const comparisonControls = document.getElementById('cube-comparison-controls');
    const rankingsControls = document.getElementById('cube-rankings-controls');

    // Reset all to inactive/hidden
    mainTabButtons.forEach(btn => btn?.classList.remove('active'));
    mainTabContents.forEach(content => {
        if (content) content.classList.remove('active');
    });

    // Hide all control sections
    if (comparisonControls) comparisonControls.style.display = 'none';
    if (rankingsControls) rankingsControls.style.display = 'none';

    // Activate default (Comparison)
    mainTabButtons[0]?.classList.add('active');
    if (mainTabContents[0]) mainTabContents[0].classList.add('active');

    // Show comparison controls
    if (comparisonControls) comparisonControls.style.display = 'block';
}

// Legacy function name for compatibility
function resetCubeSubTabs() {
    // No-op with flattened structure, handled by resetCubeMainTabs
}

// Reset sub-tabs to their default state based on the main tab
export function resetSubTabsToDefault(pageName, tabName) {
   if (pageName === 'setup') {
       if (tabName === 'base-stats') {
           // Reset base-stats sub-tabs to 'character-stats'
           window.switchBaseStatsSubTab?.('character-stats');
       }
   } else if (pageName === 'optimization') {
        if (tabName === 'cube-potential') {
           // Reset cube main tabs to Selected Slot
           resetCubeMainTabs();
           // Reset cube sub-tabs to Comparison
           resetCubeSubTabs();
       }
   }
}

// Restore the active tab on page load
function restoreTabState(pageName, tabName) {
    // Use saved tab or default tab
    const targetTab = tabName || pages[pageName]?.defaultTab;

    if (targetTab) {
        // Update submenu active states FIRST before any visual changes
        updateSubmenuActiveStates(pageName, targetTab);

        const allTabContent = document.querySelectorAll(`[class^="${pageName}-tab-content"]`);
        const allTabButtons = document.querySelectorAll(`[class^="${pageName}-tab-button"]`);

         // Hide all tabs first      
        allTabContent.forEach(tab => {
                tab.classList.remove('active');
        });

        // Show target tab immediately
        const targetTabElement = document.getElementById(`${pageName}-${targetTab}`);
        if (targetTabElement) {
            targetTabElement.classList.add('active');
        }

        // Update button states      
        allTabButtons.forEach(button => {
            button.classList.remove('active');
             const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`${tabName}`)) {
            button.classList.add('active');
        }
        });

        // Reset sub-tabs to their default state
        resetSubTabsToDefault(pageName, targetTab);
    }
}

// Toggle submenu expansion
export function toggleSubMenu(pageName) {
    const isMobile = window.innerWidth < 1024;

    // On mobile, toggle submenu expansion
    if (isMobile) {
        const submenu = document.getElementById(`submenu-${pageName}`);
        const navItem = document.querySelector(`[data-page="${pageName}"]`);

        if (!submenu) return;

        // Toggle expanded class on submenu
        const isExpanded = submenu.classList.contains('expanded');

        if (isExpanded) {
            submenu.classList.remove('expanded');
            if (navItem) navItem.classList.remove('expanded');
        } else {
            submenu.classList.add('expanded');
            if (navItem) navItem.classList.add('expanded');
        }
    }

    // Navigate to the page if not already there (works on both desktop and mobile)
    if (currentPage !== pageName) {
        navigateTo(pageName);
    }
}

// Navigate to a specific tab within a page
export function navigateToTab(pageName, tabName) {
    // Check if the hash is already set to the target (hashchange won't fire if same)
    const currentHash = window.location.hash;
    const targetHash = `#/${pageName}/${tabName}`;
    const hashAlreadySet = currentHash === targetHash;

    // Update URL hash to include tab (only if different)
    if (!hashAlreadySet) {
        window.location.hash = targetHash;
    }

    // First navigate to the page
    if (currentPage !== pageName) {
        currentPage = pageName;
        showPage(pageName);
        updateSidebarActiveState(pageName);
    }

    currentTab = tabName;

    // Use requestAnimationFrame for immediate, smooth transition
    requestAnimationFrame(() => {
        // Find the appropriate tab group and call switchTab directly
        let groupName;
        if (pageName === 'setup') {
            groupName = 'setup';
        } else if (pageName === 'optimization') {
            groupName = 'analysis';
        } else if (pageName === 'predictions') {
            groupName = 'predictions';
        }

        // Only call switchTab directly if hash was already set (no hashchange event fired)
        // If hash changed, handleHashChange already called restoreTabState which handled the visual switching
        if (hashAlreadySet) {
            switchTab(groupName, tabName);
        }

        // Close mobile menu if open
        closeMobileMenu();

        // Update submenu item active states
        updateSubmenuActiveStates(pageName, tabName);
    });
}

// Update submenu item active states
export function updateSubmenuActiveStates(pageName, tabName) {
    // Remove active from ALL submenu items across all pages to prevent multiple selections
    document.querySelectorAll('.sidebar-submenu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Now activate only the specific submenu item for the current page
    const submenu = document.getElementById(`submenu-${pageName}`);
    if (!submenu) return;

    const items = submenu.querySelectorAll('.sidebar-submenu-item');
    items.forEach(item => {
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
            item.classList.add('active');
        }
    });
}

// Export for window access
window.navigateTo = navigateTo;
window.openMobileMenu = openMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.toggleSubMenu = toggleSubMenu;
window.navigateToTab = navigateToTab;
