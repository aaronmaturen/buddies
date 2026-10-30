import { TAU, clamp, reducedMotion } from "./util.js";
import { Spring } from "./spring.js";
import { rotation, surfaceFrame } from "./sphere.js";
import { BASE, MOODS } from "./moods.js";
import { drawShadow } from "./heads.js";
import { drawEye, drawBrow, browOffset } from "./face.js";
import { MOUTHS, MOUTH_REST, drawMouth } from "./mouth.js";
import { EmotePlayer } from "./emote-player.js";
import { drawSymbols, spawnSymbol } from "./symbols.js";
import { MorphPlayer } from "./morph.js";
import { Presence } from "./presence.js";
import { HandRig } from "./hands.js";
import { WearRig } from "./wear.js";
import { HEAD_STYLES } from "./styles/index.js";
import { headColors } from "./colors.js";
import { theme } from "./theme.js";
import { pointer } from "./pointer.js";

const GLOVE = "#fbfbfd";

// One animated buddy drawn into one canvas.
// headMode: "mixed" (each buddy uses its own spec.headStyle) or any key of HEAD_STYLES (styles/index.js)
// to force one style, e.g. "solid", "ghost", "none", "sketch", "pixel".
// scale: head radius as a fraction of the canvas's shorter side.
export class Buddy {
  constructor(canvas, spec, { scale = .3, headMode = "mixed" } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.scale = scale; this.headMode = headMode;
    this.visible = true; this.w = 0; this.h = 0;
    this.p = {}; for (const k in BASE) this.p[k] = new Spring(BASE[k]);
    this.gYaw = new Spring(); this.gPitch = new Spring();
    this.hYaw = new Spring(); this.hPitch = new Spring(); this.hRoll = new Spring();
    this.lean = new Spring(1); this.jump = new Spring(0); this.squash = new Spring(1);
    this.mood = "neutral"; this.override = null;
    this.open = 1; this.blinkT = -1; this.queued = false;
    this.nextBlink = 0; this.nextGlance = 0; this.attending = true;
    this.glance = [0, 0]; this.thinkSide = 1; this.bobY = 0; this.now = 0;
    this.phase = [0, 1, 2, 3, 4, 5].map(() => Math.random() * TAU);
    this.emotes = new EmotePlayer();
    this.hands = new HandRig();
    this.morph = new MorphPlayer(); this.morphState = null;
    this.wear = new WearRig();
    this.presence = new Presence();
    this.boost = new Spring(1); this.boostSide = 1;
    this.mouth = {}; for (const k in MOUTH_REST) this.mouth[k] = new Spring(MOUTH_REST[k]);
    this.mouthShow = new Spring(0);
    this.spec = spec;
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(es => { this.visible = es[0].isIntersecting; }).observe(canvas);
  }

  setSpec(spec) { this.spec = spec; }

  // The head style actually drawn right now.
  get styleKey() {
    const key = this.headMode === "mixed" ? this.spec.headStyle : this.headMode;
    return HEAD_STYLES[key] ? key : "solid";
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = r.width; this.h = r.height;
    this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
  }

  currentMood(now) { return this.override && this.override.until > now ? this.override.mood : this.mood; }

  setMood(m) {
    if (m === this.mood) return;
    this.mood = m;
    if (m === "thinking") this.thinkSide = Math.random() < .5 ? -1 : 1;
    if (m === "surprised") { this.jump.v += 3.2; this.squash.v += 4; }
  }

  // Play a one-off reaction from EMOTES on top of the current mood. Ignored while morphed or away.
  emote(name) { if (!this.morph.busy && !this.away) this.emotes.play(name, this.now, this); }

  // Away from vanish() until appear(), with no time limit. Emotes, morphs and boops are ignored meanwhile.
  get away() { return this.presence.away; }

  vanish() {
    if (!this.presence.vanish(this.now)) return;
    this.morph.stop(); this.emotes.active = null; this.emotes.symbols.length = 0;
    this.hands.hide(); this.wear.removeAll(); this.override = null;
  }

  appear() {
    if (!this.presence.appear()) return;
    spawnSymbol(this.emotes.symbols, "puff", this.spec, { offset: [0, 0] });
    this.blinkT = 0; this.blinkDur = .2;
  }

  // Puffs at the start and end of a morph, and each morph's own event symbols at the object (or its nose).
  // Positions are in head units from the resting spot, scaled the way the flight is scaled to fit this canvas.
  spawnMorphSymbols(sp) {
    const mo = this.morphState;
    if (!mo) return;
    const f = mo.flight, fit = this.flightFit || 1;
    const at = [f.x * fit, f.y * fit];
    for (const _ of mo.puff) spawnSymbol(this.emotes.symbols, "puff", sp, { offset: at });
    for (const ev of mo.spawn) {
      if (ev.mood) this.override = { mood: ev.mood, until: this.now + (ev.for ?? 1) };
      if (!ev.symbol) continue;
      if (ev.from === "nose" && mo.def.nose) {
        // Same order the object is drawn in: flip, turn, size, then squash (which also handles turning around).
        const [nx, ny] = mo.def.nose, c = Math.cos(f.rot), s = Math.sin(f.rot), x0 = nx * (f.flip ? -1 : 1);
        const x = (x0 * c - ny * s) * f.scale * f.sx, y = (x0 * s + ny * c) * f.scale * f.sy;
        spawnSymbol(this.emotes.symbols, ev.symbol, sp, { mouth: [at[0] + x * fit, at[1] + y * fit] });
      } else {
        spawnSymbol(this.emotes.symbols, ev.symbol, sp, { offset: at });
      }
    }
  }

  // Turn into an object from MORPHS for a while, then back. Cancels any emote.
  morphInto(name) {
    if (this.away || !this.morph.start(name, this.now)) return;
    this.emotes.active = null; this.hands.hide(); this.wear.removeAll(); this.override = null;
  }

  boop() {
    if (this.away) return;
    this.squash.v -= 7;
    this.blinkT = 0; this.blinkDur = .15;
    this.emote("love");
  }

  blinkNow() {
    if (this.blinkT >= 0) return;
    this.blinkT = 0;
    this.blinkDur = this.currentMood(this.now) === "sleepy" ? .34 : .15;
  }

  // Once per frame: pick where to look and what the head should do.
  think(now, dt) {
    const sp = this.spec, mood = this.currentMood(now), S = this.p;
    this.now = now;
    for (const k in BASE) S[k].t = MOODS[mood][k];
    const E = S.energy.x;

    let ty = this.gYaw.t, tp = this.gPitch.t;
    if (now >= this.nextGlance) {
      this.attending = Math.random() < sp.attention;
      const big = Math.random() < .4;
      this.glance = Math.random() < .35 ? [0, 0] : [(Math.random() * 2 - 1) * (big ? .75 : .3), (Math.random() * 2 - 1) * (big ? .45 : .18)];
      this.nextGlance = now + (.8 + Math.random() * 2.6) / (sp.curiosity * Math.max(.4, E));
    }
    const r = this.canvas.getBoundingClientRect();
    const recent = now - pointer.t < 2.2;
    if (mood === "thinking") {
      ty = .45 * this.thinkSide + Math.sin(now * .5 + this.phase[0]) * .08;
      tp = .38 + Math.sin(now * .37 + this.phase[1]) * .05;
    } else if (recent && this.attending) {
      const D = 420;
      ty = clamp(Math.atan2(pointer.x - (r.left + r.width / 2), D), -1, 1);
      tp = clamp(-Math.atan2(pointer.y - (r.top + r.height * .48), D), -.7, .7);
    } else {
      [ty, tp] = this.glance;
    }
    ty += S.gazeYaw.x; tp += S.gazePitch.x;
    if (Math.hypot(ty - this.gYaw.t, tp - this.gPitch.t) > .5 && Math.random() < .4) this.blinkNow();
    this.gYaw.t = ty; this.gPitch.t = tp;

    const amp = reducedMotion ? .3 : 1;
    const n = (i, f) => (Math.sin(now * f + this.phase[i]) * .6 + Math.sin(now * f * 2.3 + this.phase[i + 1]) * .4) * amp;
    const nod = mood === "sleepy" ? -.1 * (.5 + .5 * Math.sin(now * .8)) : 0;
    this.hYaw.t = ty * S.follow.x + S.yawBias.x + n(0, .6) * .05;
    this.hPitch.t = tp * S.follow.x + S.pitch.x + n(2, .5) * .04 + nod;
    this.hRoll.t = sp.restTilt + S.roll.x + n(3, .45) * .03 - this.hYaw.x * .08;
    this.lean.t = S.lean.x;

    const em = this.emotes.update(now, dt, this);
    this.morphState = this.morph.update(now, sp.head);
    this.spawnMorphSymbols(sp);
    if (this.presence.update(now)) spawnSymbol(this.emotes.symbols, "puff", sp, { offset: [0, 0] });
    this.hYaw.t += em.motion.yaw; this.hPitch.t += em.motion.pitch; this.hRoll.t += em.motion.roll;
    // Keep the last mouth shape while it shrinks away.
    this.mouthShow.t = em.mouth ? 1 : 0;
    if (em.mouth) for (const k in this.mouth) this.mouth[k].t = MOUTHS[em.mouth][k];
    this.boost.t = em.magnify ? em.magnify.k : 1;
    if (em.magnify) this.boostSide = em.magnify.side;
    const head = sp.head;
    this.hands.update(now, { yaw: this.hYaw.x, pitch: this.hPitch.x, faceY: Math.sin(sp.eyeLat + (head.faceY || 0)) * head.sy, sx: head.sx });
    this.bobY = reducedMotion ? 0 : S.bob.x * .018 * Math.sin(now * (1.4 + E * 1.2) + this.phase[4]);

    // Blinks: fast close, slower open, sometimes a double.
    if (this.blinkT < 0 && now >= this.nextBlink) { this.blinkNow(); this.queued = Math.random() < .18; }
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const ph = this.blinkT / this.blinkDur;
      if (ph >= 1) {
        this.blinkT = -1; this.open = 1;
        if (this.queued) { this.queued = false; this.nextBlink = now + .09; }
        else this.nextBlink = now + (1.6 + Math.random() * 4.2) / sp.blinkRate * (mood === "sleepy" ? 1.6 : 1);
      } else {
        this.open = ph < .4 ? 1 - ph / .4 : (ph - .4) / .6;
      }
    }
  }

  // Many times per frame: advance every spring. Eyes are stiff, the head softer, so the eyes lead.
  integrate(dt) {
    const S = this.p, st = this.spec.stiffness;
    const faceK = this.mood === "surprised" ? 380 : 140;
    for (const k in S) S[k].step(dt, faceK, .85);
    const E = S.energy.x;
    this.gYaw.step(dt, 700 * st, .8); this.gPitch.step(dt, 700 * st, .8);
    const headK = 45 * st * (.5 + .5 * E);
    this.hYaw.step(dt, headK, .7); this.hPitch.step(dt, headK, .7); this.hRoll.step(dt, headK * .8, .7);
    this.lean.step(dt, 180, .6); this.jump.step(dt, 90, .45); this.squash.step(dt, 300, .3);
    for (const k in this.mouth) this.mouth[k].step(dt, 260, .7);
    this.mouthShow.step(dt, 200, .6);
    this.hands.integrate(dt);
    this.morph.integrate(dt);
    this.presence.integrate(dt);
    this.wear.integrate(dt);
    this.boost.step(dt, 160, .55);
  }

  // Pixel style draws the whole buddy into a small canvas, then scales it up without smoothing.
  draw() {
    const { ctx, w: W, h: H, dpr } = this;
    if (!W) return;
    const style = HEAD_STYLES[this.styleKey];
    if (!style.pixel) { this.render(ctx, dpr, style); return; }
    const k = Math.max(3, Math.min(W, H) / 70);
    const off = this.pixelCanvas ||= document.createElement("canvas");
    off.width = Math.ceil(W / k); off.height = Math.ceil(H / k);
    this.render(off.getContext("2d"), 1 / k, style);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, off.width * k * dpr, off.height * k * dpr);
  }

  // px is device pixels per CSS pixel for this target (dpr on screen, smaller for the pixel pass).
  render(ctx, px, style) {
    const { w: W, h: H, spec } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const base = new DOMMatrix([px, 0, 0, px, 0, 0]);
    const head = spec.head;
    const R = Math.min(W, H) * this.scale * this.lean.x / (head.fit || Math.max(1, head.sy, head.sx * .9));
    const lift = this.bobY + this.jump.x;
    const cx = W / 2, cy = H * .48 - lift * R;

    // While morphed, the object flies around its resting spot, scaled down to fit small canvases.
    const mo = this.morphState;
    const fit = this.flightFit = clamp(Math.min((W / 2 - R * 1.2) / (R * 2.2), (H * .48 - R * 1.1) / (R * 1.05)), 0, 1);
    const mx = mo ? cx + mo.flight.x * R * fit : cx, my = mo ? cy + mo.flight.y * R * fit : cy;

    // While gone only the puff is left; while going or coming back the whole buddy scales about its feet.
    if (this.presence.gone) {
      drawSymbols(ctx, this.emotes.symbols, { base, cx, cy, R, place: () => {}, layer: "over" });
      ctx.globalAlpha = 1;
      return;
    }
    const [psx, psy] = this.presence.scale;

    drawShadow(ctx, base.translate(cx, 0).scale(psx, 1).translate(-cx, 0), { cx: mx, groundY: H * .48, R, head, lift: lift + (mo ? Math.max(0, -mo.flight.y * fit) * .35 : 0), color: theme.fg });

    // Squash and stretch about the bottom of the head.
    const sq = this.squash.x;
    const m = base.translate(cx, cy + R).scale((2 - sq) * psx, sq * psy).translate(-cx, -(cy + R));
    const colors = headColors(spec.color, theme.dark);
    let objectSpace = null;
    if (mo) {
      const f = mo.flight;
      // Squash and stretch about the bottom of the object, then its turn, facing and size.
      objectSpace = m.translate(mx, my + R * .8).scale(f.sx, f.sy).translate(0, -R * .8)
        .rotate(f.rot * 180 / Math.PI).scale(f.flip ? -1 : 1, 1).scale(f.scale).translate(-mx, -my);
      // Parts like tails go behind the shape, the rest of the details over it; both fade in as the shape forms.
      const extras = { ...f, now: this.now, k: mo.k, colors };
      const layer = draw => {
        if (!draw) return;
        ctx.setTransform(objectSpace.translate(mx, my).scale(R));
        ctx.globalAlpha = clamp((mo.k - .6) / .4, 0, 1);
        draw(ctx, extras);
        ctx.globalAlpha = 1;
      };
      layer(mo.def.behind);
      style.head?.(ctx, objectSpace, { cx: mx, cy: my, R, head: { ...head, points: mo.points }, colors, color: spec.color, roll: 0, now: this.now, px });
      layer(mo.def.detail);
    } else {
      style.head?.(ctx, m, { cx, cy, R, head, colors, color: spec.color, roll: this.hRoll.x * 180 / Math.PI, now: this.now, px });
    }
    // The face fades as the head becomes the object; eyes then reappear riding on the object.
    const faceA = mo ? clamp(1 - mo.k * 1.8, 0, 1) : 1;

    const face = style.face(colors, spec.color);
    const eyeInk = face.eye, browInk = face.brow, lidFill = face.lid;
    const M = rotation(this.hYaw.x, this.hPitch.x, this.hRoll.x);
    const dy = clamp(this.gYaw.x - this.hYaw.x, -.4, .4);
    const dp = clamp(this.gPitch.x - this.hPitch.x, -.35, .35);
    const slide = .2;
    const P = {}; for (const k in this.p) P[k] = this.p[k].x;

    const place = (lon, lat) => {
      const f = surfaceFrame(M, lon, lat, head);
      ctx.setTransform(m.multiply(new DOMMatrix([R * f.e[0], R * f.e[1], R * f.s[0], R * f.s[1], cx + R * f.p[0], cy + R * f.p[1]])));
      ctx.globalAlpha = clamp((f.p[2] - .05) / .25, 0, 1) * faceA;
    };

    const faceLat = spec.eyeLat + (head.faceY || 0) - dp * slide;
    const symbols = this.emotes.symbols, fx = { base, cx, cy, R, place };
    // Glowing styles put a blurred halo around every face line.
    const glow = on => { ctx.shadowColor = face.glow || "transparent"; ctx.shadowBlur = on && face.glow ? R * .15 * px : 0; };
    if (this.wear.visible && !mo) this.wear.drawTop(ctx, base, { cx, cy, R, head, yaw: this.hYaw.x, pitch: this.hPitch.x, roll: this.hRoll.x });
    drawSymbols(ctx, symbols, { ...fx, layer: "under" });

    glow(true);
    const eyes = [];
    for (const s of [-1, 1]) {
      const lon = s * spec.spacing + dy * slide;
      // The eye behind the magnifying glass grows; brows stay where they are.
      const boost = s === this.boostSide ? this.boost.x : 1;
      const Pe = boost === 1 ? P : { ...P, eyeScale: P.eyeScale * boost };
      place(lon, faceLat);
      drawEye(ctx, { s, spec, P: Pe, open: this.open, dy, dp, ink: eyeInk, lidFill, fill: face.eyeFill, pupil: face.pupil });
      place(lon, faceLat + browOffset(s, spec, P));
      drawBrow(ctx, { s, spec, P, ink: browInk });
      eyes.push({ lon, lat: faceLat, w: spec.eyeW * P.eyeScale, h: spec.eyeH * P.eyeScale });
    }
    if (this.wear.visible) this.wear.drawFace(ctx, { place, eyes, faceLat });

    if (mo && mo.k > .55) {
      const E = mo.def.eyes;
      for (const s of [-1, 1]) {
        ctx.setTransform(objectSpace.translate(mx + (E.x + s * E.gap / 2) * R, my + E.y * R).scale(R * E.size));
        ctx.globalAlpha = clamp((mo.k - .55) / .3, 0, 1);
        drawEye(ctx, { s, spec, P, open: this.open, dy, dp, ink: eyeInk, lidFill, fill: face.eyeFill, pupil: face.pupil });
      }
      ctx.globalAlpha = 1;
    }

    // Where the mouth is on screen (head units from the head's center), so things like bubbles can come out of it.
    const mouthLon = dy * slide, mouthLat = faceLat + spec.eyeH * .5 + .17;
    const mf = surfaceFrame(M, mouthLon, mouthLat, head);
    this.mouthPoint = [mf.p[0], mf.p[1]];

    if (this.mouthShow.x > .02) {
      const mouth = {}; for (const k in this.mouth) mouth[k] = this.mouth[k].x;
      place(mouthLon, mouthLat);
      drawMouth(ctx, { m: mouth, show: this.mouthShow.x, ink: eyeInk });
    }

    glow(false);
    if (this.hands.visible) {
      const hand = spec.handStyle || "glove";
      this.hands.draw(ctx, base, { cx, cy, R, style: hand, fill: hand === "glove" ? GLOVE : colors.lit, now: this.now });
    }

    drawSymbols(ctx, symbols, { ...fx, layer: "over" });
    ctx.globalAlpha = 1;
  }
}
