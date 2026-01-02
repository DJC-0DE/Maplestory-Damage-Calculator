# UI Update: Content Type Selection

## What Changed

### 1. UI Layout (index.html)
- Replaced single dropdown with **content type buttons** (similar to class selection)
- Added 5 content type options:
  - 🎯 **None** - Training Dummy (0% def, 0% DR)
  - 🗺️ **Stage Hunt** - Regular stages (244 options)
  - 👑 **Chapter Boss** - Chapter bosses (26 options)
  - 🌍 **World Boss** - World Boss stages (20 options)
  - 📈 **Growth Dungeon** - Growth dungeons (450 options)
- Dropdown appears only after selecting a content type (except "None")

### 2. Styling (styles.css)
- Added `.content-type-selector` class
- Matches the class selector styling
- Hover effects, selected state, transitions

### 3. JavaScript Logic (main.js)
- `selectContentType(contentType)` - Handles button clicks
- `populateStageDropdown(contentType)` - Populates dropdown based on selection
- `getSelectedStageDefense()` - Updated to handle all 4 content types
- Shows defense % and accuracy requirement in dropdown options

### 4. Data Structure (constants.js + stage-data.js)
- Imports from `stage-data.js` (auto-generated)
- Organized into 4 arrays: stageHunts, chapterBosses, worldBosses, growthDungeons

## How It Works

1. User clicks a content type button
2. Button gets "selected" styling
3. Dropdown appears (if not "None") with appropriate options
4. Each option shows: Stage/Chapter + Defense % + Accuracy requirement
5. Selection saves to localStorage and updates calculations

## Example Dropdown Text

**Stage Hunt**: `19-5 (Def: 31.6%, Acc: 158)`
**Chapter Boss**: `Chapter 19 (Def: 27.5%, Acc: 164)`
**World Boss**: `World Boss Stage 10 (Def: 621%, Acc: 123)`
**Growth Dungeon**: `1000-45 (Def: 22.5%, Acc: 95)`

## Benefits

- Cleaner UI - no more huge single dropdown
- Easier to find specific content
- Shows accuracy requirements
- All data from game files (740 entries total)
- Defense formula updated to diminishing returns
