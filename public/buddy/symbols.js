import { TAU, clamp } from "./util.js";
import { INK } from "./heads.js";

// Cartoon marks that pop in, drift and fade. "float" symbols live in screen space around the head (units of head
// radius from its center); "head" symbols sit on the head's surface and turn with it. Layer "under" draws before
// the eyes (blush), everything else after.

const FONT = "800 100px 'Bricolage Grotesque', system-ui, sans-serif";

function glyph(ctx, ch, fill) {
  ctx.save();
  ctx.scale(.01, .01);
  ctx.font = FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineJoin = "round"; ctx.lineWidth = 16; ctx.strokeStyle = INK;
  ctx.strokeText(ch, 0, 4); ctx.fillStyle = fill; ctx.fillText(ch, 0, 4);
  ctx.restore();
}

function outlined(ctx, fill, width = .08) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.stroke();
}

const DRAW = {
  heart(ctx) {
    ctx.beginPath(); ctx.moveTo(0, .35);
    ctx.bezierCurveTo(-.55, -.05, -.35, -.55, 0, -.25);
    ctx.bezierCurveTo(.35, -.55, .55, -.05, 0, .35);
    outlined(ctx, "#ff6b8b");
  },
  bang: ctx => glyph(ctx, "!", "#ffd23f"),
  question: ctx => glyph(ctx, "?", "#7cc7ff"),
  z: ctx => glyph(ctx, "Z", "#c9b8ff"),
  sweat(ctx) {
    ctx.beginPath(); ctx.moveTo(0, -.5);
    ctx.quadraticCurveTo(.32, -.05, .3, .17);
    ctx.arc(0, .17, .3, 0, Math.PI);
    ctx.quadraticCurveTo(-.32, -.05, 0, -.5);
    outlined(ctx, "#8fd3ff");
    ctx.beginPath(); ctx.ellipse(-.1, .12, .06, .1, -.4, 0, TAU); ctx.fillStyle = "#ffffff"; ctx.fill();
  },
  anger(ctx) {
    ctx.lineCap = "round";
    for (const [w, color] of [[.26, INK], [.14, "#ff4d5e"]]) {
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.beginPath(); ctx.arc(.45, .45, .3, Math.PI, Math.PI * 1.5);
        ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke();
        ctx.restore();
      }
    }
  },
  sparkle(ctx) {
    ctx.beginPath(); ctx.moveTo(0, -.5);
    ctx.quadraticCurveTo(0, 0, .5, 0); ctx.quadraticCurveTo(0, 0, 0, .5);
    ctx.quadraticCurveTo(0, 0, -.5, 0); ctx.quadraticCurveTo(0, 0, 0, -.5);
    outlined(ctx, "#ffe066", .07);
  },
  thought(ctx, p) {
    for (const [x, y, r] of [[-.62, .62, .07], [-.42, .4, .11]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); outlined(ctx, "#ffffff", .05); }
    ctx.beginPath();
    for (const [x, y, r] of [[-.25, 0, .26], [0, -.14, .3], [.28, -.02, .26], [.06, .14, .26]]) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
    ctx.lineWidth = .1; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = "#ffffff"; ctx.fill();
    const lit = Math.floor(p.age * 4) % 4;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-.18 + i * .18, 0, .055, 0, TAU); ctx.fillStyle = i < lit ? INK : "#c8ccd6"; ctx.fill(); }
  },
  bulb(ctx) {
    ctx.lineCap = "round"; ctx.lineWidth = .07; ctx.strokeStyle = "#ffd23f";
    for (let i = 0; i < 7; i++) { const a = -Math.PI * (.1 + i * .8 / 6); ctx.beginPath(); ctx.moveTo(Math.cos(a) * .5, Math.sin(a) * .5 - .1); ctx.lineTo(Math.cos(a) * .68, Math.sin(a) * .68 - .1); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -.1, .3, Math.PI * .8, Math.PI * .2); ctx.lineTo(.12, .28); ctx.lineTo(-.12, .28); ctx.closePath();
    outlined(ctx, "#ffe066");
    ctx.beginPath(); ctx.roundRect(-.13, .28, .26, .16, .04); outlined(ctx, "#b8bfcc", .06);
  },
  confetti(ctx, p) {
    ctx.beginPath(); ctx.rect(-.5, -.25, 1, .5); ctx.fillStyle = p.color; ctx.fill();
  },
  blush(ctx) {
    ctx.beginPath(); ctx.ellipse(0, 0, .5, .28, 0, 0, TAU);
    ctx.fillStyle = "rgba(255, 110, 140, .6)"; ctx.fill();
    ctx.lineCap = "round"; ctx.lineWidth = .07; ctx.strokeStyle = "#e8506f";
    for (const x of [-.22, 0, .22]) { ctx.beginPath(); ctx.moveTo(x + .08, -.12); ctx.lineTo(x - .08, .12); ctx.stroke(); }
  },
};

const rand = (a, b) => a + Math.random() * (b - a);

// How each symbol is born and moves. spawn returns one or more particles; tick adjusts size/rotation as it ages.
const KINDS = {
  heart: { anchor: "float", life: 1.6, size: .3,
    spawn: () => [{ x: rand(-.35, .35), y: -.85, vx: 0, vy: -.55, sway: rand(.1, .2) }] },
  bang: { anchor: "float", life: 1.1, size: .55, draw: "bang",
    spawn: () => [{ x: .62, y: -1.1 }],
    tick: p => { p.rot = .12 * Math.sin(p.age * 30) * clamp(1 - p.age * 3, 0, 1); } },
  question: { anchor: "float", life: 1.5, size: .55,
    spawn: () => [{ x: .62, y: -1.1 }],
    tick: p => { p.rot = .25 * Math.sin(p.age * 5); } },
  z: { anchor: "float", life: 2.2, size: .28,
    spawn: () => [{ x: .45, y: -.9, vx: .25, vy: -.35, sway: .08 }],
    tick: p => { p.grow = 1 + p.age * .35; p.rot = -.2; } },
  sparkle: { anchor: "float", life: .9, size: .22,
    spawn: () => { const a = rand(-Math.PI, 0); return [{ x: Math.cos(a) * 1.25, y: Math.sin(a) * 1.05 - .1 }]; },
    tick: p => { p.grow = .6 + .4 * Math.abs(Math.sin(p.age * 10)); } },
  sweat: { anchor: "head", life: 1.5, size: .22,
    spawn: spec => [{ lon: spec.spacing + .32, lat: faceLat(spec) - .22, vlat: .18 }] },
  anger: { anchor: "head", life: 1.7, size: .3,
    spawn: () => [{ lon: .45, lat: -.5 }],
    tick: p => { p.grow = 1 + .15 * Math.sin(p.age * 14); } },
  thought: { anchor: "float", life: 1.5, size: .55,
    spawn: () => [{ x: .85, y: -1.25 }] },
  bulb: { anchor: "float", life: 1.3, size: .5,
    spawn: () => [{ x: .85, y: -1.3, vy: -.1 }],
    tick: p => { p.rot = .1 * Math.sin(p.age * 8) * Math.max(0, 1 - p.age); } },
  confetti: { anchor: "float", life: 1.6, size: .09,
    spawn: () => Array.from({ length: 16 }, () => ({
      x: rand(-.3, .3), y: -1.05, vx: rand(-1.4, 1.4), vy: rand(-1.6, -.6), g: 2.2, spin: rand(-12, 12),
      color: ["#ff6b8b", "#ffd23f", "#7cc7ff", "#8be08b", "#c9b8ff"][Math.floor(Math.random() * 5)],
    })),
    tick: p => { p.rot += p.spin / 60; } },
  blush: { anchor: "head", layer: "under", life: 2, size: .16,
    spawn: spec => [-1, 1].map(s => ({ lon: s * spec.spacing * 1.05, lat: faceLat(spec) + spec.eyeH * .5 + .1 })) },
};

// Eye height on this head, so marks near the face follow shapes that sit their face lower or higher.
function faceLat(spec) { return spec.eyeLat + (spec.head.faceY || 0); }

export function spawnSymbol(list, kind, spec, { life } = {}) {
  const K = KINDS[kind];
  for (const init of K.spawn(spec)) {
    list.push({ kind, anchor: K.anchor, layer: K.layer || "over", life: life ?? K.life, size: K.size,
      age: 0, x: 0, y: 0, vx: 0, vy: 0, sway: 0, lon: 0, lat: 0, vlat: 0, rot: 0, grow: 1, ...init });
  }
}

export function updateSymbols(list, dt) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.age += dt;
    if (p.age >= p.life) { list.splice(i, 1); continue; }
    p.vy += (p.g || 0) * dt;
    p.x += (p.vx + p.sway * Math.cos(p.age * 6)) * dt; p.y += p.vy * dt; p.lat += p.vlat * dt;
    KINDS[p.kind].tick?.(p);
  }
}

// Overshooting pop in, fade out over the last 0.3s.
const pop = age => { const u = clamp(age / .28, 0, 1) - 1; return 1 + 2.7 * u ** 3 + 1.7 * u ** 2; };
const fade = p => clamp((p.life - p.age) / .3, 0, 1);

// place(lon, lat) puts the context on the head surface and sets alpha for how much that spot faces the viewer.
export function drawSymbols(ctx, list, { layer, base, cx, cy, R, place }) {
  for (const p of list) {
    if (p.layer !== layer) continue;
    const s = p.size * p.grow * pop(p.age);
    if (p.anchor === "head") {
      place(p.lon, p.lat);
      ctx.transform(s, 0, 0, s, 0, 0);
      ctx.globalAlpha *= fade(p);
    } else {
      ctx.setTransform(base.translate(cx + p.x * R, cy + p.y * R).rotate(p.rot * 180 / Math.PI).scale(R * s));
      ctx.globalAlpha = fade(p);
    }
    ctx.rotate(p.anchor === "head" ? p.rot : 0);
    DRAW[KINDS[p.kind].draw || p.kind](ctx, p);
  }
  ctx.globalAlpha = 1;
}
