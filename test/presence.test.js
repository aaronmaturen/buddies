import test from "node:test";
import assert from "node:assert/strict";
import { Presence } from "../src/presence.js";

test("vanishing ends gone and stays gone until appear", () => {
  const p = new Presence();
  assert.equal(p.vanish(1), true);
  assert.equal(p.vanish(1), false);
  assert.equal(p.away, true);
  assert.equal(p.update(1.1), false);
  assert.equal(p.update(2), true);
  assert.equal(p.gone, true);
  assert.equal(p.update(1000), false);
  assert.equal(p.away, true);

  assert.equal(p.appear(), true);
  assert.equal(p.away, false);
  for (let i = 0; i < 600; i++) p.integrate(1 / 120);
  assert.ok(Math.abs(p.scale[0] - 1) < .01);
});
