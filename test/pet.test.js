import test from "node:test";
import assert from "node:assert/strict";

process.env.TZ = "UTC";
const { newPet, advance, care, petView, petConfig, PACE } = await import("../src/pet.js");

const MIN = 60e3, HOUR = 60 * MIN;
// Noon UTC, so the first hours are daytime.
const NOON = Date.UTC(2026, 10, 3, 12);
const hatched = () => { const pet = newPet(NOON, { seed: 7 }); advance(pet, NOON + PACE.hatch); return pet; };

test("an egg hatches into a hungry baby after a few minutes", () => {
  const pet = newPet(NOON, { seed: 1 });
  assert.equal(petView(pet).morph, "egg");
  assert.deepEqual(advance(pet, NOON + PACE.hatch - MIN), []);
  assert.ok(advance(pet, NOON + PACE.hatch).includes("hatch"));
  assert.equal(pet.stage, "baby");
  assert.equal(petView(pet).morph, null);
  assert.equal(pet.hunger, 1);
});

test("feeding fills hearts until it's full", () => {
  const pet = hatched(), now = pet.t;
  assert.equal(care(pet, "feed", now), "eat");
  assert.equal(pet.hunger, 2);
  care(pet, "feed", now); care(pet, "feed", now);
  assert.equal(care(pet, "feed", now), "full");
});

test("an ignored call is a care mistake, once", () => {
  const pet = hatched();
  pet.hunger = 0;
  advance(pet, pet.t + MIN);
  assert.equal(petView(pet).calling, "hungry");
  advance(pet, pet.t + PACE.patience + 5 * MIN);
  assert.equal(pet.mistakes, 1);
  advance(pet, pet.t + 30 * MIN);
  assert.equal(pet.mistakes, 1);
});

test("starving long enough kills it for good", () => {
  const pet = hatched();
  const events = advance(pet, pet.t + 2 * PACE.deadly);
  assert.ok(events.includes("die"));
  assert.equal(pet.stage, "dead");
  assert.equal(pet.cause, "hunger");
  assert.equal(petView(pet).morph, "grave");
  assert.equal(care(pet, "feed", pet.t + MIN), "no");
});

test("it sleeps at night, and lights left on are a call", () => {
  const pet = hatched();
  for (let t = pet.t; t < Date.UTC(2026, 10, 3, 21, 30); t += 10 * MIN) { advance(pet, t); pet.hunger = pet.happy = 4; pet.sick = false; }
  advance(pet, Date.UTC(2026, 10, 3, 21, 30));
  assert.equal(pet.asleep, true);
  assert.equal(petView(pet).mood, "asleep");
  assert.equal(petView(pet).calling, "lights");
  assert.equal(care(pet, "lights", pet.t), "lights");
  assert.equal(petView(pet).calling, null);
  assert.equal(petView(pet).mark, "z");
  assert.equal(care(pet, "feed", pet.t), "asleep");
});

test("good care grows a tidy child, neglect a scruffy one", () => {
  const good = hatched();
  for (let t = good.t; t < good.stageAt + PACE.grow.baby + MIN; t += 10 * MIN) {
    advance(good, t); good.hunger = good.happy = 4; good.poops = 0;
  }
  assert.equal(good.stage, "child");
  assert.equal(petConfig(good).head.shape, "egg");

  const bad = hatched();
  bad.mistakes = 6;
  advance(bad, bad.stageAt + PACE.grow.baby + MIN);
  assert.equal(petConfig(bad).head.shape, "blob");
});

test("the same seed and the same care give the same pet", () => {
  const a = hatched(), b = hatched();
  advance(a, NOON + 3 * 24 * HOUR); advance(b, NOON + 3 * 24 * HOUR);
  assert.deepEqual(a, b);
});

test("scolding only works when it's being naughty", () => {
  const pet = hatched();
  pet.happy = 3;
  assert.equal(care(pet, "scold", pet.t), "sulk");
  assert.equal(pet.happy, 2);
  pet.naughty = true;
  assert.equal(care(pet, "scold", pet.t), "scolded");
  assert.equal(pet.discipline, 1);
});

test("a game of which hand lasts five guesses and pays out for a good score", () => {
  for (let seed = 1; seed < 40; seed++) {
    const pet = newPet(NOON, { seed }); advance(pet, NOON + PACE.hatch);
    pet.happy = 0;
    const now = pet.t;
    assert.equal(care(pet, "play", now), "play");
    let wins = 0;
    for (let round = 1; round <= PACE.rounds; round++) {
      assert.equal(petView(pet).game.round, round - 1);
      const reply = care(pet, "guess", now, "left");
      assert.match(reply, /^(won|lost)-(left|right)$/);
      wins += reply.startsWith("won");
    }
    assert.equal(pet.game, null);
    assert.equal(pet.lastGame.wins, wins);
    assert.equal(pet.happy, wins === PACE.rounds ? 2 : wins >= PACE.toWin ? 1 : 0);
  }
});

test("medicine only works when it's sick", () => {
  const pet = hatched();
  assert.equal(care(pet, "medicine", pet.t), "well");
  pet.sick = true; pet.sickSince = pet.t;
  assert.equal(care(pet, "medicine", pet.t), "medicine");
  assert.equal(pet.sick, false);
});

test("a gift is a heart, but only every few hours", () => {
  const pet = hatched(), given = pet.t;
  pet.happy = 1;
  assert.equal(care(pet, "gift", given), "gift");
  assert.equal(pet.happy, 2);
  assert.equal(care(pet, "gift", given + 10 * MIN), "bored");
  assert.equal(pet.happy, 2);
  advance(pet, given + PACE.giftWait);
  pet.happy = 2;
  assert.equal(care(pet, "gift", pet.t), "gift");
  assert.equal(pet.happy, 3);
});

test("a game nobody finishes is dropped", () => {
  const pet = hatched();
  care(pet, "play", pet.t);
  care(pet, "guess", pet.t, "right");
  advance(pet, pet.t + PACE.guessWait + 2 * MIN);
  assert.equal(petView(pet).game, null);
});

test("it looks sick when it's close to the end", () => {
  const pet = hatched();
  pet.hunger = 0; pet.hungerAt = pet.happyAt = pet.t;
  advance(pet, pet.t + PACE.deadly - PACE.warning - 10 * MIN);
  assert.equal(petView(pet).fading, false);
  advance(pet, pet.t + 20 * MIN);
  assert.equal(petView(pet).fading, true);
  assert.equal(petView(pet).mood, "sick");
  care(pet, "feed", pet.t);
  assert.equal(petView(pet).fading, false);
});
