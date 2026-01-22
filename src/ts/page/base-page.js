class BasePage {
  constructor(pageId, defaultTab) {
    this.currentTab = null;
    this.pageId = pageId;
    this.defaultTab = defaultTab;
  }
  /**
   * Lifecycle: Called before page is visible (prevents flash of unstyled content)
   * Set CSS classes and states BEFORE the page renders
   */
  onBeforePageVisible(tabName) {
    const targetTab = tabName || this.defaultTab;
    const navItem = document.querySelector(`[data-page="${this.pageId}"]`);
    navItem?.classList.add("active");
    this.expandSubmenuIfNeeded();
    this.updateSubmenuActiveStates(targetTab);
  }
  /**
   * Lifecycle: Called after page is visible
   * Initialize tab, load data, attach listeners
   */
  onPageVisible(tabName) {
    const targetTab = tabName || this.defaultTab;
    this.currentTab = targetTab;
    this.activateTab(targetTab);
  }
  /**
   * Switch to a specific tab (called by tab button onclick)
   * Updates URL via router, which triggers lifecycle hooks
   */
  switchToTab(tabName) {
    if (window.navigateToTab) {
      window.navigateToTab(this.pageId, tabName);
    }
  }
  /**
   * Activate a tab UI without changing URL
   * Internal method called by onPageVisible
   */
  activateTab(tabName) {
    const tabClassPattern = `${this.pageId}-tab-content`;
    const buttonClassPattern = `${this.pageId}-tab-button`;
    document.querySelectorAll(`[class^="${tabClassPattern}"]`).forEach((el) => {
      el.classList.remove("active");
    });
    const targetTab = document.getElementById(`${this.pageId}-${tabName}`);
    targetTab?.classList.add("active");
    document.querySelectorAll(`[class^="${buttonClassPattern}"]`).forEach((btn) => {
      btn.classList.remove("active");
      const onclickAttr = btn.getAttribute("onclick");
      if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
        btn.classList.add("active");
      }
    });
    this.updateSubmenuActiveStates(tabName);
  }
  /**
   * Update submenu item active states for the current page
   */
  updateSubmenuActiveStates(tabName) {
    document.querySelectorAll(".sidebar-submenu-item").forEach((item) => {
      item.classList.remove("active");
    });
    const submenu = document.getElementById(`submenu-${this.pageId}`);
    if (!submenu) return;
    const items = submenu.querySelectorAll(".sidebar-submenu-item");
    items.forEach((item) => {
      const onclickAttr = item.getAttribute("onclick");
      if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
        item.classList.add("active");
      }
    });
  }
  /**
   * Expand submenu if on mobile (width < 1024px)
   */
  expandSubmenuIfNeeded() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      const submenu = document.getElementById(`submenu-${this.pageId}`);
      const navItem = document.querySelector(`[data-page="${this.pageId}"]`);
      submenu?.classList.add("expanded");
      navItem?.classList.add("expanded");
    }
  }
  /**
   * Get the current tab name
   */
  getCurrentTab() {
    return this.currentTab;
  }
  /**
   * Get the page ID
   */
  getPageId() {
    return this.pageId;
  }
  /**
   * Get the default tab name
   */
  getDefaultTab() {
    return this.defaultTab;
  }
}
export {
  BasePage
};
//# sourceMappingURL=base-page.js.map
