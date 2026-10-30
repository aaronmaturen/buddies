import {
  Buddy, animate, fromConfig, toConfig, randomConfig, randomNames, describe, setHeadShape, setHeadStyle, setColor,
  TRAITS, setTrait, setEyeShape, EYE_SHAPES,
  MOOD_NAMES, EMOTE_NAMES, MORPHS, MORPH_NAMES, HEAD_STYLES, HEADS, shapeLabel, EYE_LABELS, PALETTE,
  castShapes, spreadColors, spreadStyles, reducedMotion,
} from "./buddy/index.js";

const CAST_SIZE = 12;
const $ = id => document.getElementById(id);

const nameInput = $("buddy-name"), moodsEl = $("moods"), cycleEl = $("cycle");
const shapesEl = $("shapes"), swatchesEl = $("swatches"), castEl = $("cast");
let mood = "neutral";

// ---------- tabs ----------
// One group of controls at a time so the panel stays about as tall as the stage. Arrow keys move between
// tabs; the last tab used is remembered in this browser.
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute("aria-controls")).hidden = !on;
  }
  if (focus) tab.focus();
  try { localStorage.setItem("buddies:tab", tab.id); } catch {}
}
for (const t of tabs) {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", e => {
    const i = tabs.indexOf(t);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectTab(tabs[(next + tabs.length) % tabs.length], true);
  });
}
try { const saved = $(localStorage.getItem("buddies:tab")); if (tabs.includes(saved)) selectTab(saved); } catch {}

// ---------- buddies ----------
// The stage buddy and the cast are random configs: names from the list, every head shape different,
// colors spread around the wheel and styles dealt out so neighbours differ.
function rollSpecs() {
  const names = randomNames(CAST_SIZE + 1);
  const first = fromConfig(randomConfig({ name: names[0] }));
  const shapes = castShapes(first.headShape, Math.random);
  const specs = [first, ...names.slice(1).map((name, i) => fromConfig(randomConfig({ name, shape: shapes[i] })))];
  spreadColors(specs, Math.random);
  spreadStyles(specs, Math.random);
  return specs;
}

const startSpecs = rollSpecs();
const featured = new Buddy($("featured"), startSpecs[0], { scale: .27 });
const cast = startSpecs.slice(1).map(spec => {
  const btn = document.createElement("button");
  btn.className = "member";
  btn.innerHTML = `<canvas></canvas><strong></strong><small></small>`;
  castEl.append(btn);
  const b = new Buddy(btn.querySelector("canvas"), spec);
  b.card = btn;
  btn.addEventListener("click", () => {
    const a = featured.spec; featured.setSpec(b.spec); b.setSpec(a);
    render();
  });
  return b;
});
const all = [featured, ...cast];

// ---------- panel ----------
function render() {
  const sp = featured.spec, d = describe(sp);
  $("stage-name").textContent = sp.name;
  renderTraits(sp);
  for (const b of cast) {
    const cd = describe(b.spec);
    b.card.querySelector("strong").textContent = b.spec.name;
    b.card.querySelector("small").textContent = `${shapeLabel(b.spec.headShape).toLowerCase()}, ${cd.temper}, ${cd.attn}`;
    b.card.setAttribute("aria-label", `Bring ${b.spec.name} forward`);
  }
  if (document.activeElement !== nameInput) nameInput.value = sp.name;
  for (const el of swatchesEl.children) el.setAttribute("aria-pressed", String(el.dataset.color === sp.color.name));
  for (const el of shapesEl.children) el.setAttribute("aria-pressed", String(el.dataset.shape === sp.headShape));
  for (const el of $("head-modes").children) el.setAttribute("aria-pressed", String(el.dataset.head === sp.headStyle));
}

// ---------- traits ----------
// Plain-language readout for each slider, from describe() where it has words for it.
function readout(key, sp) {
  const d = describe(sp), v = sp[key];
  return {
    eyeSize: `${v < .22 ? "small" : v > .28 ? "big" : "medium"} · ${Math.round(v * 100)}`,
    spacing: `${v < .3 ? "close-set" : v > .37 ? "wide-set" : "even"} · ${Math.round(v * 100)}`,
    stiffness: `${d.temper} · spring ×${v.toFixed(2)}`,
    attention: `${d.attn} · ${Math.round(v * 100)}% follows you`,
    curiosity: `${d.look} · ×${v.toFixed(2)}`,
    blinkRate: `${d.blink} · ×${v.toFixed(2)}`,
  }[key];
}

const traitRows = {};
for (const [key, T] of Object.entries(TRAITS)) {
  const row = document.createElement("div");
  row.className = "trait";
  row.innerHTML = `<label for="trait-${key}">${T.label}</label><input type="range" id="trait-${key}" min="${T.min}" max="${T.max}" step="${T.step}"><output for="trait-${key}"></output>`;
  const input = row.querySelector("input");
  input.addEventListener("input", () => { setTrait(featured.spec, key, +input.value); renderTraits(featured.spec); });
  traitRows[key] = { row, input, out: row.querySelector("output") };
  $("trait-sliders").append(row);
}
for (const key of Object.keys(EYE_SHAPES)) {
  const b = chip("chip", EYE_LABELS[key]);
  b.dataset.eye = key;
  b.addEventListener("click", () => { setEyeShape(featured.spec, key); renderTraits(featured.spec); });
  $("eye-shapes").append(b);
}
function renderTraits(sp) {
  for (const [key, { input, out }] of Object.entries(traitRows)) {
    if (document.activeElement !== input) input.value = sp[key];
    out.textContent = readout(key, sp);
  }
  for (const el of $("eye-shapes").children) el.setAttribute("aria-pressed", String(el.dataset.eye === sp.shape));
}

function chip(className, text) {
  const b = document.createElement("button");
  b.className = className; b.textContent = text;
  return b;
}

for (const key of Object.keys(HEADS)) {
  const b = chip("chip", shapeLabel(key));
  b.dataset.shape = key;
  shapesEl.append(b);
}
shapesEl.addEventListener("click", e => {
  const b = e.target.closest("[data-shape]");
  if (!b) return;
  setHeadShape(featured.spec, b.dataset.shape);
  render();
});

for (const [key, c] of Object.entries(PALETTE)) {
  const b = chip("swatch", "");
  b.dataset.color = key;
  b.style.background = `hsl(${c.h} ${c.s}% ${c.l}%)`;
  b.setAttribute("aria-label", key); b.title = key[0].toUpperCase() + key.slice(1);
  swatchesEl.append(b);
}
swatchesEl.addEventListener("click", e => {
  const b = e.target.closest("[data-color]");
  if (!b) return;
  setColor(featured.spec, { ...PALETTE[b.dataset.color], name: b.dataset.color });
  render();
});

// ---------- moods ----------
function setMood(m, fromCycle = false) {
  mood = m;
  for (const b of all) setTimeout(() => b.setMood(m), Math.random() * (fromCycle ? 350 : 120));
  for (const el of moodsEl.children) el.setAttribute("aria-pressed", String(el.dataset.mood === m));
  $("stage-mood").textContent = m;
}

for (const m of MOOD_NAMES) {
  const b = chip("chip", m[0].toUpperCase() + m.slice(1));
  b.dataset.mood = m;
  b.addEventListener("click", () => { cycleEl.checked = false; setMood(m); });
  moodsEl.append(b);
}

cycleEl.checked = !reducedMotion;
setInterval(() => {
  if (cycleEl.checked) setMood(MOOD_NAMES[(MOOD_NAMES.indexOf(mood) + 1) % MOOD_NAMES.length], true);
}, 3400);

// ---------- emotes ----------
// The featured buddy reacts right away; the cast follows a beat later, each on its own timing.
const label = name => { const words = name.replace(/([A-Z])/g, " $1").toLowerCase(); return words[0].toUpperCase() + words.slice(1); };
for (const name of EMOTE_NAMES) {
  const b = chip("chip", label(name));
  b.addEventListener("click", () => {
    featured.emote(name);
    for (const c of cast) setTimeout(() => c.emote(name), 120 + Math.random() * 350);
  });
  $("emotes").append(b);
}

// ---------- morphs ----------
for (const name of MORPH_NAMES) {
  const b = chip("chip", MORPHS[name].label);
  b.addEventListener("click", () => {
    featured.morphInto(name);
    for (const c of cast) setTimeout(() => c.morphInto(name), 150 + Math.random() * 500);
  });
  $("morphs").append(b);
}

// ---------- head style, name, reroll, load, boop ----------
// Like shape and color, the head style only changes the buddy on the stage.
const modesEl = $("head-modes");
for (const [key, s] of Object.entries(HEAD_STYLES)) {
  const b = chip("chip", s.label);
  b.dataset.head = key;
  b.addEventListener("click", () => { setHeadStyle(featured.spec, key); render(); });
  modesEl.append(b);
}

nameInput.addEventListener("input", () => { featured.spec.name = nameInput.value.trim().slice(0, 24) || "Buddy"; render(); });

$("reroll").addEventListener("click", () => {
  rollSpecs().forEach((spec, i) => all[i].setSpec(spec));
  render();
});

// Paste a config from Copy config to put that buddy on the stage.
$("config-load").addEventListener("click", () => {
  const status = $("config-status");
  try {
    const config = JSON.parse($("config-input").value);
    featured.setSpec(fromConfig(config));
    status.textContent = `Loaded ${featured.spec.name}.`;
    render();
  } catch {
    status.textContent = "That isn't valid JSON. Paste the text from Copy config.";
  }
});

featured.canvas.addEventListener("click", () => featured.boop());

// ---------- copy config ----------
// The featured buddy's config as JSON; Load a config (or fromConfig in code) rebuilds it.
const copyBtn = $("copy-config");
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const area = Object.assign(document.createElement("textarea"), { value: text });
    area.style.position = "fixed"; area.style.opacity = "0";
    document.body.append(area); area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
copyBtn.addEventListener("click", async () => {
  const ok = await copyText(JSON.stringify(toConfig(featured.spec), null, 2));
  copyBtn.textContent = ok ? "Copied" : "Copy failed";
  copyBtn.dataset.state = ok ? "done" : "";
  clearTimeout(copyBtn.timer);
  copyBtn.timer = setTimeout(() => { copyBtn.textContent = "Copy config"; delete copyBtn.dataset.state; }, 1600);
});

render();
setMood("neutral");
animate(...all);
