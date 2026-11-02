import { HEADS } from "./heads.js";
import { TONES } from "./colors.js";
import { RANDOM_STYLES } from "./styles/index.js";

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
    const gray = c.s < 15;
    if (gray && (i === 0 || grays++ >= 1)) {
      const T = TONES.candy;
      c.s = Math.round((T.s[0] + T.s[1]) / 2); c.l = Math.round((T.l[0] + T.l[1]) / 2);
    }
    if (c.s >= 15) c.h = Math.round((start + i * 137.5) % 360);
    delete c.name;
    sp.color = c;
  });
}

// Deal head styles out of shuffled rounds of every seeded style, so each appears about equally and
// neighbours rarely match.
export function spreadStyles(specs, rand) {
  let deck = [];
  specs.forEach((sp, i) => {
    if (!deck.length) {
      deck = [...RANDOM_STYLES];
      for (let j = deck.length - 1; j > 0; j--) { const k = Math.floor(rand() * (j + 1)); [deck[j], deck[k]] = [deck[k], deck[j]]; }
      if (i && deck[0] === specs[i - 1].headStyle) deck.push(deck.shift());
    }
    sp.headStyle = deck.shift();
  });
}
