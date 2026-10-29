import { clamp } from "../util.js";
import { INK } from "../heads.js";

// Loops around the stage nose-first, flips to face its direction except mid-loop, speed lines when fast.
export const airplane = {
  label: "Paper airplane",
  outline: [[1.15, .02], [-.25, .2], [-.55, .42], [-.95, .12], [-.6, -.08], [-.9, -.6]],
  scale: .85,
  eyes: { x: .36, y: -.07, gap: .3, size: .9 },
  duration: 4.6,
  path: [[0, 0], [.8, -.35], [1.6, .15], [2.2, -.45], [1.6, -1.05], [1, -.45], [1.6, .15], [2.15, .05],
         [1.95, -.6], [0, -.95], [-1.8, -.7], [-2.05, .05], [-1, .28], [0, 0]],
  loop: [2, 6],
  detail(ctx, { speed }) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // Top wing catches more light, and the creases show the folds.
    ctx.beginPath(); ctx.moveTo(1.15, .02); ctx.lineTo(-.9, -.6); ctx.lineTo(-.6, -.08); ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, .22)"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(1.1, .02); ctx.lineTo(-.6, -.08); ctx.moveTo(1.05, .05); ctx.lineTo(-.25, .2);
    ctx.lineWidth = .035; ctx.strokeStyle = "rgba(22, 24, 30, .55)"; ctx.stroke();
    // Speed lines trail off the tail when it's moving fast.
    if (speed > .4) {
      ctx.globalAlpha *= clamp((speed - .4) / 1.2, 0, .8);
      ctx.lineWidth = .05; ctx.strokeStyle = "rgba(255, 255, 255, .9)";
      ctx.beginPath();
      for (const [y, len] of [[-.35, .7], [.05, 1], [.3, .55]]) { ctx.moveTo(-1.05, y); ctx.lineTo(-1.05 - len, y); }
      ctx.stroke();
      ctx.lineWidth = .02; ctx.strokeStyle = INK; ctx.globalAlpha *= .3; ctx.stroke();
    }
  },
};
