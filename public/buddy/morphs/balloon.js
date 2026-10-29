import { TAU } from "../util.js";
import { ease } from "./shared.js";

// Rises on a wiggly string, drifts side to side swaying, then sinks back down.
const body = [
  ...Array.from({ length: 44 }, (_, i) => {
    const a = Math.PI / 2 + .16 + i / 43 * (TAU - .32);
    return [Math.cos(a) * .82, -.15 + Math.sin(a) * 1.02];
  }),
  [-.12, .98], [.12, .98],
];

export const balloon = {
  label: "Balloon",
  outline: body,
  scale: .9,
  eyes: { x: 0, y: -.3, gap: .36, size: .95 },
  duration: 4.4,
  motion(u, now) {
    const up = ease(u, 0, .25) - ease(u, .78, 1);
    return {
      x: 1.1 * Math.sin(u * TAU) * up,
      y: -1.05 * up + .06 * Math.sin(now * 2.4),
      rot: (.14 * Math.sin(now * 1.8) - .2 * Math.cos(u * TAU)) * up,
    };
  },
  detail(ctx, { now }) {
    // Glint, then the knot's string trailing down.
    ctx.beginPath(); ctx.ellipse(-.36, -.62, .12, .22, -.5, 0, TAU);
    ctx.fillStyle = "rgba(255, 255, 255, .5)"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 1);
    ctx.bezierCurveTo(.18 * Math.sin(now * 4), 1.35, -.18 * Math.sin(now * 4 + 1), 1.65, .08 * Math.sin(now * 3), 2);
    // Mid gray so the string shows on both light and dark stages.
    ctx.lineWidth = .035; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(150, 156, 172, .95)"; ctx.stroke();
  },
};
