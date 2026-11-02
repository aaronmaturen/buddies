import test from "node:test";
import assert from "node:assert/strict";
import { EMOTE_NAMES, MOOD_NAMES, MORPH_NAMES, follow, leaderMenu, words } from "../src/index.js";

const leaves = items => items.flatMap(item => item.items ? leaves(item.items) : [item.value]);

test("the menu offers every emote, mood and morph once", () => {
  const names = kind => leaves(leaderMenu()).filter(v => v.kind === kind).map(v => v.name).sort();
  assert.deepEqual(names("emote"), [...EMOTE_NAMES].sort());
  assert.deepEqual(names("mood"), [...MOOD_NAMES].sort());
  assert.deepEqual(names("morph"), [...MORPH_NAMES].sort());
});

test("the away wedge flips with the buddies", () => {
  assert.equal(leaderMenu().at(-1).label, "Disappear");
  assert.deepEqual(leaderMenu({ away: true }).at(-1), { label: "Come back", value: { kind: "away", name: "appear" } });
});

test("follow calls the matching buddy method", () => {
  const calls = [];
  const buddy = Object.fromEntries(["emote", "setMood", "morphInto", "vanish", "appear"].map(m => [m, (...a) => calls.push([m, ...a])]));
  follow(buddy, { kind: "emote", name: "wave" });
  follow(buddy, { kind: "mood", name: "happy" });
  follow(buddy, { kind: "morph", name: "fish" });
  follow(buddy, { kind: "away", name: "vanish" });
  follow(buddy, { kind: "away", name: "appear" });
  assert.deepEqual(calls, [["emote", "wave"], ["setMood", "happy"], ["morphInto", "fish"], ["vanish"], ["appear"]]);
});

test("words turns table names into labels", () => {
  assert.equal(words("thumbsUp"), "Thumbs up");
  assert.equal(words("love"), "Love");
});
