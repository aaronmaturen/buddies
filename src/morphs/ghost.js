import { TAU, reducedMotion } from "../util.js";
import { ease } from "./shared.js";

// A sheet ghost with a rippling hem that floats side to side, leaning into its drift, and says "Boo!".
function sheet(now) {
  const top = Array.from({ length: 30 }, (_, i) => {
    const a = Math.PI + i / 29 * Math.PI;
    return [Math.cos(a) * .82, -.2 + Math.sin(a) * .85];
  });
  const hem = Array.from({ length: 33 }, (_, i) => {
    const x = .9 - i / 32 * 1.8;
    const wave = reducedMotion ? 0 : now * 6;
    return [x, .78 + .1 * Math.sin(x * 9 + wave)];
  });
  return [...top, [.9, .55], ...hem, [-.9, .55]];
}

export const ghost = {
  label: "Ghost",
  outline: sheet,
  scale: .9,
  eyes: { x: 0, y: -.32, gap: .36, size: 1 },
  duration: 4,
  motion(u, now) {
    const up = ease(u, 0, .2) - ease(u, .82, 1);
    const drift = Math.sin(u * TAU);
    return { x: 1.25 * drift * up, y: (-.5 + .12 * Math.sin(now * 3)) * up, rot: -.18 * Math.cos(u * TAU) * up };
  },
  events: [{ at: .5, symbol: "boo" }],
  detail(ctx) {
    ctx.beginPath(); ctx.ellipse(-.38, -.62, .14, .22, -.5, 0, TAU);
    ctx.fillStyle = "rgba(255, 255, 255, .35)"; ctx.fill();
  },
};
