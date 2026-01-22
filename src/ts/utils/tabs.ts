// Tab switching functionality

import { resetSubTabsToDefault, updateSubmenuActiveStates } from '@core/router.js';

declare global {
    interface Window {
        switchTab: (group: TabGroup, tabName: string) => void;
        switchTabAndUpdateURL: (group: TabGroup, tabName: string, clickEvent: MouseEvent) => void;
    }
}

type TabGroup = 'setup' | 'analysis' | 'predictions';
type PageName = 'setup' | 'optimization' | 'predictions';

const pageNameMap: Record<TabGroup, PageName> = {
    'setup': 'setup',
    'analysis': 'optimization',
    'predictions': 'predictions'
};

window.switchTab = switchTab;
window.switchTabAndUpdateURL = switchTabAndUpdateURL;

// Tab switching function (for programmatic use only - does NOT update URL)
export function switchTab(group: TabGroup, tabName: string): void {
    _performTabSwitch(group, tabName);
}

// Tab switching function for user interactions (updates URL)
export function switchTabAndUpdateURL(group: TabGroup, tabName: string, clickEvent: MouseEvent): void {
    _performTabSwitch(group, tabName, clickEvent);

    // Update URL hash to reflect the new tab state
    // Only update if this is a genuine user click (isTrusted event)
    if (clickEvent.isTrusted) {
        const pageName = pageNameMap[group];
        if (pageName) {
            // Update hash
            const currentHash = window.location.hash;
            const newHash = `#/${pageName}/${tabName}`;
            if (currentHash !== newHash) {
                window.location.hash = newHash;
            }
        }
    }
}

// Internal tab switching logic (shared between both functions)
function _performTabSwitch(group: TabGroup, tabName: string, clickEvent?: MouseEvent): void {
    // Get all tab contents and buttons within the group
    const targetElement = document.getElementById(`${group}-${tabName}`);
    const tabContents = targetElement
        ? Array.from(document.querySelectorAll<HTMLElement>(`[id^="${group}-"]`))
        : [];

    // Find the button group more robustly - search in common container patterns
    let tabButtons: HTMLElement[] = [];
    const clickedButton = clickEvent?.currentTarget instanceof HTMLElement
        ? clickEvent.currentTarget
        : null;

    if (clickedButton) {
        // If we have an event, get siblings from the same parent
        const parent = clickedButton.parentElement;
        if (parent) {
            tabButtons = Array.from(parent.children).filter((child): child is HTMLElement =>
                child instanceof HTMLElement && (
                    child.classList.contains('tab-button') ||
                    child.classList.contains('optimization-tab-button')
                )
            );
        }
    } else {
        // Fallback: search all buttons in the page that match this group
        tabButtons = Array.from(document.querySelectorAll('.tab-button, .optimization-tab-button')).filter((btn): btn is HTMLElement => {
            const onclickAttr = btn.getAttribute('onclick');
            return onclickAttr && onclickAttr.includes(`'${group}'`);
        });
    }

    // Hide all tab contents in this group (support both old and new classes)
    tabContents.forEach((content) => {
        if (content.classList.contains('tab-content') || content.classList.contains('optimization-tab-content')) {
            content.classList.remove('active');
        }
    });

    // Remove active class from all buttons in this group
    tabButtons.forEach((button) => {
        button.classList.remove('active');
    });

    // Show the selected tab content
    const selectedTab = document.getElementById(`${group}-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button (if we have one)
    if (clickedButton) {
        clickedButton.classList.add('active');
    } else {
        // If no event, find and activate the button by matching onclick attribute
        tabButtons.forEach((btn) => {
            const onclickAttr = btn.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
                btn.classList.add('active');
            }
        });
    }

    // Reset sub-tabs to their default state
    const pageName = pageNameMap[group];
    if (pageName) {
        resetSubTabsToDefault(pageName, tabName);
        // Update sidebar to reflect the newly selected tab
        updateSubmenuActiveStates(pageName, tabName);
    }
}
