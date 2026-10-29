import { TAU, reducedMotion } from "../util.js";
import { ease } from "./shared.js";

// Swims in place: hovers and bobs with a wagging tail, turns around and back (narrowing to a sliver mid-turn,
// the way a fish turns), and blows bubbles from its mouth.
function body(now) {
  const wag = reducedMotion ? 0 : .16 * Math.sin(now * 11);
  const top = Array.from({ length: 22 }, (_, i) => { const a = -i / 21 * Math.PI; return [.2 + Math.cos(a) * .85, Math.sin(a) * .55]; });
  const bottom = Array.from({ length: 22 }, (_, i) => { const a = Math.PI - i / 21 * Math.PI; return [.2 + Math.cos(a) * .85, Math.sin(a) * .55]; });
  const tail = [[-.7, -.08], [-1.15, -.5 + wag], [-.98, wag * .6], [-1.15, .5 + wag], [-.7, .08]];
  return [...top, ...tail, ...bottom.slice(1)];
}

export const fish = {
  label: "Fish",
  outline: body,
  scale: .85,
  eyes: { x: .55, y: -.12, gap: .24, size: .72 },
  nose: [1.05, .05],
  duration: 4.6,
  motion(u, now) {
    const up = ease(u, 0, .15) - ease(u, .88, 1);
    const turn = ease(u, .3, .42) - ease(u, .62, .74);
    return {
      x: .15 * Math.sin(now * 1.3) * up,
      y: (-.35 + .07 * Math.sin(now * 2.2)) * up,
      rot: .08 * Math.sin(now * 2.2 + 1) * up,
      sx: Math.cos(turn * Math.PI),
    };
  },
  // Bubbles only while it's side-on, not mid-turn.
  events: [.12, .22, .48, .55, .82, .9].map(at => ({ at, symbol: "bubble", from: "nose" })),
  detail(ctx) {
    // Gill and a fin.
    ctx.lineCap = "round"; ctx.lineWidth = .04; ctx.strokeStyle = "rgba(22, 24, 30, .5)";
    ctx.beginPath(); ctx.arc(.35, 0, .32, -1.1, 1.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-.1, .2); ctx.quadraticCurveTo(-.3, .5, -.05, .45);
    ctx.fillStyle = "rgba(255, 255, 255, .35)"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(.05, -.28, .22, .08, -.2, 0, TAU);
    ctx.fillStyle = "rgba(255, 255, 255, .3)"; ctx.fill();
  },
};
