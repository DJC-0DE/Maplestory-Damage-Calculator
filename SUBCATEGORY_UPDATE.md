# Subcategory Dropdown Update

## Problem
- Stage Hunts: 244 entries in one dropdown (hard to navigate)
- Growth Dungeons: 450 entries in one dropdown (very hard to navigate)

## Solution
Added a **subcategory dropdown** that appears between content type selection and stage selection for Stage Hunts and Growth Dungeons.

## How It Works Now

### Content Type: None
- No dropdowns shown
- Uses training dummy (0% def, 0% DR)

### Content Type: Chapter Boss
- Shows: Stage dropdown directly (26 entries)
- Simple, no subcategory needed

### Content Type: World Boss
- Shows: Stage dropdown directly (20 entries)
- Simple, no subcategory needed

### Content Type: Stage Hunt
1. Shows: **Chapter dropdown** (Chapters 1-28)
2. User selects a chapter
3. Shows: **Stage dropdown** (9 stages for that chapter)

**Example flow:**
- Click "Stage Hunt" button
- Subcategory dropdown appears: "Chapter 19"
- Stage dropdown shows: 19-1, 19-2, 19-3, ... 19-9 (9 entries)

### Content Type: Growth Dungeon
1. Shows: **Dungeon Type dropdown** (5 types)
   - Weapon Stages
   - EXP Stages
   - Equipment Stages
   - Enhancement Stages
   - Hero Training Ground Stages
2. User selects a type
3. Shows: **Stage dropdown** (90 stages for that type)

**Example flow:**
- Click "Growth Dungeon" button
- Subcategory dropdown appears: "Weapon Stages"
- Stage dropdown shows: Weapon Stage 1, 2, 3, ... 90 (90 entries)

## UI Structure

```
[Content Type Buttons: None | Stage Hunt | Chapter Boss | World Boss | Growth Dungeon]
                                ↓
        [Subcategory Dropdown] ← Only for Stage Hunt & Growth Dungeon
                                ↓
              [Stage Dropdown] ← Final selection
```

## Dropdown Sizes After Change

| Content Type | Before | After (max) |
|-------------|--------|-------------|
| None | 0 | 0 |
| Stage Hunt | 244 | 9 per chapter |
| Chapter Boss | 26 | 26 |
| World Boss | 20 | 20 |
| Growth Dungeon | 450 | 90 per type |

## Benefits
- ✅ Much smaller dropdowns (9-90 entries max instead of 244-450)
- ✅ Easier to find specific stages
- ✅ Organized by logical grouping (chapter/type)
- ✅ No change needed for simple content types (Boss/World Boss)
