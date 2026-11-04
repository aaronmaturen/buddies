import { randomConfig } from "./spec.js";

// The pet game: a dumb 90s virtual pet. Plain rules over a plain JSON state, with no drawing and no learning.
// The same care always leads to the same kind of buddy; the only chance is dice rolls from a seed kept in the state.
//
//   let pet = newPet(Date.now());
//   const events = advance(pet, Date.now());   // catches up on real time, even days; ["hatch", "poop", ...]
//   care(pet, "feed", Date.now());             // "eat", "full", "asleep", ...
//   care(pet, "play", Date.now());             // starts a game of "which hand?"; then care(pet, "guess", now, "left")
//   care(pet, "gift", Date.now());             // a heart of happiness right away, but only one gift every few hours
//   petView(pet);                              // what to show: morph, mood, marks, messes, size
//   petConfig(pet);                            // the buddy config for its current life stage

const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

export const PACE = {
  hatch: 5 * MIN,
  grow: { baby: HOUR, child: DAY },
  // One heart lost every so often, faster for babies.
  hunger: { baby: 30 * MIN, child: 60 * MIN, adult: 80 * MIN },
  happy: { baby: 35 * MIN, child: 70 * MIN, adult: 90 * MIN },
  poop: 3 * HOUR,
  patience: 15 * MIN,        // a call left this long counts as a care mistake
  sickFromMess: 2 * HOUR,    // poop left this long can make it sick
  deadly: 12 * HOUR,         // starving or sick this long without help
  lifespan: { good: 12 * DAY, ok: 9 * DAY, bad: 6 * DAY },
  bedtime: 21, wake: 8,
  naughty: 3 * HOUR,         // about how often a grown buddy calls for no reason
  warning: 6 * HOUR,         // it looks sick this long before starving, sickness or old age would end it
  rounds: 5, toWin: 3,       // a game of "which hand?": win toWin of rounds for a heart, all of them for two
  guessWait: 2 * MIN,        // a game left this long without a guess is over
  giftWait: 4 * HOUR,        // a gift sooner than this after the last one doesn't impress it
};

export const HEARTS = 4;

// What each life stage looks like. Bad care grows a scruffier buddy.
const FORMS = {
  baby: { any: { shape: "round" } },
  child: { good: { shape: "egg" }, ok: { shape: "bean" }, bad: { shape: "blob" } },
  adult: { good: { shape: "gumdrop" }, ok: { shape: "squircle" }, bad: { shape: "cloud", style: "sketch" } },
};
const SIZE = { egg: .8, baby: .62, child: .8, adult: 1, dead: .9 };

// The same step as mulberry32, with its counter kept in the state so a saved pet carries on the same dice.
function roll(pet) {
  let t = pet.rng = (pet.rng + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function newPet(now, { config, seed = Math.floor(Math.random() * 2 ** 31) } = {}) {
  const pet = { version: 1, rng: seed, stage: "egg", form: "any", born: now, stageAt: now, t: now,
    hunger: HEARTS, happy: HEARTS, discipline: 0, mistakes: 0, poops: 0, messSince: null, nextPoop: now + PACE.poop,
    sick: false, sickSince: null, asleep: false, lightsOff: false, call: null, naughty: false, game: null, lastGame: null, giftAt: null,
    hungerAt: now, happyAt: now, starvingSince: null, lifespan: null, diedAt: null, cause: null };
  pet.config = config || randomConfig({ rand: () => roll(pet) });
  return pet;
}

const alive = pet => pet.stage !== "egg" && pet.stage !== "dead";
const isNight = t => { const h = new Date(t).getHours(); return h >= PACE.bedtime || h < PACE.wake; };

function die(pet, now, cause, events) {
  Object.assign(pet, { stage: "dead", stageAt: now, diedAt: now, cause, call: null, asleep: false, naughty: false });
  events.push("die");
}

function grow(pet, now, events) {
  const age = now - pet.stageAt;
  if (pet.stage === "baby" && age >= PACE.grow.baby) {
    pet.form = pet.mistakes <= 1 ? "good" : pet.mistakes <= 3 ? "ok" : "bad";
  } else if (pet.stage === "child" && age >= PACE.grow.child) {
    const score = pet.mistakes - pet.discipline;
    pet.form = score <= 2 ? "good" : score <= 5 ? "ok" : "bad";
    pet.lifespan = PACE.lifespan[pet.form];
  } else return;
  pet.stage = pet.stage === "baby" ? "child" : "adult";
  pet.stageAt = now; pet.mistakes = 0;
  events.push("grow");
}

// Hearts drain while awake; poop piles up; mess left too long can make it sick.
function live(pet, now, events) {
  const rate = PACE.hunger[pet.stage], happyRate = PACE.happy[pet.stage];
  if (now - pet.hungerAt >= rate) { pet.hunger = Math.max(0, pet.hunger - 1); pet.hungerAt += rate; }
  if (now - pet.happyAt >= happyRate) { pet.happy = Math.max(0, pet.happy - 1); pet.happyAt += happyRate; }
  if (now >= pet.nextPoop) {
    pet.poops = Math.min(4, pet.poops + 1); pet.messSince ??= now;
    pet.nextPoop = now + PACE.poop * (.75 + roll(pet) * .5);
    events.push("poop");
  }
  if (!pet.sick && pet.poops && now - pet.messSince > PACE.sickFromMess && roll(pet) < 1 / 60) {
    pet.sick = true; pet.sickSince = now; events.push("sick");
  }
  if (pet.stage !== "baby" && !pet.naughty && !pet.call && roll(pet) < MIN / PACE.naughty) pet.naughty = true;
}

// The one thing it's calling about right now, if anything. A call left alone too long is a care mistake.
function calls(pet, now) {
  const why = pet.hunger === 0 ? "hungry" : pet.happy === 0 ? "sad" : pet.sick ? "sick"
    : pet.asleep && !pet.lightsOff ? "lights" : pet.naughty ? "naughty" : null;
  if (!why) { pet.call = null; return; }
  if (pet.call?.why !== why) pet.call = { why, since: now, counted: false };
  if (!pet.call.counted && now - pet.call.since >= PACE.patience) {
    pet.call.counted = true;
    if (why === "naughty") { pet.naughty = false; pet.call = null; } else pet.mistakes++;
  }
}

function step(pet, now, events) {
  if (pet.game && (now - pet.game.at > PACE.guessWait || !alive(pet) || pet.asleep)) pet.game = null;
  if (pet.stage === "dead") return;
  if (pet.stage === "egg") {
    if (now - pet.born >= PACE.hatch) {
      Object.assign(pet, { stage: "baby", stageAt: now, hunger: 1, happy: 2, hungerAt: now, happyAt: now, nextPoop: now + PACE.poop });
      events.push("hatch");
    }
    return;
  }
  const night = isNight(now);
  if (night && !pet.asleep) { pet.asleep = true; pet.naughty = false; events.push("sleep"); }
  if (!night && pet.asleep) { pet.asleep = false; pet.lightsOff = false; pet.hungerAt = pet.happyAt = now; events.push("wake"); }
  if (!pet.asleep) live(pet, now, events);
  calls(pet, now);
  pet.starvingSince = pet.hunger === 0 ? pet.starvingSince ?? now : null;
  if (pet.starvingSince !== null && now - pet.starvingSince >= PACE.deadly) return die(pet, now, "hunger", events);
  if (pet.sick && now - pet.sickSince >= PACE.deadly) return die(pet, now, "sickness", events);
  if (pet.stage === "adult" && now - pet.stageAt >= pet.lifespan) return die(pet, now, "old age", events);
  grow(pet, now, events);
}

// Catches the pet up to `now` a minute at a time, however long the app was closed. Returns what happened.
export function advance(pet, now) {
  const events = [];
  for (let t = pet.t + MIN; t <= now; t += MIN) { step(pet, t, events); pet.t = t; }
  // A freshly loaded pet calls straight away, not only after its first minute.
  if (alive(pet)) calls(pet, pet.t);
  return events;
}

// How soon starving, sickness or old age would end it, if nothing changes.
function timeLeft(pet, now) {
  const left = [Infinity];
  if (pet.starvingSince !== null) left.push(pet.starvingSince + PACE.deadly - now);
  if (pet.sick) left.push(pet.sickSince + PACE.deadly - now);
  if (pet.stage === "adult" && pet.lifespan) left.push(pet.stageAt + pet.lifespan - now);
  return Math.min(...left);
}

// One guess in a game of "which hand?". The game ends after PACE.rounds guesses, with hearts for a good score.
function guessHand(pet, now, guess) {
  if (!pet.game || now - pet.game.at > PACE.guessWait) pet.game = { round: 0, wins: 0, at: now };
  const side = roll(pet) < .5 ? "left" : "right", won = side === guess, game = pet.game;
  game.round++; game.wins += won; game.at = now;
  if (game.round >= PACE.rounds) {
    const hearts = game.wins === PACE.rounds ? 2 : game.wins >= PACE.toWin ? 1 : 0;
    pet.happy = Math.min(HEARTS, pet.happy + hearts);
    pet.lastGame = { wins: game.wins, hearts };
    pet.game = null;
    calls(pet, now);
  }
  return `${won ? "won" : "lost"}-${side}`;
}

// Does one care action. Returns how the buddy takes it, for the host to show.
// play starts a game of "which hand?" ("play"); each guess, "left" or "right", returns "won-left", "lost-right"
// and so on. After the last round pet.game is null and pet.lastGame has the score and the hearts it earned.
export function care(pet, action, now, guess) {
  advance(pet, now);
  if (action === "lights") { pet.lightsOff = !pet.lightsOff; calls(pet, now); return "lights"; }
  if (action === "quit") { pet.game = null; return "no"; }
  if (!alive(pet)) return "no";
  if (action === "clean") { const had = pet.poops; pet.poops = 0; pet.messSince = null; return had ? "clean" : "no"; }
  if (pet.asleep) return "asleep";
  if (action === "feed") {
    if (pet.hunger >= HEARTS) return "full";
    pet.hunger++; pet.hungerAt = now; pet.starvingSince = null;
  } else if (action === "play") {
    pet.game = { round: 0, wins: 0, at: now };
    return "play";
  } else if (action === "guess") {
    return guessHand(pet, now, guess);
  } else if (action === "gift") {
    if (pet.happy >= HEARTS) return "full";
    if (pet.giftAt != null && now - pet.giftAt < PACE.giftWait) return "bored";
    pet.happy++; pet.happyAt = now; pet.giftAt = now;
  } else if (action === "medicine") {
    if (!pet.sick) return "well";
    pet.sick = false; pet.sickSince = null;
  } else if (action === "scold") {
    if (!pet.naughty) { pet.happy = Math.max(0, pet.happy - 1); calls(pet, now); return "sulk"; }
    pet.naughty = false; pet.discipline = Math.min(HEARTS, pet.discipline + 1);
  } else return "no";
  calls(pet, now);
  return { feed: "eat", gift: "gift", medicine: "medicine", scold: "scolded" }[action];
}

// What to show for the pet right now. size is relative to a grown buddy.
export function petView(pet) {
  const stage = pet.stage, why = pet.call?.why;
  const fading = alive(pet) && timeLeft(pet, pet.t) <= PACE.warning;
  const mood = !alive(pet) ? "neutral" : pet.asleep ? "asleep" : pet.sick || fading ? "sick" : why === "naughty" ? "skeptical"
    : pet.hunger === 0 || pet.happy === 0 ? "sad" : pet.hunger <= 1 ? "worried"
    : pet.hunger >= 3 && pet.happy >= 3 ? "happy" : "neutral";
  const mark = !alive(pet) ? null : pet.asleep ? (why === "lights" ? "bang" : "z") : why ? "bang" : fading ? "sweat" : null;
  return { stage, morph: stage === "egg" ? "egg" : stage === "dead" ? "grave" : null, mood, mark, calling: why || null,
    messes: alive(pet) ? pet.poops : 0, size: SIZE[stage], lightsOff: pet.lightsOff, hunger: pet.hunger, happy: pet.happy,
    discipline: pet.discipline, age: Math.floor((pet.t - pet.born) / DAY), fading,
    game: pet.game ? { round: pet.game.round, wins: pet.game.wins, rounds: PACE.rounds } : null };
}

// The buddy config for the pet's current stage: its own colors and personality, with the stage's head.
export function petConfig(pet) {
  const look = FORMS[pet.stage]?.[pet.form] ?? FORMS[pet.stage]?.any ?? {};
  const head = { ...pet.config.head };
  if (look.shape) head.shape = look.shape;
  if (look.style) head.style = look.style;
  return { ...pet.config, head };
}
