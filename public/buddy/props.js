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

// ---------- held ----------

export const HELD = {
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
