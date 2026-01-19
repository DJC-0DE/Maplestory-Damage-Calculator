// Number formatting utility
export function formatNumber(num) {
  return Math.round(num).toLocaleString();
}

// Format DPS with K/M/B suffixes
export function formatDPS(dps) {
  if (dps === null || dps === undefined || isNaN(dps)) {
    return "-";
  }

  const abs = Math.abs(dps);

  if (abs >= 1_000_000_000) {
    return (dps / 1_000_000_000).toFixed(2) + "B";
  } else if (abs >= 1_000_000) {
    return (dps / 1_000_000).toFixed(2) + "M";
  } else if (abs >= 1_000) {
    return (dps / 1_000).toFixed(1) + "K";
  } else {
    return Math.round(dps).toString();
  }
}
