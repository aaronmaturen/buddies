import { HEADS } from "./heads.js";
import { TONES } from "./colors.js";

// Helpers for showing several buddies together without repeats.

// Shuffled head shapes minus `exclude`, so no two buddies on a page share a shape.
export function castShapes(exclude, rand) {
  const pool = Object.keys(HEADS).filter(k => k !== exclude);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// Spread hues around the color wheel by the golden angle so neighbours never look alike.
// At most one gray, and never the first spec.
export function spreadColors(specs, rand) {
  const start = rand() * 360;
  let grays = 0;
  specs.forEach((sp, i) => {
    const c = { ...sp.color };
    if (c.tone === "gray" && (i === 0 || grays++ >= 1)) {
      const T = TONES.candy;
      c.tone = "candy"; c.s = Math.round((T.s[0] + T.s[1]) / 2); c.l = Math.round((T.l[0] + T.l[1]) / 2);
    }
    if (c.tone !== "gray") c.h = Math.round((start + i * 137.5) % 360);
    sp.color = sp.seedColor = c;
  });
}
