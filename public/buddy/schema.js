import { HEADS, shapeLabel } from "./heads.js";
import { HEAD_STYLES } from "./styles/index.js";
import { EYE_SHAPES, EYE_LABELS } from "./face.js";
import { LIMITS } from "./spec.js";

// JSON Schema for a buddy config, built from the library's own tables so new shapes, styles and ranges show
// up automatically. Editors use it for autocomplete and checking; it's standard JSON Schema, so VS Code can
// use it too. Each enum also carries enumDescriptions (a VS Code extension) with friendly names.

const range = (description, [minimum, maximum]) => ({ type: "number", minimum, maximum, description: `${description} (${minimum} to ${maximum})` });
const choice = (description, values, label = v => v) => ({ enum: values, enumDescriptions: values.map(label), description });
const object = (description, properties) => ({ type: "object", description, additionalProperties: false, properties });

export function configSchema() {
  const L = LIMITS;
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Buddy config",
    ...object("One buddy: looks and personality.", {
      name: { type: "string", maxLength: 24, description: "Shown under the buddy, up to 24 characters." },
      head: object("The head's shape, drawing style and color.", {
        shape: choice("Head silhouette.", Object.keys(HEADS), shapeLabel),
        style: choice("How the head is drawn.", Object.keys(HEAD_STYLES), k => HEAD_STYLES[k].label),
        color: object("Head color as hue, saturation and lightness.", {
          h: range("Hue, around the color wheel", L.color.h),
          s: range("Saturation, gray to vivid", L.color.s),
          l: range("Lightness, deep to pastel", L.color.l),
          name: { type: "string", description: "Optional color name, set by palette picks." },
        }),
      }),
      eyes: object("Eye shape, size and placement, in head radii.", {
        shape: choice("Eye shape.", Object.keys(EYE_SHAPES), k => EYE_LABELS[k]),
        size: range("Eye size", L.eyes.size),
        spacing: range("How far apart the eyes sit", L.eyes.spacing),
        height: range("How low on the face the eyes sit", L.eyes.height),
      }),
      brows: object("Eyebrows, in head radii.", {
        length: range("Brow length", L.brows.length),
        thickness: range("Brow thickness", L.brows.thickness),
        gap: range("Space between eye and brow", L.brows.gap),
      }),
      hands: choice("Hands that appear during emotes.", ["glove", "mitt"], v => v === "glove" ? "White cartoon gloves" : "Mittens in the head's color"),
      personality: object("How the buddy moves.", {
        temper: range("How snappy its head turns: calm to twitchy", L.personality.temper),
        attention: range("How often it follows your cursor", L.personality.attention),
        curiosity: range("How often it glances somewhere new", L.personality.curiosity),
        blinkRate: range("How often it blinks", L.personality.blinkRate),
        tilt: range("Resting head tilt, in radians", L.personality.tilt),
      }),
    }),
  };
}
