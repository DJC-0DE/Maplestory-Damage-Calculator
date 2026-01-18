// Stat Breakdown UI - Shows where base stats come from (equipment and companions)
// REDESIGNED: Premium fintech-meets-gaming-HUD aesthetic with glassmorphism & data visualization
import { getContributedStats, onContributedStatsChange, getUnlockableStatConfigs, getUnlockableStat, updateUnlockableStat, updateUnlockableStatsContributions, getGuildBonusConfigs, getGuildBonus, updateGuildBonus, updateGuildBonusesContributions } from '@core/state.js';
import { getWeaponAttackBonus } from '@core/state.js';
import { saveToLocalStorage } from '@core/storage.js';

// ============================================================================
// CSS DESIGN SYSTEM - Premium Data-Driven Aesthetic
// ============================================================================

const STAT_BREAKDOWN_STYLES = `
    /* ========================================
       STAT BREAKDOWN - PREMIUM ANALYTICS DASHBOARD
       Fintech Terminal × Gaming HUD
       ======================================== */

    /* Premium Typography System */
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    /* ========================================
       DESIGN TOKENS - Premium Color & Spacing System
       ======================================== */

    :root {
        /* Typography - Premium Pairing */
        --sb-font-display: 'Space Grotesk', -apple-system, sans-serif;
        --sb-font-mono: 'JetBrains Mono', 'SF Mono', 'Consolas', monospace;

        /* Contribution Colors - Premium Palette */
        --sb-base: #64748b;
        --sb-equipment: #10b981;
        --sb-scrolling: #3b82f6;
        --sb-cube: #f59e0b;
        --sb-companion: #a855f7;
        --sb-inner-ability: #ec4899;
        --sb-main-stat: #ef4444;
        --sb-unlockable: #14b8a6;
        --sb-guild: #8b5cf6;
        --sb-unaccounted: #f43f5e;

        /* Premium Gradients */
        --sb-gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --sb-gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
        --sb-gradient-accent: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        --sb-gradient-purple: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
        --sb-gradient-teal: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);

        /* Glassmorphism Surfaces */
        --sb-glass-bg: rgba(15, 23, 42, 0.6);
        --sb-glass-border: rgba(255, 255, 255, 0.08);
        --sb-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        --sb-glass-blur: blur(12px);

        /* Surface Hierarchy */
        --sb-surface-elevated: rgba(30, 41, 59, 0.7);
        --sb-surface-base: rgba(15, 23, 42, 0.5);
        --sb-surface-subtle: rgba(51, 65, 85, 0.3);

        /* Border System */
        --sb-border-glass: rgba(255, 255, 255, 0.06);
        --sb-border-hover: rgba(255, 255, 255, 0.12);
        --sb-border-active: rgba(255, 255, 255, 0.18);

        /* Spacing Scale - Precise */
        --sb-space-2xs: 2px;
        --sb-space-xs: 4px;
        --sb-space-sm: 6px;
        --sb-space-md: 10px;
        --sb-space-lg: 14px;
        --sb-space-xl: 20px;
        --sb-space-2xl: 28px;

        /* Animation Curves - Premium Feel */
        --sb-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        --sb-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
        --sb-ease-out: cubic-bezier(0, 0, 0.2, 1);
        --sb-duration-fast: 150ms;
        --sb-duration-base: 250ms;
        --sb-duration-slow: 400ms;

        /* Glow Effects */
        --sb-glow-subtle: 0 0 20px rgba(99, 102, 241, 0.15);
        --sb-glow-medium: 0 0 30px rgba(99, 102, 241, 0.25);
        --sb-glow-strong: 0 0 40px rgba(99, 102, 241, 0.35);
    }

    /* ========================================
       ANIMATED MESH GRADIENT BACKGROUND
       ======================================== */

    .stat-breakdown-wrapper {
        font-family: var(--sb-font-display);
        position: relative;
        background: linear-gradient(135deg,
            rgba(99, 102, 241, 0.03) 0%,
            rgba(168, 85, 247, 0.02) 50%,
            rgba(20, 184, 166, 0.03) 100%);
        border-radius: 16px;
        padding: var(--sb-space-xl);
        animation: fadeIn var(--sb-duration-base) var(--sb-ease-smooth);
    }

    .stat-breakdown-wrapper::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 18px;
        background: linear-gradient(135deg,
            rgba(99, 102, 241, 0.1),
            rgba(168, 85, 247, 0.08),
            rgba(20, 184, 166, 0.1));
        z-index: -1;
        opacity: 0.5;
        animation: gradientShift 8s ease-in-out infinite;
    }

    @keyframes gradientShift {
        0%, 100% {
            filter: hue-rotate(0deg);
        }
        50% {
            filter: hue-rotate(15deg);
        }
    }

    /* ========================================
       PREMIUM TAB SYSTEM - Glassmorphic Navigation
       ======================================== */

    .stat-breakdown-tabs {
        display: flex;
        gap: var(--sb-space-sm);
        padding: var(--sb-space-sm);
        background: var(--sb-glass-bg);
        backdrop-filter: var(--sb-glass-blur);
        -webkit-backdrop-filter: var(--sb-glass-blur);
        border: 1px solid var(--sb-glass-border);
        border-radius: 12px;
        margin-bottom: var(--sb-space-xl);
        box-shadow: var(--sb-glass-shadow),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .stat-tab-button {
        flex: 1;
        padding: 12px 18px;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-family: var(--sb-font-display);
        font-weight: 600;
        font-size: 0.8125rem;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--text-secondary);
        transition: all var(--sb-duration-base) var(--sb-ease-smooth);
        position: relative;
        overflow: hidden;
    }

    .stat-tab-button::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05));
        opacity: 0;
        transition: opacity var(--sb-duration-base) var(--sb-ease-smooth);
        border-radius: 8px;
    }

    .stat-tab-button::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%) scaleX(0);
        width: 60%;
        height: 2px;
        background: currentColor;
        transition: transform var(--sb-duration-base) var(--sb-ease-spring);
        border-radius: 2px 2px 0 0;
    }

    .stat-tab-button:hover {
        color: var(--text-primary);
        transform: translateY(-1px);
    }

    .stat-tab-button:hover::before {
        opacity: 1;
    }

    .stat-tab-button.active {
        background: var(--sb-surface-elevated);
        color: var(--text-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2),
                    0 0 0 1px var(--sb-glass-border);
    }

    .stat-tab-button.active::after {
        transform: translateX(-50%) scaleX(1);
    }

    /* Tab-specific glow effects */
    .stat-tab-button[data-tab="special-stats"].active {
        background: linear-gradient(135deg,
            rgba(20, 184, 166, 0.15),
            rgba(20, 184, 166, 0.08));
        border-color: rgba(20, 184, 166, 0.3);
        color: #2dd4bf;
        box-shadow: 0 0 20px rgba(20, 184, 166, 0.2),
                    0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .stat-tab-button[data-tab="guild-bonuses"].active {
        background: linear-gradient(135deg,
            rgba(168, 85, 247, 0.15),
            rgba(168, 85, 247, 0.08));
        border-color: rgba(168, 85, 247, 0.3);
        color: #c084fc;
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.2),
                    0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .stat-tab-button[data-tab="level-stats"].active {
        background: linear-gradient(135deg,
            rgba(249, 115, 22, 0.15),
            rgba(249, 115, 22, 0.08));
        border-color: rgba(249, 115, 22, 0.3);
        color: #fb923c;
        box-shadow: 0 0 20px rgba(249, 115, 22, 0.2),
                    0 2px 8px rgba(0, 0, 0, 0.2);
    }

    /* Tab content with staggered animation */
    .stat-tab-content {
        display: none;
    }

    .stat-tab-content.active {
        display: block;
        animation: slideUp var(--sb-duration-base) var(--sb-ease-spring);
    }

    /* ========================================
       COMPACT CONFIG SECTION - Collapsible Design
       ======================================== */

    .stat-breakdown-config-wrapper {
        margin-bottom: var(--sb-space-xl);
    }

    .stat-config-toggle {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        padding: 14px var(--sb-space-md);
        background: var(--sb-surface-base);
        backdrop-filter: var(--sb-glass-blur);
        -webkit-backdrop-filter: var(--sb-glass-blur);
        border: 1px solid var(--sb-glass-border);
        border-radius: 12px;
        cursor: pointer;
        transition: all var(--sb-duration-base) var(--sb-ease-smooth);
        margin-bottom: var(--sb-space-md);
        box-shadow: var(--sb-glow-subtle);
    }

    .stat-config-toggle:hover {
        border-color: var(--sb-border-hover);
        box-shadow: var(--sb-glow-medium);
        transform: translateY(-1px);
    }

    .stat-config-toggle-text {
        display: flex;
        align-items: center;
        gap: var(--sb-space-sm);
        font-family: var(--sb-font-display);
        font-weight: 700;
        font-size: 0.9375rem;
        color: var(--text-primary);
        letter-spacing: -0.02em;
    }

    .stat-config-toggle-icon {
        display: inline-block;
        font-size: 0.75rem;
        color: var(--accent-primary);
        transition: transform var(--sb-duration-base) var(--sb-ease-smooth);
    }

    .stat-config-toggle-subtitle {
        font-family: var(--sb-font-display);
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        letter-spacing: 0.01em;
        margin-left: 20px;
    }

    .stat-config-content {
        display: none;
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition: all var(--sb-duration-slow) var(--sb-ease-smooth);
    }

    .stat-config-content.expanded {
        display: block;
        max-height: 2000px;
        opacity: 1;
        animation: slideDown var(--sb-duration-base) var(--sb-ease-smooth);
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            max-height: 0;
        }
        to {
            opacity: 1;
            max-height: 2000px;
        }
    }

    /* ========================================
       PREMIUM STAT CARDS - Compact Design
       ======================================== */

    .unlockable-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--sb-space-sm);
    }

    @media (max-width: 1200px) {
        .unlockable-stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 768px) {
        .unlockable-stats-grid {
            grid-template-columns: 1fr;
        }
    }

    .stat-card {
        background: var(--sb-surface-base);
        backdrop-filter: var(--sb-glass-blur);
        -webkit-backdrop-filter: var(--sb-glass-blur);
        border: 1px solid var(--sb-glass-border);
        border-radius: 10px;
        padding: var(--sb-space-sm);
        transition: all var(--sb-duration-base) var(--sb-ease-smooth);
        position: relative;
        overflow: hidden;
    }

    .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--sb-gradient-teal);
        opacity: 0;
        transition: opacity var(--sb-duration-base) var(--sb-ease-smooth);
    }

    .stat-card.unlocked::before {
        opacity: 1;
    }

    .stat-card.locked {
        opacity: 0.4;
        filter: grayscale(0.5);
    }

    .stat-card:hover {
        transform: translateY(-2px);
        border-color: var(--sb-border-hover);
        box-shadow: var(--sb-glow-subtle),
                    0 8px 24px rgba(0, 0, 0, 0.25);
    }

    .stat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .stat-card-title {
        font-weight: 600;
        font-size: 0.75rem;
        color: var(--text-primary);
        letter-spacing: 0.01em;
        text-transform: uppercase;
    }

    .stat-card-value-row {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .stat-card-value {
        font-family: var(--sb-font-mono);
        font-weight: 700;
        font-size: 1rem;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.02em;
    }

    .stat-card-value.unlocked {
        background: var(--sb-gradient-teal);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .stat-card-value.locked {
        color: var(--text-secondary);
    }

    /* ========================================
       PREMIUM LOCK TOGGLE - Compact Design
       ======================================== */

    .stat-lock-toggle {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--sb-surface-subtle);
        border: 1px solid var(--sb-glass-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all var(--sb-duration-base) var(--sb-ease-smooth);
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .stat-lock-toggle:hover {
        background: var(--sb-surface-elevated);
        border-color: var(--sb-border-hover);
        color: var(--text-primary);
        transform: scale(1.08);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .stat-lock-toggle:active {
        transform: scale(0.95);
    }

    .stat-lock-toggle svg {
        width: 16px;
        height: 16px;
        stroke-width: 2;
    }

    /* ========================================
       COMPACT SLIDER SECTION
       ======================================== */

    .stat-slider-section {
        margin-top: var(--sb-space-sm);
        padding-top: var(--sb-space-sm);
        border-top: 1px solid var(--sb-glass-border);
    }

    .stat-slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .stat-slider-label {
        font-size: 0.625rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .stat-slider-value {
        font-family: var(--sb-font-mono);
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary);
        background: var(--sb-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Compact Range Slider */
    .stat-range-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 4px;
        background: var(--sb-surface-subtle);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
        position: relative;
    }

    .stat-range-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        background: var(--sb-gradient-teal);
        border: 2px solid rgba(15, 23, 42, 0.8);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3),
                    0 0 0 3px rgba(20, 184, 166, 0.08);
        transition: all var(--sb-duration-fast) var(--sb-ease-spring);
    }

    .stat-range-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 2px 10px rgba(20, 184, 166, 0.4),
                    0 0 0 4px rgba(20, 184, 166, 0.12);
    }

    .stat-range-slider::-webkit-slider-thumb:active {
        transform: scale(1.05);
    }

    .stat-range-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: var(--sb-gradient-teal);
        border: 2px solid rgba(15, 23, 42, 0.8);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3),
                    0 0 0 3px rgba(20, 184, 166, 0.08);
        transition: all var(--sb-duration-fast) var(--sb-ease-spring);
    }

    .stat-range-slider::-moz-range-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 2px 10px rgba(20, 184, 166, 0.4),
                    0 0 0 4px rgba(20, 184, 166, 0.12);
    }

    /* ========================================
       GUILD BONUS CARDS - Compact Grid
       ======================================== */

    .guild-bonuses-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--sb-space-sm);
    }

    @media (max-width: 768px) {
        .guild-bonuses-grid {
            grid-template-columns: 1fr;
        }
    }

    .guild-card .stat-card-value.unlocked {
        background: var(--sb-gradient-purple);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .guild-card::before {
        background: var(--sb-gradient-purple);
    }

    .guild-card .stat-range-slider::-webkit-slider-thumb {
        background: var(--sb-gradient-purple);
        box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3),
                    0 0 0 3px rgba(168, 85, 247, 0.08);
    }

    .guild-card .stat-range-slider::-webkit-slider-thumb:hover {
        box-shadow: 0 2px 10px rgba(168, 85, 247, 0.4),
                    0 0 0 4px rgba(168, 85, 247, 0.12);
    }

    .guild-card .stat-range-slider::-moz-range-thumb {
        background: var(--sb-gradient-purple);
        box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3),
                    0 0 0 3px rgba(168, 85, 247, 0.08);
        transition: all var(--sb-duration-fast) var(--sb-ease-spring);
    }

    .guild-card .stat-range-slider::-moz-range-thumb:hover {
        box-shadow: 0 2px 10px rgba(168, 85, 247, 0.4),
                    0 0 0 4px rgba(168, 85, 247, 0.12);
    }

    /* ========================================
       PREMIUM BREAKDOWN CARDS - Compact Data Visualization
       ======================================== */

    .stat-breakdown-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--sb-space-sm);
        margin-top: var(--sb-space-xl);
    }

    @media (max-width: 768px) {
        .stat-breakdown-grid {
            grid-template-columns: 1fr;
        }
    }

    .breakdown-card {
        background: var(--sb-surface-base);
        backdrop-filter: var(--sb-glass-blur);
        -webkit-backdrop-filter: var(--sb-glass-blur);
        border: 1px solid var(--sb-glass-border);
        border-radius: 10px;
        padding: var(--sb-space-sm);
        transition: all var(--sb-duration-base) var(--sb-ease-smooth);
        position: relative;
        overflow: hidden;
    }

    .breakdown-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent);
        opacity: 0;
        transition: opacity var(--sb-duration-base) var(--sb-ease-smooth);
    }

    .breakdown-card:hover {
        border-color: var(--sb-border-hover);
        transform: translateY(-2px);
        box-shadow: var(--sb-glow-medium),
                    0 12px 32px rgba(0, 0, 0, 0.3);
    }

    .breakdown-card:hover::before {
        opacity: 1;
    }

    .breakdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sb-space-sm);
        padding-bottom: var(--sb-space-sm);
        border-bottom: 1px solid var(--sb-glass-border);
    }

    .breakdown-title {
        font-weight: 700;
        font-size: 0.75rem;
        color: var(--text-primary);
        letter-spacing: 0.02em;
        text-transform: uppercase;
    }

    .breakdown-total {
        font-family: var(--sb-font-mono);
        font-weight: 700;
        font-size: 1rem;
        background: var(--sb-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.02em;
    }

    /* Weapon Bonus Note - Premium Alert Style */
    .breakdown-weapon-note {
        font-size: 0.75rem;
        color: #fbbf24;
        margin-bottom: var(--sb-space-md);
        padding: var(--sb-space-sm) var(--sb-space-md);
        background: linear-gradient(135deg,
            rgba(251, 191, 36, 0.1),
            rgba(245, 158, 11, 0.05));
        border: 1px solid rgba(251, 191, 36, 0.2);
        border-radius: 8px;
        font-family: var(--sb-font-mono);
        font-variant-numeric: tabular-nums;
        display: flex;
        align-items: center;
        gap: var(--sb-space-sm);
    }

    .breakdown-weapon-note::before {
        content: '⚡';
        font-size: 0.875rem;
    }

    /* ========================================
       PREMIUM CONTRIBUTION LIST - Visual Bars
       ======================================== */

    .contribution-list {
        display: flex;
        flex-direction: column;
        gap: var(--sb-space-sm);
    }

    .contribution-item {
        position: relative;
        padding: var(--sb-space-md);
        background: var(--sb-surface-subtle);
        border: 1px solid var(--sb-glass-border);
        border-radius: 10px;
        transition: all var(--sb-duration-base) var(--sb-ease-smooth);
        overflow: hidden;
    }

    .contribution-item::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        transition: width var(--sb-duration-base) var(--sb-ease-smooth);
    }

    .contribution-item:hover {
        background: var(--sb-surface-base);
        transform: translateX(3px);
        border-color: var(--sb-border-hover);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .contribution-item:hover::before {
        width: 6px;
    }

    .contribution-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--sb-space-md);
        margin-bottom: var(--sb-space-xs);
    }

    .contribution-name {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        font-weight: 500;
        letter-spacing: 0.01em;
    }

    .contribution-value {
        font-family: var(--sb-font-mono);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
    }

    /* Visual Progress Bar */
    .contribution-bar {
        height: 4px;
        background: var(--sb-surface-subtle);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
    }

    .contribution-bar-fill {
        height: 100%;
        border-radius: 2px;
        transition: width var(--sb-duration-slow) var(--sb-ease-smooth);
        position: relative;
    }

    /* Contribution Percentage Badge */
    .contribution-percent {
        display: inline-block;
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--text-primary);
        background: var(--sb-surface-elevated);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: var(--sb-font-mono);
        font-variant-numeric: tabular-nums;
        margin-left: var(--sb-space-xs);
    }

    /* Contribution Type Colors */
    .contribution-item[data-type="base"] {
        border-color: rgba(100, 116, 139, 0.2);
    }
    .contribution-item[data-type="base"]::before {
        background: var(--sb-base);
    }
    .contribution-item[data-type="base"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-base), rgba(100, 116, 139, 0.6));
    }

    .contribution-item[data-type="equipment"] {
        border-color: rgba(16, 185, 129, 0.2);
    }
    .contribution-item[data-type="equipment"]::before {
        background: var(--sb-equipment);
    }
    .contribution-item[data-type="equipment"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-equipment), rgba(16, 185, 129, 0.6));
    }

    .contribution-item[data-type="scrolling"] {
        border-color: rgba(59, 130, 246, 0.2);
    }
    .contribution-item[data-type="scrolling"]::before {
        background: var(--sb-scrolling);
    }
    .contribution-item[data-type="scrolling"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-scrolling), rgba(59, 130, 246, 0.6));
    }

    .contribution-item[data-type="cube"] {
        border-color: rgba(245, 158, 11, 0.2);
    }
    .contribution-item[data-type="cube"]::before {
        background: var(--sb-cube);
    }
    .contribution-item[data-type="cube"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-cube), rgba(245, 158, 11, 0.6));
    }

    .contribution-item[data-type="companion"] {
        border-color: rgba(168, 85, 247, 0.2);
    }
    .contribution-item[data-type="companion"]::before {
        background: var(--sb-companion);
    }
    .contribution-item[data-type="companion"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-companion), rgba(168, 85, 247, 0.6));
    }

    .contribution-item[data-type="innerAbility"] {
        border-color: rgba(236, 72, 153, 0.2);
    }
    .contribution-item[data-type="innerAbility"]::before {
        background: var(--sb-inner-ability);
    }
    .contribution-item[data-type="innerAbility"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-inner-ability), rgba(236, 72, 153, 0.6));
    }

    .contribution-item[data-type="mainStat"] {
        border-color: rgba(239, 68, 68, 0.2);
    }
    .contribution-item[data-type="mainStat"]::before {
        background: var(--sb-main-stat);
    }
    .contribution-item[data-type="mainStat"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-main-stat), rgba(239, 68, 68, 0.6));
    }

    .contribution-item[data-type="unlockable"] {
        border-color: rgba(20, 184, 166, 0.2);
    }
    .contribution-item[data-type="unlockable"]::before {
        background: var(--sb-unlockable);
    }
    .contribution-item[data-type="unlockable"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-unlockable), rgba(20, 184, 166, 0.6));
    }

    .contribution-item[data-type="guild"] {
        border-color: rgba(139, 92, 246, 0.2);
    }
    .contribution-item[data-type="guild"]::before {
        background: var(--sb-guild);
    }
    .contribution-item[data-type="guild"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-guild), rgba(139, 92, 246, 0.6));
    }

    .contribution-item[data-type="unaccounted"] {
        border-color: rgba(244, 63, 94, 0.3);
        background: linear-gradient(135deg,
            rgba(244, 63, 94, 0.08),
            rgba(244, 63, 94, 0.03));
    }
    .contribution-item[data-type="unaccounted"]::before {
        background: var(--sb-unaccounted);
    }
    .contribution-item[data-type="unaccounted"] .contribution-bar-fill {
        background: linear-gradient(90deg, var(--sb-unaccounted), rgba(244, 63, 94, 0.6));
    }

    /* ========================================
       EMPTY STATE - Premium Design
       ======================================== */

    .breakdown-empty {
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.8125rem;
        padding: var(--sb-space-2xl);
        font-style: italic;
        opacity: 0.5;
        font-weight: 500;
    }

    /* ========================================
       STAGGERED ANIMATIONS - Premium Feel
       ======================================== */

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(12px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes pulse-glow {
        0%, 100% {
            box-shadow: var(--sb-glow-subtle);
        }
        50% {
            box-shadow: var(--sb-glow-strong);
        }
    }

    /* Staggered card entrance */
    .stat-card,
    .breakdown-card {
        animation: slideUp var(--sb-duration-base) var(--sb-ease-spring) backwards;
    }

    .stat-card:nth-child(1),
    .breakdown-card:nth-child(1) { animation-delay: 0ms; }
    .stat-card:nth-child(2),
    .breakdown-card:nth-child(2) { animation-delay: 50ms; }
    .stat-card:nth-child(3),
    .breakdown-card:nth-child(3) { animation-delay: 100ms; }
    .stat-card:nth-child(4),
    .breakdown-card:nth-child(4) { animation-delay: 150ms; }
    .stat-card:nth-child(5),
    .breakdown-card:nth-child(5) { animation-delay: 200ms; }
    .stat-card:nth-child(6),
    .breakdown-card:nth-child(6) { animation-delay: 250ms; }
    .stat-card:nth-child(n+7),
    .breakdown-card:nth-child(n+7) { animation-delay: 300ms; }

    /* ========================================
       PREMIUM LEGEND - Contribution Type Guide
       ======================================== */

    .contribution-legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sb-space-sm);
        padding: var(--sb-space-md);
        background: var(--sb-surface-base);
        border: 1px solid var(--sb-glass-border);
        border-radius: 10px;
        margin-top: var(--sb-space-xl);
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: var(--sb-space-xs);
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
    }

    .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .legend-item[data-type="base"] .legend-dot { background: var(--sb-base); }
    .legend-item[data-type="equipment"] .legend-dot { background: var(--sb-equipment); }
    .legend-item[data-type="scrolling"] .legend-dot { background: var(--sb-scrolling); }
    .legend-item[data-type="cube"] .legend-dot { background: var(--sb-cube); }
    .legend-item[data-type="companion"] .legend-dot { background: var(--sb-companion); }
    .legend-item[data-type="innerAbility"] .legend-dot { background: var(--sb-inner-ability); }
    .legend-item[data-type="mainStat"] .legend-dot { background: var(--sb-main-stat); }
    .legend-item[data-type="unlockable"] .legend-dot { background: var(--sb-unlockable); }
    .legend-item[data-type="guild"] .legend-dot { background: var(--sb-guild); }
    .legend-item[data-type="unaccounted"] .legend-dot { background: var(--sb-unaccounted); }

    /* Dark mode premium adjustments */
    .dark .stat-breakdown-wrapper {
        --sb-glass-bg: rgba(15, 23, 42, 0.75);
        --sb-glass-border: rgba(255, 255, 255, 0.06);
        --sb-surface-elevated: rgba(30, 41, 59, 0.8);
        --sb-surface-base: rgba(15, 23, 42, 0.6);
        --sb-surface-subtle: rgba(51, 65, 85, 0.4);
    }

    /* Focus states for accessibility - Premium Glow */
    .stat-tab-button:focus-visible,
    .stat-lock-toggle:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5),
                    var(--sb-glow-subtle);
    }

    .stat-range-slider:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
    }
`;

// Inject styles on module load
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = STAT_BREAKDOWN_STYLES;
    document.head.appendChild(styleSheet);
}

// ============================================================================
// STAT DEFINITIONS
// ============================================================================

const STAT_DEFINITIONS = {
    'mainStat': {
        displayName: 'Main Stat',
        inputId: 'primary-main-stat-base',
        isPercentage: false,
        companionKeys: ['MainStat']
    },
    'attack': {
        displayName: 'Attack',
        inputId: 'attack-base',
        isPercentage: false,
        needsDivision: true,
        companionKeys: ['Attack']
    },
    'defense': {
        displayName: 'Defense',
        inputId: 'defense-base',
        isPercentage: false
    },
    'critRate': {
        displayName: 'Critical Rate',
        inputId: 'crit-rate-base',
        isPercentage: true
    },
    'critDamage': {
        displayName: 'Critical Damage',
        inputId: 'crit-damage-base',
        isPercentage: true
    },
    'attackSpeed': {
        displayName: 'Attack Speed',
        inputId: 'attack-speed-base',
        isPercentage: true
    },
    'damage': {
        displayName: 'Damage',
        inputId: 'damage-base',
        isPercentage: true,
        companionKeys: ['AttackPower']
    },
    'damageAmp': {
        displayName: 'Damage Amplification',
        inputId: 'damage-amp-base',
        isPercentage: false
    },
    'defPen': {
        displayName: 'Defense Penetration',
        inputId: 'def-pen-base',
        isPercentage: true
    },
    'bossDamage': {
        displayName: 'Boss Monster Damage',
        inputId: 'boss-damage-base',
        isPercentage: true,
        companionKeys: ['AttackPowerToBoss']
    },
    'normalDamage': {
        displayName: 'Normal Monster Damage',
        inputId: 'normal-damage-base',
        isPercentage: true,
        companionKeys: ['AttackPowerExcludeBoss']
    },
    'minDamage': {
        displayName: 'Min Damage Multiplier',
        inputId: 'min-damage-base',
        isPercentage: true,
        companionKeys: ['MinDamageRatio']
    },
    'maxDamage': {
        displayName: 'Max Damage Multiplier',
        inputId: 'max-damage-base',
        isPercentage: true,
        companionKeys: ['MaxDamageRatio']
    },
    'finalDamage': {
        displayName: 'Final Damage',
        inputId: 'final-damage-base',
        isPercentage: true
    }
};

const SLOT_DISPLAY_NAMES = {
    'head': 'Head',
    'cape': 'Cape',
    'chest': 'Chest',
    'shoulders': 'Shoulders',
    'legs': 'Legs',
    'belt': 'Belt',
    'gloves': 'Gloves',
    'boots': 'Boots',
    'ring': 'Ring',
    'neck': 'Neck',
    'eye-accessory': 'Eye Accessory'
};

// ============================================================================
// ICON SYSTEM (SVG)
// ============================================================================

const ICONS = {
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`
};

// ============================================================================
// RENDER FUNCTIONS - Special Stats
// ============================================================================

function renderUnlockableStatCard(unlockableKey, config) {
    const statData = getUnlockableStat(unlockableKey);
    const isUnlocked = statData.unlocked;
    const currentLevel = statData.level || 0;
    const currentValue = config.base + (currentLevel * config.increment);

    const cardClass = isUnlocked ? 'stat-card unlocked' : 'stat-card locked';
    const valueClass = isUnlocked ? 'stat-card-value unlocked' : 'stat-card-value locked';
    const lockIcon = isUnlocked ? ICONS.unlock : ICONS.lock;
    const lockTitle = isUnlocked ? 'Lock this stat' : 'Unlock this stat';

    let html = `
        <div class="${cardClass}" data-stat="${unlockableKey}">
            <div class="stat-card-header">
                <span class="stat-card-title">${config.displayName}</span>
                <div class="stat-card-value-row">
                    <span id="unlockable-value-${unlockableKey}" class="${valueClass}">
                        ${formatValue(currentValue, config.isPercentage)}
                    </span>
                    <button
                        class="stat-lock-toggle"
                        onclick="event.stopPropagation(); toggleUnlockableStat('${unlockableKey}')"
                        title="${lockTitle}"
                        aria-label="${lockTitle}"
                    >
                        ${lockIcon}
                    </button>
                </div>
            </div>
    `;

    if (isUnlocked) {
        html += `
            <div class="stat-slider-section">
                <div class="stat-slider-header">
                    <span class="stat-slider-label">Level</span>
                    <span id="unlockable-level-display-${unlockableKey}" class="stat-slider-value">${currentLevel}</span>
                </div>
                <input
                    type="range"
                    id="unlockable-slider-${unlockableKey}"
                    class="stat-range-slider"
                    min="0"
                    max="${config.maxLevel}"
                    value="${currentLevel}"
                    oninput="updateUnlockableStatLevelPreview('${unlockableKey}')"
                    onchange="updateUnlockableStatLevel('${unlockableKey}')"
                    aria-label="${config.displayName} level"
                >
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function renderSpecialStatsContent() {
    const configs = getUnlockableStatConfigs();
    const configKeys = Object.keys(configs);

    const column1 = configKeys.slice(0, 4);
    const column2 = configKeys.slice(4, 8);
    const column3 = configKeys.slice(8);

    let html = '<div class="unlockable-stats-grid">';

    [column1, column2, column3].forEach(column => {
        html += '<div style="display: flex; flex-direction: column; gap: var(--sb-space-md);">';
        column.forEach(key => {
            html += renderUnlockableStatCard(key, configs[key]);
        });
        html += '</div>';
    });

    html += '</div>';
    return html;
}

// ============================================================================
// RENDER FUNCTIONS - Guild Bonuses
// ============================================================================

function renderGuildBonusCard(guildKey, config) {
    const bonusData = getGuildBonus(guildKey);
    const isUnlocked = bonusData.unlocked;
    const currentLevel = bonusData.level || 0;

    let currentValue;
    if (config.customValues) {
        currentValue = isUnlocked && currentLevel > 0 ? (config.customValues[currentLevel - 1] || 0) : 0;
    } else {
        currentValue = config.base + (currentLevel * config.increment);
    }

    const cardClass = isUnlocked ? 'stat-card guild-card unlocked' : 'stat-card guild-card locked';
    const valueClass = isUnlocked ? 'stat-card-value unlocked' : 'stat-card-value locked';
    const lockIcon = isUnlocked ? ICONS.unlock : ICONS.lock;
    const lockTitle = isUnlocked ? 'Lock this bonus' : 'Unlock this bonus';

    let html = `
        <div class="${cardClass}" data-stat="${guildKey}">
            <div class="stat-card-header">
                <span class="stat-card-title">${config.displayName}</span>
                <div class="stat-card-value-row">
                    <span id="guild-value-${guildKey}" class="${valueClass}">
                        ${formatValue(currentValue, config.isPercentage)}
                    </span>
                    <button
                        class="stat-lock-toggle"
                        onclick="event.stopPropagation(); toggleGuildBonus('${guildKey}')"
                        title="${lockTitle}"
                        aria-label="${lockTitle}"
                    >
                        ${lockIcon}
                    </button>
                </div>
            </div>
    `;

    if (isUnlocked) {
        html += `
            <div class="stat-slider-section">
                <div class="stat-slider-header">
                    <span class="stat-slider-label">Rank</span>
                    <span id="guild-rank-display-${guildKey}" class="stat-slider-value">${currentLevel}</span>
                </div>
                <input
                    type="range"
                    id="guild-slider-${guildKey}"
                    class="stat-range-slider"
                    min="0"
                    max="${config.maxLevel}"
                    value="${currentLevel}"
                    oninput="updateGuildBonusRankPreview('${guildKey}')"
                    onchange="updateGuildBonusRank('${guildKey}')"
                    aria-label="${config.displayName} rank"
                >
            </div>
        `;
    }

    html += '</div>';
    return html;
}

function renderGuildBonusesContent() {
    const configs = getGuildBonusConfigs();
    const configKeys = Object.keys(configs);

    let html = '<div class="guild-bonuses-grid">';
    configKeys.forEach(key => {
        html += renderGuildBonusCard(key, configs[key]);
    });
    html += '</div>';

    return html;
}

// ============================================================================
// RENDER FUNCTIONS - Level Stats
// ============================================================================

function renderLevelStatsContent() {
    return `
        <div class="breakdown-empty" style="background: var(--sb-surface-tertiary); border: 1px solid var(--sb-border-medium); border-radius: 10px;">
            <div style="font-size: 2rem; margin-bottom: var(--sb-space-sm);">🚧</div>
            Level stats coming soon...
        </div>
    `;
}

// ============================================================================
// TAB SYSTEM - Compact Collapsible Design
// ============================================================================

function createTabsStructure() {
    return `
        <div class="stat-breakdown-config-wrapper">
            <button class="stat-config-toggle" onclick="toggleConfigSection()" id="config-toggle-btn">
                <span class="stat-config-toggle-text">
                    <span class="stat-config-toggle-icon" id="config-toggle-icon">▾</span>
                    Stat Configuration
                </span>
                <span class="stat-config-toggle-subtitle">Special Stats • Guild Bonuses • Level Stats</span>
            </button>
            <div class="stat-config-content" id="config-content">
                <div class="stat-breakdown-tabs">
                    <button class="stat-tab-button active" data-tab="special-stats" onclick="switchExtraStatsTab('special-stats')">
                        Special Stats
                    </button>
                    <button class="stat-tab-button" data-tab="guild-bonuses" onclick="switchExtraStatsTab('guild-bonuses')">
                        Guild Bonuses
                    </button>
                    <button class="stat-tab-button" data-tab="level-stats" onclick="switchExtraStatsTab('level-stats')">
                        Level Stats
                    </button>
                </div>
                <div class="stat-tab-content active" id="special-stats-content">
                    ${renderSpecialStatsContent()}
                </div>
                <div class="stat-tab-content" id="guild-bonuses-content">
                    ${renderGuildBonusesContent()}
                </div>
                <div class="stat-tab-content" id="level-stats-content">
                    ${renderLevelStatsContent()}
                </div>
            </div>
        </div>
    `;
}

window.toggleConfigSection = function() {
    const content = document.getElementById('config-content');
    const icon = document.getElementById('config-toggle-icon');
    const toggle = document.getElementById('config-toggle-btn');

    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.style.transform = 'rotate(0deg)';
        toggle.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        icon.style.transform = 'rotate(180deg)';
        toggle.classList.add('expanded');
    }
};

// ============================================================================
// STAT BREAKDOWN GRID
// ============================================================================

function renderStatSection(statKey, statDef, inputValue, displayValue, contributions, weaponAttackBonus) {
    const totalContributed = contributions.reduce((sum, c) => sum + c.value, 0);
    const unaccounted = displayValue - totalContributed;

    let html = `
        <div class="breakdown-card" data-stat="${statKey}">
            <div class="breakdown-header">
                <span class="breakdown-title">${statDef.displayName}</span>
                <span class="breakdown-total">${formatValue(inputValue, statDef.isPercentage)}</span>
            </div>
    `;

    if (statDef.needsDivision && weaponAttackBonus > 1) {
        html += `
            <div class="breakdown-weapon-note">
                ÷${weaponAttackBonus.toFixed(3)} (${((weaponAttackBonus - 1) * 100).toFixed(1)}% bonus) = <strong>${formatValue(displayValue, false)}</strong> base
            </div>
        `;
    }

    if (contributions.length > 0 || unaccounted > 0.01) {
        html += '<div class="contribution-list">';

        contributions.forEach(contribution => {
            const type = contribution.type;
            const percentage = displayValue > 0 ? ((contribution.value / displayValue) * 100).toFixed(1) : 0;
            const barWidth = Math.min(percentage, 100);

            html += `
                <div class="contribution-item" data-type="${type}">
                    <div class="contribution-content">
                        <span class="contribution-name">${contribution.name}</span>
                        <div style="display: flex; align-items: center; gap: var(--sb-space-xs);">
                            <span class="contribution-value">+${formatValue(contribution.value, statDef.isPercentage)}</span>
                            <span class="contribution-percent">${percentage}%</span>
                        </div>
                    </div>
                    <div class="contribution-bar">
                        <div class="contribution-bar-fill" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            `;
        });

        if (unaccounted > 0.01) {
            const unaccountedPercent = displayValue > 0 ? ((unaccounted / displayValue) * 100).toFixed(1) : 0;
            const barWidth = Math.min(unaccountedPercent, 100);

            html += `
                <div class="contribution-item" data-type="unaccounted">
                    <div class="contribution-content">
                        <span class="contribution-name">Unaccounted</span>
                        <div style="display: flex; align-items: center; gap: var(--sb-space-xs);">
                            <span class="contribution-value">${formatValue(unaccounted, statDef.isPercentage)}</span>
                            <span class="contribution-percent">${unaccountedPercent}%</span>
                        </div>
                    </div>
                    <div class="contribution-bar">
                        <div class="contribution-bar-fill" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
    } else {
        html += `<div class="breakdown-empty">No contributions</div>`;
    }

    html += '</div>';
    return html;
}

// ============================================================================
// RENDER FUNCTIONS - Legend
// ============================================================================

function renderContributionLegend() {
    const legendItems = [
        { type: 'base', name: 'Base' },
        { type: 'equipment', name: 'Equipment' },
        { type: 'scrolling', name: 'Scrolling' },
        { type: 'cube', name: 'Cube' },
        { type: 'companion', name: 'Companion' },
        { type: 'innerAbility', name: 'Inner Ability' },
        { type: 'mainStat', name: 'Primary Stat' },
        { type: 'unlockable', name: 'Special Stats' },
        { type: 'guild', name: 'Guild Bonuses' },
        { type: 'unaccounted', name: 'Unaccounted' }
    ];

    let html = '<div class="contribution-legend">';
    legendItems.forEach(item => {
        html += `
            <div class="legend-item" data-type="${item.type}">
                <div class="legend-dot"></div>
                <span>${item.name}</span>
            </div>
        `;
    });
    html += '</div>';

    return html;
}

// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

export function updateStatBreakdown() {
    const container = document.getElementById('stat-breakdown-content');
    if (!container) return;

    const contributedStats = getContributedStats();
    const {
        base = {},
        equipment = {},
        Companion = {},
        CompanionInventory = {},
        InnerAbility = {},
        MainStat = {},
        scrolling = {},
        cubePotential = {},
        UnlockableStats = {},
        GuildBonuses = {}
    } = contributedStats;

    const tabsExist = document.querySelector('.stat-tab-button');
    const gridExists = document.getElementById('stat-breakdown-grid');

    if (!tabsExist || !gridExists) {
        // Full render
        let html = '<div class="stat-breakdown-wrapper">' + createTabsStructure();

        const statData = [];

        Object.entries(STAT_DEFINITIONS).forEach(([statKey, statDef]) => {
            const inputValue = getInputValue(statDef.inputId);
            if (inputValue === null) return;

            let displayValue = inputValue;
            let weaponAttackBonus = 1;

            if (statDef.needsDivision) {
                const bonus = getWeaponAttackBonus();
                weaponAttackBonus = (bonus.totalAttack / 100) + 1;
                displayValue = inputValue / weaponAttackBonus;
            }

            const contributions = gatherContributions(
                statKey, statDef, base, equipment, Companion, CompanionInventory,
                InnerAbility, MainStat, scrolling, cubePotential, UnlockableStats, GuildBonuses,
                displayValue
            );

            statData.push({ statKey, statDef, inputValue, displayValue, contributions, weaponAttackBonus });
        });

        if (statData.length === 0) {
            html += '<div class="breakdown-empty">No stat data available</div>';
        } else {
            html += '<div id="stat-breakdown-grid" class="stat-breakdown-grid">';
            statData.forEach(({ statKey, statDef, inputValue, displayValue, contributions, weaponAttackBonus }) => {
                html += renderStatSection(statKey, statDef, inputValue, displayValue, contributions, weaponAttackBonus);
            });
            html += '</div>';
            html += renderContributionLegend();
        }

        html += '</div>';
        container.innerHTML = html;
    } else {
        updateActiveTabContent();
        updateBreakdownGrid();
    }
}

function updateActiveTabContent() {
    const activeButton = document.querySelector('.stat-tab-button.active');
    if (!activeButton) return;

    const tabName = activeButton.getAttribute('data-tab');
    const contentContainer = document.getElementById(`${tabName}-content`);
    if (!contentContainer) return;

    let newContent = '';
    switch (tabName) {
        case 'special-stats':
            newContent = renderSpecialStatsContent();
            break;
        case 'guild-bonuses':
            newContent = renderGuildBonusesContent();
            break;
        case 'level-stats':
            newContent = renderLevelStatsContent();
            break;
    }

    contentContainer.innerHTML = newContent;
}

function updateBreakdownGrid() {
    const grid = document.getElementById('stat-breakdown-grid');
    if (!grid) return;

    const contributedStats = getContributedStats();
    const {
        base = {},
        equipment = {},
        Companion = {},
        CompanionInventory = {},
        InnerAbility = {},
        MainStat = {},
        scrolling = {},
        cubePotential = {},
        UnlockableStats = {},
        GuildBonuses = {}
    } = contributedStats;

    const statData = [];

    Object.entries(STAT_DEFINITIONS).forEach(([statKey, statDef]) => {
        const inputValue = getInputValue(statDef.inputId);
        if (inputValue === null) return;

        let displayValue = inputValue;
        let weaponAttackBonus = 1;

        if (statDef.needsDivision) {
            const bonus = getWeaponAttackBonus();
            weaponAttackBonus = (bonus.totalAttack / 100) + 1;
            displayValue = inputValue / weaponAttackBonus;
        }

        const contributions = gatherContributions(
            statKey, statDef, base, equipment, Companion, CompanionInventory,
            InnerAbility, MainStat, scrolling, cubePotential, UnlockableStats, GuildBonuses,
            displayValue
        );

        statData.push({ statKey, statDef, inputValue, displayValue, contributions, weaponAttackBonus });
    });

    if (statData.length === 0) {
        grid.innerHTML = '<div class="breakdown-empty">No stat data available</div>';
        return;
    }

    let html = '';
    statData.forEach(({ statKey, statDef, inputValue, displayValue, contributions, weaponAttackBonus }) => {
        html += renderStatSection(statKey, statDef, inputValue, displayValue, contributions, weaponAttackBonus);
    });

    grid.innerHTML = html;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getInputValue(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return null;
    return parseFloat(input.value) || 0;
}

function gatherContributions(statKey, statDef, baseStats, equipmentStats, companionStats, companionInventoryStats, innerAbilityStats, mainStatStats, scrollingStats, cubePotentialStats, unlockableStats, guildBonuses, targetValue) {
    const contributions = [];

    const baseValue = baseStats[statKey];
    if (baseValue && baseValue > 0) {
        contributions.push({ type: 'base', name: 'Base', value: baseValue });
    }

    const unlockableValue = unlockableStats[statKey];
    if (unlockableValue && unlockableValue > 0) {
        contributions.push({ type: 'unlockable', name: 'Special Stats', value: unlockableValue });
    }

    const guildValue = guildBonuses[statKey];
    if (guildValue && guildValue > 0) {
        contributions.push({ type: 'guild', name: 'Guild Bonuses', value: guildValue });
    }

    Object.entries(equipmentStats).forEach(([slotId, slotStats]) => {
        const value = getEquipmentStatValue(slotStats, statKey, statDef);
        if (value > 0) {
            contributions.push({
                type: 'equipment',
                name: SLOT_DISPLAY_NAMES[slotId] || slotId,
                value: value
            });
        }
    });

    const scrollingValue = scrollingStats[statKey];
    if (scrollingValue && scrollingValue > 0) {
        contributions.push({ type: 'scrolling', name: 'Scrolling', value: scrollingValue });
    }

    const cubeValue = cubePotentialStats[statKey];
    if (cubeValue && cubeValue > 0) {
        contributions.push({ type: 'cube', name: 'Cube Potential', value: cubeValue });
    }

    const companionKeys = statDef.companionKeys || [getCompanionKey(statKey)];
    Object.entries(companionStats).forEach(([companionKey, value]) => {
        if (companionKeys.includes(companionKey) && value > 0) {
            contributions.push({
                type: 'companion',
                name: formatCompanionKey(companionKey, 'equipped'),
                value: value
            });
        }
    });

    Object.entries(companionInventoryStats).forEach(([companionKey, value]) => {
        if (companionKeys.includes(companionKey) && value > 0) {
            contributions.push({
                type: 'companion',
                name: formatCompanionKey(companionKey, 'inventory'),
                value: value
            });
        }
    });

    const innerAbilityValue = innerAbilityStats[statKey];
    if (innerAbilityValue && innerAbilityValue > 0) {
        contributions.push({ type: 'innerAbility', name: 'Inner Ability', value: innerAbilityValue });
    }

    if (statKey === 'attack' && mainStatStats.attack) {
        contributions.push({ type: 'mainStat', name: 'Primary Stat (1:1)', value: mainStatStats.attack });
    }

    return contributions;
}

function getEquipmentStatValue(slotStats, statKey, statDef) {
    const statKeyMap = {
        'attack': 'attack',
        'mainStat': 'mainStat',
        'critRate': 'critRate',
        'critDamage': 'critDamage',
        'statDamage': 'statDamage',
        'damage': 'damage',
        'finalDamage': 'finalDamage',
        'bossDamage': 'bossDamage',
        'normalDamage': 'normalDamage',
        'minDamage': 'minDamage',
        'maxDamage': 'maxDamage',
        'attackSpeed': 'attackSpeed',
        'defPen': 'defPen',
        'damageAmp': 'damageAmp'
    };

    const mappedKey = statKeyMap[statKey];
    if (mappedKey && slotStats[mappedKey]) {
        return slotStats[mappedKey];
    }

    return 0;
}

function getCompanionKey(statKey) {
    const keyMap = {
        'bossDamage': 'AttackPowerToBoss',
        'normalDamage': 'AttackPowerExcludeBoss',
        'minDamage': 'MinDamageRatio',
        'maxDamage': 'MaxDamageRatio',
        'critRate': 'CriticalChance',
        'attackSpeed': 'AttackSpeed',
        'attack': 'Attack',
        'statDamage': 'MainStat'
    };
    return keyMap[statKey] || statKey;
}

function formatCompanionKey(companionKey, source = 'equipped') {
    const sourceLabel = source === 'inventory' ? '(Companions Inventory)' : '(Companions Equipped)';
    const displayNames = {
        'AttackPower': `Damage ${sourceLabel}`,
        'AttackPowerToBoss': `Boss Damage ${sourceLabel}`,
        'AttackPowerExcludeBoss': `Normal Monster Damage ${sourceLabel}`,
        'CriticalChance': `Critical Rate ${sourceLabel}`,
        'AttackSpeed': `Attack Speed ${sourceLabel}`,
        'MinDamageRatio': `Min Damage Multiplier ${sourceLabel}`,
        'MaxDamageRatio': `Max Damage Multiplier ${sourceLabel}`,
        'Attack': `Attack ${sourceLabel}`,
        'MainStat': `Main Stat ${sourceLabel}`
    };
    return displayNames[companionKey] || `${companionKey} ${sourceLabel}`;
}

function formatValue(value, isPercentage) {
    if (isPercentage) {
        return value.toFixed(1).replace(/\.0$/, '') + '%';
    }
    return value.toFixed(0);
}

// ============================================================================
// INITIALIZATION & EVENT HANDLERS
// ============================================================================

export function initializeStatBreakdown() {
    onContributedStatsChange((stats, source) => {
        const statBreakdownTab = document.getElementById('analysis-stat-breakdown');
        if (statBreakdownTab && statBreakdownTab.classList.contains('active')) {
            if (source === 'unlockable-stats' || source === 'guild-bonuses') {
                updateActiveTabContent();
                updateBreakdownGrid();
            } else {
                updateStatBreakdown();
            }
        }
    });

    setTimeout(() => {
        const statBreakdownTab = document.getElementById('analysis-stat-breakdown');
        if (statBreakdownTab && statBreakdownTab.classList.contains('active')) {
            updateStatBreakdown();
        }
    }, 0);
}

window.updateStatBreakdown = updateStatBreakdown;

window.toggleUnlockableStat = function(unlockableKey) {
    const current = getUnlockableStat(unlockableKey);
    updateUnlockableStat(unlockableKey, {
        unlocked: !current.unlocked,
        level: current.level || 0
    });
    updateUnlockableStatsContributions();
    saveToLocalStorage();
    updateActiveTabContent();
    updateBreakdownGrid();
};

window.updateUnlockableStatLevel = function(unlockableKey) {
    const slider = document.getElementById(`unlockable-slider-${unlockableKey}`);
    if (!slider) return;

    const level = parseInt(slider.value) || 0;
    const current = getUnlockableStat(unlockableKey);

    updateUnlockableStat(unlockableKey, {
        unlocked: current.unlocked,
        level: level
    });

    const configs = getUnlockableStatConfigs();
    const config = configs[unlockableKey];
    if (config) {
        const valueSpan = document.getElementById(`unlockable-value-${unlockableKey}`);
        if (valueSpan) {
            const currentValue = config.base + (level * config.increment);
            valueSpan.textContent = formatValue(currentValue, config.isPercentage);
        }
    }

    updateUnlockableStatsContributions();
    saveToLocalStorage();
};

window.updateUnlockableStatLevelPreview = function(unlockableKey) {
    const slider = document.getElementById(`unlockable-slider-${unlockableKey}`);
    const levelDisplay = document.getElementById(`unlockable-level-display-${unlockableKey}`);

    if (!slider || !levelDisplay) return;

    const level = parseInt(slider.value) || 0;
    levelDisplay.textContent = level;

    const configs = getUnlockableStatConfigs();
    const config = configs[unlockableKey];
    if (config) {
        const valueSpan = document.getElementById(`unlockable-value-${unlockableKey}`);
        if (valueSpan) {
            const currentValue = config.base + (level * config.increment);
            valueSpan.textContent = formatValue(currentValue, config.isPercentage);
        }
    }
};

window.switchExtraStatsTab = function(tabName) {
    const tabContents = document.querySelectorAll('.stat-tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    const buttons = document.querySelectorAll('.stat-tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    const selectedTab = document.getElementById(`${tabName}-content`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    buttons.forEach(button => {
        if (button.getAttribute('onclick')?.includes(`'${tabName}'`)) {
            button.classList.add('active');
        }
    });
};

window.toggleGuildBonus = function(guildKey) {
    const current = getGuildBonus(guildKey);
    updateGuildBonus(guildKey, {
        unlocked: !current.unlocked,
        level: current.level || 0
    });
    updateGuildBonusesContributions();
    saveToLocalStorage();
    updateActiveTabContent();
    updateBreakdownGrid();
};

window.updateGuildBonusRank = function(guildKey) {
    const slider = document.getElementById(`guild-slider-${guildKey}`);
    if (!slider) return;

    const level = parseInt(slider.value) || 0;
    const current = getGuildBonus(guildKey);

    updateGuildBonus(guildKey, {
        unlocked: current.unlocked,
        level: level
    });

    const configs = getGuildBonusConfigs();
    const config = configs[guildKey];
    if (config) {
        const valueSpan = document.getElementById(`guild-value-${guildKey}`);
        if (valueSpan) {
            let currentValue;
            if (config.customValues) {
                currentValue = level > 0 ? (config.customValues[level - 1] || 0) : 0;
            } else {
                currentValue = config.base + (level * config.increment);
            }
            valueSpan.textContent = formatValue(currentValue, config.isPercentage);
        }
    }

    updateGuildBonusesContributions();
    saveToLocalStorage();
};

window.updateGuildBonusRankPreview = function(guildKey) {
    const slider = document.getElementById(`guild-slider-${guildKey}`);
    const rankDisplay = document.getElementById(`guild-rank-display-${guildKey}`);

    if (!slider || !rankDisplay) return;

    const rank = parseInt(slider.value) || 0;
    rankDisplay.textContent = rank;

    const configs = getGuildBonusConfigs();
    const config = configs[guildKey];
    if (config) {
        const valueSpan = document.getElementById(`guild-value-${guildKey}`);
        if (valueSpan) {
            let currentValue;
            if (config.customValues) {
                currentValue = rank > 0 ? (config.customValues[rank - 1] || 0) : 0;
            } else {
                currentValue = config.base + (rank * config.increment);
            }
            valueSpan.textContent = formatValue(currentValue, config.isPercentage);
        }
    }
};
