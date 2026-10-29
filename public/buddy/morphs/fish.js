import { TAU, reducedMotion } from "../util.js";

// Swims a wavy path nose-first with a wagging tail, blowing bubbles as it goes.
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
  path: [[0, 0], [1, -.5], [2, -.1], [1.2, .3], [0, -.4], [-1.2, -.8], [-2, -.3], [-1.3, .25], [0, 0]],
  events: [.15, .32, .5, .68, .85].map(at => ({ at, symbol: "bubble", from: "nose" })),
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
