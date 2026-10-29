import { TAU } from "./util.js";
import { hashStr, mulberry32 } from "./random.js";
import { HEADS, headFor } from "./heads.js";
import { EYE_SHAPES } from "./face.js";
import { pickColor, colorName } from "./colors.js";
import { SEEDED_STYLES, HEAD_STYLES } from "./styles/index.js";

const SYL = ["bo", "pi", "zu", "ka", "mo", "ri", "ne", "lu", "ta", "vi", "do", "sa", "fen", "ko", "mi", "ru", "jo", "wa"];

// A spec is everything that makes one buddy that buddy: looks and personality, all from the seed.
// The order of r() calls is part of the format: reordering or removing one changes every existing seed.
export function makeSpec(seed, forcedShape) {
  const r = mulberry32(hashStr(seed));
  const pick = a => a[Math.floor(r() * a.length)];
  const lerp = (a, b) => a + (b - a) * r();

  const shape = pick(Object.keys(EYE_SHAPES));
  const [sw, sh, corner] = EYE_SHAPES[shape];
  const size = lerp(.2, .3);
  const raw = pick(SYL) + pick(SYL) + (r() < .4 ? pick(["x", "n", "p", "o", "i"]) : "");
  const pickedShape = pick(Object.keys(HEADS));
  const headShape = forcedShape || pickedShape;
  const color = pickColor(r);
  const phase = r() * TAU;
  r(); // retired hue draw, kept so existing seeds keep their looks

  const spec = {
    seed, name: raw[0].toUpperCase() + raw.slice(1),
    headShape, seedHeadShape: headShape, headKey: "seed", head: headFor(headShape, phase),
    color, seedColor: color, colorKey: "seed",
    shape, corner, eyeW: size * sw, eyeH: size * sh,
    spacing: lerp(.27, .4),
    eyeLat: lerp(-.02, .12),
    browLen: lerp(.15, .3),
    browThick: lerp(.035, .075),
    browGap: lerp(.06, .13),
    stiffness: lerp(.6, 1.6),
    blinkRate: lerp(.6, 1.6),
    curiosity: lerp(.4, 1.5),
    attention: lerp(.3, .95),
    restTilt: lerp(-.1, .1),
    // New draws go last so older seeds keep everything above.
    handStyle: r() < .5 ? "glove" : "mitt",
    headStyle: pick(SEEDED_STYLES),
  };
  spec.seedHeadStyle = spec.headStyle; spec.headStyleKey = "seed";
  return spec;
}

// Plain-language reading of a spec's personality.
export function describe(spec) {
  const temper = spec.stiffness > 1.25 ? "twitchy" : spec.stiffness < .85 ? "calm" : "steady";
  const attn = spec.attention > .75 ? "attentive" : spec.attention < .5 ? "aloof" : "easygoing";
  const blink = spec.blinkRate > 1.25 ? "blinks a lot" : spec.blinkRate < .8 ? "rarely blinks" : "normal blinker";
  const look = spec.curiosity > 1.15 ? "glances around constantly" : spec.curiosity < .7 ? "holds its gaze" : "looks around now and then";
  return { temper, attn, blink, look, colorName: colorName(spec.color) };
}

// Overrides that a chooser can apply on top of the seed; "seed" restores the seeded value.
export function setHeadShape(spec, key) {
  spec.headKey = key;
  spec.headShape = key === "seed" ? spec.seedHeadShape : key;
  spec.head = headFor(spec.headShape, spec.head.phase);
}

export function setHeadStyle(spec, key) {
  spec.headStyleKey = key;
  spec.headStyle = key === "seed" ? spec.seedHeadStyle : key;
}

export function setColor(spec, key, palette) {
  spec.colorKey = key;
  spec.color = key === "seed" ? spec.seedColor : { ...palette[key], name: key };
}

// A small, shareable description of a buddy. The seed rebuilds everything else; head shape and color are
// stored too because pickers and the cast's color spreading can change them away from the seed's own.
export function toConfig(spec) {
  return { seed: spec.seed, name: spec.name, headShape: spec.headShape, color: { ...spec.color }, headStyle: spec.headStyle };
}

export function fromConfig(config) {
  const spec = makeSpec(config.seed, config.headShape);
  if (config.color) spec.color = spec.seedColor = { ...config.color };
  if (HEAD_STYLES[config.headStyle]) spec.headStyle = spec.seedHeadStyle = config.headStyle;
  return spec;
}
