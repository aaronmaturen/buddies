export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
