import { TAU, clamp, reducedMotion } from "../util.js";

// A cat sitting facing you. Twice it lifts a paw to its mouth and licks it, eyes squeezed happily shut,
// with quick little strokes and a pink tongue. Its tail curls and sways at its side.
const LINE = "rgba(22, 24, 30, .6)";

const outline = [
  [.62, .95], [.68, .6], [.6, .25], [.42, .02],
  [.55, -.2], [.6, -.4], [.55, -.62], [.5, -.72], [.58, -1.15], [.28, -.88],
  [.15, -.92], [0, -.93], [-.15, -.92],
  [-.28, -.88], [-.58, -1.15], [-.5, -.72], [-.55, -.62], [-.6, -.4], [-.55, -.2],
  [-.42, .02], [-.6, .25], [-.68, .6], [-.62, .95], [-.3, 1], [0, 1], [.3, 1],
];

// 0 at rest, 1 with the paw at its mouth, holding there for most of the window.
const lickIn = (u, a, b) => clamp(1.7 * Math.sin(clamp((u - a) / (b - a), 0, 1) * Math.PI), 0, 1);

export const cat = {
  label: "Cat",
  outline,
  scale: .9,
  eyes: { x: 0, y: -.48, gap: .36, size: .78 },
  duration: 4.4,
  motion(u, now) {
    const lick = reducedMotion ? 0 : Math.max(lickIn(u, .25, .5), lickIn(u, .6, .82));
    return { x: 0, y: .02 * Math.sin(now * 1.6), rot: -.09 * lick + .03 * Math.sin(now * 1.3), lick };
  },
  events: [{ at: .27, mood: "happy", for: 1 }, { at: .62, mood: "happy", for: .9 }],
  detail(ctx, { lick = 0, now, colors }) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    // Tail curling up the left side.
    const sway = .08 * Math.sin(now * 2.2);
    ctx.beginPath(); ctx.moveTo(-.55, .9);
    ctx.bezierCurveTo(-1.05, .95, -1.1 + sway, .35, -.82 + sway, .12);
    for (const [w, c] of [[.2, LINE], [.13, colors.lit]]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); }
    // Inner ears and a pink nose.
    ctx.fillStyle = "rgba(255, 150, 170, .55)";
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * .33, -.86); ctx.lineTo(s * .52, -1.06); ctx.lineTo(s * .5, -.76); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(-.06, -.3); ctx.lineTo(.06, -.3); ctx.lineTo(0, -.24); ctx.closePath();
    ctx.fillStyle = "#ff8fa8"; ctx.fill();
    // Whiskers.
    ctx.lineWidth = .02; ctx.strokeStyle = LINE;
    ctx.beginPath();
    for (const s of [-1, 1]) for (const dy of [-.03, .04]) { ctx.moveTo(s * .16, -.25 + dy); ctx.lineTo(s * .52, -.29 + dy * 2.2); }
    ctx.stroke();
    // Tongue, then the paw rising from its lap to its mouth with little licking strokes.
    if (lick > .7) {
      const flick = .5 + .5 * Math.sin(now * 18);
      ctx.beginPath(); ctx.ellipse(.03, -.15 + .03 * flick, .06, .05 + .04 * flick, 0, 0, TAU);
      ctx.fillStyle = "#ff7d97"; ctx.fill();
    }
    const px = .26 - .16 * lick, py = .82 - 1 * lick + .04 * Math.sin(now * 18) * lick;
    ctx.beginPath(); ctx.ellipse(px, py, .17, .12, -.3 * lick, 0, TAU);
    ctx.fillStyle = colors.lit; ctx.fill(); ctx.lineWidth = .035; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.lineWidth = .02;
    ctx.beginPath();
    for (const dx of [-.06, .03]) { ctx.moveTo(px + dx, py - .1); ctx.lineTo(px + dx + .01, py - .03); }
    ctx.stroke();
  },
};
