import { resetSubTabsToDefault, updateSubmenuActiveStates } from "@core/router.js";
const pageNameMap = {
  "setup": "setup",
  "analysis": "optimization",
  "predictions": "predictions"
};
window.switchTab = switchTab;
window.switchTabAndUpdateURL = switchTabAndUpdateURL;
function switchTab(group, tabName) {
  _performTabSwitch(group, tabName);
}
function switchTabAndUpdateURL(group, tabName, clickEvent) {
  _performTabSwitch(group, tabName, clickEvent);
  if (clickEvent.isTrusted) {
    const pageName = pageNameMap[group];
    if (pageName) {
      const currentHash = window.location.hash;
      const newHash = `#/${pageName}/${tabName}`;
      if (currentHash !== newHash) {
        window.location.hash = newHash;
      }
    }
  }
}
function _performTabSwitch(group, tabName, clickEvent) {
  const targetElement = document.getElementById(`${group}-${tabName}`);
  const tabContents = targetElement ? Array.from(document.querySelectorAll(`[id^="${group}-"]`)) : [];
  let tabButtons = [];
  const clickedButton = clickEvent?.currentTarget instanceof HTMLElement ? clickEvent.currentTarget : null;
  if (clickedButton) {
    const parent = clickedButton.parentElement;
    if (parent) {
      tabButtons = Array.from(parent.children).filter(
        (child) => child instanceof HTMLElement && (child.classList.contains("tab-button") || child.classList.contains("optimization-tab-button"))
      );
    }
  } else {
    tabButtons = Array.from(document.querySelectorAll(".tab-button, .optimization-tab-button")).filter((btn) => {
      const onclickAttr = btn.getAttribute("onclick");
      return onclickAttr && onclickAttr.includes(`'${group}'`);
    });
  }
  tabContents.forEach((content) => {
    if (content.classList.contains("tab-content") || content.classList.contains("optimization-tab-content")) {
      content.classList.remove("active");
    }
  });
  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });
  const selectedTab = document.getElementById(`${group}-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }
  if (clickedButton) {
    clickedButton.classList.add("active");
  } else {
    tabButtons.forEach((btn) => {
      const onclickAttr = btn.getAttribute("onclick");
      if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
        btn.classList.add("active");
      }
    });
  }
  const pageName = pageNameMap[group];
  if (pageName) {
    resetSubTabsToDefault(pageName, tabName);
    updateSubmenuActiveStates(pageName, tabName);
  }
}
export {
  switchTab,
  switchTabAndUpdateURL
};
//# sourceMappingURL=tabs.js.map
