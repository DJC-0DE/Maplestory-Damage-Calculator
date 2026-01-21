import { CLASS, STAT_TYPE } from "@ts/types";
function isStrMainStatClass(className) {
  return className === CLASS.HERO || className === CLASS.DARK_KNIGHT;
}
function isDexMainStatClass(className) {
  return className === CLASS.BOWMASTER || className === CLASS.MARKSMAN;
}
function isIntMainStatClass(className) {
  return className === CLASS.ARCH_MAGE_IL || className === CLASS.ARCH_MAGE_FP;
}
function isLukMainStatClass(className) {
  return className === CLASS.NIGHT_LORD || className === CLASS.SHADOWER;
}
function getStatType(className, statId) {
  if (isStrMainStatClass(className)) {
    if (statId === "str") return STAT_TYPE.PRIMARY;
    if (statId === "dex") return STAT_TYPE.SECONDARY;
  } else if (isDexMainStatClass(className)) {
    if (statId === "dex") return STAT_TYPE.PRIMARY;
    if (statId === "str") return STAT_TYPE.SECONDARY;
  } else if (isIntMainStatClass(className)) {
    if (statId === "int") return STAT_TYPE.PRIMARY;
    if (statId === "luk") return STAT_TYPE.SECONDARY;
  } else if (isLukMainStatClass(className)) {
    if (statId === "luk") return STAT_TYPE.PRIMARY;
    if (statId === "dex") return STAT_TYPE.SECONDARY;
  }
  return null;
}
function getMainStatIds(className) {
  if (isStrMainStatClass(className)) {
    return { primary: "str", secondary: "dex" };
  } else if (isDexMainStatClass(className)) {
    return { primary: "dex", secondary: "str" };
  } else if (isIntMainStatClass(className)) {
    return { primary: "int", secondary: "luk" };
  } else if (isLukMainStatClass(className)) {
    return { primary: "luk", secondary: "dex" };
  }
  return null;
}
export {
  getMainStatIds,
  getStatType,
  isDexMainStatClass,
  isIntMainStatClass,
  isLukMainStatClass,
  isStrMainStatClass
};
//# sourceMappingURL=class-select.js.map
