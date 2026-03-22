# Character Sheets

test

A static character sheet system built for a Pathfinder campaign — and anyone else who wants it.

Each character gets their own folder, their own color scheme, and their own backstory rendered in a dark, typographically obsessive web interface. The sheet handles the math. You handle the lore.

**[→ View the Roster](https://fleshbox.github.io/sheets/)**

---

## What's in here

```
/
├── index.html          — the roster (front page)
├── roster.json         — list of characters shown on the roster
├── sheet.js            — shared logic that builds every sheet
├── sheet.css           — shared styles
├── howto/              — documentation for adding characters
├── nix/                — Nix (Fetchling Barbarian // Alchemist, Gestalt 3)
│   ├── index.html
│   ├── character.json
│   └── portrait.png
└── atnas/              — Atnas Greystag (Plumekith Aasimar Warden, Level 5)
    ├── index.html
    ├── character.json
    └── portrait.png
```

Each character is self-contained in their own folder. The shared JS reads `character.json`, calculates derived values (stat mods, skill totals, saves, attack bonuses, AC, initiative), applies the character's color theme, and builds the sheet. You never touch the HTML to update a character.

## Adding a character

Full documentation, including JSON schema reference and step-by-step setup for people who've never used Git before:

**[→ How To Add a Character](https://fleshbox.github.io/sheets/howto/)**

## Cloning this for your own campaign

Fork or clone the repo, drop in your own characters, enable GitHub Pages on your fork, and you're live. The system is designed to be portable — there's nothing in here tied to a specific campaign or setting beyond the character data itself.

The `howto/` page walks through the full workflow, including GitHub setup, from scratch.

---

*Built with vanilla HTML, CSS, and JavaScript. No frameworks. No build step. No nonsense.*