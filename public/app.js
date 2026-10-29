import {
  Buddy, animate, makeSpec, describe, setHeadShape, setHeadStyle, setColor, toConfig,
  MOOD_NAMES, EMOTE_NAMES, HEAD_STYLES, HEADS, shapeLabel, EYE_LABELS, PALETTE,
  castShapes, spreadColors, spreadStyles, mulberry32, reducedMotion,
} from "./buddy/index.js";

const SEEDS = ["glance", "pip", "moss", "orbit", "juniper", "tock", "ember", "biscuit", "nova", "pebble", "widget", "sprocket", "waffle"];
const WORDS = ["fern", "pixel", "dune", "otter", "kite", "nimbus", "pebble", "sprout", "quill", "comet", "maple", "zinc"];
const $ = id => document.getElementById(id);

const seedInput = $("seed"), traitsEl = $("traits"), moodsEl = $("moods"), cycleEl = $("cycle");
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
const featured = new Buddy($("featured"), makeSpec(SEEDS[0]), { scale: .27 });
const startShapes = castShapes(featured.spec.headShape, mulberry32(7));
const cast = SEEDS.slice(1).map((seed, i) => {
  const btn = document.createElement("button");
  btn.className = "member";
  btn.innerHTML = `<canvas></canvas><strong></strong><small></small>`;
  castEl.append(btn);
  const b = new Buddy(btn.querySelector("canvas"), makeSpec(seed, startShapes[i]));
  b.card = btn;
  btn.addEventListener("click", () => {
    const a = featured.spec; featured.setSpec(b.spec); b.setSpec(a);
    seedInput.value = featured.spec.seed;
    render();
  });
  return b;
});
const all = [featured, ...cast];
spreadColors(all.map(b => b.spec), mulberry32(11));
spreadStyles(all.map(b => b.spec), mulberry32(13));

// ---------- panel ----------
function render() {
  const sp = featured.spec, d = describe(sp);
  $("stage-name").textContent = sp.name;
  const rows = [
    ["head", `${shapeLabel(sp.headShape).toLowerCase()}, ${d.colorName}`],
    ["style", HEAD_STYLES[featured.styleKey].label.toLowerCase()],
    ["eyes", EYE_LABELS[sp.shape]],
    ["temper", `${d.temper} · spring ×${sp.stiffness.toFixed(2)}`],
    ["attention", `${d.attn} · ${Math.round(sp.attention * 100)}% follows you`],
    ["gaze", d.look],
    ["blinks", `${d.blink} · ×${sp.blinkRate.toFixed(2)}`],
  ];
  traitsEl.replaceChildren(...rows.flatMap(([k, v]) => {
    const dt = document.createElement("dt"); dt.textContent = k;
    const dd = document.createElement("dd"); dd.textContent = v;
    return [dt, dd];
  }));
  for (const b of cast) {
    const cd = describe(b.spec);
    b.card.querySelector("strong").textContent = b.spec.name;
    b.card.querySelector("small").textContent = `${shapeLabel(b.spec.headShape).toLowerCase()}, ${cd.temper}, ${cd.attn}`;
    b.card.setAttribute("aria-label", `Bring ${b.spec.name} forward`);
  }
  for (const el of swatchesEl.children) el.setAttribute("aria-pressed", String(el.dataset.color === sp.colorKey));
  for (const el of shapesEl.children) el.setAttribute("aria-pressed", String(el.dataset.shape === sp.headKey));
  for (const el of $("head-modes").children) el.setAttribute("aria-pressed", String(el.dataset.head === sp.headStyleKey));
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
  setColor(featured.spec, b.dataset.color, PALETTE);
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

// ---------- head mode, seed, reroll, boop ----------
// Like shape and color, the head style only changes the buddy on the stage; "From seed" restores its own.
const modesEl = $("head-modes");
for (const [key, label] of [["seed", "From seed"], ...Object.entries(HEAD_STYLES).map(([k, s]) => [k, s.label])]) {
  const b = chip("chip", label);
  b.dataset.head = key;
  b.addEventListener("click", () => { setHeadStyle(featured.spec, key); render(); });
  modesEl.append(b);
}

seedInput.addEventListener("input", () => { featured.setSpec(makeSpec(seedInput.value.trim() || "blank")); render(); });

$("reroll").addEventListener("click", () => {
  const fresh = () => `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${Math.floor(Math.random() * 900 + 100)}`;
  featured.setSpec(makeSpec(fresh()));
  const shapes = castShapes(featured.spec.headShape, Math.random);
  cast.forEach((b, i) => b.setSpec(makeSpec(fresh(), shapes[i])));
  spreadColors(all.map(b => b.spec), Math.random);
  spreadStyles(all.map(b => b.spec), Math.random);
  seedInput.value = featured.spec.seed;
  render();
});

featured.canvas.addEventListener("click", () => featured.boop());

// ---------- copy config ----------
// The featured buddy as JSON: enough for fromConfig() to rebuild it, plus how it's shown right now.
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
  const config = { ...toConfig(featured.spec), headStyle: featured.styleKey, mood };
  const ok = await copyText(JSON.stringify(config, null, 2));
  copyBtn.textContent = ok ? "Copied" : "Copy failed";
  copyBtn.dataset.state = ok ? "done" : "";
  clearTimeout(copyBtn.timer);
  copyBtn.timer = setTimeout(() => { copyBtn.textContent = "Copy config"; delete copyBtn.dataset.state; }, 1600);
});

render();
setMood("neutral");
animate(...all);
