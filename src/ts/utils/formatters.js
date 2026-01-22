function formatNumber(num) {
  return Math.round(num).toLocaleString();
}
function formatDPS(dps) {
  if (dps === null || dps === void 0 || isNaN(dps)) {
    return "-";
  }
  const abs = Math.abs(dps);
  if (abs >= 1e9) {
    return (dps / 1e9).toFixed(2) + "B";
  } else if (abs >= 1e6) {
    return (dps / 1e6).toFixed(2) + "M";
  } else if (abs >= 1e3) {
    return (dps / 1e3).toFixed(1) + "K";
  } else {
    return Math.round(dps).toString();
  }
}
export {
  formatDPS,
  formatNumber
};
//# sourceMappingURL=formatters.js.map
