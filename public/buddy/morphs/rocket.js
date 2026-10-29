import { clamp } from "../util.js";
import { INK } from "../heads.js";
import { ease } from "./shared.js";

// Rumbles on the pad, blasts off out the top of the stage, then comes back down on a landing burn.
export const rocket = {
  label: "Rocket",
  outline: [[0, -1.25], [.32, -.6], [.32, .72], [.64, 1.06], [.18, .92], [-.18, .92], [-.64, 1.06], [-.32, .72], [-.32, -.6]],
  scale: .85,
  eyes: { x: 0, y: -.12, gap: .3, size: .75 },
  duration: 4.2,
  motion(u, now) {
    const rumble = u < .18 ? .035 * Math.sin(now * 70) : 0;
    const climb = ease(u, .18, .42), land = ease(u, .58, 1);
    const y = u < .5 ? -4.2 * climb * climb : -3.6 * (1 - land);
    // Thrust drives the flame: building on the pad, full on the way up, a softer burn coming down.
    const thrust = u < .18 ? .4 + u * 3 : u < .45 ? 1 : u < .58 ? 0 : clamp(.5 + .5 * (1 - land), 0, 1) * (u < .97 ? 1 : 0);
    return { x: rumble, y, rot: .04 * Math.sin(now * 9) * (u < .5 ? 1 : .5), thrust };
  },
  detail(ctx, { thrust, now }) {
    // Fins and a nose cone band in white, then the flame under the nozzle.
    ctx.beginPath(); ctx.moveTo(-.32, -.6); ctx.lineTo(.32, -.6);
    ctx.lineWidth = .05; ctx.strokeStyle = "rgba(255, 255, 255, .7)"; ctx.stroke();
    if (thrust > .02) {
      const flick = 1 + .18 * Math.sin(now * 40) + .1 * Math.sin(now * 23);
      for (const [w, len, color] of [[.3, 1.1, "#ff8a3d"], [.17, .75, "#ffe066"]]) {
        ctx.beginPath(); ctx.moveTo(-w, .95);
        ctx.quadraticCurveTo(0, .95 + len * thrust * flick * 1.4, w, .95); ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(-.3, .95); ctx.quadraticCurveTo(0, .95 + 1.1 * thrust * flick * 1.4, .3, .95);
      ctx.lineWidth = .03; ctx.strokeStyle = INK; ctx.stroke();
    }
  },
};
