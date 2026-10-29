// The invisible head: a rotated sphere, stretched to the silhouette, that flat features are laid onto.

export function rotation(yaw, pitch, roll) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
  const Rx = [[1, 0, 0], [0, cp, -sp], [0, sp, cp]];
  const Rz = [[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]];
  const mm = (A, B) => A.map(row => [0, 1, 2].map(j => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
  return mm(Rz, mm(Rx, Ry));
}

const apply = (M, v) => [
  M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
  M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
  M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
];

// Point on the head plus east/south tangents at (lon, lat), so a flat feature can be drawn against the surface.
export function surfaceFrame(M, lon, lat, head) {
  const cl = Math.cos(lat), sl = Math.sin(lat), co = Math.cos(lon), so = Math.sin(lon);
  const y = sl * head.sy;
  const p = [so * cl * head.sx * (1 + head.taper * y), y, co * cl];
  return { p: apply(M, p), e: apply(M, [co, 0, -so]), s: apply(M, [-so * sl, cl, -co * sl]) };
}
