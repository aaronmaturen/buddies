import { TAU } from "../util.js";

// What's left when a buddy dies: a headstone in the buddy's own color and style, held until a new egg.
const arch = Array.from({ length: 25 }, (_, i) => {
  const a = Math.PI + i / 24 * Math.PI;
  return [Math.cos(a) * .7, -.3 + Math.sin(a) * .62];
});
const stone = [...arch, [.7, .85], [-.7, .85]];

export const grave = {
  label: "Grave",
  held: true,
  outline: stone,
  scale: .9,
  eyes: null,
  duration: 1,
  motion: () => ({ x: 0, y: 0, rot: 0 }),
  // RIP cut into the stone and a little mound of grass at its foot.
  detail(ctx, { colors }) {
    ctx.fillStyle = colors.shade; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 .42px system-ui, sans-serif";
    ctx.fillText("RIP", 0, -.2);
    ctx.fillStyle = "#6fbf73";
    for (const x of [-.55, -.2, .2, .55]) { ctx.beginPath(); ctx.ellipse(x, .86, .22, .1, 0, 0, TAU); ctx.fill(); }
  },
};
