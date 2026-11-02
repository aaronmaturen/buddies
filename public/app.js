import {
  Buddy, animate, fromConfig, toConfig, randomConfig, randomNames, describe, setHeadShape, setHeadStyle, setColor,
  MOOD_NAMES, EMOTE_NAMES, MORPHS, MORPH_NAMES, HEAD_STYLES, HEADS, shapeLabel, PALETTE,
  castShapes, spreadColors, spreadStyles, reducedMotion, configSchema, Leader, words,
} from "./buddies.js";
import { createConfigEditor } from "./config-editor.js";
import { createTraits } from "./traits.js";
import { copyText } from "./copy-text.js";

const CAST_SIZE = 12;
const $ = id => document.getElementById(id);

const nameInput = $("buddy-name"), moodsEl = $("moods"), cycleEl = $("cycle");
const shapesEl = $("shapes"), swatchesEl = $("swatches"), castEl = $("cast");
let mood = "neutral", leading = false;

// ---------- viewer ----------
// The viewer shows the whole cast or the stage buddy: a card opens the stage, the grid button goes back. Look and
// Buddy controls only change the stage buddy, so using one opens the stage too. The last view is remembered here.
function setView(view) {
  $("stage").hidden = view !== "stage";
  castEl.hidden = view !== "cast";
  try { localStorage.setItem("buddies:view", view); } catch {}
}
for (const id of ["sec-look", "sec-buddy"]) {
  for (const type of ["click", "input"]) {
    $(id).addEventListener(type, e => { if (e.target.closest("button:not(#reroll), input, textarea, summary, .cm-editor")) setView("stage"); });
  }
}
try { if (localStorage.getItem("buddies:view") === "cast") setView("cast"); } catch {}

// ---------- buddies ----------
// The cast is random configs: names from the list, every head shape different, colors spread around the
// wheel and styles dealt out so neighbours differ. The stage shows one of them: the stage buddy and that
// card share a spec, so changes to one show on the other.
function rollSpecs() {
  const names = randomNames(CAST_SIZE);
  const first = fromConfig(randomConfig({ name: names[0] }));
  const shapes = castShapes(first.headShape, Math.random);
  const specs = [first, ...names.slice(1).map((name, i) => fromConfig(randomConfig({ name, shape: shapes[i] })))];
  spreadColors(specs, Math.random);
  spreadStyles(specs, Math.random);
  return specs;
}

const startSpecs = rollSpecs();
const featured = new Buddy($("featured"), startSpecs[0], { scale: .27 });
const cast = startSpecs.map(spec => {
  const btn = document.createElement("button");
  btn.className = "member";
  btn.innerHTML = `<canvas></canvas><strong></strong>`;
  castEl.append(btn);
  const b = new Buddy(btn.querySelector("canvas"), spec);
  b.card = btn;
  btn.addEventListener("click", e => {
    onStage = b;
    featured.setSpec(b.spec);
    render();
    if (leading) return openLeaderMenu(btn, e);
    setView("stage");
    featured.canvas.focus();
  });
  return b;
});
const all = [featured, ...cast];
let onStage = cast[0];
// The button hides itself, so focus moves to the card that was on the stage.
$("show-cast").addEventListener("click", () => {
  setView("cast");
  onStage.card.focus();
});

// ---------- panel ----------
function render() {
  const sp = featured.spec;
  $("stage-name").textContent = sp.name;
  labelStage();
  renderTraits();
  for (const b of cast) {
    const cd = describe(b.spec);
    b.card.querySelector("strong").textContent = b.spec.name;
    b.card.title = `${b.spec.name}: ${shapeLabel(b.spec.headShape).toLowerCase()}, ${cd.temper}, ${cd.attn}`;
    b.card.setAttribute("aria-label", b.spec.name);
    b.card.setAttribute("aria-pressed", String(b === onStage));
  }
  if (document.activeElement !== nameInput) nameInput.value = sp.name;
  for (const el of swatchesEl.children) el.setAttribute("aria-pressed", String(el.dataset.color === sp.color.name));
  for (const el of shapesEl.children) el.setAttribute("aria-pressed", String(el.dataset.shape === sp.headShape));
  for (const el of $("head-modes").children) el.setAttribute("aria-pressed", String(el.dataset.head === sp.headStyle));
}

function chip(className, text) {
  const b = document.createElement("button");
  b.className = className; b.textContent = text;
  return b;
}

const renderTraits = createTraits($("trait-sliders"), $("eye-shapes"), () => featured.spec, chip);

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
  labelStage();
}

for (const m of MOOD_NAMES) {
  const b = chip("chip", m[0].toUpperCase() + m.slice(1));
  b.dataset.mood = m;
  b.addEventListener("click", () => { cycleEl.checked = false; setMood(m); });
  moodsEl.append(b);
}

cycleEl.checked = !reducedMotion;
// Holding still also stops the mood cycle: both are motion nobody asked for.
$("hold-still").addEventListener("change", e => {
  for (const b of all) b.still = e.target.checked;
  if (e.target.checked) cycleEl.checked = false;
});
setInterval(() => {
  if (cycleEl.checked) setMood(MOOD_NAMES[(MOOD_NAMES.indexOf(mood) + 1) % MOOD_NAMES.length], true);
}, 3400);

// ---------- emotes ----------
// The stage buddy and its card react right away; the rest follow a beat later, each on its own timing.
function everyone(act, wait, spread) {
  act(featured);
  for (const c of cast) setTimeout(() => act(c), c === onStage ? 0 : wait + Math.random() * spread);
}

for (const name of EMOTE_NAMES) {
  const b = chip("chip", words(name));
  b.addEventListener("click", () => {
    everyone(b => b.emote(name), 120, 350);
  });
  $("emotes").append(b);
}

// ---------- morphs ----------
for (const name of MORPH_NAMES) {
  const b = chip("chip", MORPHS[name].label);
  b.addEventListener("click", () => {
    everyone(b => b.morphInto(name), 150, 500);
  });
  $("morphs").append(b);
}

// ---------- away ----------
// Everyone vanishes and stays gone until Come back (or a click on the empty stage).
const vanishBtn = $("vanish");
let away = false;
function setAway(on) {
  away = on;
  vanishBtn.textContent = on ? "Come back" : "Disappear";
  labelStage();
  everyone(b => on ? b.vanish() : b.appear(), 120, 450);
}
vanishBtn.addEventListener("click", () => setAway(!away));

// ---------- leader ----------
// In leader mode the Emotes and Mood buttons give way to a pie menu on whichever buddy is clicked. That buddy
// leads and the rest follow; the page only listens for the commands the menu fires.
const leader = new Leader();
const leaderBtn = $("leader-mode");
leader.addEventListener("command", e => {
  const { kind, name } = e.detail;
  if (kind === "emote") everyone(b => b.emote(name), 120, 350);
  else if (kind === "morph") everyone(b => b.morphInto(name), 150, 500);
  else if (kind === "mood") setMood(name);
  else if (kind === "away") setAway(name === "vanish");
});

function openLeaderMenu(el, e) {
  // A keyboard press has no pointer position, so the menu opens on the buddy.
  const r = el.getBoundingClientRect();
  const fromKeyboard = !e || e.detail === 0;
  leader.open(fromKeyboard ? r.left + r.width / 2 : e.clientX, fromKeyboard ? r.top + r.height / 2 : e.clientY, { away });
}

leaderBtn.addEventListener("click", () => {
  leading = !leading;
  leaderBtn.setAttribute("aria-pressed", String(leading));
  leaderBtn.textContent = leading ? "Stop leading" : "Lead the cast";
  for (const el of document.querySelectorAll("[data-buttons-only]")) el.hidden = leading;
  $("leader-hint").hidden = !leading;
  if (leading) {
    cycleEl.checked = false;
    setView("cast");
  }
  labelStage();
});

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
  rollSpecs().forEach((spec, i) => cast[i].setSpec(spec));
  featured.setSpec(onStage.spec);
  render();
});

// Opening the box fills it with the stage buddy's config and swaps in a schema-aware editor, if it can load.
let configEditor = null;
const configText = () => configEditor ? configEditor.value : $("config-input").value;

function loadConfig() {
  const status = $("config-status");
  try {
    onStage.setSpec(fromConfig(JSON.parse(configText())));
    featured.setSpec(onStage.spec);
    status.textContent = `Loaded ${featured.spec.name}.`;
    render();
  } catch {
    status.textContent = "That isn't valid JSON yet. The editor marks where.";
  }
}
$("config-load").addEventListener("click", loadConfig);

$("load-config").addEventListener("toggle", async e => {
  if (!e.target.open) return;
  const area = $("config-input");
  if (!configText().trim()) {
    const json = JSON.stringify(toConfig(featured.spec), null, 2);
    if (configEditor) configEditor.value = json; else area.value = json;
  }
  if (configEditor || area.dataset.loading) return;
  area.dataset.loading = "1";
  $("config-status").textContent = "Loading editor…";
  try {
    configEditor = await createConfigEditor(area, configSchema(), { onSubmit: loadConfig });
    $("config-status").textContent = "Type for suggestions; hover a key for help. ⌘↵ loads.";
  } catch {
    $("config-status").textContent = "";
  }
});

// The stage buddy is a button: Enter or Space boops it, or brings everyone back while they're away.
function labelStage() {
  const name = featured.spec.name;
  featured.canvas.setAttribute("aria-label", leading ? `Open ${name}'s leader menu` : away ? "Bring everyone back" : `Boop ${name} (${mood})`);
}
const pressStage = e => leading ? openLeaderMenu(featured.canvas, e) : away ? setAway(false) : featured.boop();
featured.canvas.addEventListener("click", pressStage);
featured.canvas.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  pressStage(null);
});

// ---------- copy config ----------
// The featured buddy's config as JSON; Load a config (or fromConfig in code) rebuilds it.
const copyBtn = $("copy-config");
copyBtn.addEventListener("click", async () => {
  const ok = await copyText(JSON.stringify(toConfig(featured.spec), null, 2));
  $("copy-status").textContent = ok ? `${featured.spec.name}'s config copied` : "Copy failed";
  copyBtn.dataset.state = ok ? "done" : "failed";
  clearTimeout(copyBtn.timer);
  copyBtn.timer = setTimeout(() => { delete copyBtn.dataset.state; }, 1600);
});

render();
setMood("neutral");
animate(...all);
