// Shared by head styles. Each style draws the head silhouette in `shape` space (rolls with the head) and puts
// lighting in `lit` space (offset toward a light that stays put while the head rolls).
export const LIGHT_INK = "#f4f5f8";

export const shapeSpace = (m, { cx, cy, roll }) => m.translate(cx, cy).rotate(roll).translate(-cx, -cy);

export const litSpace = (m, { cx, cy, R, roll }) =>
  m.translate(cx - R * .14, cy - R * .18).rotate(roll).scale(.98).translate(-cx, -cy);
