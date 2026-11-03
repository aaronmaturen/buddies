// One shared pointer for every buddy on the page; `t` is when it last moved, in seconds.
export const pointer = { x: 0, y: 0, t: -99 };

// x and y are viewport pixels. For hosts that know the cursor beyond the page, like a desktop app's small window.
export function setPointer(x, y) { pointer.x = x; pointer.y = y; pointer.t = performance.now() / 1000; }

const track = e => setPointer(e.clientX, e.clientY);
// Importing the library on a server (server-side rendering) must not touch the browser.
if (typeof addEventListener === "function") {
  addEventListener("pointermove", track, { passive: true });
  addEventListener("pointerdown", track, { passive: true });
}
