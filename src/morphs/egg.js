import { TAU, reducedMotion } from "../util.js";

// The egg a buddy hatches from: held until hatching, so it sits still and rocks now and then.
const shell = Array.from({ length: 48 }, (_, i) => {
  const a = i / 48 * TAU, s = Math.sin(a);
  return [Math.cos(a) * .72 * (1 - .14 * s), -.08 + s * .95];
});

export const egg = {
  label: "Egg",
  held: true,
  outline: shell,
  scale: .85,
  eyes: null,
  duration: 1,
  // A few quick rocks every few seconds, as if something inside is moving.
  motion(u, now) {
    const rocking = reducedMotion ? 0 : Math.max(0, Math.sin(now * 1.3) - .75) * 4;
    return { x: 0, y: 0, rot: .14 * Math.sin(now * 14) * rocking };
  },
};
