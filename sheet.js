// sheet.js — Character sheet loader
// Fetches ./character.json, calculates derived values, and populates the DOM.

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcMod(score) {
  return Math.floor((score - 10) / 2);
}

function fmtMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function buildModMap(abilityScores) {
  const map = {};
  for (const s of abilityScores) {
    map[s.name] = calcMod(s.score);
  }
  return map;
}

function buildTooltip(baseParts, misc, miscReason) {
  const pieces = baseParts.map(p => fmtMod(p));
  if (misc) pieces.push(`${fmtMod(misc)}${miscReason ? ` (${miscReason})` : ''}`);
  return pieces.join(' ');
}

function withTooltip(value, tooltip) {
  if (!tooltip) return `${value}`;
  return `<span class="has-tooltip" data-tooltip="${tooltip}">${value}<span class="tooltip-indicator">◆</span></span>`;
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
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
    shadow:  '--shadow', deep:    '--deep',  surface: '--surface',
    raised:  '--raised', border:  '--border', muted:   '--muted',
    text:    '--text',   textDim: '--text-dim', primary: '--primary', accent: '--accent',
  };
  for (const [key, cssVar] of Object.entries(map)) {
    if (theme[key]) root.style.setProperty(cssVar, theme[key]);
  }
  const hexToRgb = hex => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
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
  if (meta.ogUrl)         set('og:url',         meta.ogUrl);
  if (meta.ogImage)       set('og:image',       meta.ogImage);
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildHeader(data) {
  document.querySelector('.character-name').textContent    = data.name;
  document.querySelector('.character-subtitle').textContent = data.subtitle;
  document.querySelector('.character-quote').textContent   = data.quote;
}

function buildPortrait(portrait) {
  const img = document.querySelector('#portrait-img');
  const lb  = document.querySelector('#lightbox-img');
  img.src = lb.src = portrait.src;
  img.alt = portrait.alt;
  lb.alt  = portrait.alt + ' enlarged';
  // Hide broken image icon if portrait is missing
  img.onerror = () => { img.style.display = 'none'; };
  lb.onerror  = () => { lb.style.display  = 'none'; };
}

function buildIdentity(items) {
  document.querySelector('.identity-grid').innerHTML = items.map(item => `
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
  document.querySelector('.appearance-block ul').innerHTML = items.map(item => `
    <li>
      <strong style="color:${variantColor(item.labelVariant || 'primary')}">${item.label}:</strong>
      ${item.value}
    </li>
  `).join('');
}

function buildAbilityScores(scores, note) {
  document.querySelector('.stats-grid').innerHTML = scores.map(s => {
    const mod        = calcMod(s.score);
    const isLow      = mod < 0;
    const scoreColor = isLow ? 'var(--accent)' : s.primary ? 'var(--primary)' : 'var(--text)';
    const modColor   = isLow ? 'var(--accent)' : 'var(--text-dim)';
    // Tooltip if score has misc adjustment (e.g. from items or racial)
    const tip = s.misc ? buildTooltip([s.score - (s.misc||0)], s.misc, s.miscReason) : null;
    return `
      <div class="stat-box${s.primary ? ' primary' : ''}">
        <span class="stat-name">${s.name}</span>
        <span class="stat-score" style="color:${scoreColor}">${withTooltip(s.score, tip)}</span>
        <span class="stat-mod" style="color:${modColor}">${fmtMod(mod)}</span>
      </div>
    `;
  }).join('');
  document.querySelector('.ability-scores-note').textContent = note || '';
}

function buildCombat(combat, modMap, bab) {
  // Initiative
  const initMisc  = combat.initiativeMisc || 0;
  const initTotal = (modMap['DEX'] || 0) + initMisc;
  const initTip   = buildTooltip([modMap['DEX'] || 0], initMisc, combat.initiativeMiscReason);

  // AC
  const acMisc   = combat.acMisc || 0;
  const dexForAC = combat.armorMaxDex !== undefined
    ? Math.min(modMap['DEX'] || 0, combat.armorMaxDex)
    : (modMap['DEX'] || 0);
  const acTotal  = 10 + (combat.armorBonus || 0) + dexForAC + acMisc;
  const acTip    = [
    `10 base`,
    `+${combat.armorBonus || 0} armor`,
    `${fmtMod(dexForAC)} DEX${combat.armorMaxDex !== undefined ? ` (capped)` : ''}`,
    acMisc ? `${fmtMod(acMisc)}${combat.acMiscReason ? ` (${combat.acMiscReason})` : ''}` : null
  ].filter(Boolean).join(' + ');

  // Saves
  const saves = (combat.saves || []).map(sv => {
    const mod   = modMap[sv.stat] || 0;
    const misc  = sv.misc || 0;
    const total = sv.base + mod + misc;
    const tip   = buildTooltip([sv.base, mod], misc, sv.miscReason);
    return { ...sv, total, tip };
  });

  // Stat tiles
  const statTiles = [
    { label: 'BAB',        value: fmtMod(bab),       tip: null },
    { label: 'Initiative', value: fmtMod(initTotal),  tip: initTip },
    { label: 'AC',         value: acTotal,            tip: acTip },
    ...(combat.hp !== undefined ? [{ label: 'HP', value: combat.hp, tip: null }] : []),
    ...(combat.speed !== undefined ? [{ label: 'Speed', value: combat.speed, tip: null }] : []),
    ...saves.map(sv => ({ label: sv.label, value: fmtMod(sv.total), tip: sv.tip, variant: sv.variant })),
    ...(combat.extraStats || []).map(s => ({ label: s.label, value: s.value, tip: null, variant: s.variant })),
  ];

  document.querySelector('.combat-grid').innerHTML = statTiles.map(s => `
    <div class="combat-stat">
      <span class="combat-label">${s.label}</span>
      <span class="combat-value" style="color:${s.variant ? variantColor(s.variant) : 'var(--primary)'}">
        ${s.tip ? withTooltip(s.value, s.tip) : s.value}
      </span>
    </div>
  `).join('');

  // Weapons
  document.querySelector('#weapons-table tbody').innerHTML = (combat.weapons || []).map(w => {
    const statMod  = modMap[w.stat || 'DEX'] || 0;
    const misc     = w.misc || 0;
    const atkTotal = bab + statMod + misc;
    const atkTip   = buildTooltip([bab, statMod], misc, w.miscReason);
    return `
      <tr>
        <td class="highlight">${w.name}</td>
        <td>${withTooltip(fmtMod(atkTotal), atkTip)}</td>
        <td>${w.damage}</td>
        <td>${w.crit || '—'}</td>
        <td style="color:${variantColor(w.notesVariant)};font-size:0.85rem;${w.notesVariant === 'accent' ? 'font-style:italic;' : ''}">${w.notes || ''}</td>
      </tr>
    `;
  }).join('');
}

function buildClassFeatures(classes, note) {
  document.querySelector('.class-features-grid').innerHTML = classes.map(cls => `
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
  document.querySelector('.class-features-note').innerHTML = renderInline(note || '');
}

function buildFeats(feats) {
  document.querySelector('#feats-table tbody').innerHTML = feats.map(f => `
    <tr>
      <td class="highlight">${f.level}</td>
      <td>${f.name}</td>
      <td style="color:var(--text-dim);font-size:0.85rem;">${f.notes}</td>
    </tr>
  `).join('');
}

function buildSkills(skills, note, modMap) {
  document.querySelector('#skills-table thead tr').innerHTML =
    '<th>Skill</th><th>Ranks</th><th>Mod</th><th>Total</th>';

  document.querySelector('#skills-table tbody').innerHTML = skills.map(s => {
    const statMod    = modMap[s.stat] || 0;
    const ranks      = s.ranks || 0;
    const classBonus = (s.classSkill && ranks > 0) ? 3 : 0;
    const misc       = s.misc || 0;
    const total      = statMod + ranks + classBonus + misc;

    const tipParts = [
      `${fmtMod(statMod)} ${s.stat}`,
      `${ranks} ranks`,
      classBonus ? `+3 class` : null,
      misc ? `${fmtMod(misc)}${s.miscReason ? ` (${s.miscReason})` : ''}` : null,
    ].filter(Boolean).join(' + ');

    const classIndicator = (s.classSkill && ranks > 0)
      ? ` <span style="color:var(--accent);font-size:0.7rem;" title="Class skill">●</span>`
      : '';

    return `
      <tr>
        <td class="highlight">${s.name}${classIndicator}</td>
        <td>${ranks}</td>
        <td style="color:var(--text-dim)">${fmtMod(statMod)} <span style="font-size:0.75rem;color:var(--muted)">${s.stat}</span></td>
        <td class="highlight">${withTooltip(fmtMod(total), tipParts)}</td>
      </tr>
    `;
  }).join('');

  document.querySelector('.skills-note').textContent = note || '';
}

function buildRacialTraits(racial) {
  document.querySelector('.racial-title').textContent = `Racial Traits — ${racial.raceName}`;
  document.querySelector('.racial-traits-list').innerHTML = racial.traits.map(t => `
    <li>
      <span class="feature-name">${renderInline(t.name)}</span>
      ${t.description ? ` — ${renderInline(t.description)}` : ''}
    </li>
  `).join('');
}

function buildEquipment(items) {
  document.querySelector('#equipment-table tbody').innerHTML = items.map(item => `
    <tr>
      <td class="highlight">${item.name}</td>
      <td style="color:${variantColor(item.notesVariant)};font-size:0.85rem;${item.notesVariant === 'accent' ? 'font-style:italic;' : ''}">${item.notes}</td>
    </tr>
  `).join('');
}

function buildLore(loreBlocks) {
  document.querySelector('.lore-container').innerHTML = loreBlocks.map(block => {
    let inner = '';
    if (block.content)   inner += renderMarkdown(block.content);
    if (block.bindings)  inner += block.bindings.map(b => `
      <div class="binding-item">
        <span class="binding-label">${b.label}</span>
        <span class="binding-name">${b.name}</span>
        <p>${b.description}</p>
      </div>
    `).join('');
    if (block.incidents) inner += `<div class="incidents">` + block.incidents.map(inc => `
      <div class="incident${inc.variant === 'accent' ? ' accent' : ''}">${inc.text}</div>
    `).join('') + `</div>`;
    if (block.hooks) inner += `<ul class="hook-list">` + block.hooks.map(h => `<li>${h}</li>`).join('') + `</ul>`;
    const titleNote = block.titleNote ? ` <span class="lore-title-note">${block.titleNote}</span>` : '';
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

    const modMap = buildModMap(data.abilityScores);
    const bab    = data.combat.bab || 0;

    applyTheme(data.theme);
    applyMeta(data.meta);
    buildHeader(data.header);
    buildPortrait(data.portrait);
    buildIdentity(data.identity);
    buildAppearance(data.appearance);
    buildAbilityScores(data.abilityScores, data.abilityScoresNote);
    buildCombat(data.combat, modMap, bab);
    buildClassFeatures(data.classFeatures, data.classFeaturesNote);
    buildFeats(data.feats);
    buildSkills(data.skills, data.skillsNote, modMap);
    buildRacialTraits(data.racialTraits);
    buildEquipment(data.equipment);
    buildLore(data.lore);
    buildFooter(data.footer);

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