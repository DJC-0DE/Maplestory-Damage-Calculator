# Skill Damage Calculation Guide

## Quick Reference: How to Calculate Skill Damage %

### Step 1: Find the Skill Index
**File**: `ignore/textassets/Localization_en.json`

Search for the skill name to find its key (e.g., `"SKILL_NAME_33010"`). The number is your **Skill Index**.

### Step 2: Get Base Damage and Factor Index
**File**: `ignore/textassets/SkillTable.json`

Search for `"SkillIndex": "YOUR_NUMBER"` and find:
- **Values**: First number is base damage (e.g., `"800"` = 80%)
- **ValueLevelFactors**: Second number is the factor table index (e.g., `["0", "21"]` = use factor 21)

### Step 3: Get Level Multiplier
**File**: `ignore/textassets/SkillLevelFactorTable.json`

Find the level entry (e.g., `"Level": "100"`), then look at the **Factor** array.
The value at the index from Step 2 is your multiplier (e.g., `Factor[21] = "1400"` = 1.4x)

### Step 4: Calculate Final Damage
```
Final Damage % = Base Damage × (Factor / 1000)
```

## Example: La Mancha Spear at Level 100

1. Skill Index: **33010**
2. Base: **800** → 80%, Factor Index: **21**
3. Factor[21] at Level 100: **1400**
4. Calculation: `80% × (1400/1000) = 80% × 1.4 = 112%`

## Example: Hex of the Evil Eye at Level 100

1. Skill Index: **33061** (buff component)
2. Base: **150** → 15%, Factor Index: **22**
3. Factor[22] at Level 100: **1300**
4. Calculation: `15% × (1300/1000) = 15% × 1.3 = 19.5%`

## Notes

- Base values in JSON are typically 10x the actual % (800 = 80%)
- Factor values represent multipliers per 1000 (1400 = 1.4x)
- Different skills may use different factor indices for different scaling curves
