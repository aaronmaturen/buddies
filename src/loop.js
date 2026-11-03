// One requestAnimationFrame loop for every buddy. Springs step at 120 Hz so motion stays smooth at any frame rate.
const buddies = new Set();
const STEP = 1 / 120;
const FRAME_SLACK = .002;
let running = false, last = 0, minFrame = 0;

// Most frames per second to draw, for hosts that run all day on a battery. 0 means every animation frame.
export function setFrameRate(fps) { minFrame = fps > 0 ? 1 / fps : 0; }

function frame(ms) {
  if (!buddies.size) { running = false; return; }
  const now = ms / 1000;
  if (now - last < minFrame - FRAME_SLACK) { requestAnimationFrame(frame); return; }
  const dt = Math.min(.1, now - last);
  last = now;
  for (const b of buddies) {
    if (!b.visible) continue;
    b.think(now, dt);
    for (let rem = dt; rem > 0; rem -= STEP) b.integrate(Math.min(rem, STEP));
    b.draw();
  }
  requestAnimationFrame(frame);
}

export function animate(...list) {
  for (const b of list) buddies.add(b);
  if (running) return;
  running = true;
  last = performance.now() / 1000;
  requestAnimationFrame(frame);
}

export function stopAnimating(...list) {
  for (const b of list) buddies.delete(b);
}
