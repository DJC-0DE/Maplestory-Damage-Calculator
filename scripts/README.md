# Stage Data Generator Scripts

## Overview

This folder contains scripts to automatically generate game data files from the extracted JSON assets.

## Scripts

### `generate-stage-data.js`

Generates `stage-data.js` containing all stage/boss defense and accuracy data.

**Usage:**
```bash
node scripts/generate-stage-data.js
```

**What it does:**
- Reads data from `ignore/textassets/*.json`
- Extracts defense and accuracy stats for all content types
- Generates organized data structure
- Writes to `stage-data.js`

**Generated Data:**
- **Stage Hunts**: Chapters 1-28, stages 1-9 each (244 entries)
- **Chapter Bosses**: Boss dungeons for chapters 3-28 (26 entries)
- **World Bosses**: World Boss Stages 1-20 (20 entries)
- **Growth Dungeons**: 5 types × 90 stages each (450 entries)
  - Weapon Stage 1-90
  - EXP Stage 1-90
  - Equipment Stage 1-90
  - Enhancement Stage 1-90
  - Hero Training Ground Stage 1-90

**When to regenerate:**
- After updating game files in `ignore/textassets/`
- When new chapters/stages are added
- When defense/accuracy values change

## Data Format

Each entry contains:
```javascript
{
  stage: "19-5",           // Stage identifier
  defense: 31.6,           // Defense % (MonsterTierTable.Defence ÷ 100)
  damageReduction: 0,      // Damage Reduction % (currently 0 for all new entries)
  accuracy: 158            // Accuracy requirement (MonsterTierTable.HitChance)
}
```

For chapter bosses, uses `chapter` instead of `stage`:
```javascript
{
  chapter: "19",
  defense: 27.5,
  damageReduction: 0,
  accuracy: 164
}
```

## Source Files

The generator reads from:
- `DungeonTable.json` - Dungeon definitions and tier mappings
- `MonsterTierTable.json` - Monster stats (Defence, HitChance)
- `CampFamilyTable.json` - Family to monster mappings (for bosses)
- `Localization_en.json` - Display names
- `DungeonVisualizeTable.json` - Visual data and names

## Output

Creates `stage-data.js` in the root directory with timestamp and auto-generated warning.
