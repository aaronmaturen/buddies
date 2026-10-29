import { TAU, clamp, reducedMotion } from "./util.js";
import { Spring } from "./spring.js";
import { rotation, surfaceFrame } from "./sphere.js";
import { BASE, MOODS } from "./moods.js";
import { INK, drawHead, drawShadow } from "./heads.js";
import { drawEye, drawBrow, browOffset } from "./face.js";
import { headColors } from "./colors.js";
import { theme } from "./theme.js";
import { pointer } from "./pointer.js";

// One animated buddy drawn into one canvas.
// headMode: "solid" (cel-shaded), "ghost" (faint) or "none" (eyes and brows only).
// scale: head radius as a fraction of the canvas's shorter side.
export class Buddy {
  constructor(canvas, spec, { scale = .3, headMode = "solid" } = {}) {
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
    this.spec = spec;
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(es => { this.visible = es[0].isIntersecting; }).observe(canvas);
  }

  setSpec(spec) { this.spec = spec; }

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

  boop(now = performance.now() / 1000) {
    this.squash.v -= 7; this.jump.v += 2.4;
    this.override = { mood: "happy", until: now + 1.3 };
    this.blinkT = 0; this.blinkDur = .15;
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
  }

  draw() {
    const { ctx, w: W, h: H, dpr, spec, headMode: mode } = this;
    if (!W) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const base = new DOMMatrix([dpr, 0, 0, dpr, 0, 0]);
    const head = spec.head;
    const R = Math.min(W, H) * this.scale * this.lean.x / (head.fit || Math.max(1, head.sy, head.sx * .9));
    const lift = this.bobY + this.jump.x;
    const cx = W / 2, cy = H * .48 - lift * R;

    drawShadow(ctx, base, { cx, groundY: H * .48, R, head, lift, color: theme.fg });

    // Squash and stretch about the bottom of the head.
    const sq = this.squash.x;
    const m = base.translate(cx, cy + R).scale(2 - sq, sq).translate(-cx, -(cy + R));
    const colors = headColors(spec.color, theme.dark);
    if (mode !== "none") drawHead(ctx, m, { cx, cy, R, head, colors, mode, roll: this.hRoll.x * 180 / Math.PI, now: this.now });

    // Dark heads get light brows so the face still reads; eye whites stay white everywhere.
    const solid = mode === "solid";
    const browInk = solid ? (colors.deep ? "#f4f5f8" : INK) : theme.fg;
    const eyeInk = solid ? INK : theme.fg;
    const lidFill = solid ? colors.lit : theme.surface;
    const M = rotation(this.hYaw.x, this.hPitch.x, this.hRoll.x);
    const dy = clamp(this.gYaw.x - this.hYaw.x, -.4, .4);
    const dp = clamp(this.gPitch.x - this.hPitch.x, -.35, .35);
    const slide = .2;
    const P = {}; for (const k in this.p) P[k] = this.p[k].x;

    const place = (lon, lat) => {
      const f = surfaceFrame(M, lon, lat, head);
      ctx.setTransform(m.multiply(new DOMMatrix([R * f.e[0], R * f.e[1], R * f.s[0], R * f.s[1], cx + R * f.p[0], cy + R * f.p[1]])));
      ctx.globalAlpha = clamp((f.p[2] - .05) / .25, 0, 1);
    };

    for (const s of [-1, 1]) {
      const lon = s * spec.spacing + dy * slide;
      const lat = spec.eyeLat + (head.faceY || 0) - dp * slide;
      place(lon, lat);
      drawEye(ctx, { s, spec, P, open: this.open, dy, dp, ink: eyeInk, lidFill });
      place(lon, lat + browOffset(s, spec, P));
      drawBrow(ctx, { s, spec, P, ink: browInk });
    }
    ctx.globalAlpha = 1;
  }
}
