import { clamp, reducedMotion } from "./util.js";
import { EMOTES } from "./emotes.js";
import { spawnSymbol, updateSymbols } from "./symbols.js";

const STILL = { yaw: 0, pitch: 0, roll: 0 };
const W = Math.PI * 2;

// Head movements as offsets over time, eased in at the start and out at the end. Pitch up is positive.
const MOTIONS = {
  sway: (t, e) => ({ roll: .12 * Math.sin(t * 6) * e }),
  giggle: (t, e) => ({ roll: .08 * Math.sin(t * 18) * e, pitch: .1 * e }),
  recoil: (t, e) => ({ pitch: .2 * e }),
  tilt: (t, e) => ({ roll: -.35 * e }),
  shake: (t, e) => ({ yaw: .35 * Math.sin(t * W * 2.5) * e }),
  tremble: (t, e) => ({ yaw: .04 * Math.sin(t * 55) * e }),
  doze: (t, e) => ({ pitch: -.25 * e * (.6 + .4 * Math.sin(t * 3)) }),
  lookAway: (t, e) => ({ pitch: -.12 * e }),
  chinUp: (t, e) => ({ pitch: .22 * e, roll: .08 * e }),
  wiggle: (t, e) => ({ roll: .22 * Math.sin(t * W * 2.2) * e }),
  nod: (t, e) => ({ pitch: -.22 * Math.sin(t * W * 2.2) * e }),
  sigh: (t, e) => ({ pitch: -.18 * e, roll: .05 * e }),
};

// Which hands an event's `hand` names: 1 is the hand on the right of the screen.
const SIDES = { right: [1], left: [-1], both: [1, -1] };

// Runs one emote at a time for one buddy and owns that buddy's symbols.
export class EmotePlayer {
  constructor() { this.active = null; this.symbols = []; }

  play(name, now, buddy) {
    const def = EMOTES[name];
    if (!def) return;
    this.active = { def, start: now, fired: 0, handsOut: false, magnify: null };
    buddy.hands.hide();
    buddy.wear.removeAll();
    if (def.mood) buddy.override = { mood: def.mood, until: now + def.duration };
  }

  // Returns the head offsets, mouth shape and any magnified eye for this frame.
  update(now, dt, buddy) {
    updateSymbols(this.symbols, dt);
    const a = this.active;
    if (!a) return { motion: STILL, mouth: null, magnify: null };
    const t = now - a.start, d = a.def.duration;
    if (t >= d) { this.active = null; buddy.hands.hide(); buddy.wear.removeAll(); return { motion: STILL, mouth: null, magnify: null }; }

    const events = a.def.events || [];
    while (a.fired < events.length && events[a.fired].at <= t) {
      const ev = events[a.fired++];
      if (ev.jump) buddy.jump.v += ev.jump;
      if (ev.squash) buddy.squash.v += ev.squash;
      if (ev.symbol) spawnSymbol(this.symbols, ev.symbol, buddy.spec, { life: ev.life });
      if (ev.mood) buddy.override = { mood: ev.mood, until: a.start + d };
      if (ev.wear) buddy.wear.wear(ev.wear);
      if (ev.magnify) a.magnify = { side: ev.magnify, k: ev.zoom || 1.6 };
      const sides = SIDES[ev.hand];
      if (sides && ev.hide) buddy.hands.hide(sides);
      else if (sides) buddy.hands.set(sides, ev);
    }
    // Hands start leaving a beat before the emote ends so they're gone as the face settles.
    if (!a.handsOut && t >= d - .35) { a.handsOut = true; a.magnify = null; buddy.hands.hide(); buddy.wear.removeAll(); }

    const ease = clamp(Math.min(t / .15, (d - t) / .3), 0, 1) * (reducedMotion ? .4 : 1);
    const motion = { ...STILL, ...MOTIONS[a.def.motion]?.(t, ease) };
    return { motion, mouth: t < d - .25 ? a.def.mouth : null, magnify: a.magnify };
  }
}
