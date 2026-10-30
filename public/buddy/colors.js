// Saturation/lightness ranges per tone, and how often each comes up; earthy also narrows the hue.
export const TONES = {
  candy: { s: [70, 85], l: [60, 68], weight: 32 },
  pastel: { s: [58, 72], l: [72, 80], weight: 26 },
  deep: { s: [50, 65], l: [38, 50], weight: 20 },
  earthy: { s: [32, 48], l: [54, 66], weight: 14 },
  gray: { s: [4, 10], l: [68, 80], weight: 8 },
};
const TONE_TOTAL = Object.values(TONES).reduce((a, t) => a + t.weight, 0);

// Hand-picked head colors for a chooser.
export const PALETTE = {
  red: { h: 4, s: 72, l: 64 },
  orange: { h: 24, s: 85, l: 64 },
  yellow: { h: 46, s: 90, l: 66 },
  green: { h: 135, s: 45, l: 58 },
  teal: { h: 176, s: 50, l: 52 },
  blue: { h: 215, s: 70, l: 62 },
  violet: { h: 265, s: 55, l: 66 },
  pink: { h: 330, s: 70, l: 72 },
  gray: { h: 220, s: 6, l: 74 },
  charcoal: { h: 220, s: 8, l: 40 },
};

const HUE_NAMES = [[12, "red"], [30, "coral"], [45, "orange"], [65, "yellow"], [90, "lime"], [150, "green"], [185, "teal"],
                   [210, "sky"], [245, "blue"], [275, "violet"], [300, "purple"], [335, "pink"], [361, "red"]];

// A random color drawn from the weighted tones.
export function pickColor(r) {
  const lerp = (a, b) => a + (b - a) * r();
  let roll = r() * TONE_TOTAL;
  const tone = Object.keys(TONES).find(k => (roll -= TONES[k].weight) < 0) || "candy";
  const T = TONES[tone];
  return {
    tone,
    h: Math.floor(tone === "earthy" ? (r() < .5 ? lerp(18, 50) : lerp(80, 150)) : r() * 360),
    s: Math.round(lerp(...T.s)),
    l: Math.round(lerp(...T.l)),
  };
}

// A name like "pastel teal", worked out from the color itself; palette picks keep their own name.
export function colorName(c) {
  if (c.name) return c.name;
  if (c.s < 15) return "soft gray";
  const tone = c.l >= 72 ? "pastel" : c.l < 52 ? "deep" : c.s < 50 ? "earthy" : "bright";
  return `${tone} ${HUE_NAMES.find(([max]) => (c.h % 360) < max)[1]}`;
}

// The three cel-shading tones for a head; `deep` heads need light brows.
export function headColors(c, dark) {
  const l = c.l - (dark ? 5 : 0);
  return {
    lit: `hsl(${c.h} ${c.s}% ${l}%)`,
    shade: `hsl(${c.h} ${Math.max(0, c.s - 8)}% ${l - 14}%)`,
    glow: `hsl(${c.h} ${Math.min(100, c.s + 10)}% ${Math.min(94, l + 12)}%)`,
    deep: l < 56,
  };
}
