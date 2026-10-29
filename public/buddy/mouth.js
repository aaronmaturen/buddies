import { clamp } from "./util.js";

// Mouths only appear during emotes. Like the eyes, a mouth is one shape whose numbers morph between presets:
// w width, open how far the lips part, smile corners up (negative frowns), round pulls it into an "o",
// wave makes a nervous squiggle, tongue sticks one out. All in units of head radius.
export const MOUTH_REST = { w: .14, open: 0, smile: 0, round: 0, wave: 0, tongue: 0 };

export const MOUTHS = {
  smile: { w: .28, smile: .7 },
  grin: { w: .34, open: .9, smile: .7 },
  o: { w: .17, open: .85, round: 1 },
  small: { w: .13, open: .4, round: .8 },
  flat: { w: .22, smile: -.05 },
  frown: { w: .25, smile: -.7 },
  wavy: { w: .28, smile: -.1, wave: 1 },
  tongue: { w: .25, open: .2, smile: .45, tongue: 1 },
};
for (const k in MOUTHS) MOUTHS[k] = { ...MOUTH_REST, ...MOUTHS[k] };

const MOUTH_FILL = "#3b1f27";
const TONGUE = "#f07a90";
const LINE = .032;

// Drawn in the mouth's local frame, already placed on the head. show (0..1) pops it in and out.
export function drawMouth(ctx, { m, show, ink }) {
  if (show < .02) return;
  const W = m.w * (1 - m.round * .45) * (.55 + .45 * show);
  const half = W / 2;
  const arc = x => Math.sqrt(Math.max(0, 1 - (x / half) ** 2));
  const center = x => {
    const u = x / half;
    return m.smile * .06 * (1 - u * u) + m.wave * .016 * Math.sin(u * Math.PI * 3);
  };
  const gap = m.open * .15 * show;
  const topK = .25 + .25 * m.round, botK = .75 - .25 * m.round;
  const xs = Array.from({ length: 25 }, (_, i) => -half + W * i / 24);
  ctx.globalAlpha *= clamp(show * 1.5, 0, 1);
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = ink;

  const tongue = () => {
    if (m.tongue < .05) return;
    const ty = center(0) + gap * botK * .6;
    ctx.beginPath(); ctx.ellipse(W * .1, ty + .035 * m.tongue, .045, .05 * m.tongue, 0, 0, Math.PI * 2);
    ctx.fillStyle = TONGUE; ctx.fill();
    ctx.lineWidth = LINE * .8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * .1, ty + .01); ctx.lineTo(W * .1, ty + .06 * m.tongue);
    ctx.lineWidth = LINE * .5; ctx.stroke();
  };

  if (gap < .008) {
    tongue();
    ctx.beginPath();
    xs.forEach((x, i) => i ? ctx.lineTo(x, center(x)) : ctx.moveTo(x, center(x)));
    ctx.lineWidth = LINE; ctx.stroke();
    return;
  }

  const outline = () => {
    ctx.beginPath();
    xs.forEach((x, i) => { const y = center(x) - gap * topK * arc(x); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], center(xs[i]) + gap * botK * arc(xs[i]));
    ctx.closePath();
  };
  outline(); ctx.fillStyle = MOUTH_FILL; ctx.fill();
  tongue();
  outline(); ctx.lineWidth = LINE; ctx.stroke();
}
