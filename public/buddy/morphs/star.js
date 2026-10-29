import { TAU } from "../util.js";
import { ease } from "./shared.js";

// Hops up, spins and twinkles, shoots off the right edge, then streaks back in from the left to land.
const points = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i / 10 * TAU, r = i % 2 ? .46 : 1.05;
  return [Math.cos(a) * r, Math.sin(a) * r];
});

export const star = {
  label: "Star",
  outline: points,
  scale: .85,
  eyes: { x: 0, y: .05, gap: .3, size: .75 },
  duration: 4.2,
  motion(u, now) {
    const hop = ease(u, 0, .15) - ease(u, .85, 1);
    const out = ease(u, .45, .6), back = ease(u, .62, .85);
    // Off the right edge, then in from the left: x jumps from far right to far left while out of view.
    const x = u < .61 ? 4 * out * out : -4 * (1 - back);
    // Three full turns over the act, so it lands level.
    const spin = ease(u, .08, .92) * TAU * 3;
    return { x, y: -.7 * hop, rot: spin, speed: u > .45 && u < .85 ? 2 : 0 };
  },
  events: [.12, .22, .32, .4, .9].map(at => ({ at, symbol: "sparkle" })),
  detail(ctx, { speed }) {
    ctx.beginPath(); ctx.ellipse(-.22, -.35, .1, .18, -.4, 0, TAU);
    ctx.fillStyle = "rgba(255, 255, 255, .5)"; ctx.fill();
    if (speed > 1) {
      ctx.lineCap = "round"; ctx.lineWidth = .06; ctx.strokeStyle = "rgba(255, 224, 102, .8)";
      ctx.beginPath();
      for (const y of [-.4, 0, .4]) { ctx.moveTo(-1.1, y); ctx.lineTo(-2.2, y); }
      ctx.stroke();
    }
  },
};
