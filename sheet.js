// sheet.js — Character sheet loader
// Reads the URL hash (#charactername), fetches characters/{name}.json,
// applies the theme, and populates the DOM.

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
// Handles: **bold**, *italic*, line breaks (\n\n = paragraph break within a block)
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .split('\n\n')
    .map(para => {
      const html = para
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      return `<p>${html}</p>`;
    })
    .join('');
}

// Inline only (no paragraph wrapping) — for short strings
function renderInline(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// ─── Theme application ────────────────────────────────────────────────────────
function applyTheme(theme) {
  const root = document.documentElement;
  const map = {
    shadow:   '--shadow',
    deep:     '--deep',
    surface:  '--surface',
    raised:   '--raised',
    border:   '--border',
    muted:    '--muted',
    text:     '--text',
    textDim:  '--text-dim',
    primary:  '--primary',
    accent:   '--accent',
  };

  for (const [key, cssVar] of Object.entries(map)) {
    if (theme[key]) root.style.setProperty(cssVar, theme[key]);
  }

  // Derived alpha variants
  const hexToRgb = hex => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r}, ${g}, ${b}`;
  };

  if (theme.primary) {
    const rgb = hexToRgb(theme.primary);
    root.style.setProperty('--primary-dim',  `rgba(${rgb}, 0.15)`);
    root.style.setProperty('--primary-glow', `rgba(${rgb}, 0.4)`);
  }
  if (theme.accent) {
    const rgb = hexToRgb(theme.accent);
    root.style.setProperty('--accent-dim',  `rgba(${rgb}, 0.12)`);
    root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.4)`);
  }
}

// ─── Variant resolver ─────────────────────────────────────────────────────────
// Maps variant strings to CSS variable references
function variantColor(variant) {
  switch (variant) {
    case 'primary': return 'var(--primary)';
    case 'accent':  return 'var(--accent)';
    case 'dim':     return 'var(--text-dim)';
    default:        return 'var(--text)';
  }
}

// ─── Meta tags ────────────────────────────────────────────────────────────────
function applyMeta(meta) {
  document.title = meta.title || 'Character Sheet';
  const set = (prop, content) => {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };
  if (meta.ogTitle)       set('og:title',       meta.ogTitle);
  if (meta.ogDescription) set('og:description', meta.ogDescription);
  if (meta.ogUrl)         set('og:url',          meta.ogUrl);
  if (meta.ogImage)       set('og:image',        meta.ogImage);
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildHeader(data) {
  document.querySelector('.character-name').textContent = data.name;
  document.querySelector('.character-subtitle').textContent = data.subtitle;
  document.querySelector('.character-quote').textContent = data.quote;
}

function buildPortrait(portrait) {
  const img = document.querySelector('#portrait-img');
  const lbImg = document.querySelector('#lightbox-img');
  img.src = portrait.src;
  img.alt = portrait.alt;
  lbImg.src = portrait.src;
  lbImg.alt = portrait.alt + ' enlarged';
}

function buildIdentity(items) {
  const grid = document.querySelector('.identity-grid');
  grid.innerHTML = items.map(item => `
    <div class="identity-item">
      <span class="identity-label">${item.label}</span>
      <span class="identity-value">
        ${item.value}
        ${item.note ? `<span style="color:var(--text-dim);font-size:0.85rem;"> (${item.note})</span>` : ''}
      </span>
    </div>
  `).join('');
}

function buildAppearance(items) {
  const ul = document.querySelector('.appearance-block ul');
  ul.innerHTML = items.map(item => `
    <li>
      <strong style="color:${variantColor(item.labelVariant || 'primary')}">${item.label}:</strong>
      ${item.value}
    </li>
  `).join('');
}

function buildAbilityScores(scores, note) {
  const grid = document.querySelector('.stats-grid');
  grid.innerHTML = scores.map(s => {
    const scoreColor = s.low ? 'var(--muted)' : s.primary ? 'var(--primary)' : 'var(--text)';
    const modColor   = s.low ? 'var(--accent)' : 'var(--text-dim)';
    return `
      <div class="stat-box${s.primary ? ' primary' : ''}">
        <span class="stat-name">${s.name}</span>
        <span class="stat-score" style="color:${scoreColor}">${s.score}</span>
        <span class="stat-mod"  style="color:${modColor}">${s.mod}</span>
      </div>
    `;
  }).join('');
  document.querySelector('.ability-scores-note').textContent = note || '';
}

function buildCombat(combat) {
  const statsDiv = document.querySelector('.combat-grid');
  statsDiv.innerHTML = combat.stats.map(s => `
    <div class="combat-stat">
      <span class="combat-label">${s.label}</span>
      <span class="combat-value" style="color:${s.variant ? variantColor(s.variant) : 'var(--primary)'}">${s.value}</span>
    </div>
  `).join('');

  const tbody = document.querySelector('#weapons-table tbody');
  tbody.innerHTML = combat.weapons.map(w => `
    <tr>
      <td class="highlight">${w.name}</td>
      <td>${w.attack}</td>
      <td>${w.damage}</td>
      <td>${w.crit}</td>
      <td style="color:${variantColor(w.notesVariant)};font-size:0.85rem;${w.notesVariant === 'accent' ? 'font-style:italic;' : ''}">${w.notes}</td>
    </tr>
  `).join('');
}

function buildClassFeatures(classes, note) {
  const container = document.querySelector('.class-features-grid');
  container.innerHTML = classes.map(cls => `
    <div>
      <p class="class-label">${cls.className}</p>
      <ul class="feature-list">
        ${cls.features.map(f => `
          <li>
            <span class="feature-name">${f.name}</span>
            ${f.description ? ` — ${renderInline(f.description)}` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
  const noteEl = document.querySelector('.class-features-note');
  noteEl.innerHTML = renderInline(note || '');
}

function buildFeats(feats) {
  const tbody = document.querySelector('#feats-table tbody');
  tbody.innerHTML = feats.map(f => `
    <tr>
      <td class="highlight">${f.level}</td>
      <td>${f.name}</td>
      <td style="color:var(--text-dim);font-size:0.85rem;">${f.notes}</td>
    </tr>
  `).join('');
}

function buildSkills(skills, note) {
  const tbody = document.querySelector('#skills-table tbody');
  tbody.innerHTML = skills.map(s => `
    <tr>
      <td class="highlight">${s.name}</td>
      <td>${s.ranks}</td>
      <td>${s.stat}</td>
      <td>${s.class}</td>
      <td class="highlight">${s.total}</td>
    </tr>
  `).join('');
  document.querySelector('.skills-note').textContent = note || '';
}

function buildRacialTraits(racial) {
  document.querySelector('.racial-title').textContent =
    `Racial Traits — ${racial.raceName}`;
  const ul = document.querySelector('.racial-traits-list');
  ul.innerHTML = racial.traits.map(t => `
    <li>
      <span class="feature-name">${renderInline(t.name)}</span>
      ${t.description ? ` — ${renderInline(t.description)}` : ''}
    </li>
  `).join('');
}

function buildEquipment(items) {
  const tbody = document.querySelector('#equipment-table tbody');
  tbody.innerHTML = items.map(item => `
    <tr>
      <td class="highlight">${item.name}</td>
      <td style="color:${variantColor(item.notesVariant)};font-size:0.85rem;${item.notesVariant === 'accent' ? 'font-style:italic;' : ''}">${item.notes}</td>
    </tr>
  `).join('');
}

function buildLore(loreBlocks) {
  const container = document.querySelector('.lore-container');
  container.innerHTML = loreBlocks.map(block => {
    let inner = '';

    // Prose content (markdown)
    if (block.content) {
      inner += renderMarkdown(block.content);
    }

    // Bindings (typed component)
    if (block.bindings) {
      inner += block.bindings.map(b => `
        <div class="binding-item">
          <span class="binding-label">${b.label}</span>
          <span class="binding-name">${b.name}</span>
          <p>${b.description}</p>
        </div>
      `).join('');
    }

    // Incidents (typed component)
    if (block.incidents) {
      inner += `<div class="incidents">` + block.incidents.map(inc => `
        <div class="incident${inc.variant === 'accent' ? ' accent' : ''}">${inc.text}</div>
      `).join('') + `</div>`;
    }

    // Hooks (typed component)
    if (block.hooks) {
      inner += `<ul class="hook-list">` + block.hooks.map(h => `
        <li>${h}</li>
      `).join('') + `</ul>`;
    }

    const titleNote = block.titleNote
      ? ` <span class="lore-title-note">${block.titleNote}</span>`
      : '';

    return `
      <div class="lore-block ${block.accent === 'primary' ? 'primary-accent' : 'accent-accent'}">
        <div class="lore-title">${block.title}${titleNote}</div>
        ${inner}
      </div>
    `;
  }).join('');
}

function buildFooter(text) {
  document.querySelector('.footer').textContent = text || '';
}

// ─── Main loader ──────────────────────────────────────────────────────────────
async function loadCharacter() {
  try {
    const res = await fetch('./character.json');
    if (!res.ok) throw new Error('character.json not found.');
    const data = await res.json();

    applyTheme(data.theme);
    applyMeta(data.meta);
    buildHeader(data.header);
    buildPortrait(data.portrait);
    buildIdentity(data.identity);
    buildAppearance(data.appearance);
    buildAbilityScores(data.abilityScores, data.abilityScoresNote);
    buildCombat(data.combat);
    buildClassFeatures(data.classFeatures, data.classFeaturesNote);
    buildFeats(data.feats);
    buildSkills(data.skills, data.skillsNote);
    buildRacialTraits(data.racialTraits);
    buildEquipment(data.equipment);
    buildLore(data.lore);
    buildFooter(data.footer);

    // Reveal page after load
    document.body.classList.add('loaded');

  } catch (err) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;
        font-family:serif;color:#c8c8d8;text-align:center;padding:2rem;">
        <div>
          <p style="font-size:1.2rem;margin-bottom:0.5rem;">Character not found.</p>
          <p style="color:#7a7a9a;font-size:0.9rem;">${err.message}</p>
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', loadCharacter);