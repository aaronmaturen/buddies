import { TAU } from "./util.js";
import { INK } from "./heads.js";

// Prop drawings, all with the same ink outline as the heads.
// Worn props are drawn in head units (head radius = 1); held props in hand units (hand height = 1, palm at the
// origin, fingers toward -y, thumb toward -x). `behind` held props are drawn before the hand so fingers grip them.

const LINE = .07;

function outlined(ctx, fill, width = LINE) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.stroke();
}

// ---------- worn ----------

// One sunglasses lens, drawn in an eye's local frame; w/h are the eye's size so lenses fit any eye shape.
export function drawLens(ctx, w, h) {
  const lw = Math.max(w * 1.3, .2), lh = Math.max(h * 1.05, .16);
  ctx.beginPath(); ctx.roundRect(-lw / 2, -lh / 2, lw, lh, Math.min(lw, lh) * .4);
  ctx.fillStyle = "#1d2230"; ctx.fill();
  ctx.lineWidth = .035; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-lw * .25, -lh * .15); ctx.lineTo(-lw * .05, -lh * .32);
  ctx.lineWidth = .025; ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.stroke();
  return lw;
}

export function drawBridge(ctx, from, to) {
  ctx.beginPath(); ctx.moveTo(from, -.02); ctx.quadraticCurveTo(0, -.06, to, -.02);
  ctx.lineWidth = .035; ctx.lineCap = "round"; ctx.strokeStyle = INK; ctx.stroke();
}

// Hats sit with their brim at the origin and rise toward -y.
export const HATS = {
  partyHat(ctx) {
    ctx.save(); ctx.rotate(.15);
    ctx.beginPath(); ctx.moveTo(-.36, 0); ctx.lineTo(0, -.9); ctx.lineTo(.36, 0); ctx.closePath();
    ctx.fillStyle = "#ff7aa8"; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.lineWidth = .1; ctx.strokeStyle = "#ffe066";
    for (const y of [-.15, -.42, -.69]) { ctx.beginPath(); ctx.moveTo(-.5, y + .12); ctx.lineTo(.5, y - .12); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-.36, 0); ctx.lineTo(0, -.9); ctx.lineTo(.36, 0); ctx.closePath();
    ctx.lineWidth = LINE * .7; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -.92, .1, 0, TAU); outlined(ctx, "#7cc7ff", LINE * .6);
    ctx.restore();
  },
  nightcap(ctx) {
    ctx.beginPath(); ctx.moveTo(-.48, -.05);
    ctx.bezierCurveTo(-.4, -.7, .3, -.75, .7, -.35);
    ctx.quadraticCurveTo(.25, -.3, .48, -.05); ctx.closePath();
    outlined(ctx, "#7c8cff", LINE * .7);
    ctx.beginPath(); ctx.roundRect(-.52, -.12, 1.04, .16, .08); outlined(ctx, "#f4f5fb", LINE * .6);
    ctx.beginPath(); ctx.arc(.72, -.33, .1, 0, TAU); outlined(ctx, "#f4f5fb", LINE * .6);
  },
};

// ---------- on the floor ----------

// A cartoon swirl with stink lines, in its own units (about 1 across, sitting on y = 1).
export function drawPoop(ctx, m, now) {
  ctx.setTransform(m);
  ctx.beginPath();
  ctx.ellipse(0, .78, .5, .22, 0, 0, TAU); ctx.ellipse(0, .46, .36, .18, 0, 0, TAU); ctx.ellipse(.02, .2, .22, .14, 0, 0, TAU);
  ctx.moveTo(.08, .08); ctx.quadraticCurveTo(.16, -.08, .02, -.14);
  outlined(ctx, "#9a6a43", .06);
  ctx.lineCap = "round"; ctx.lineWidth = .05; ctx.strokeStyle = "rgba(120, 160, 90, .8)";
  for (const x of [-.32, .32]) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) { const y = -.05 - i * .07, px = x + .06 * Math.sin(now * 4 + i * .9 + x * 7); i ? ctx.lineTo(px, y) : ctx.moveTo(px, y); }
    ctx.stroke();
  }
}

// ---------- held ----------

export const HELD = {
  food: { draw(ctx) {
    // A rice ball with a band of seaweed.
    ctx.beginPath(); ctx.moveTo(-.12, -1.35); ctx.quadraticCurveTo(.08, -1.4, .38, -.7);
    ctx.quadraticCurveTo(.42, -.5, .2, -.5); ctx.lineTo(-.45, -.5); ctx.quadraticCurveTo(-.66, -.5, -.6, -.7);
    ctx.quadraticCurveTo(-.32, -1.4, -.12, -1.35); outlined(ctx, "#f7f7f2");
    ctx.beginPath(); ctx.roundRect(-.3, -.82, .36, .32, .04); outlined(ctx, "#24342b", LINE * .6);
  } },
  pill: { draw(ctx) {
    ctx.save(); ctx.translate(-.1, -.95); ctx.rotate(-.6);
    ctx.beginPath(); ctx.roundRect(-.2, -.45, .4, .9, .2); outlined(ctx, "#f4f5fb");
    ctx.beginPath(); ctx.roundRect(-.2, -.45, .4, .45, [.2, .2, 0, 0]); outlined(ctx, "#ff6b6b");
    ctx.restore();
  } },
  mug: { behind: true, draw(ctx, now) {
    // The handle sits under the fist; the cup is on the side toward the head.
    ctx.beginPath(); ctx.arc(-.32, -.16, .2, -Math.PI / 2, Math.PI / 2);
    ctx.lineWidth = .16; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = .08; ctx.strokeStyle = "#e9eef6"; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-1.02, -.55, .7, .78, .14); outlined(ctx, "#e9eef6");
    ctx.beginPath(); ctx.roundRect(-1.02, -.32, .7, .14, .02); ctx.fillStyle = "#ff8a5c"; ctx.fill();
    ctx.lineCap = "round"; ctx.lineWidth = .06; ctx.strokeStyle = "rgba(160,170,190,.8)";
    for (const x of [-.82, -.55]) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const y = -.65 - i * .06, px = x + .05 * Math.sin(now * 5 + i * .8 + x * 9); i ? ctx.lineTo(px, y) : ctx.moveTo(px, y); }
      ctx.stroke();
    }
  } },
  gift: { draw(ctx) {
    ctx.beginPath(); ctx.roundRect(-.38, -1.12, .76, .66, .08); outlined(ctx, "#ff6b8b");
    ctx.beginPath(); ctx.rect(-.07, -1.12, .14, .66); ctx.fillStyle = "#ffe066"; ctx.fill();
    ctx.beginPath(); ctx.rect(-.38, -.86, .76, .12); ctx.fill();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * .14, -1.2, .14, .08, s * .5, 0, TAU); outlined(ctx, "#ffe066", LINE * .7); }
  } },
  magnifier: { behind: true, draw(ctx) {
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, .05); ctx.lineTo(-.08, -.75);
    ctx.lineWidth = .26; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = .14; ctx.strokeStyle = "#8a5a3c"; ctx.stroke();
    ctx.beginPath(); ctx.arc(-.14, -1.25, .48, 0, TAU);
    ctx.fillStyle = "rgba(190, 225, 255, .28)"; ctx.fill();
    ctx.lineWidth = .2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = .1; ctx.strokeStyle = "#d9b44a"; ctx.stroke();
    ctx.beginPath(); ctx.arc(-.14, -1.25, .32, Math.PI * 1.1, Math.PI * 1.45);
    ctx.lineWidth = .06; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.stroke();
  } },
};
