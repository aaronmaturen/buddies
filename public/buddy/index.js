// Public entry point for the buddy library.
//
//   import { Buddy, fromConfig, randomConfig, animate } from "./buddy/index.js";
//   const b = new Buddy(canvas, fromConfig(randomConfig()));   // or fromConfig(a config from Copy config)
//   animate(b);
//   b.setMood("happy");
//   b.emote("love");
//   b.morphInto("ghost");

export { Buddy } from "./buddy.js";
export { EMOTE_NAMES } from "./emotes.js";
export { MORPHS, MORPH_NAMES } from "./morph.js";
export { HEAD_STYLES } from "./styles/index.js";
export { animate, stopAnimating } from "./loop.js";
export { fromConfig, toConfig, randomConfig, randomNames, NAMES, describe, setHeadShape, setHeadStyle, setColor, TRAITS, setTrait, setEyeShape } from "./spec.js";
export { EYE_SHAPES } from "./face.js";
export { MOOD_NAMES } from "./moods.js";
export { HEADS, shapeLabel } from "./heads.js";
export { EYE_LABELS } from "./face.js";
export { PALETTE } from "./colors.js";
export { castShapes, spreadColors, spreadStyles } from "./variety.js";
export { mulberry32 } from "./random.js";
export { reducedMotion } from "./util.js";
