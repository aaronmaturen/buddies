import { clamp } from "./util.js";
import { rotation, surfaceFrame } from "./sphere.js";
import { drawShadow } from "./heads.js";
import { drawEye, drawBrow, browOffset } from "./face.js";
import { drawMouth } from "./mouth.js";
import { drawSymbols } from "./symbols.js";
import { headColors } from "./colors.js";
import { theme } from "./theme.js";

// One frame of a Buddy. This is the drawing half of the Buddy class, so unlike the drawing helpers it reads a Buddy
// directly. `view` holds what's worked out once per frame: where the head is, its size, and any morph.
const GLOVE = "#fbfbfd";
const SLIDE = .2;

export function renderBuddy(b, ctx, px, style) {
  const { w: W, h: H, spec } = b;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const base = new DOMMatrix([px, 0, 0, px, 0, 0]);
  const head = spec.head;
  const R = Math.min(W, H) * b.scale * b.lean.x / (head.fit || Math.max(1, head.sy, head.sx * .9));
  const lift = b.bobY + b.jump.x;
  const cx = W / 2, cy = H * .48 - lift * R;

  // While morphed, the object flies around its resting spot, scaled down to fit small canvases.
  const mo = b.morphState;
  const fit = b.flightFit = clamp(Math.min((W / 2 - R * 1.2) / (R * 2.2), (H * .48 - R * 1.1) / (R * 1.05)), 0, 1);
  const mx = mo ? cx + mo.flight.x * R * fit : cx, my = mo ? cy + mo.flight.y * R * fit : cy;

  // While gone only the puff is left; while going or coming back the whole buddy scales about its feet.
  if (b.presence.gone) {
    drawSymbols(ctx, b.emotes.symbols, { base, cx, cy, R, place: () => {}, layer: "over" });
    ctx.globalAlpha = 1;
    return;
  }
  const [psx, psy] = b.presence.scale;

  const view = { ctx, px, style, base, head, R, lift, cx, cy, H, mo, fit, mx, my, psx, psy };
  const { m, colors, objectSpace } = drawBody(b, view);
  drawFace(b, view, m, colors, objectSpace);
}

// The floor shadow and the head, or the object while morphed.
function drawBody(b, view) {
  const { ctx, px, style, base, head, R, lift, cx, cy, H, mo, fit, mx, psx, psy } = view, { spec } = b;
  drawShadow(ctx, base.translate(cx, 0).scale(psx, 1).translate(-cx, 0), { cx: mx, groundY: H * .48, R, head, lift: lift + (mo ? Math.max(0, -mo.flight.y * fit) * .35 : 0), color: theme.fg });

  // Squash and stretch about the bottom of the head.
  const sq = b.squash.x;
  const m = base.translate(cx, cy + R).scale((2 - sq) * psx, sq * psy).translate(-cx, -(cy + R));
  const colors = headColors(spec.color, theme.dark);
  if (mo) return { m, colors, objectSpace: drawObject(b, view, m, colors) };
  style.head?.(ctx, m, { cx, cy, R, head, colors, color: spec.color, roll: b.hRoll.x * 180 / Math.PI, now: b.now, px });
  return { m, colors, objectSpace: null };
}

function drawObject(b, { ctx, px, style, head, R, mo, mx, my }, m, colors) {
  const { spec } = b, f = mo.flight;
  // Squash and stretch about the bottom of the object, then its turn, facing and size.
  const objectSpace = m.translate(mx, my + R * .8).scale(f.sx, f.sy).translate(0, -R * .8)
    .rotate(f.rot * 180 / Math.PI).scale(f.flip ? -1 : 1, 1).scale(f.scale).translate(-mx, -my);
  // Parts like tails go behind the shape, the rest of the details over it; both fade in as the shape forms.
  const extras = { ...f, now: b.now, k: mo.k, colors };
  const layer = draw => {
    if (!draw) return;
    ctx.setTransform(objectSpace.translate(mx, my).scale(R));
    ctx.globalAlpha = clamp((mo.k - .6) / .4, 0, 1);
    draw(ctx, extras);
    ctx.globalAlpha = 1;
  };
  layer(mo.def.behind);
  style.head?.(ctx, objectSpace, { cx: mx, cy: my, R, head: { ...head, points: mo.points }, colors, color: spec.color, roll: 0, now: b.now, px });
  layer(mo.def.detail);
  return objectSpace;
}

function drawFace(b, view, m, colors, objectSpace) {
  const { ctx, px, style, base, head, R, cx, cy, mo } = view, { spec } = b;
  // The face fades as the head becomes the object; eyes then reappear riding on the object.
  const faceA = mo ? clamp(1 - mo.k * 1.8, 0, 1) : 1;

  const face = style.face(colors, spec.color);
  const M = rotation(b.hYaw.x, b.hPitch.x, b.hRoll.x);
  const dy = clamp(b.gYaw.x - b.hYaw.x, -.4, .4);
  const dp = clamp(b.gPitch.x - b.hPitch.x, -.35, .35);
  const P = {}; for (const k in b.p) P[k] = b.p[k].x;

  const place = (lon, lat) => {
    const f = surfaceFrame(M, lon, lat, head);
    ctx.setTransform(m.multiply(new DOMMatrix([R * f.e[0], R * f.e[1], R * f.s[0], R * f.s[1], cx + R * f.p[0], cy + R * f.p[1]])));
    ctx.globalAlpha = clamp((f.p[2] - .05) / .25, 0, 1) * faceA;
  };

  const faceLat = spec.eyeLat + (head.faceY || 0) - dp * SLIDE;
  const symbols = b.emotes.symbols, fx = { base, cx, cy, R, place };
  // Glowing styles put a blurred halo around every face line.
  const glow = on => { ctx.shadowColor = face.glow || "transparent"; ctx.shadowBlur = on && face.glow ? R * .15 * px : 0; };
  if (b.wear.visible && !mo) b.wear.drawTop(ctx, base, { cx, cy, R, head, yaw: b.hYaw.x, pitch: b.hPitch.x, roll: b.hRoll.x });
  drawSymbols(ctx, symbols, { ...fx, layer: "under" });

  const look = { P, dy, dp, face, faceLat, place };
  glow(true);
  drawEyes(b, ctx, look);
  if (mo && mo.k > .55) drawObjectEyes(b, view, objectSpace, look);
  drawMouthOnFace(b, ctx, M, look);
  glow(false);
  if (b.hands.visible) {
    const hand = spec.handStyle || "glove";
    b.hands.draw(ctx, base, { cx, cy, R, style: hand, fill: hand === "glove" ? GLOVE : colors.lit, now: b.now });
  }

  drawSymbols(ctx, symbols, { ...fx, layer: "over" });
  ctx.globalAlpha = 1;
}

function drawEyes(b, ctx, { P, dy, dp, face, faceLat, place }) {
  const { spec } = b, eyes = [];
  for (const s of [-1, 1]) {
    const lon = s * spec.spacing + dy * SLIDE;
  // The eye behind the magnifying glass grows; brows stay where they are.
  const boost = s === b.boostSide ? b.boost.x : 1;
  const Pe = boost === 1 ? P : { ...P, eyeScale: P.eyeScale * boost };
  place(lon, faceLat);
    drawEye(ctx, { s, spec, P: Pe, open: b.open, dy, dp, ink: face.eye, lidFill: face.lid, fill: face.eyeFill, pupil: face.pupil });
    place(lon, faceLat + browOffset(s, spec, P));
    drawBrow(ctx, { s, spec, P, ink: face.brow });
  eyes.push({ lon, lat: faceLat, w: spec.eyeW * P.eyeScale, h: spec.eyeH * P.eyeScale });
}
  if (b.wear.visible) b.wear.drawFace(ctx, { place, eyes, faceLat });
}

// Eyes riding on the object once the head has melted into it.
function drawObjectEyes(b, { ctx, R, mo, mx, my }, objectSpace, { P, dy, dp, face }) {
  const { spec } = b, E = mo.def.eyes;
  for (const s of [-1, 1]) {
    ctx.setTransform(objectSpace.translate(mx + (E.x + s * E.gap / 2) * R, my + E.y * R).scale(R * E.size));
    ctx.globalAlpha = clamp((mo.k - .55) / .3, 0, 1);
    drawEye(ctx, { s, spec, P, open: b.open, dy, dp, ink: face.eye, lidFill: face.lid, fill: face.eyeFill, pupil: face.pupil });
  }
  ctx.globalAlpha = 1;
}

function drawMouthOnFace(b, ctx, M, { dy, face, faceLat, place }) {
  const { spec } = b, head = spec.head;
  // Where the mouth is on screen (head units from the head's center), so things like bubbles can come out of it.
  const mouthLon = dy * SLIDE, mouthLat = faceLat + spec.eyeH * .5 + .17;
  const mf = surfaceFrame(M, mouthLon, mouthLat, head);
  b.mouthPoint = [mf.p[0], mf.p[1]];

  if (b.mouthShow.x > .02) {
    const mouth = {}; for (const k in b.mouth) mouth[k] = b.mouth[k].x;
    place(mouthLon, mouthLat);
    drawMouth(ctx, { m: mouth, show: b.mouthShow.x, ink: face.eye });
  }
}
