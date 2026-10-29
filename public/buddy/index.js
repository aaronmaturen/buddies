// Public entry point for the buddy library.
//
//   import { Buddy, makeSpec, animate } from "./buddy/index.js";
//   const b = new Buddy(canvas, makeSpec("glance"));
//   animate(b);
//   b.setMood("happy");
//   b.emote("love");

export { Buddy } from "./buddy.js";
export { EMOTE_NAMES } from "./emotes.js";
export { HEAD_STYLES } from "./styles/index.js";
export { animate, stopAnimating } from "./loop.js";
export { makeSpec, describe, setHeadShape, setColor, toConfig, fromConfig } from "./spec.js";
export { MOOD_NAMES } from "./moods.js";
export { HEADS, shapeLabel } from "./heads.js";
export { EYE_LABELS } from "./face.js";
export { PALETTE } from "./colors.js";
export { castShapes, spreadColors } from "./variety.js";
export { mulberry32 } from "./random.js";
export { reducedMotion } from "./util.js";
