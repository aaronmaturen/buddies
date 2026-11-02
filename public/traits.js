import { TRAITS, EYE_SHAPES, EYE_LABELS, describe, setTrait, setEyeShape } from "./buddies.js";

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

// Builds the eye shape buttons and trait sliders. getSpec gives the buddy they change; the returned function
// shows that buddy's values.
export function createTraits(sliders, eyeShapes, getSpec, chip) {
  const rows = {};
  const show = () => {
    const sp = getSpec();
    for (const [key, { input, out }] of Object.entries(rows)) {
      if (document.activeElement !== input) input.value = sp[key];
      out.textContent = readout(key, sp);
    }
    for (const el of eyeShapes.children) el.setAttribute("aria-pressed", String(el.dataset.eye === sp.shape));
  };

  for (const [key, T] of Object.entries(TRAITS)) {
    const row = document.createElement("div");
    row.className = "trait";
    row.innerHTML = `<label for="trait-${key}">${T.label}</label><input type="range" id="trait-${key}" min="${T.min}" max="${T.max}" step="${T.step}"><output for="trait-${key}"></output>`;
    const input = row.querySelector("input");
    input.addEventListener("input", () => { setTrait(getSpec(), key, +input.value); show(); });
    rows[key] = { input, out: row.querySelector("output") };
    sliders.append(row);
  }
  for (const key of Object.keys(EYE_SHAPES)) {
    const b = chip("chip", EYE_LABELS[key]);
    b.dataset.eye = key;
    b.addEventListener("click", () => { setEyeShape(getSpec(), key); show(); });
    eyeShapes.append(b);
  }
  return show;
}
