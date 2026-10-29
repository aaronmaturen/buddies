import { clamp } from "../util.js";
import { ellipse } from "./shared.js";

// Bounces across the stage and back, lower each time, squashing on every landing. The stripe rolls; the eyes
// stay upright so it doesn't look dizzy.
const BOUNCES = 6;

export const ball = {
  label: "Bouncy ball",
  outline: ellipse(.82, .82, 48),
  scale: .8,
  eyes: { x: 0, y: -.12, gap: .34, size: .85 },
  duration: 4.4,
  motion(u) {
    const x = 1.7 * Math.sin(u * Math.PI * 2) * (1 - u * .3);
    const b = u * BOUNCES, phase = b - Math.floor(b), height = 1.25 * (1 - u * .8);
    const y = -height * Math.sin(phase * Math.PI);
    // Squash when close to the floor, stretch a little while rising and falling fast.
    const near = clamp(1 - Math.abs(y) / .18, 0, 1);
    const stretch = 1 + .12 * Math.abs(Math.cos(phase * Math.PI)) * (1 - near);
    const sy = (1 - .3 * near) * stretch, sx = (1 + .3 * near) / stretch;
    return { x, y, rot: 0, sx, sy, spin: x * 2.4 };
  },
  detail(ctx, { spin = 0 }) {
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, .82, 0, Math.PI * 2); ctx.clip();
    ctx.rotate(spin);
    ctx.lineWidth = .16; ctx.strokeStyle = "rgba(255, 255, 255, .55)";
    ctx.beginPath(); ctx.ellipse(0, 0, .9, .3, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-.32, -.42, .16, .09, -.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, .6)"; ctx.fill();
  },
};
