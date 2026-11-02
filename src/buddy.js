import { TAU, clamp, reducedMotion } from "./util.js";
import { Spring } from "./spring.js";
import { BASE, MOODS } from "./moods.js";
import { MOUTHS, MOUTH_REST } from "./mouth.js";
import { renderBuddy } from "./buddy-render.js";
import { EmotePlayer } from "./emote-player.js";
import { spawnSymbol } from "./symbols.js";
import { MorphPlayer } from "./morph.js";
import { Presence } from "./presence.js";
import { HandRig } from "./hands.js";
import { WearRig } from "./wear.js";
import { HEAD_STYLES } from "./styles/index.js";
import { pointer } from "./pointer.js";
import { stopAnimating } from "./loop.js";

const TURN_AWAY_CHANCE = .05;

// One animated buddy drawn into one canvas.
// headMode: "mixed" (each buddy uses its own spec.headStyle) or any key of HEAD_STYLES (styles/index.js)
// to force one style, e.g. "solid", "ghost", "none", "sketch", "pixel".
// scale: head radius as a fraction of the canvas's shorter side.
export class Buddy {
  constructor(canvas, spec, { scale = .3, headMode = "mixed" } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext("2d");
    this.scale = scale; this.headMode = headMode;
    this.visible = true; this.w = 0; this.h = 0;
    // still: no idle motion (glancing, following the pointer, drift, bob, blinks). Moods, emotes and morphs still play.
    this.still = false;
    this.p = {}; for (const k in BASE) this.p[k] = new Spring(BASE[k]);
    this.gYaw = new Spring(); this.gPitch = new Spring();
    this.hYaw = new Spring(); this.hPitch = new Spring(); this.hRoll = new Spring();
    this.lean = new Spring(1); this.jump = new Spring(0); this.squash = new Spring(1);
    this.mood = "neutral"; this.override = null;
    this.open = 1; this.blinkT = -1; this.queued = false;
    this.nextBlink = 0; this.nextGlance = 0; this.attending = true;
    this.glance = [0, 0]; this.turnAway = 0; this.thinkSide = 1; this.bobY = 0; this.now = 0;
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
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.visibleObserver = new IntersectionObserver(es => { this.visible = es[0].isIntersecting; });
    this.visibleObserver.observe(canvas);
  }

  // Stop animating and let go of the canvas, for when the app removes it.
  destroy() {
    stopAnimating(this);
    this.resizeObserver.disconnect();
    this.visibleObserver.disconnect();
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

  // Hands and worn things go away on their springs.
  clearProps() { this.hands.hide(); this.wear.removeAll(); }

  cancelEmote() { this.emotes.active = null; this.override = null; this.clearProps(); }

  // Away from vanish() until appear(), with no time limit. Emotes, morphs and boops are ignored meanwhile.
  get away() { return this.presence.away; }

  vanish() {
    if (!this.presence.vanish(this.now)) return;
    this.morph.stop(); this.emotes.symbols.length = 0;
    this.cancelEmote();
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
    this.cancelEmote();
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

  // Where to look this frame, plus how far the head should turn away from the camera.
  pickGaze(now, mood, E) {
    const sp = this.spec;
    let ty = this.gYaw.t, tp = this.gPitch.t, away = 0;
    if (this.still) {
      this.glance = [0, 0]; this.nextGlance = now; this.turnAway = 0;
    } else if (now >= this.nextGlance) {
      this.attending = Math.random() < sp.attention;
      const big = Math.random() < .4;
      // Now and then it turns right away from the camera for one glance.
      this.turnAway = !reducedMotion && Math.random() < TURN_AWAY_CHANCE ? (Math.random() < .5 ? -1 : 1) * 1.9 : 0;
      this.glance = Math.random() < .35 ? [0, 0] : [(Math.random() * 2 - 1) * (big ? .75 : .3), (Math.random() * 2 - 1) * (big ? .45 : .18)];
      this.nextGlance = now + (.8 + Math.random() * 2.6) / (sp.curiosity * Math.max(.4, E));
    }
    const r = this.canvas.getBoundingClientRect();
    const recent = now - pointer.t < 2.2;
    if (mood === "thinking") {
      const drift = this.still ? 0 : 1;
      ty = .45 * this.thinkSide + Math.sin(now * .5 + this.phase[0]) * .08 * drift;
      tp = .38 + Math.sin(now * .37 + this.phase[1]) * .05 * drift;
    } else if (recent && this.attending && !this.still) {
      const D = 420;
      ty = clamp(Math.atan2(pointer.x - (r.left + r.width / 2), D), -1, 1);
      tp = clamp(-Math.atan2(pointer.y - (r.top + r.height * .48), D), -.7, .7);
    } else {
      [ty, tp] = this.glance;
      away = this.turnAway;
    }
    return [ty, tp, away];
  }

  // Blinks: fast close, slower open, sometimes a double.
  updateBlink(now, dt, mood) {
    const sp = this.spec;
    if (this.blinkT < 0 && now >= this.nextBlink && !this.still) { this.blinkNow(); this.queued = Math.random() < .18; }
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

  // Once per frame: pick where to look and what the head should do.
  think(now, dt) {
    const sp = this.spec, mood = this.currentMood(now), S = this.p;
    this.now = now;
    for (const k in BASE) S[k].t = MOODS[mood][k];
    const E = S.energy.x;

    let [ty, tp, away] = this.pickGaze(now, mood, E);
    ty += S.gazeYaw.x; tp += S.gazePitch.x;
    if (!this.still && Math.hypot(ty - this.gYaw.t, tp - this.gPitch.t) > .5 && Math.random() < .4) this.blinkNow();
    this.gYaw.t = ty; this.gPitch.t = tp;

    const amp = this.still ? 0 : reducedMotion ? .3 : 1;
    const n = (i, f) => (Math.sin(now * f + this.phase[i]) * .6 + Math.sin(now * f * 2.3 + this.phase[i + 1]) * .4) * amp;
    const nod = mood === "sleepy" && !this.still ? -.1 * (.5 + .5 * Math.sin(now * .8)) : 0;
    this.hYaw.t = ty * S.follow.x + S.yawBias.x + n(0, .6) * .05 + away;
    this.hPitch.t = tp * S.follow.x + S.pitch.x + n(2, .5) * .04 + nod;
    this.hRoll.t = sp.restTilt + S.roll.x + n(3, .45) * .03 - clamp(this.hYaw.x, -1, 1) * .08;
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
    this.bobY = reducedMotion || this.still ? 0 : S.bob.x * .018 * Math.sin(now * (1.4 + E * 1.2) + this.phase[4]);

    this.updateBlink(now, dt, mood);
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
  render(ctx, px, style) { renderBuddy(this, ctx, px, style); }
}
