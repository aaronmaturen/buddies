import { TAU, reducedMotion } from "../util.js";

// A dog sitting facing you, floppy ears down, panting with its tongue out and wagging its tail so hard its
// whole body wiggles along.
const LINE = "rgba(22, 24, 30, .6)";

const outline = [
  [.68, .95], [.72, .55], [.55, .2], [.78, 0], [.86, -.3], [.62, -.62],
  [.4, -.78], [.15, -.85], [-.15, -.85], [-.4, -.78],
  [-.62, -.62], [-.86, -.3], [-.78, 0], [-.55, .2], [-.72, .55], [-.68, .95],
  [-.3, 1], [0, 1], [.3, 1],
];

export const dog = {
  label: "Dog",
  outline,
  scale: .9,
  eyes: { x: 0, y: -.5, gap: .4, size: .8 },
  duration: 4.4,
  motion(u, now) {
    const wag = reducedMotion ? 0 : Math.sin(now * 16);
    return { x: .02 * wag, y: -.03 * Math.abs(Math.sin(now * 8)), rot: .05 * wag, wag };
  },
  events: [{ at: 0, mood: "excited", for: 4.6 }],
  behind(ctx, { wag = 0, colors }) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // Tail wagging up off the right side, from behind the body.
    ctx.beginPath(); ctx.moveTo(.3, .85);
    ctx.quadraticCurveTo(1.05, .8, 1 + .2 * wag, .3 + .1 * Math.abs(wag));
    for (const [w, c] of [[.2, LINE], [.13, colors.lit]]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
  },
  detail(ctx, { now, colors }) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // Floppy ears in the darker tone.
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * .45, -.66); ctx.quadraticCurveTo(s * .95, -.45, s * .8, .02);
      ctx.quadraticCurveTo(s * .6, .06, s * .5, -.3); ctx.closePath();
      ctx.fillStyle = colors.shade; ctx.fill(); ctx.lineWidth = .03; ctx.strokeStyle = LINE; ctx.stroke();
    }
    // Muzzle, nose, and a panting tongue.
    ctx.beginPath(); ctx.ellipse(0, -.17, .3, .2, 0, 0, TAU);
    ctx.fillStyle = colors.glow; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -.27, .09, .06, 0, 0, TAU);
    ctx.fillStyle = "#1d1f26"; ctx.fill();
    const pant = reducedMotion ? .5 : .5 + .5 * Math.sin(now * 12);
    ctx.beginPath(); ctx.ellipse(.03, -.02 + .03 * pant, .08, .1 + .05 * pant, .1, 0, TAU);
    ctx.fillStyle = "#ff7d97"; ctx.fill(); ctx.lineWidth = .02; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-.12, -.12); ctx.quadraticCurveTo(0, -.06, .12, -.12);
    ctx.lineWidth = .025; ctx.stroke();
  },
};
