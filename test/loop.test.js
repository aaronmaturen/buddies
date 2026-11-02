import test from "node:test";
import assert from "node:assert/strict";

const frames = [];
globalThis.requestAnimationFrame = f => frames.push(f);
const { animate, stopAnimating } = await import("../src/loop.js");

let ms = performance.now();
const step = () => { const f = frames.shift(); if (f) f(ms += 16); };
const fake = () => ({ visible: true, thought: 0, think() { this.thought++; }, integrate() {}, draw() {} });

test("the loop runs buddies, skips hidden ones, stops when empty and starts again", () => {
  const a = fake(), hidden = { ...fake(), visible: false };
  animate(a, hidden);
  step(); step();
  assert.equal(a.thought, 2);
  assert.equal(hidden.thought, 0);

  stopAnimating(a, hidden);
  step();
  assert.equal(frames.length, 0);

  const b = fake();
  animate(b);
  step(); step();
  assert.equal(b.thought, 2);
  assert.equal(a.thought, 2);
  stopAnimating(b);
});
