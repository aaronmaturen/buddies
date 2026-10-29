import { Spring } from "./spring.js";
import { INK } from "./heads.js";
import { HELD } from "./props.js";

// Floating hands with no arms. Each hand lives in screen space around the head (units of head radius from its
// center) and only shows during emotes. Side 1 is the hand on the right of the screen, -1 the left; poses are
// drawn for the right hand with the thumb toward the head, and mirrored for the left.

const OUT = .12;          // outline thickness added around every part
const SIZE = .42;         // hand height as a fraction of head radius
const OFFSTAGE = [1.6, .9];

// Pose parts: palm is a rounded rect [x, y, w, h, r]; digits are round-capped strokes [x1, y1, x2, y2, width]
// merged into the silhouette; over are digits drawn on top with their own outline; lines are ink details.
const POSES = {
  open: { palm: [-.3, -.3, .6, .6, .24], digits: [[-.19, -.25, -.21, -.72, .2], [0, -.28, 0, -.8, .2], [.19, -.25, .21, -.7, .2], [-.28, 0, -.52, -.25, .2]] },
  mittOpen: { palm: [-.32, -.62, .64, .95, .3], digits: [[-.3, 0, -.5, -.25, .22]] },
  fist: { palm: [-.32, -.32, .64, .6, .3], over: [[-.2, -.02, .12, -.02, .16]], lines: [[-.08, -.32, -.08, -.16], [.1, -.32, .1, -.16]] },
  point: { palm: [-.32, -.32, .64, .6, .3], digits: [[-.12, -.28, -.12, -.85, .2]], over: [[-.2, -.02, .12, -.02, .16]] },
  thumb: { palm: [-.32, -.32, .64, .6, .3], digits: [[-.3, -.1, -.32, -.62, .21]], lines: [[.02, -.32, .02, -.16], [.18, -.32, .18, -.16]] },
};

function palmPath(ctx, [x, y, w, h, r]) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function stroke(ctx, [x1, y1, x2, y2], width, color) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.lineWidth = width; ctx.strokeStyle = color; ctx.stroke();
}

// Outline pass in ink, then the same parts slightly thinner in the fill color, so everything merges into one outline.
export function drawHand(ctx, { pose, style, fill }) {
  const P = POSES[style === "mitt" && pose === "open" ? "mittOpen" : pose];
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (style === "glove") {
    palmPath(ctx, [-.33, .22, .66, .2, .08]);
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = OUT / 2; ctx.strokeStyle = INK; ctx.stroke();
  }
  palmPath(ctx, P.palm); ctx.lineWidth = OUT; ctx.strokeStyle = INK; ctx.stroke();
  for (const d of P.digits || []) stroke(ctx, d, d[4] + OUT, INK);
  palmPath(ctx, P.palm); ctx.fillStyle = fill; ctx.fill();
  for (const d of P.digits || []) stroke(ctx, d, d[4], fill);
  for (const d of P.over || []) { stroke(ctx, d, d[4] + OUT, INK); stroke(ctx, d, d[4], fill); }
  for (const l of P.lines || []) stroke(ctx, l, OUT / 2.4, INK);
}

// Two hands on springs. A target is { pose, x, y, rot, size, holds, face, wiggle, bob, clap } for the right hand;
// the left hand mirrors x. face: y is relative to the eye line and the hand follows the head's turn.
export class HandRig {
  constructor() {
    this.hands = [1, -1].map(side => ({
      side, pose: "open", target: null, size: 1, holds: null,
      x: new Spring(side * OFFSTAGE[0]), y: new Spring(OFFSTAGE[1]), rot: new Spring(0), show: new Spring(0),
    }));
  }

  get visible() { return this.hands.some(h => h.show.x > .02 || h.target); }

  set(sides, target) {
    for (const h of this.hands) {
      if (!sides.includes(h.side)) continue;
      if (!h.target && h.show.x < .1) { h.x.x = h.side * OFFSTAGE[0]; h.y.x = OFFSTAGE[1]; }
      if (h.target && h.pose !== target.pose) h.show.v -= 3;
      h.target = target; h.pose = target.pose; h.size = target.size || 1; h.holds = target.holds || null; h.show.t = 1;
    }
  }

  hide(sides = [1, -1]) {
    for (const h of this.hands) if (sides.includes(h.side)) { h.target = null; h.show.t = 0; }
  }

  // Once per frame: move targets for oscillations and, for face-anchored poses, the head's turn.
  update(now, { yaw, pitch, faceY, sx }) {
    for (const h of this.hands) {
      const t = h.target;
      if (!t) { h.x.t = h.side * OFFSTAGE[0]; h.y.t = OFFSTAGE[1]; continue; }
      const w = (f = 3) => Math.sin(now * f * Math.PI * 2);
      let x = t.x + (t.clap ? t.clap.x * (.5 + .5 * w(t.clap.freq)) : 0) + (t.bob?.x || 0) * w(t.bob?.freq);
      let y = t.y + (t.bob?.y || 0) * w(t.bob?.freq);
      if (t.face) y += faceY;
      h.x.t = h.side * x + (t.face ? Math.sin(yaw) * sx * .85 : 0);
      h.y.t = y - (t.face ? Math.sin(pitch) * .85 : 0);
      h.rot.t = (t.rot || 0) + (t.wiggle ? t.wiggle.rot * w(t.wiggle.freq) : 0);
    }
  }

  integrate(dt) {
    for (const h of this.hands) {
      h.x.step(dt, 120, .65); h.y.step(dt, 120, .65); h.rot.step(dt, 150, .6); h.show.step(dt, 220, .55);
    }
  }

  draw(ctx, base, { cx, cy, R, style, fill, now }) {
    for (const h of this.hands) {
      const s = Math.max(0, h.show.x);
      if (s < .02) continue;
      ctx.setTransform(base.translate(cx + h.x.x * R, cy + h.y.x * R).scale(h.side, 1).rotate(h.rot.x * 180 / Math.PI).scale(R * SIZE * h.size * s));
      ctx.globalAlpha = Math.min(1, s * 2);
      const prop = h.holds && HELD[h.holds];
      if (prop?.behind) prop.draw(ctx, now);
      drawHand(ctx, { pose: h.pose, style, fill });
      if (prop && !prop.behind) prop.draw(ctx, now);
    }
    ctx.globalAlpha = 1;
  }
}
