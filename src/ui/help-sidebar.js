// Help sidebar functionality

window.openHelpSidebar = openHelpSidebar;
window.closeHelpSidebar = closeHelpSidebar;
window.scrollToSection = scrollToSection;

const helpContent = {
  "skill-coeff": {
    title: "Skill Coefficient",
    content: `
            <h4>What is Skill Coefficient?</h4>
            <p>The Skill Coefficient is a percentage value that determines how much of your base attack damage is applied when using your Basic Attack skill.</p>

            <h4>Where to Find It</h4>
            <p>You can find this value in the description of your <strong>Basic Attack</strong> skill. It's usually shown as a percentage (e.g., "89.9%" or "120%").</p>

            <img src="media/tutorial/skill-coefficient.png" alt="Skill Coefficient Example" style="width: 100%; max-width: 300px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">

            <h4>Example</h4>
            <p>If your skill coefficient is 89.9% and you have 1000 base attack, your Basic Attack will deal 899 damage before other multipliers are applied.</p>
        `,
  },
  "def-pen": {
    title: "Defense Penetration",
    content: `
            <h4>What is Defense Penetration?</h4>
            <p>Defense Penetration reduces the target's defense value, allowing you to deal more damage. This is especially valuable against high-defense enemies.</p>

            <h4>When It Matters</h4>
            <p>Defense Penetration becomes increasingly important when fighting:</p>
            <ul>
                <li>World Bosses (50%+ defense)</li>
                <li>Chapter Bosses (20-25% defense)</li>
                <li>High-level stage hunts</li>
            </ul>
        `,
  },
  "skill-mastery": {
    title: "Skill Mastery Bonus",
    content: `
            <h4>Skill Mastery - All Monsters</h4>
            <p>Check the boxes for mastery bonuses that apply to all monsters you've unlocked.</p>

            <img src="media/tutorial/mastery.png" alt="Skill Mastery - All Monsters Example" style="width: 100%; max-width: 300px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">

            <h4>Skill Mastery - Boss Only</h4>
            <p>Check the boxes for mastery bonuses that only apply when fighting bosses.</p>

            <img src="media/tutorial/mastery-boss.png" alt="Skill Mastery - Boss Only Example" style="width: 100%; max-width: 300px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">
        `,
  },
  "skill-mastery-boss": {
    title: "Skill Mastery Bonus - Boss Only",
    content: `
            <h4>What is this?</h4>
            <p>This field is for Mastery skills that <strong>only apply when fighting bosses</strong>.</p>

            <h4>How to Use</h4>
            <p>Similar to regular Skill Mastery Bonus, but only include bonuses that specifically state "against bosses" or "boss damage".</p>

            <img src="media/tutorial/mastery-boss.png" alt="Boss Mastery Example" style="width: 100%; max-width: 300px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">

            <h4>Important</h4>
            <p>Don't double-count! If a bonus applies to all enemies, put it in the regular Skill Mastery Bonus field, not here.</p>
        `,
  },
  "target-stage": {
    title: "Target Stage/Boss",
    content: `
            <h4>What is this?</h4>
            <p>Select the enemy or stage you're currently fighting to apply accurate defense and damage reduction values.</p>

            <h4>Why It Matters</h4>
            <p>Different enemies have different defensive stats:</p>
            <ul>
                <li><strong>Training Dummy:</strong> 0% defense (shows your raw damage)</li>
                <li><strong>Normal Stages:</strong> Low defense (5-20%)</li>
                <li><strong>Chapter Bosses:</strong> Medium defense (20-25%)</li>
                <li><strong>World Bosses:</strong> High defense (50%+)</li>
            </ul>

            <h4>Tip</h4>
            <p>Select "Training Dummy" to see your maximum potential damage output without any enemy resistances.</p>
        `,
  },
  defense: {
    title: "Defense (Dark Knight Only)",
    content: `
            <h4>What is Defense?</h4>
            <p>This field is specifically for Dark Knight characters who have a passive skill that converts a percentage of their Defense stat into Main Stat.</p>

            <h4>Why It's Important</h4>
            <p>The Dark Knight passive converts defense into main stat, which is a unique damage multiplier. This conversion is <strong>not</strong> included when you get a main stat % increase from equipment or other sources.</p>

            <h4>How to Use</h4>
            <ul>
                <li>Enter your total Defense value from your character stats</li>
                <li>The calculator will apply the Dark Knight passive conversion</li>
                <li>This ensures accurate damage calculations for Dark Knights</li>
            </ul>

            <h4>Note</h4>
            <p>This field is only visible when you select Dark Knight as your class.</p>
        `,
  },
  "main-stat-pct": {
    title: "Current Main Stat %",
    content: `
            <h4>What is Main Stat %?</h4>
            <p>Main Stat % represents all percentage-based bonuses you currently have that increase your main stat (STR, DEX, INT, or LUK depending on your class).</p>

            <h4>Why It's Required</h4>
            <p>Main stat % bonuses are <strong>additive with each other</strong>, which means the value of gaining additional main stat % depends on your current total and existing bonuses. This field is required to correctly calculate how much DPS you would gain from additional main stat % sources.</p>

            <h4>How to Use These Fields Together</h4>
            <ol>
                <li><strong>Primary Main Stat:</strong> Enter the TOTAL main stat shown on your character sheet (this already includes all your main stat % bonuses)</li>
                <li><strong>Current Main Stat %:</strong> Enter the sum of all your main stat % bonuses</li>
            </ol>

            <h4>How to Calculate</h4>
            <p>Add up all your main stat % bonuses from:</p>
            <ul>
                <li>Artifacts</li>
                <li>Passive skills</li>
                <li>Buff skills</li>
                <li>Any other source that says "+X% Main Stat"</li>
            </ul>

            <h4>Important Note for Dark Knights</h4>
            <p>Main stat % bonuses do NOT affect the portion of your main stat that comes from Defense conversion. This is automatically handled in the calculations.</p>

            <h4>Example</h4>
            <p>If you have +20% from equipment, +15% from artifacts, and +10% from skills, enter <strong>45</strong> in the "Current Main Stat %" field. Then enter your character sheet's total main stat value in the "Primary Main Stat" field.</p>
        `,
  },
  "stats-autofill": {
    title: "Stats Auto-Fill",
    content: `
            <p>Use optical character recognition to auto-fill stats from the Character page.</p>

            <h4>How to prepare the screenshot</h4>
            <ul>
                <li>Copy the image such that only the stat lines are visible. Tip: Use Win-Shift-S on Windows, or Cmd-Shift-4 on Mac</li>
                <li>Paste the image from your clipboard while mouse is hovering over the paste area</li>
                <li>If Auto-Fill misses fields, you can edit them manually</li>
            </ul>
            
            <h4>Notes</h4>
              <ul>
                <li>"Min Damage Multiplier" may not get autofilled correctly</li>
                <li>Ensure that all primary stats (STR, DEX, INT, LUK) are visible in the <strong>same</strong> screenshot for accurate calculation of primary/secondary stats</li>
            </ul>
            
            <h4> Example Acceptable Screenshots</h4>
            <img src="media/autofill/stats-autofill-ex1.png" style="width: 100%; max-width: 360px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">
            <img src="media/autofill/stats-autofill-ex2.png" style="width: 100%; max-width: 360px; margin: 12px 0; border: 1px solid var(--border-color); border-radius: 8px;">
        `,
  },
};

export function openHelpSidebar(helpKey) {
  const sidebar = document.getElementById("help-sidebar");
  const title = document.getElementById("help-sidebar-title");
  const content = document.getElementById("help-sidebar-content");
  const backdrop = document.getElementById("help-sidebar-backdrop");

  if (!sidebar || !title || !content) return;

  const helpData = helpContent[helpKey];
  if (!helpData) return;

  // Set content
  title.textContent = helpData.title;
  content.innerHTML = helpData.content;

  // Show sidebar
  sidebar.style.display = "flex";

  // Only show backdrop and mobile-open class on mobile (< 1024px)
  if (window.innerWidth < 1024) {
    sidebar.classList.add("mobile-open");
    if (backdrop) {
      backdrop.classList.add("active");
    }
  }
}

export function closeHelpSidebar() {
  const sidebar = document.getElementById("help-sidebar");
  const backdrop = document.getElementById("help-sidebar-backdrop");

  if (sidebar) {
    sidebar.classList.remove("mobile-open");
    // Use a timeout to allow the transform animation to complete before hiding
    setTimeout(() => {
      if (!sidebar.classList.contains("mobile-open")) {
        sidebar.style.display = "none";
      }
    }, 300);
  }
  if (backdrop) {
    backdrop.classList.remove("active");
  }
}

// Left Navigation - Scroll to Section
export function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}
