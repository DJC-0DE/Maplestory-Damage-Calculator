// Tab switching functionality

import { renderArtifactPotential } from "@core/features/artifacts/artifact-potential.js";
import {
  resetSubTabsToDefault,
  updateSubmenuActiveStates,
} from "@core/router.js";

window.switchTab = switchTab;
window.switchTabAndUpdateURL = switchTabAndUpdateURL;

// Tab switching function (for programmatic use only - does NOT update URL)
export function switchTab(group, tabName) {
  _performTabSwitch(group, tabName);
}

// Tab switching function for user interactions (updates URL)
export function switchTabAndUpdateURL(group, tabName, clickEvent) {
  _performTabSwitch(group, tabName, clickEvent);

  // Update URL hash to reflect the new tab state
  // Only update if this is a genuine user click (isTrusted event)
  if (clickEvent && clickEvent.isTrusted) {
    // Map group names to page names for URL
    const pageNameMap = {
      setup: "setup",
      analysis: "optimization",
      predictions: "predictions",
    };
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
function _performTabSwitch(group, tabName, clickEvent = null) {
  // Get all tab contents and buttons within the group
  const tabContents =
    document.querySelectorAll(`#${group}-${tabName}`).length > 0
      ? document.querySelectorAll(`[id^="${group}-"]`)
      : [];

  // Find the button group more robustly - search in common container patterns
  let tabButtons = [];
  const clickedButton = clickEvent?.currentTarget;

  if (clickedButton) {
    // If we have an event, get siblings from the same parent
    tabButtons = Array.from(clickedButton.parentElement.children).filter(
      (child) =>
        child.classList.contains("tab-button") ||
        child.classList.contains("optimization-tab-button"),
    );
  } else {
    // Fallback: search all buttons in the page that match this group
    tabButtons = Array.from(
      document.querySelectorAll(".tab-button, .optimization-tab-button"),
    ).filter((btn) => {
      const onclickAttr = btn.getAttribute("onclick");
      return onclickAttr && onclickAttr.includes(`'${group}'`);
    });
  }

  // Hide all tab contents in this group (support both old and new classes)
  tabContents.forEach((content) => {
    if (
      content.classList.contains("tab-content") ||
      content.classList.contains("optimization-tab-content")
    ) {
      content.classList.remove("active");
    }
  });

  // Remove active class from all buttons in this group
  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Show the selected tab content
  const selectedTab = document.getElementById(`${group}-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  // Add active class to clicked button (if we have one)
  if (clickedButton) {
    clickedButton.classList.add("active");
  } else {
    // If no event, find and activate the button by matching onclick attribute
    tabButtons.forEach((btn) => {
      const onclickAttr = btn.getAttribute("onclick");
      if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
        btn.classList.add("active");
      }
    });
  }

  // Render content for specific tabs
  if (group === "analysis" && tabName === "artifact-potential") {
    renderArtifactPotential();
  }

  // Reset sub-tabs to their default state
  // Map group names to page names for the router
  const pageNameMap = {
    setup: "setup",
    analysis: "optimization",
    predictions: "predictions",
  };
  const pageName = pageNameMap[group];
  if (pageName) {
    resetSubTabsToDefault(pageName, tabName);
    // Update sidebar to reflect the newly selected tab
    updateSubmenuActiveStates(pageName, tabName);
  }
}
