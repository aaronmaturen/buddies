export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// "thumbsUp" → "Thumbs up", for showing names from the tables.
export const words = name => { const w = name.replace(/([A-Z])/g, " $1").toLowerCase(); return w[0].toUpperCase() + w.slice(1); };
