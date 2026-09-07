import { OBSTACLES, type Point } from "../content/cafe";
const CELL = 0.25;
const key = (x: number, z: number) => `${x},${z}`;
/** Small static shop: four-neighbour routing with a 0.18m clearance. */
export function planRoute(from: Point, to: Point): Point[] | null {
  const free = (x: number, z: number) =>
    Math.abs(x) <= 4.5 &&
    Math.abs(z) <= 6.5 &&
    !OBSTACLES.some(
      (o) =>
        Math.abs(x - o.x) < o.width / 2 + 0.18 &&
        Math.abs(z - o.z) < o.depth / 2 + 0.18,
    );
  const sx = Math.round(from.x / CELL),
    sz = Math.round(from.z / CELL);
  const tx = Math.round(to.x / CELL),
    tz = Math.round(to.z / CELL);
  if (!free(sx * CELL, sz * CELL) || !free(tx * CELL, tz * CELL)) return null;
  const queue = [[sx, sz]],
    parents = new Map<string, string | null>([[key(sx, sz), null]]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    if (x === tx && z === tz) {
      const path: Point[] = [];
      let current: string | null = key(x, z);
      while (current) {
        const [px, pz] = current.split(",").map(Number);
        path.push({ x: px * CELL, z: pz * CELL });
        current = parents.get(current) ?? null;
      }
      const points = path.reverse();
      // Preserve turns, remove collinear grid points.
      return points.filter(
        (p, i) =>
          i === 0 ||
          i === points.length - 1 ||
          p.x - points[i - 1].x !== points[i + 1].x - p.x ||
          p.z - points[i - 1].z !== points[i + 1].z - p.z,
      );
    }
    for (const [dx, dz] of [
      [0, -1],
      [-1, 0],
      [1, 0],
      [0, 1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        k = key(nx, nz);
      if (!parents.has(k) && free(nx * CELL, nz * CELL)) {
        parents.set(k, key(x, z));
        queue.push([nx, nz]);
      }
    }
  }
  return null;
}
