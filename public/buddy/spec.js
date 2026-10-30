import { TAU, clamp } from "./util.js";
import { HEADS, headFor } from "./heads.js";
import { EYE_SHAPES } from "./face.js";
import { pickColor, colorName } from "./colors.js";
import { RANDOM_STYLES, HEAD_STYLES } from "./styles/index.js";

// A buddy is defined by a config: plain JSON that Copy config produces and fromConfig() reads.
//
//   {
//     "name": "Mizu",
//     "head": { "shape": "pentagon", "style": "solid", "color": { "h": 184, "s": 45, "l": 65 } },
//     "eyes": { "shape": "pill", "size": 0.25, "spacing": 0.33, "height": 0.05 },
//     "brows": { "length": 0.2, "thickness": 0.05, "gap": 0.1 },
//     "hands": "glove",
//     "personality": { "temper": 1.3, "attention": 0.7, "curiosity": 1.1, "blinkRate": 1.1, "tilt": 0.02 }
//   }
//
// Lengths are in head radii. Anything missing gets a default; numbers are kept in range.
// Internally a buddy uses a flat "spec" built from the config; toConfig() turns it back into JSON.

export const NAMES = [
  "Mizu", "Pip", "Bopi", "Kakai", "Fenru", "Momo", "Doru", "Josa", "Vine", "Borix", "Jozuo", "Rimo", "Pikon", "Mozu",
  "Tock", "Nova", "Biscuit", "Pebble", "Widget", "Sprocket", "Waffle", "Juniper", "Ember", "Orbit", "Moss", "Glim",
  "Noodle", "Tofu", "Puddle", "Zuzu", "Kiko", "Lumi", "Bean", "Nib", "Pogo", "Quill", "Ruru", "Sable", "Tiko", "Umi",
  "Wren", "Yoyo", "Zephyr", "Clove", "Dot", "Fizz", "Gumbo", "Hops", "Inky", "Jelly", "Kip", "Lolo", "Mochi", "Nim",
];

// Slider ranges for the tunable traits, a little wider than what random buddies get.
export const TRAITS = {
  eyeSize: { label: "eye size", min: .16, max: .34, step: .005 },
  spacing: { label: "eye spacing", min: .22, max: .44, step: .005 },
  stiffness: { label: "temper", min: .5, max: 1.8, step: .01 },
  attention: { label: "attention", min: .1, max: 1, step: .01 },
  curiosity: { label: "gaze", min: .3, max: 1.8, step: .01 },
  blinkRate: { label: "blinks", min: .4, max: 2, step: .01 },
};

const num = (v, fallback, min, max) => clamp(typeof v === "number" && isFinite(v) ? v : fallback, min, max);
const pickFrom = (list, rand) => list[Math.floor(rand() * list.length)];

export function fromConfig(config = {}) {
  const head = config.head || {}, eyes = config.eyes || {}, brows = config.brows || {}, mind = config.personality || {};
  const c = head.color || {};
  const shape = HEADS[head.shape] ? head.shape : "round";
  const spec = {
    name: typeof config.name === "string" && config.name.trim() ? config.name.trim().slice(0, 24) : "Buddy",
    headShape: shape, head: headFor(shape, Math.random() * TAU),
    headStyle: HEAD_STYLES[head.style] ? head.style : "solid",
    color: { h: num(c.h, 200, 0, 360), s: num(c.s, 60, 0, 100), l: num(c.l, 65, 20, 92), ...(typeof c.name === "string" ? { name: c.name } : {}) },
    shape: EYE_SHAPES[eyes.shape] ? eyes.shape : "round",
    eyeSize: num(eyes.size, .25, TRAITS.eyeSize.min, TRAITS.eyeSize.max),
    spacing: num(eyes.spacing, .33, TRAITS.spacing.min, TRAITS.spacing.max),
    eyeLat: num(eyes.height, .05, -.1, .2),
    browLen: num(brows.length, .22, .08, .4),
    browThick: num(brows.thickness, .05, .02, .1),
    browGap: num(brows.gap, .1, .03, .2),
    handStyle: config.hands === "mitt" ? "mitt" : "glove",
    stiffness: num(mind.temper, 1, TRAITS.stiffness.min, TRAITS.stiffness.max),
    attention: num(mind.attention, .6, TRAITS.attention.min, TRAITS.attention.max),
    curiosity: num(mind.curiosity, 1, TRAITS.curiosity.min, TRAITS.curiosity.max),
    blinkRate: num(mind.blinkRate, 1, TRAITS.blinkRate.min, TRAITS.blinkRate.max),
    restTilt: num(mind.tilt, 0, -.2, .2),
  };
  applyEyes(spec);
  return spec;
}

const round = (v, places = 3) => Math.round(v * 10 ** places) / 10 ** places;

export function toConfig(spec) {
  const { h, s, l, name } = spec.color;
  return {
    name: spec.name,
    head: { shape: spec.headShape, style: spec.headStyle, color: { h: Math.round(h), s: Math.round(s), l: Math.round(l), ...(name ? { name } : {}) } },
    eyes: { shape: spec.shape, size: round(spec.eyeSize), spacing: round(spec.spacing), height: round(spec.eyeLat) },
    brows: { length: round(spec.browLen), thickness: round(spec.browThick), gap: round(spec.browGap) },
    hands: spec.handStyle,
    personality: { temper: round(spec.stiffness, 2), attention: round(spec.attention, 2), curiosity: round(spec.curiosity, 2), blinkRate: round(spec.blinkRate, 2), tilt: round(spec.restTilt) },
  };
}

// A random buddy. shape and name can be given (the cast uses this to keep shapes and names unique).
export function randomConfig({ shape, name, rand = Math.random } = {}) {
  const lerp = (a, b) => a + (b - a) * rand();
  const { h, s, l } = pickColor(rand);
  return {
    name: name || pickFrom(NAMES, rand),
    head: { shape: shape || pickFrom(Object.keys(HEADS), rand), style: pickFrom(RANDOM_STYLES, rand), color: { h, s, l } },
    eyes: { shape: pickFrom(Object.keys(EYE_SHAPES), rand), size: lerp(.2, .3), spacing: lerp(.27, .4), height: lerp(-.02, .12) },
    brows: { length: lerp(.15, .3), thickness: lerp(.035, .075), gap: lerp(.06, .13) },
    hands: rand() < .5 ? "glove" : "mitt",
    personality: { temper: lerp(.6, 1.6), attention: lerp(.3, .95), curiosity: lerp(.4, 1.5), blinkRate: lerp(.6, 1.6), tilt: lerp(-.1, .1) },
  };
}

// count different names from NAMES, in random order.
export function randomNames(count, rand = Math.random) {
  const pool = [...NAMES];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, count);
}

// Eye width, height and roundness follow from the eye shape and size.
function applyEyes(spec) {
  const [sw, sh, corner] = EYE_SHAPES[spec.shape];
  spec.eyeW = spec.eyeSize * sw; spec.eyeH = spec.eyeSize * sh; spec.corner = corner;
}

// Setters the page's pickers and sliders use.
export function setTrait(spec, key, value) {
  spec[key] = value;
  if (key === "eyeSize") applyEyes(spec);
}

export function setEyeShape(spec, shape) {
  spec.shape = shape;
  applyEyes(spec);
}

export function setHeadShape(spec, key) {
  spec.headShape = key;
  spec.head = headFor(key, spec.head.phase);
}

export function setHeadStyle(spec, key) { spec.headStyle = key; }

export function setColor(spec, color) { spec.color = { ...color }; }

// Plain-language reading of a spec's personality.
export function describe(spec) {
  const temper = spec.stiffness > 1.25 ? "twitchy" : spec.stiffness < .85 ? "calm" : "steady";
  const attn = spec.attention > .75 ? "attentive" : spec.attention < .5 ? "aloof" : "easygoing";
  const blink = spec.blinkRate > 1.25 ? "blinks a lot" : spec.blinkRate < .8 ? "rarely blinks" : "normal blinker";
  const look = spec.curiosity > 1.15 ? "glances around constantly" : spec.curiosity < .7 ? "holds its gaze" : "looks around now and then";
  return { temper, attn, blink, look, colorName: colorName(spec.color) };
}
