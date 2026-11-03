import test from "node:test";
import assert from "node:assert/strict";

// Just enough of the browser for a Buddy; the canvas has one drawn square from 10 to 20 on each side.
class Observer { observe() {} disconnect() {} }
globalThis.ResizeObserver = Observer;
globalThis.IntersectionObserver = Observer;

const { Buddy, fromConfig, setPointer } = await import("../src/index.js");
const { pointer } = await import("../src/pointer.js");

function canvasWithSquare() {
  const options = {};
  const ctx = {
    getImageData(left, top, w, h) {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const px = left + x, py = top + y;
        if (px >= 10 && px < 20 && py >= 10 && py < 20) data[(y * w + x) * 4 + 3] = 255;
      }
      return { data };
    },
  };
  return { options, getContext(_, o) { Object.assign(options, o); return ctx; } };
}

test("hitTest finds what's drawn, with a little slop, and ignores empty canvas", () => {
  const b = new Buddy(canvasWithSquare(), fromConfig());
  assert.equal(b.hitTest(15, 15), true);
  assert.equal(b.hitTest(8, 15), true);
  assert.equal(b.hitTest(40, 40), false);
});

test("options reach the canvas and the shadow switch", () => {
  const canvas = canvasWithSquare();
  const b = new Buddy(canvas, fromConfig(), { floor: false, readable: true });
  assert.equal(canvas.options.willReadFrequently, true);
  assert.equal(b.floor, false);
  assert.equal(new Buddy(canvasWithSquare(), fromConfig()).floor, true);
});

test("setPointer moves the shared pointer and marks it recent", () => {
  setPointer(120, 80);
  assert.equal(pointer.x, 120);
  assert.equal(pointer.y, 80);
  assert.ok(performance.now() / 1000 - pointer.t < 1);
});
