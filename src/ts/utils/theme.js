window.toggleTheme = () => toggleTheme();
function toggleTheme() {
  const html = document.documentElement;
  if (!html.classList.contains("dark")) {
    html.classList.add("dark");
  }
  localStorage.setItem("theme", "dark");
}
function loadTheme() {
  const html = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleSidebar = document.getElementById("theme-icon-sidebar");
  html.classList.add("dark");
  localStorage.setItem("theme", "dark");
  if (themeToggle) themeToggle.textContent = "\u2600\uFE0F";
  if (themeToggleSidebar) themeToggleSidebar.textContent = "\u2600\uFE0F";
}
export {
  loadTheme,
  toggleTheme
};
//# sourceMappingURL=theme.js.map
