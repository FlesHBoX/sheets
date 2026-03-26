# Character Sheet System — LLM Reference

> Stripped-down schema reference for AI assistance. Source of truth: `howto/index.html`.

## Overview

Static site hosted on GitHub Pages. Each character lives in their own folder:

```
/
  index.html          — roster (front page)
  roster.json         — list of characters
  sheet.js            — shared logic (don't edit)
  sheet.css           — shared styles (don't edit)
  nix/
    index.html        — stub with OG tags
    character.json    — all character data
    portrait.png
    lore/             — optional extra lore pages
      index.html      — shared stub (copy, never edit)
      index.json      — list of lore entries
      nix-combat.json — a lore entry
      nix-combat/     — optional Discord embed stub
        index.html
```

The only files edited for a character are `character.json` and `roster.json` (when adding someone new). `sheet.js` reads the JSON and renders everything automatically.

---

## roster.json

```json
[
  {
    "name":     "Thorvald",
    "subtitle": "Dwarf · Fighter · Level 4",
    "quote":    "\"I've survived worse.\"",
    "portrait": "./thorvald/portrait.png",
    "href":     "./thorvald/",
    "primary":  "#c8a060",
    "accent":   "#4a9aff"
  }
]
```

---

## character.json — Full Schema

### meta
Controls page title and social embeds (Discord, Slack).

| Field | Type | Description |
|-------|------|-------------|
| title | string | Browser tab title. E.g. `"NIX — Character Sheet"` |
| ogTitle | string | Embed title |
| ogDescription | string | Embed subtitle. Typically Race · Class · Level — Quote |
| ogUrl | string | Full URL to character page |
| ogImage | string | Full URL to portrait |

### theme
All values are hex codes. `primary` and `accent` are most important.

| Field | Description |
|-------|-------------|
| primary | Main color — names, stat highlights, section titles |
| accent | Secondary color — warnings, quotes, emotional weight |
| _primary / _accent | Notes to yourself, never rendered |
| shadow / deep / surface / raised | Background layers |
| border / muted / text / textDim | UI chrome, safe to leave as defaults |

### header
```json
"header": {
  "name":     "NIX",
  "subtitle": "Fetchling · Barbarian // Alchemist · Gestalt Level 3",
  "quote":    "\"This is not your party, Ember.\""
}
```

### identity
Label/value pairs in a grid. Optional `note` renders dimmed in parentheses.
```json
"identity": [
  { "label": "Race",      "value": "Fetchling" },
  { "label": "True Name", "value": "Nix", "note": "formerly: Ember" }
]
```

### appearance
Physical description items. `labelVariant`: `"primary"` | `"accent"` | `"dim"`.
```json
"appearance": [
  { "label": "Build",   "value": "Lean.",                    "labelVariant": "primary" },
  { "label": "Warning", "value": "Goes still before violence.", "labelVariant": "accent"  }
]
```

### abilityScores
Enter raw score only — modifiers calculated automatically via `floor((score - 10) / 2)`.
- `primary: true` — highlighted border
- `misc` + `miscReason` — bonus shown in hover tooltip
- Negative mod displays in accent color automatically

```json
"abilityScores": [
  { "name": "STR", "score": 18, "primary": true },
  { "name": "DEX", "score": 17, "primary": true, "misc": 2, "miscReason": "Racial +2" },
  { "name": "WIS", "score":  8, "primary": false }
]
```

### combat
Provide raw components — initiative, AC, saves, attack bonuses calculated automatically.

```json
"combat": {
  "bab":         3,
  "armorBonus":  4,
  "armorMaxDex": 4,      // omit if no DEX cap
  "speed":       "30 ft",

  // hp as per-level rolls — max calculated automatically (roll + CON mod per level)
  // misc + miscReason: optional flat bonus + tooltip
  // Alternatively use a plain string for static display: "hp": "45"
  "hp": [
    { "level": 1, "roll": "12", "class": "Barbarian" },
    { "level": 2, "roll": "7",  "class": "Barbarian", "misc": 1, "miscReason": "Toughness" },
    { "level": 3, "roll": "12", "class": "Barbarian" }
  ],

  "saves": [
    { "label": "Fort", "stat": "CON", "base": 3 },
    { "label": "Will", "stat": "WIS", "base": 1,
      "variant": "accent",               // accent color (e.g. weak save)
      "misc": 2, "miscReason": "Iron Will" }
  ],

  "extraStats": [   // extra tiles — class resources, pools, etc.
    { "label": "Rage Rounds", "value": "10" }
  ],

  "weapons": [
    {
      "name":         "Kukri",
      "stat":         "STR",         // STR or DEX governs attack bonus
      "damage":       "1d4+4",
      "crit":         "18-20 x2",
      "notes":        "Rule of Cool.",
      "notesVariant": "dim",          // "dim", "primary", or "accent"
      "misc":         1,              // optional attack bonus (feats, magic)
      "miscReason":   "Masterwork"
    }
  ]
}
```

### classFeatures
One entry per class. Gestalt characters use two entries (render side by side).
Descriptions support `**bold**` and `*italic*`.

```json
"classFeatures": [
  {
    "className": "Fighter",
    "features": [
      { "name": "Bravery",       "description": "+1 Will saves vs. fear" },
      { "name": "Armor Training","description": "" }
    ]
  }
]
```

### feats
```json
"feats": [
  { "level": "1st", "name": "Power Attack", "notes": "-1 attack / +2 damage" }
]
```
Use `"—"` for `level` if the feat wasn't gained at a specific level.

### skills
Only list skills the character has invested in. Totals calculated automatically.
`●` appears when +3 class skill bonus is active.

Formula: `stat mod + ranks + class bonus (+3 if classSkill: true and ranks > 0) + misc`

```json
"skills": [
  {
    "name":       "Perception",
    "stat":       "WIS",
    "classSkill": true,
    "ranks":      5,
    "misc":       2,
    "miscReason": "Racial bonus"
  }
]
```

### racialTraits
```json
"racialTraits": {
  "raceName": "Fetchling",
  "traits": [
    { "name": "Darkvision",     "description": "60 ft" },
    { "name": "Shadow Blending","description": "Miss chance in dim light increases to 50%" }
  ]
}
```

### equipment
`notesVariant`: `"dim"` standard · `"accent"` warnings/voice · `"primary"` highlighted values
```json
"equipment": [
  { "name": "Chain Shirt",   "notes": "+4 AC",            "notesVariant": "dim"     },
  { "name": "Health Potion", "notes": "Emergency only.",  "notesVariant": "accent"  },
  { "name": "Gold",          "notes": "150 gp",           "notesVariant": "primary" }
]
```

### magic
Optional. Omit entirely for non-casters — section is silently skipped.

The sheet shows slots per day, a prepared list (each tappable for details), and an "Open Formula Book" button.

| Field | Type | Description |
|-------|------|-------------|
| type | string | `"formulae"` (Alchemist), `"arcane"` (Wizard/Magus), `"spontaneous"` (Sorc/Oracle), `"divine"` (Cleric/Druid) |
| castingMode | string | `"consume"` (default): using a spell removes it from prepared list. `"pool"`: decrements shared slot count, spell stays on list. |
| label | string | Section heading. E.g. `"Formulae"` or `"Spells"` |
| spellbookLabel | string | Label for book button/modal. Defaults to `"Spellbook"` |
| slotsPerDay | object | Keys = spell level strings (`"1"`, `"2"`). Values = total slots including ability bonus — calculate externally |
| slotsUsed | object | Tracks slots spent this session. Same shape as slotsPerDay. Start each day with `{}` |
| prepared | array | Array of `id` strings from `known`. Duplicates allowed. Use `[]` if nothing prepared |
| preparedTimestamp | number | Unix ms timestamp of last prep change. Set automatically by sheet via Export State |
| known | array | Full formula book / spellbook. Use `[]` if not yet populated |

Each `known` entry:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique slug, kebab-case. E.g. `"cure-light-wounds"` |
| name | string | Display name |
| level | number | Spell/extract level as integer |
| school | string | Optional. E.g. `"Conjuration"` |
| castingTime | string | Optional. E.g. `"1 standard action"` |
| range | string | Optional. E.g. `"Touch"` |
| target | string | Optional. E.g. `"Creature touched"` |
| duration | string | Optional. E.g. `"1 min/level"` |
| savingThrow | string | Optional. E.g. `"Will negates"` |
| description | string | Optional. Supports `**bold**`, `*italic*`, `\n\n` for paragraph breaks |

```json
"magic": {
  "type":           "formulae",
  "label":          "Formulae",
  "spellbookLabel": "Formula Book",
  "slotsPerDay": { "1": 4 },
  "prepared": ["enlarge-person", "cure-light-wounds"],
  "known": [
    {
      "id":          "cure-light-wounds",
      "name":        "Cure Light Wounds",
      "level":       1,
      "school":      "Conjuration",
      "castingTime": "1 standard action",
      "range":       "Touch",
      "target":      "Creature touched",
      "duration":    "Instantaneous",
      "savingThrow": "Will half (harmless)",
      "description": "Heals 1d8 + caster level hit points (max +5)."
    }
  ]
}
```

**Session management:**
- **Use/Cast** button: marks spell as spent. `consume` mode removes instance from prepared. `pool` mode decrements slot count.
- **✕ (Unprepare)** button: removes from prepared list without spending a slot.
- **Export State** (top-right of sheet): exports `currentHp`, `slotsUsed`, `prepared`, `preparedTimestamp` as JSON to copy back into `character.json`.
- New day: reset `slotsUsed` to `{}`, update `prepared`, commit.

### lore
Backstory section. Blocks render in order: `content` → `bindings` → `incidents` → `hooks`.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Block heading |
| titleNote | string | Optional dimmed note after title. E.g. `"(she/her)"` |
| accent | `"primary"` \| `"accent"` | Left border color |
| content | string | Prose. Supports `**bold**`, `*italic*`, `\n\n` for paragraph breaks |
| incidents | array | Quoted lines in left-border style. Each: `{ "text": "...", "variant": "default" \| "accent" }` |
| bindings | array | Named ability/curse blocks. Each: `{ "label": "...", "name": "...", "description": "..." }` |
| hooks | array | Campaign hook strings, rendered as a bulleted list |

```json
"lore": [
  {
    "title":   "The Beginning",
    "accent":  "primary",
    "content": "First paragraph.\n\nSecond paragraph. **Bold** and *italic* work."
  },
  {
    "title":    "Things They Say",
    "accent":   "accent",
    "incidents": [
      { "text": "\"I've survived worse.\"", "variant": "default" },
      { "text": "\"...barely.\"",           "variant": "accent"  }
    ]
  },
  {
    "title":  "Campaign Hooks",
    "accent": "primary",
    "hooks":  ["Why did they leave?", "What does the villain want?"]
  }
]
```

---

## Extra Lore Pages

Characters can have additional lore pages beyond the main sheet — vignettes, session recaps, extended backstory. Lives in `lore/` subfolder. The character sheet auto-detects it and renders a **Further Reading** section. No changes to `character.json` needed.

### Folder structure
```
yourcharacter/lore/
  index.html        — copy from existing character's lore folder, never edit
  index.json        — list of lore entries
  entry-name.json   — one file per entry
  entry-name/       — optional: Discord embed stub folder
    index.html
```

URL uses a hash to select entries: `sheets/nix/lore/#nix-combat`

### lore/index.json
Controls the Further Reading section and the lore page nav bar.

```json
[
  {
    "id":          "nix-combat",
    "title":       "Nix in Combat",
    "description": "The thing about Nix is the constant hum of activity.",
    "shareUrl":    "./lore/nix-combat/"   // optional — relative to character root
  },
  {
    "id":    "the-docks",
    "title": "The Night at the Docks"
  }
]
```

- `id` must match the filename exactly — `"nix-combat"` → `nix-combat.json`
- `shareUrl` points to the Discord embed stub folder (relative to character root, not lore folder). When present, Further Reading and nav use it instead of the hash URL.

### Lore entry JSON
Two formats supported — can be mixed in one file.

**Plain prose** (best for vignettes, fiction):
```json
{
  "title":   "Nix in Combat",
  "content": "First paragraph.\n\nSecond paragraph.\n\n*Italic.* **Bold.**"
}
```

**Block layout** (best for structured content — same schema as `lore` in `character.json`):
```json
{
  "title": "The Docks — Session 4",
  "blocks": [
    {
      "title":   "Before",
      "accent":  "primary",
      "content": "What happened before the session."
    },
    {
      "title":     "What Was Said",
      "accent":    "accent",
      "incidents": [
        { "text": "\"SHUT UP EMBER.\"", "variant": "default" }
      ]
    }
  ]
}
```

Mix both: use `content` for an intro paragraph and `blocks` for structured sections. They render in that order.

### Discord embed stubs (optional)
Hash-based URLs (`lore/#nix-combat`) look identical to embed crawlers. Fix: a stub folder per entry with hardcoded OG tags that immediately redirects to the real lore page.

`yourcharacter/lore/nix-combat/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta property="og:title"       content="Nix in Combat" />
<meta property="og:description" content="The thing about Nix is the constant hum of activity." />
<meta property="og:type"        content="website" />
<meta property="og:url"         content="https://USERNAME.github.io/sheets/nix/lore/nix-combat/" />
<meta property="og:image"       content="https://USERNAME.github.io/sheets/nix/portrait.png" />
<title>Nix in Combat</title>
<meta http-equiv="refresh" content="0;url=../#nix-combat">
</head>
<body>
  <script>window.location.replace('../#nix-combat');</script>
</body>
</html>
```

After creating the stub folder, add `"shareUrl": "./lore/nix-combat/"` to the entry in `lore/index.json`.

> **Note:** `shareUrl` is relative to the character sheet root (`yourcharacter/`), not the lore folder. Always prefix with `./lore/`.
