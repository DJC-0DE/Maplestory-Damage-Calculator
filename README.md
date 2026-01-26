# MapleStory Damage Calculator

A comprehensive damage calculator and optimization tool for MapleStory players. Plan your character progression, compare gear options, and maximize your damage output with detailed stat analysis.

## Features

### Loadout Management
- Configure base stats (level, class, primary/secondary stats, mastery)
- Manage equipment across all slots with stat tracking
- Track weapon levels and attack priorities
- Configure companions and their inventory effects

### Gear Lab
- **Item Comparison**: Compare potential gear upgrades with precise DPS calculations
- **Inner Ability**: Optimize inner ability lines for your build
- **Artifact Potential**: Analyze and plan artifact potential configurations
- **Scroll Optimizer**: Plan scrolling strategies for equipment
- **Cube Potential**: Simulate and optimize cube potential outcomes
- **Stat Breakdown**: View detailed damage component analysis

### Stat Hub
- **Stat Predictions**: See how each stat affects your damage with interactive charts
- **Stat Equivalency Calculator**: Convert between different stats to understand relative value

### Advanced Mechanics
- Defense penetration calculations
- Damage amplification tracking
- Final damage computations
- Attack speed hardcap handling (150%)
- Boss vs. normal monster damage calculations
- Critical hit analysis with rate capping
- Stage-specific defense values

### Additional Features
- OCR support for gear screenshot uploads
- Local data persistence
- Responsive design (mobile-friendly)
- Dark mode interface

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start local server: `npm start`
5. Open browser to `http://localhost:8000`

## Testing

The project includes comprehensive Playwright tests:

```bash
npm test                # Run all tests
npm run test:headed     # Run tests in visible browser
npm run test:debug      # Debug tests
```

## Technology

- TypeScript/JavaScript
- Tailwind CSS for styling
- Chart.js for data visualization
- Playwright for testing
- Tesseract.js for OCR functionality
