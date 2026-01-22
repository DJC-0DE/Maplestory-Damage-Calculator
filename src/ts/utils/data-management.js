window.importData = importData;
window.exportData = exportData;
function importData() {
  navigator.clipboard.readText().then((text) => {
    try {
      const data = JSON.parse(text);
      const importData2 = data;
      if (!importData2.damageCalculatorData && !importData2.heroPowerPresets && !importData2.cubePotentialData && !importData2.comparisonItems) {
        throw new Error("Invalid data format");
      }
      if (!confirm("\u26A0\uFE0F This will overwrite your current data. Are you sure you want to continue?")) {
        return;
      }
      if (importData2.damageCalculatorData) {
        const dataString = typeof importData2.damageCalculatorData === "string" ? importData2.damageCalculatorData : JSON.stringify(importData2.damageCalculatorData);
        localStorage.setItem("damageCalculatorData", dataString);
      }
      if (importData2.heroPowerPresets) {
        const dataString = typeof importData2.heroPowerPresets === "string" ? importData2.heroPowerPresets : JSON.stringify(importData2.heroPowerPresets);
        localStorage.setItem("heroPowerPresets", dataString);
      }
      if (importData2.cubePotentialData) {
        const dataString = typeof importData2.cubePotentialData === "string" ? importData2.cubePotentialData : JSON.stringify(importData2.cubePotentialData);
        localStorage.setItem("cubePotentialData", dataString);
      }
      if (importData2.comparisonItems) {
      }
      if (importData2.selectedClass) {
        localStorage.setItem("selectedClass", importData2.selectedClass);
      }
      if (importData2.selectedJobTier) {
        localStorage.setItem("selectedJobTier", importData2.selectedJobTier);
      }
      if (importData2.theme) {
        localStorage.setItem("theme", importData2.theme);
      }
      alert("\u2705 Data imported successfully! Refreshing page...");
      location.reload();
    } catch (err) {
      console.error("Failed to import data:", err);
      alert("\u274C Failed to import data. Please make sure you copied valid data.");
    }
  }).catch((err) => {
    console.error("Failed to read clipboard:", err);
    alert("\u274C Failed to read clipboard. Please make sure you have data copied.");
  });
}
function exportData() {
  const allData = {
    damageCalculatorData: localStorage.getItem("damageCalculatorData"),
    heroPowerPresets: localStorage.getItem("heroPowerPresets"),
    cubePotentialData: localStorage.getItem("cubePotentialData"),
    comparisonItems: exportComparisonItems(),
    selectedClass: localStorage.getItem("selectedClass"),
    selectedJobTier: localStorage.getItem("selectedJobTier"),
    theme: localStorage.getItem("theme")
  };
  Object.keys(allData).forEach((key) => {
    const value = allData[key];
    if (value && typeof value === "string") {
      try {
        allData[key] = JSON.parse(value);
      } catch (e) {
      }
    }
  });
  const jsonString = JSON.stringify(allData, null, 2);
  navigator.clipboard.writeText(jsonString).then(() => {
    alert("\u2705 Data copied to clipboard! You can now paste it on another device.");
  }).catch((err) => {
    console.error("Failed to copy data:", err);
    alert("\u274C Failed to copy data. Please check console for details.");
  });
}
export {
  exportData,
  importData
};
//# sourceMappingURL=data-management.js.map
