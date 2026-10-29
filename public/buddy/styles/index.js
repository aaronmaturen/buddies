import { INK } from "../heads.js";
import { theme } from "../theme.js";
import { LIGHT_INK } from "./common.js";
import { cel, ghost } from "./cel.js";
import { sticker } from "./sticker.js";
import { sketch, PENCIL } from "./sketch.js";
import { jelly } from "./jelly.js";
import { neon, neonColors } from "./neon.js";
import { inked, PAPER } from "./inked.js";
import { comic } from "./comic.js";
import { clay } from "./clay.js";
import { fuzzy } from "./fuzzy.js";
import { hologram, HOLO } from "./hologram.js";
import { paper } from "./paper.js";
import { chalk, chalkColor, SLATE } from "./chalk.js";

// Head styles. Each has:
//   label   button text
//   head    draws the head (ctx, m, { cx, cy, R, head, colors, color, roll, now, px }), or null for none
//   face    colors for the face given the head colors and spec color:
//           eye (outline), brow, lid (sleepy lid fill), and optionally eyeFill, pupil, glow (blurred halo)
//   pixel   draw the whole buddy small and scale it up blocky
const onHead = c => ({ eye: INK, brow: c.deep ? LIGHT_INK : INK, lid: c.lit });
const onPage = () => ({ eye: theme.fg, brow: theme.fg, lid: theme.surface });

// Styles a buddy can be seeded with: every one that draws a head. Invisible and ghost would read as missing in a grid.
export const SEEDED_STYLES = ["solid", "sticker", "sketch", "jelly", "pixel", "neon", "inked", "comic", "clay", "fuzzy", "hologram", "paper", "chalk"];

export const HEAD_STYLES = {
  none: { label: "Invisible", head: null, face: onPage },
  ghost: { label: "Ghost", head: ghost, face: onPage },
  solid: { label: "Cel-shaded", head: cel, face: onHead },
  sticker: { label: "Sticker", head: sticker, face: onHead },
  sketch: { label: "Sketch", head: sketch, face: c => ({ eye: PENCIL, brow: PENCIL, lid: c.lit }) },
  jelly: { label: "Jelly", head: jelly, face: onHead },
  pixel: { label: "Pixel", head: cel, face: onHead, pixel: true },
  neon: { label: "Neon", head: neon, face: (c, color) => {
    const n = neonColors(color);
    return { eye: n.tube, brow: n.tube, lid: n.body, eyeFill: n.body, pupil: n.core, glow: n.tube };
  } },
  inked: { label: "Inked", head: inked, face: () => ({ eye: INK, brow: INK, lid: PAPER }) },
  comic: { label: "Comic", head: comic, face: onHead },
  clay: { label: "Clay", head: clay, face: onHead },
  fuzzy: { label: "Fuzzy", head: fuzzy, face: onHead },
  hologram: { label: "Hologram", head: hologram,
    face: () => ({ eye: HOLO.line, brow: HOLO.line, lid: HOLO.fill, eyeFill: HOLO.fill, pupil: HOLO.core, glow: HOLO.line }) },
  paper: { label: "Paper", head: paper, face: onHead },
  chalk: { label: "Chalk", head: chalk, face: (c, color) => {
    const tone = chalkColor(color);
    return { eye: tone, brow: tone, lid: SLATE, eyeFill: SLATE, pupil: tone };
  } },
};
