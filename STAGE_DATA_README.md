# Stage Data Organization

## Overview
All stage/boss data has been extracted from the game's JSON files and organized into separate categories for easier UI implementation.

## File Structure

### `stage-data.js` (Auto-generated)
Contains 740 entries organized into 4 categories:
- **stageHunts**: 244 entries (Chapters 1-28, stages 1-9)
- **chapterBosses**: 26 entries (Chapter bosses 3-28)
- **worldBosses**: 20 entries (World Boss Stages 1-20)
- **growthDungeons**: 450 entries (Chapters 1000-1004, 90 stages each)

### `constants.js`
Imports stage data and makes it available via `stageDefenses` export.

## Data Format

Each entry contains:
```javascript
{
  stage: "1-1",           // Stage identifier
  defense: 0.01,          // Defense % (from MonsterTierTable Defence ÷ 100)
  damageReduction: 0,     // Damage Reduction % (set to 0 for all new entries)
  accuracy: 1             // Accuracy requirement (from MonsterTierTable HitChance)
}
```

## Defense Calculation

Defense now uses a **diminishing returns formula** instead of linear reduction:

**Formula**: `damage_multiplier = 100 / (100 + effective_defense)`

Where: `effective_defense = defense * (1 - defense_penetration / 100)`

**Examples**:
- 27% defense: `100 / (100 + 27) = 0.787` (78.7% damage dealt)
- 615% defense: `100 / (100 + 615) = 0.14` (14% damage dealt)

This ensures:
- You always deal some damage, even at very high defense
- Defense penetration is always valuable
- No negative multipliers or healing enemies

## Next Steps

The UI should be updated to:
1. Ask user to select content type first (Stage Hunt, Chapter Boss, World Boss, Growth Dungeon)
2. Show appropriate dropdown based on selection
3. Display accuracy requirements in the UI
4. Use the new defense formula for damage calculations

## Data Sources

All data extracted from:
- `ignore/textassets/DungeonTable.json` - Dungeon definitions
- `ignore/textassets/MonsterTierTable.json` - Monster stats (Defence, HitChance)
- `ignore/textassets/CampFamilyTable.json` - Family/boss mappings
- `ignore/textassets/Localization_en.json` - Display names
