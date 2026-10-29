// One shared pointer for every buddy on the page; `t` is when it last moved, in seconds.
export const pointer = { x: 0, y: 0, t: -99 };

const track = e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now() / 1000; };
addEventListener("pointermove", track, { passive: true });
addEventListener("pointerdown", track, { passive: true });
