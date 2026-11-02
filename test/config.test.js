import test from "node:test";
import assert from "node:assert/strict";
import { fromConfig, toConfig, randomConfig, LIMITS, configSchema } from "../src/index.js";

test("a config survives the round trip", () => {
  const config = toConfig(fromConfig(randomConfig({ name: "Pip", shape: "egg" })));
  assert.deepEqual(toConfig(fromConfig(config)), config);
  assert.equal(config.name, "Pip");
  assert.equal(config.head.shape, "egg");
});

test("missing settings get defaults", () => {
  const config = toConfig(fromConfig({}));
  assert.equal(config.name, "Buddy");
  assert.equal(config.head.shape, "round");
  assert.equal(config.hands, "glove");
});

test("numbers are kept in range and unknown names are ignored", () => {
  const config = toConfig(fromConfig({ eyes: { size: 99 }, personality: { temper: -5 }, head: { shape: "nope", style: "nope" } }));
  assert.equal(config.eyes.size, LIMITS.eyes.size[1]);
  assert.equal(config.personality.temper, LIMITS.personality.temper[0]);
  assert.equal(config.head.shape, "round");
  assert.equal(config.head.style, "solid");
});

test("random configs fit the schema's choices", () => {
  const { properties } = configSchema();
  for (let i = 0; i < 200; i++) {
    const config = randomConfig();
    assert.ok(properties.head.properties.shape.enum.includes(config.head.shape));
  }
});
