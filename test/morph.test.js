import test from "node:test";
import assert from "node:assert/strict";
import { MorphPlayer, MORPH_NAMES } from "../src/morph.js";
import { HEADS } from "../src/heads.js";

// Steps a morph player like the animation loop does: one update per frame, springs at 120 Hz.
function run(player, from, seconds) {
  let now = from;
  for (; now < from + seconds; now += 1 / 60) {
    player.update(now, HEADS.round);
    for (let i = 0; i < 2; i++) player.integrate(1 / 120);
  }
  return now;
}

test("held morphs stay until released, then melt back", () => {
  const player = new MorphPlayer();
  assert.ok(player.start("egg", 0, { hold: true }));
  let now = run(player, 0, 20);
  assert.equal(player.holding?.label, "Egg");
  player.release(now);
  now = run(player, now, 3);
  assert.equal(player.busy, false);
});

test("held-only morphs stay out of the morph list", () => {
  assert.ok(!MORPH_NAMES.includes("egg"));
  assert.ok(!MORPH_NAMES.includes("grave"));
  assert.ok(MORPH_NAMES.includes("rocket"));
});
