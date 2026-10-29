import { Spring } from "./spring.js";
import { drawLens, drawBridge, HATS } from "./props.js";

// Worn accessories, shown only during emotes. Two slots: "face" (sunglasses, drawn on the eyes so they turn with
// the head and slide down into place) and "top" (hats, which pop onto the top of the head and tilt with it).
export const WEARABLES = { sunglasses: "face", partyHat: "top", nightcap: "top" };

// The highest point of a head shape, in head units (negative is up).
function headTop(head) {
  if (head.verts) return Math.min(...head.verts.map(v => v[1]));
  return -head.sy * (1 - Math.min(0, head.taper) * .3);
}

export class WearRig {
  constructor() {
    this.slots = { face: { item: null, show: new Spring(0) }, top: { item: null, show: new Spring(0) } };
  }

  get visible() { return Object.values(this.slots).some(s => s.item); }

  wear(item) {
    const slot = this.slots[WEARABLES[item]];
    if (!slot) return;
    if (slot.show.x < .05) slot.show.x = 0;
    slot.item = item; slot.show.t = 1;
  }

  removeAll() { for (const s of Object.values(this.slots)) s.show.t = 0; }

  integrate(dt) {
    for (const s of Object.values(this.slots)) {
      s.show.step(dt, 170, .5);
      if (s.show.t === 0 && s.show.x < .02) s.item = null;
    }
  }

  // place(lon, lat) puts the context on the head surface (see buddy.js); eyes is [{ lon, lat, w, h }] per eye.
  drawFace(ctx, { place, eyes, faceLat }) {
    const s = this.slots.face;
    if (s.item !== "sunglasses") return;
    const show = Math.max(0, s.show.x), drop = (1 - Math.min(1, show)) * .6;
    let half = 0;
    for (const e of eyes) {
      place(e.lon, e.lat - drop);
      ctx.globalAlpha *= Math.min(1, show * 2);
      half = drawLens(ctx, e.w, e.h) / 2;
    }
    place(0, faceLat - drop);
    ctx.globalAlpha *= Math.min(1, show * 2);
    const inner = Math.abs(eyes[0].lon) - half;
    if (inner > 0) drawBridge(ctx, -inner, inner);
    ctx.globalAlpha = 1;
  }

  drawTop(ctx, base, { cx, cy, R, head, yaw, pitch, roll }) {
    const s = this.slots.top;
    if (!s.item) return;
    const show = Math.max(0, s.show.x);
    const x = cx + R * Math.sin(yaw) * .25 * head.sx;
    const y = cy + R * (headTop(head) * .82 - Math.sin(pitch) * .2 - (1 - Math.min(1, show)) * .5);
    ctx.setTransform(base.translate(x, y).rotate(roll * 180 / Math.PI).scale(R * Math.max(.01, show)));
    ctx.globalAlpha = Math.min(1, show * 2);
    HATS[s.item](ctx);
    ctx.globalAlpha = 1;
  }
}
