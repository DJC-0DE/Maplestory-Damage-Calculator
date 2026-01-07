// Tab switching functionality

import { renderArtifactPotential } from '../core/artifact-potential.js';

// Tab switching function
export function switchTab(group, tabName) {
    // Get all tab contents and buttons within the group
    const tabContents = document.querySelectorAll(`#${group}-${tabName}`).length > 0
        ? document.querySelectorAll(`[id^="${group}-"]`)
        : [];
    const tabButtons = event.currentTarget.parentElement.querySelectorAll('.tab-button');

    // Hide all tab contents in this group
    tabContents.forEach(content => {
        if (content.classList.contains('tab-content')) {
            content.classList.remove('active');
        }
    });

    // Remove active class from all buttons in this group
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Show the selected tab content
    const selectedTab = document.getElementById(`${group}-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    event.currentTarget.classList.add('active');

    // Render content for specific tabs
    if (group === 'analysis' && tabName === 'artifact-potential') {
        renderArtifactPotential();
    }
}

// Scrolling sub-tab switching function
export function switchScrollingSubTab(tabName) {
    // Hide all scrolling sub-tabs
    const subtabs = document.querySelectorAll('.scrolling-subtab');
    subtabs.forEach(subtab => {
        subtab.style.display = 'none';
        subtab.classList.remove('active');
    });

    // Remove active class from all scrolling sub-tab buttons
    const buttons = event.currentTarget.parentElement.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    // Show the selected sub-tab
    const selectedSubtab = document.getElementById(`scrolling-${tabName}`);
    if (selectedSubtab) {
        selectedSubtab.style.display = 'block';
        selectedSubtab.classList.add('active');
    }

    // Add active class to clicked button
    event.currentTarget.classList.add('active');
}
